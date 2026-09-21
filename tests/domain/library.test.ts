import { randomUUID } from 'node:crypto';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { LibraryController, type KeyValueStore } from '../../packages/contracts/src/library';
import { decideProgress, resumePosition, verifyAsset } from '../../packages/contracts/src/sync';
import type { Lesson, Progress, ProgressMutation } from '../../packages/contracts/src';
import { ApiError } from '../../packages/contracts/src/client';

const lesson: Lesson = {
  kind: 'lesson',
  slug: 'first-lesson',
  title: 'First lesson',
  description: 'A lesson',
  author: 'Library',
  topic: 'Economics',
  coverUrl: 'https://example.com/cover.webp',
  courseSlug: 'first-course',
  order: 1,
  format: 'audio',
  durationSeconds: 180,
  transcript: 'Original transcript.',
  sources: [],
  asset: {
    url: 'https://example.com/lesson.mp3',
    mimeType: 'audio/mpeg',
    bytes: 512,
    sha256: 'a'.repeat(64),
    version: '1',
  },
};
function memory(): KeyValueStore {
  const records = new Map<string, string>();
  const key = (s: string, n: string, k: string) => `${s}|${n}|${k}`;
  return {
    get: <T>(s: string, n: string, k: string): T | null =>
      JSON.parse(records.get(key(s, n, k)) ?? 'null'),
    set: (s, n, k, v) => {
      records.set(key(s, n, k), JSON.stringify(v));
    },
    all: <T>(s: string, n: string): T[] =>
      [...records].filter(([k]) => k.startsWith(`${s}|${n}|`)).map(([, v]) => JSON.parse(v)),
    remove: (s, n, k) => {
      records.delete(key(s, n, k));
    },
    clear: (s) => {
      for (const k of records.keys()) if (k.startsWith(`${s}|`)) records.delete(k);
    },
  };
}
function server() {
  let progress: Progress | null = null;
  const results = new Map<string, ReturnType<typeof decideProgress>>();
  return {
    progress: vi.fn(async (input: ProgressMutation) => {
      if (results.has(input.operationId)) return results.get(input.operationId)!;
      const result = decideProgress(progress, input, 180, new Date().toISOString());
      results.set(input.operationId, result);
      if (result.status === 'accepted') progress = result.progress;
      return result;
    }),
    bookmark: vi.fn(async (input) => ({ ...input, updatedAt: new Date().toISOString() })),
    library: vi.fn(async () => ({ progress: progress ? [progress] : [], bookmarks: [] })),
  };
}
afterEach(() => vi.useRealTimers());
describe('account-isolated progress outbox', () => {
  it('retains pending playback after session expiry and resumes the same operation after login', async () => {
    vi.useFakeTimers();
    const api = server();
    api.progress.mockRejectedValueOnce(new ApiError(401, 'Session expired'));
    const store = new LibraryController(memory(), api, randomUUID);
    store.setUser(1);
    store.saveProgress(lesson, 42);
    await store.sync();
    const operation = store.progress(lesson.slug)?.inFlight;
    expect(store.requiresAuthentication).toBe(true);
    expect(store.progress(lesson.slug)?.value.positionSeconds).toBe(42);
    await store.sync();
    expect(api.progress).toHaveBeenCalledTimes(1);
    store.setUser(1);
    await vi.advanceTimersByTimeAsync(1100);
    await store.sync();
    expect(store.requiresAuthentication).toBe(false);
    expect(api.progress.mock.calls[1]?.[0]).toEqual(operation);
    expect(store.progress(lesson.slug)).toMatchObject({
      dirty: false,
      value: { positionSeconds: 42 },
    });
  });
  it('does not merge guest or previous-account data into a new account', async () => {
    const api = server();
    const store = new LibraryController(memory(), api, randomUUID);
    store.saveProgress(lesson, 42);
    store.setUser(1);
    expect(store.entries()).toEqual([]);
    store.saveProgress(lesson, 90);
    store.setUser(2);
    expect(store.entries()).toEqual([]);
    store.setUser(null);
    expect(store.progress(lesson.slug)?.value.positionSeconds).toBe(42);
    await store.sync();
    expect(api.progress).not.toHaveBeenCalled();
    store.clearUser(1);
    store.setUser(1);
    expect(store.entries()).toEqual([]);
  });
  it('preserves an intentional rewind and asks before overwriting another device', async () => {
    const api = server();
    const a = new LibraryController(memory(), api, randomUUID);
    const b = new LibraryController(memory(), api, randomUUID);
    a.setUser(1);
    b.setUser(1);
    a.saveProgress(lesson, 90);
    await a.sync();
    await b.sync();
    a.saveProgress(lesson, 120);
    await a.sync();
    b.saveProgress(lesson, 20);
    await b.sync();
    expect(b.progress(lesson.slug)?.value.positionSeconds).toBe(20);
    expect(b.progress(lesson.slug)?.conflict?.positionSeconds).toBe(120);
    b.resolveConflict(lesson.slug, 'local');
    await vi.waitFor(() => expect(b.progress(lesson.slug)?.dirty).toBe(false));
    expect((await api.library()).progress[0]?.positionSeconds).toBe(20);
    expect((await api.library()).progress[0]?.revision).toBe(3);
  });
  it('replays the same operation after a lost response without losing newer local playback', async () => {
    vi.useFakeTimers();
    const api = server();
    const original = api.progress;
    const calls: ProgressMutation[] = [];
    let loseFirst = true;
    const wrapped = {
      ...api,
      progress: async (input: ProgressMutation) => {
        calls.push(input);
        const result = await original(input);
        if (loseFirst) {
          loseFirst = false;
          throw new Error('Connection lost after commit');
        }
        return result;
      },
    };
    const kv = memory();
    let store = new LibraryController(kv, wrapped, randomUUID);
    store.setUser(1);
    store.saveProgress(lesson, 20);
    await store.sync();
    store.saveProgress(lesson, 30);
    await store.sync();
    expect(calls).toHaveLength(1);
    store = new LibraryController(kv, wrapped, randomUUID);
    store.setUser(1);
    await vi.advanceTimersByTimeAsync(1100);
    await store.sync();
    expect(calls[1]).toEqual(calls[0]);
    expect(store.progress(lesson.slug)?.value.positionSeconds).toBe(30);
    await store.sync();
    expect(calls[2]?.operationId).not.toBe(calls[0]?.operationId);
    expect((await api.library()).progress[0]).toMatchObject({ positionSeconds: 30, revision: 2 });
  });
  it('discards late responses when the user signs out during synchronization', async () => {
    const api = server();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const wrapped = {
      ...api,
      progress: async (input: ProgressMutation) => {
        await gate;
        return api.progress(input);
      },
    };
    const store = new LibraryController(memory(), wrapped, randomUUID);
    store.setUser(1);
    store.saveProgress(lesson, 50);
    const syncing = store.sync();
    store.clearUser(1);
    store.setUser(null);
    release();
    await syncing;
    expect(store.entries()).toEqual([]);
    store.setUser(1);
    expect(store.entries()).toEqual([]);
  });
  it('keeps changes made while an earlier checkpoint is in flight', async () => {
    const api = server();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const wrapped = {
      ...api,
      progress: async (input: ProgressMutation) => {
        await gate;
        return api.progress(input);
      },
    };
    const store = new LibraryController(memory(), wrapped, randomUUID);
    store.setUser(1);
    store.saveProgress(lesson, 20);
    const syncing = store.sync();
    store.saveProgress(lesson, 45, true);
    release();
    await syncing;
    expect(store.progress(lesson.slug)).toMatchObject({
      dirty: true,
      value: { positionSeconds: 45, completed: true, revision: 1 },
    });
    await store.sync();
    expect((await api.library()).progress[0]).toMatchObject({
      positionSeconds: 45,
      completed: true,
      revision: 2,
    });
  });
});
describe('media integrity and editions', () => {
  it('rejects a truncated or modified download', () => {
    expect(verifyAsset({ bytes: 511, sha256: lesson.asset.sha256 }, lesson.asset)).toBe(false);
    expect(verifyAsset({ bytes: 512, sha256: 'b'.repeat(64) }, lesson.asset)).toBe(false);
    expect(verifyAsset({ bytes: 512, sha256: lesson.asset.sha256 }, lesson.asset)).toBe(true);
  });
  it('does not apply an old edition’s timestamp to a revised lesson', () => {
    const progress = {
      lessonSlug: lesson.slug,
      positionSeconds: 95,
      completed: false,
      assetVersion: '1',
      revision: 2,
      updatedAt: new Date().toISOString(),
    };
    expect(resumePosition(progress, '2', 60)).toBe(0);
    expect(resumePosition(progress, '1', 60)).toBe(60);
  });
});
