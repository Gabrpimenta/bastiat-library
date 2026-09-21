import type {
  Bookmark,
  BookmarkMutation,
  Content,
  Lesson,
  Progress,
  ProgressMutation,
} from './index';
import { ApiClient, ApiError } from './client';
import { retryDelay } from './sync';

export interface KeyValueStore {
  get<T>(scope: string, namespace: string, key: string): T | null;
  set<T>(scope: string, namespace: string, key: string, value: T): void;
  all<T>(scope: string, namespace: string): T[];
  remove(scope: string, namespace: string, key: string): void;
  clear(scope: string): void;
}
export type LocalProgress = {
  value: Progress;
  dirty: boolean;
  inFlight?: ProgressMutation;
  conflict?: Progress;
  attempt: number;
  retryAt: number;
};
type LocalBookmark = { value: Bookmark; dirty: boolean; inFlight?: BookmarkMutation };
type Listener = () => void;

export class LibraryController {
  private scope = 'guest';
  private generation = 0;
  private version = 0;
  private listeners = new Set<Listener>();
  private running = false;
  public syncError: string | null = null;
  public syncing = false;

  constructor(
    private storage: KeyValueStore,
    private api: Pick<ApiClient, 'progress' | 'bookmark' | 'library'>,
    private uuid: () => string,
  ) {}
  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  snapshot = () => this.version;
  private emit() {
    this.version++;
    this.listeners.forEach((listener) => listener());
  }
  setUser(id: number | null) {
    this.scope = id === null ? 'guest' : `user:${id}`;
    this.generation++;
    this.syncError = null;
    this.emit();
  }
  clearUser(id: number) {
    this.storage.clear(`user:${id}`);
    this.emit();
  }
  entries() {
    return this.storage.all<LocalProgress>(this.scope, 'progress');
  }
  progress(slug: string) {
    return this.storage.get<LocalProgress>(this.scope, 'progress', slug);
  }
  bookmarks() {
    return this.storage
      .all<LocalBookmark>(this.scope, 'bookmarks')
      .filter((entry) => entry.value.saved)
      .map((entry) => entry.value);
  }
  isSaved(item: Pick<Content, 'kind' | 'slug'>) {
    return (
      this.storage.get<LocalBookmark>(this.scope, 'bookmarks', `${item.kind}:${item.slug}`)?.value
        .saved ?? false
    );
  }

  saveProgress(lesson: Lesson, positionSeconds: number, completed?: boolean) {
    const old = this.progress(lesson.slug);
    const compatible = old?.value.assetVersion === lesson.asset.version;
    const value: Progress = {
      lessonSlug: lesson.slug,
      positionSeconds: Math.min(Math.max(0, positionSeconds), lesson.durationSeconds),
      completed: completed ?? (compatible ? old.value.completed : false),
      assetVersion: lesson.asset.version,
      revision: old?.value.revision ?? 0,
      updatedAt: new Date().toISOString(),
    };
    this.storage.set<LocalProgress>(this.scope, 'progress', lesson.slug, {
      value,
      dirty: true,
      attempt: old?.attempt ?? 0,
      retryAt: old?.retryAt ?? 0,
      ...(old?.inFlight ? { inFlight: old.inFlight } : {}),
      ...(old?.conflict ? { conflict: old.conflict } : {}),
    });
    this.emit();
  }

  toggleBookmark(item: Pick<Content, 'kind' | 'slug'>) {
    const key = `${item.kind}:${item.slug}`;
    const old = this.storage.get<LocalBookmark>(this.scope, 'bookmarks', key);
    this.storage.set<LocalBookmark>(this.scope, 'bookmarks', key, {
      value: {
        targetKind: item.kind,
        targetSlug: item.slug,
        saved: !old?.value.saved,
        updatedAt: new Date().toISOString(),
      },
      dirty: true,
      ...(old?.inFlight ? { inFlight: old.inFlight } : {}),
    });
    this.emit();
    void this.sync();
  }

  resolveConflict(slug: string, choice: 'local' | 'remote') {
    const record = this.progress(slug);
    if (!record?.conflict) return;
    const value =
      choice === 'remote'
        ? record.conflict
        : { ...record.value, revision: record.conflict.revision };
    this.storage.set<LocalProgress>(this.scope, 'progress', slug, {
      value,
      dirty: choice === 'local',
      attempt: 0,
      retryAt: 0,
    });
    this.emit();
    void this.sync();
  }

