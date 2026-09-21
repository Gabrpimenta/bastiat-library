import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
  type AudioStatus,
} from 'expo-audio';
import { createVideoPlayer, type VideoPlayer } from 'expo-video';
import { AppState } from 'react-native';
import { useSyncExternalStore } from 'react';
import type { Lesson } from '@bastiat/contracts';
import { resumePosition } from '@bastiat/contracts/sync';
import { library } from './library';
import { localMedia } from './downloads';

type PlayerState = {
  lesson: Lesson | null;
  playing: boolean;
  loading: boolean;
  position: number;
  duration: number;
  speed: number;
  error: string | null;
  offline: boolean;
};
let state: PlayerState = {
  lesson: null,
  playing: false,
  loading: false,
  position: 0,
  duration: 0,
  speed: 1,
  error: null,
  offline: false,
};
let audio: AudioPlayer | null = null;
let video: VideoPlayer | null = null;
const listeners = new Set<() => void>();
let nativeSubscriptions: { remove(): void }[] = [];
let generation = 0;
let lastCheckpoint = 0;
let loadingTimer: ReturnType<typeof setTimeout> | null = null;
const clearLoadingTimer = () => {
  if (loadingTimer) clearTimeout(loadingTimer);
  loadingTimer = null;
};
const update = (patch: Partial<PlayerState>) => {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
};
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export function usePlayer() {
  return useSyncExternalStore(subscribe, () => state);
}
export const getVideo = () => video;

export function checkpoint() {
  if (!state.lesson || state.loading || state.error) return;
  const position = audio?.currentTime ?? video?.currentTime ?? state.position;
  library.saveProgress(state.lesson, position);
  lastCheckpoint = Date.now();
}

export function stopPlayer() {
  generation++;
  clearLoadingTimer();
  checkpoint();
  nativeSubscriptions.forEach((subscription) => subscription.remove());
  nativeSubscriptions = [];
  if (audio) {
    audio.pause();
    audio.setActiveForLockScreen(false);
    audio.remove();
    audio = null;
  }
  if (video) {
    video.pause();
    video.release();
    video = null;
  }
  update({ lesson: null, playing: false, loading: false, position: 0, error: null });
}

