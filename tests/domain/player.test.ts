import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { Lesson } from '../../packages/contracts/src';

const native = vi.hoisted(() => ({ create: vi.fn(), progress: vi.fn() }));
vi.mock('../../apps/mobile/node_modules/expo-audio', () => ({
  createAudioPlayer: native.create,
  setAudioModeAsync: vi.fn(async () => {}),
}));
vi.mock('../../apps/mobile/node_modules/expo-video', () => ({ createVideoPlayer: vi.fn() }));
vi.mock('../../apps/mobile/node_modules/react-native', () => ({ AppState: {} }));
vi.mock('../../apps/mobile/src/services/library', () => ({
  library: { progress: native.progress, saveProgress: vi.fn(), sync: vi.fn() },
}));
vi.mock('../../apps/mobile/src/services/downloads', () => ({ localMedia: () => null }));

import { playLesson, stopPlayer } from '../../apps/mobile/src/services/player';

const lesson: Lesson = {
  kind: 'lesson',
  slug: 'audio-test',
  title: 'Audio test',
  description: 'Synthetic fixture',
  author: 'Library',
  topic: 'Economics',
  coverUrl: 'https://example.test/art.webp',
  courseSlug: 'course',
  order: 1,
  format: 'audio',
  durationSeconds: 180,
  transcript: 'Synthetic fixture.',
  sources: [],
  asset: {
    url: 'https://example.test/audio.mp3',
    mimeType: 'audio/mpeg',
    bytes: 512,
    sha256: 'a'.repeat(64),
    version: '1',
  },
};

function player(loaded = true) {
  const status = {
    isLoaded: loaded,
    playing: false,
    isBuffering: false,
    currentTime: 0,
    duration: 180,
    didJustFinish: false,
    error: null,
  };
  let listener: (value: typeof status) => void = () => {};
  return {
    currentTime: 0,
    currentStatus: status,
    addListener: vi.fn((_event, callback) => {
      listener = callback;
      return { remove: vi.fn() };
    }),
    emit: (patch = {}) => listener({ ...status, ...patch }),
    seekTo: vi.fn(async (_seconds: number) => {}),
    play: vi.fn(),
    pause: vi.fn(),
    setActiveForLockScreen: vi.fn(),
    remove: vi.fn(),
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  native.progress.mockReturnValue(null);
});
afterEach(() => {
  stopPlayer();
  vi.useRealTimers();
  vi.clearAllMocks();
});

it('starts an already-loaded source even when its ready event preceded subscription', async () => {
  const audio = player();
  native.create.mockReturnValue(audio);
  await playLesson(lesson);
  await vi.advanceTimersByTimeAsync(0);
  expect(audio.play).toHaveBeenCalledOnce();
  expect(audio.seekTo).not.toHaveBeenCalled();
  expect(audio.setActiveForLockScreen).toHaveBeenCalledWith(true, expect.any(Object));
  audio.emit();
  expect(audio.play).toHaveBeenCalledOnce();
});

it('does not restart audio if restoring the checkpoint finishes after loading timed out', async () => {
  native.progress.mockReturnValue({ value: { positionSeconds: 30, assetVersion: '1' } });
  const audio = player();
  let finish = () => {};
  audio.seekTo.mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  native.create.mockReturnValue(audio);
  await playLesson(lesson);
  expect(audio.seekTo).toHaveBeenCalledWith(30);
  await vi.advanceTimersByTimeAsync(20000);
  finish();
  await vi.advanceTimersByTimeAsync(0);
  expect(audio.play).not.toHaveBeenCalled();
  expect(audio.pause).toHaveBeenCalled();
});

it('ignores a superseded lesson whose pending seek fails after the next lesson starts', async () => {
  native.progress.mockReturnValue({ value: { positionSeconds: 30, assetVersion: '1' } });
  const old = player();
  let reject = (_error: Error) => {};
  old.seekTo.mockImplementation(
    () =>
      new Promise<void>((_resolve, fail) => {
        reject = fail;
      }),
  );
  const next = player();
  native.create.mockReturnValueOnce(old).mockReturnValueOnce(next);
  await playLesson(lesson);
  native.progress.mockReturnValue(null);
  await playLesson({ ...lesson, slug: 'next' });
  reject(new Error('Superseded seek'));
  await vi.advanceTimersByTimeAsync(0);
  expect(old.play).not.toHaveBeenCalled();
  expect(next.play).toHaveBeenCalledOnce();
  expect(next.pause).not.toHaveBeenCalled();
  await playLesson({ ...lesson, slug: 'next' });
  expect(native.create).toHaveBeenCalledTimes(2);
});

it('does not bypass checkpoint restoration when Play is tapped again during loading', async () => {
  const audio = player(false);
  native.create.mockReturnValue(audio);
  await playLesson(lesson);
  await playLesson(lesson);
  expect(audio.play).not.toHaveBeenCalled();
  audio.emit({ isLoaded: true });
  await vi.advanceTimersByTimeAsync(0);
  expect(audio.play).toHaveBeenCalledOnce();
});