  async sync() {
    if (this.scope === 'guest' || this.running) return;
    const scope = this.scope;
    const generation = this.generation;
    const valid = () => generation === this.generation;
    this.running = true;
    this.syncing = true;
    this.syncError = null;
    this.emit();
    try {
      for (const record of this.storage.all<LocalProgress>(scope, 'progress')) {
        if (!valid()) return;
        if (!record.dirty || record.conflict || record.retryAt > Date.now()) continue;
        const input = record.inFlight ?? {
          operationId: this.uuid(),
          lessonSlug: record.value.lessonSlug,
          positionSeconds: record.value.positionSeconds,
          completed: record.value.completed,
          assetVersion: record.value.assetVersion,
          baseRevision: record.value.revision,
        };
        this.storage.set(scope, 'progress', input.lessonSlug, { ...record, inFlight: input });
        const result = await this.api.progress(input);
        if (!valid()) return;
        const latest = this.storage.get<LocalProgress>(scope, 'progress', input.lessonSlug)!;
        if (result.status === 'conflict') {
          this.storage.set(scope, 'progress', input.lessonSlug, {
            ...latest,
            inFlight: undefined,
            conflict: result.progress,
          });
        } else {
          const changed =
            latest.value.positionSeconds !== input.positionSeconds ||
            latest.value.completed !== input.completed ||
            latest.value.assetVersion !== input.assetVersion;
          this.storage.set<LocalProgress>(scope, 'progress', input.lessonSlug, {
            value: changed
              ? { ...latest.value, revision: result.progress.revision }
              : result.progress,
            dirty: changed,
            attempt: 0,
            retryAt: 0,
          });
        }
      }
      for (const record of this.storage.all<LocalBookmark>(scope, 'bookmarks')) {
        if (!valid()) return;
        if (!record.dirty) continue;
        const input = record.inFlight ?? {
          operationId: this.uuid(),
          targetKind: record.value.targetKind,
          targetSlug: record.value.targetSlug,
          saved: record.value.saved,
        };
        const key = `${input.targetKind}:${input.targetSlug}`;
        this.storage.set(scope, 'bookmarks', key, { ...record, inFlight: input });
        const result = await this.api.bookmark(input);
        if (!valid()) return;
        const latest = this.storage.get<LocalBookmark>(scope, 'bookmarks', key)!;
        const changed = latest.value.saved !== input.saved;
        this.storage.set<LocalBookmark>(scope, 'bookmarks', key, {
          value: changed ? latest.value : result,
          dirty: changed,
        });
      }
      const remote = await this.api.library();
      if (!valid()) return;
      for (const value of remote.progress) {
        const local = this.storage.get<LocalProgress>(scope, 'progress', value.lessonSlug);
        if (!local?.dirty && !local?.inFlight && !local?.conflict)
          this.storage.set<LocalProgress>(scope, 'progress', value.lessonSlug, {
            value,
            dirty: false,
            attempt: 0,
            retryAt: 0,
          });
      }
      for (const value of remote.bookmarks) {
        const key = `${value.targetKind}:${value.targetSlug}`;
        const local = this.storage.get<LocalBookmark>(scope, 'bookmarks', key);
        if (!local?.dirty && !local?.inFlight)
          this.storage.set<LocalBookmark>(scope, 'bookmarks', key, { value, dirty: false });
      }
    } catch (error) {
      if (!valid()) return;
      this.syncError =
        error instanceof ApiError && error.status === 401
          ? 'Sign in again to resume syncing.'
          : error instanceof Error
            ? error.message
            : 'Sync will retry when you reconnect.';
      for (const record of this.storage.all<LocalProgress>(scope, 'progress')) {
        if (record.inFlight)
          this.storage.set(scope, 'progress', record.value.lessonSlug, {
            ...record,
            attempt: record.attempt + 1,
            retryAt: Date.now() + retryDelay(record.attempt),
          });
      }
    } finally {
      this.running = false;
      this.syncing = false;
      this.emit();
    }
  }
}
