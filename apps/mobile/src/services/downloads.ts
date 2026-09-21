import { Directory, File, Paths, type DownloadTask } from 'expo-file-system';
import { digest, CryptoDigestAlgorithm } from 'expo-crypto';
import { AppState } from 'react-native';
import { useSyncExternalStore } from 'react';
import type { Lesson } from '@bastiat/contracts';
import { verifyAsset, type DownloadState } from '@bastiat/contracts/sync';
import { storage } from './storage';
import { cacheContent } from './api';

export type Download = {
  lesson: Lesson;
  state: DownloadState;
  filename: string;
  received: number;
  error?: string;
};
const directory = new Directory(Paths.document, 'lessons');
directory.create({ idempotent: true, intermediates: true });
let version = 0;
const listeners = new Set<() => void>();
const active = new Map<string, DownloadTask>();
const generations = new Map<string, number>();
let running = false;
const emit = () => {
  version++;
  listeners.forEach((listener) => listener());
};
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const persist = (item: Download) => {
  storage.set('public', 'downloads', item.lesson.slug, item);
  emit();
};
export const downloads = () => storage.all<Download>('public', 'downloads');
export const getDownload = (slug: string) => storage.get<Download>('public', 'downloads', slug);
export function useDownloads() {
  useSyncExternalStore(subscribe, () => version);
  return downloads();
}

export function localMedia(lesson: Lesson): string | null {
  const item = getDownload(lesson.slug);
  if (
    item?.state !== 'ready' ||
    item.lesson.asset.version !== lesson.asset.version ||
    item.lesson.asset.sha256 !== lesson.asset.sha256
  )
    return null;
  const file = new File(directory, item.filename);
  if (!file.exists || file.size !== lesson.asset.bytes) {
    persist({
      ...item,
      state: 'failed',
      error: 'The downloaded file is missing or incomplete. Download it again.',
    });
    return null;
  }
  return file.uri;
}

export function queueDownload(lesson: Lesson) {
  const old = getDownload(lesson.slug);
  if (old && ['queued', 'downloading', 'verifying'].includes(old.state)) return;
  generations.set(lesson.slug, (generations.get(lesson.slug) ?? 0) + 1);
  cacheContent(lesson);
  const extension = lesson.format === 'audio' ? 'mp3' : 'mp4';
  persist({
    lesson,
    state: 'queued',
    filename: `${lesson.slug}-${lesson.asset.sha256.slice(0, 12)}.${extension}`,
    received: 0,
  });
  void runQueue();
}

export function cancelDownload(slug: string) {
  generations.set(slug, (generations.get(slug) ?? 0) + 1);
  active.get(slug)?.cancel();
  const item = getDownload(slug);
  if (item) persist({ ...item, state: 'cancelled', received: 0 });
}

export function removeDownload(slug: string) {
  generations.set(slug, (generations.get(slug) ?? 0) + 1);
  active.get(slug)?.cancel();
  const item = getDownload(slug);
  if (!item) return;
  for (const suffix of ['', '.part']) {
    const file = new File(directory, item.filename + suffix);
    if (file.exists) file.delete();
  }
  storage.remove('public', 'downloads', slug);
  emit();
}

async function runQueue() {
  if (running || AppState.currentState !== 'active') return;
  running = true;
  try {
    while (true) {
      const item = downloads().find((download) => download.state === 'queued');
      if (!item) break;
      if (AppState.currentState !== 'active') break;
      const { lesson } = item;
      const generation = generations.get(lesson.slug) ?? 0;
      const valid = () => generation === (generations.get(lesson.slug) ?? 0);
      const partial = new File(directory, `${item.filename}.part`);
      const destination = new File(directory, item.filename);
      try {
        if (lesson.asset.bytes > 64 * 1024 * 1024)
          throw new Error('This edition supports downloads up to 64 MB per lesson.');
        if (Paths.availableDiskSpace < lesson.asset.bytes * 2 + 10 * 1024 * 1024)
          throw new Error('There is not enough space. Remove a download and try again.');
        if (partial.exists) partial.delete();
        persist({ ...item, state: 'downloading', error: undefined });
        const task = File.createDownloadTask(lesson.asset.url, partial, {
          sessionType: 'foreground',
          onProgress: ({ bytesWritten }) => {
            const current = getDownload(lesson.slug);
            if (valid() && current?.state === 'downloading')
              persist({ ...current, received: bytesWritten });
          },
        });
        active.set(lesson.slug, task);
        const file = await task.downloadAsync();
        if (
          !valid() ||
          !file ||
          getDownload(lesson.slug)?.state === 'cancelled' ||
          !getDownload(lesson.slug)
        )
          continue;
        persist({ ...item, state: 'verifying', received: file.size });
        const hash = await digest(
          CryptoDigestAlgorithm.SHA256,
          new Uint8Array(await file.arrayBuffer()),
        );
        const sha256 = Array.from(new Uint8Array(hash))
          .map((value) => value.toString(16).padStart(2, '0'))
          .join('');
        if (!verifyAsset({ bytes: file.size, sha256 }, lesson.asset))
          throw new Error('The file could not be verified. Please download it again.');
        if (!valid() || getDownload(lesson.slug)?.state !== 'verifying') continue;
        if (destination.exists) destination.delete();
        await file.move(destination);
        if (!valid() || getDownload(lesson.slug)?.state !== 'verifying') {
          if (destination.exists) destination.delete();
          continue;
        }
        if (!destination.exists || destination.size !== lesson.asset.bytes)
          throw new Error('The file could not be verified. Please download it again.');
        persist({ ...item, state: 'ready', received: lesson.asset.bytes });
        console.info(
          JSON.stringify({
            event: 'download.ready',
            format: lesson.format,
            bytes: lesson.asset.bytes,
          }),
        );
      } catch (error) {
        const current = getDownload(lesson.slug);
        if (valid() && current && current.state !== 'cancelled')
          persist({
            ...current,
            state: 'failed',
            error:
              error instanceof Error &&
              /^(This edition|There is not enough|The file could not)/.test(error.message)
                ? error.message
                : 'Download failed. Check your connection and try again.',
          });
      } finally {
        active.get(lesson.slug)?.release();
        active.delete(lesson.slug);
        if (partial.exists) partial.delete();
      }
    }
  } finally {
    running = false;
  }
}

export function restoreDownloads() {
  for (const item of downloads()) {
    if (['downloading', 'verifying'].includes(item.state))
      persist({ ...item, state: 'queued', received: 0 });
  }
  void runQueue();
  return AppState.addEventListener('change', (state) => {
    if (state === 'active') void runQueue();
  });
}