export async function playLesson(lesson: Lesson) {
  if (state.lesson?.slug === lesson.slug && !state.error) {
    if (state.loading) return;
    if (state.position >= state.duration - 0.5) await seek(0);
    audio?.play();
    video?.play();
    update({ playing: true });
    return;
  }
  stopPlayer();
  const ownGeneration = generation;
  const local = localMedia(lesson);
  const start = resumePosition(
    library.progress(lesson.slug)?.value,
    lesson.asset.version,
    lesson.durationSeconds,
  );
  update({
    lesson,
    loading: true,
    playing: false,
    position: start,
    duration: lesson.durationSeconds,
    speed: 1,
    error: null,
    offline: !!local,
  });
  const started = Date.now();
  loadingTimer = setTimeout(() => {
    if (generation === ownGeneration && state.loading) {
      generation++;
      audio?.pause();
      video?.pause();
      update({
        loading: false,
        playing: false,
        error: 'This lesson is taking too long to load. Check your connection and try again.',
      });
    }
  }, 20000);
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    });
    if (generation !== ownGeneration) return;
    if (lesson.format === 'audio') {
      const player = createAudioPlayer({ uri: local ?? lesson.asset.url }, { updateInterval: 500 });
      audio = player;
      let restored = false;
      let seeking = false;
      const onStatus = (status: AudioStatus) => {
        if (generation !== ownGeneration) return;
        if (status.error) {
          clearLoadingTimer();
          generation++;
          player.pause();
          update({
            error: 'This lesson could not be played. Check your connection and try again.',
            loading: false,
            playing: false,
          });
          return;
        }
        if (state.error) return;
        if (status.isLoaded && !restored && !seeking) {
          seeking = true;
          void (start > 0 ? player.seekTo(start) : Promise.resolve())
            .then(() => {
              if (generation !== ownGeneration) return;
              restored = true;
              clearLoadingTimer();
              update({ loading: false, position: start });
              player.setActiveForLockScreen(true, {
                title: lesson.title,
                artist: 'Bastiat Library',
                albumTitle: 'The Seen and the Unseen',
                artworkUrl: lesson.coverUrl,
              });
              player.play();
              console.info(
                JSON.stringify({
                  event: 'playback.ready',
                  source: local ? 'local' : 'remote',
                  elapsedMs: Date.now() - started,
                }),
              );
            })
            .catch(() => {
              if (generation !== ownGeneration) return;
              clearLoadingTimer();
              generation++;
              player.pause();
              update({
                error: 'We could not resume this lesson. Try again.',
                loading: false,
                playing: false,
              });
            });
        }
        const paused = state.playing && !status.playing;
        update({
          playing: status.playing,
          loading: !restored || !status.isLoaded || status.isBuffering,
          position: restored ? status.currentTime : start,
          duration: status.duration || lesson.durationSeconds,
        });
        if (
          restored &&
          status.isLoaded &&
          (Date.now() - lastCheckpoint > 5000 || status.didJustFinish || paused)
        )
          checkpoint();
      };
      nativeSubscriptions.push(player.addListener('playbackStatusUpdate', onStatus));
      // Loading can finish before the listener attaches, especially for local media.
      onStatus(player.currentStatus);
    } else {
      const player = createVideoPlayer({ uri: local ?? lesson.asset.url });
      video = player;
      player.timeUpdateEventInterval = 0.5;
      let restored = false;
      nativeSubscriptions.push(
        player.addListener('statusChange', ({ status, error }) => {
          if (generation !== ownGeneration) return;
          if (status === 'readyToPlay' && !restored && !state.error) {
            restored = true;
            clearLoadingTimer();
            player.currentTime = start;
            player.play();
          }
          if (error) clearLoadingTimer();
          update({
            loading: status === 'loading',
            error: error
              ? 'This video could not be played. Check your connection and try again.'
              : null,
          });
        }),
      );
      nativeSubscriptions.push(
        player.addListener('playingChange', ({ isPlaying }) => {
          if (generation === ownGeneration) update({ playing: isPlaying });
        }),
      );
      nativeSubscriptions.push(
        player.addListener('timeUpdate', ({ currentTime }) => {
          if (generation !== ownGeneration) return;
          update({ position: currentTime, duration: player.duration || lesson.durationSeconds });
          if (Date.now() - lastCheckpoint > 5000) checkpoint();
        }),
      );
      nativeSubscriptions.push(
        player.addListener('playToEnd', () => {
          if (generation === ownGeneration) checkpoint();
        }),
      );
      update({ loading: true });
    }
  } catch {
    if (generation === ownGeneration) {
      clearLoadingTimer();
      update({
        error: 'This lesson could not be played. Check your connection and try again.',
        loading: false,
      });
    }
  }
}

export function togglePlayback() {
  if (state.playing) {
    audio?.pause();
    video?.pause();
    update({ playing: false });
    checkpoint();
    void library.sync();
  } else {
    if (state.lesson) void playLesson(state.lesson);
  }
}
export async function seek(seconds: number) {
  const position = Math.max(0, Math.min(seconds, state.duration));
  if (audio) await audio.seekTo(position);
  if (video) video.currentTime = position;
  update({ position });
  checkpoint();
}
export function playbackSpeed(speed: number) {
  audio?.setPlaybackRate(speed);
  if (video) video.playbackRate = speed;
  update({ speed });
}
export function markComplete() {
  if (state.lesson) {
    library.saveProgress(state.lesson, state.position, true);
    void library.sync();
  }
}
export function watchPlayerLifecycle() {
  return AppState.addEventListener('change', (next) => {
    if (next !== 'active') {
      checkpoint();
      if (video) {
        video.pause();
        update({ playing: false });
      }
    }
  });
}
