'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  useCallback,
  type ReactNode,
} from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiClient } from '@bastiat/contracts/client';
import { LibraryController, type KeyValueStore } from '@bastiat/contracts/library';
import type { Lesson, User } from '@bastiat/contracts';
import { resumePosition } from '@bastiat/contracts/sync';

export const api = new ApiClient('');
const prefix = (scope: string, namespace: string) => `bastiat:v2:${scope}:${namespace}:`;
const browserStorage: KeyValueStore = {
  get<T>(scope: string, namespace: string, key: string): T | null {
    if (typeof window === 'undefined') return null;
    try {
      return JSON.parse(localStorage.getItem(prefix(scope, namespace) + key) ?? 'null');
    } catch {
      return null;
    }
  },
  set(scope, namespace, key, value) {
    if (typeof window !== 'undefined')
      localStorage.setItem(prefix(scope, namespace) + key, JSON.stringify(value));
  },
  all<T>(scope: string, namespace: string): T[] {
    if (typeof window === 'undefined') return [];
    return Object.keys(localStorage)
      .filter((key) => key.startsWith(prefix(scope, namespace)))
      .flatMap((key) => {
        try {
          return [JSON.parse(localStorage.getItem(key)!) as T];
        } catch {
          return [];
        }
      });
  },
  remove(scope, namespace, key) {
    if (typeof window !== 'undefined') localStorage.removeItem(prefix(scope, namespace) + key);
  },
  clear(scope) {
    if (typeof window !== 'undefined')
      Object.keys(localStorage)
        .filter((key) => key.startsWith(`bastiat:v2:${scope}:`))
        .forEach((key) => localStorage.removeItem(key));
  },
};
export const library = new LibraryController(browserStorage, api, () => crypto.randomUUID());
export function useLibrary() {
  useSyncExternalStore(library.subscribe, library.snapshot, () => 0);
  return library;
}

type Player = {
  lesson: Lesson | null;
  position: number;
  duration: number;
  playing: boolean;
  loading: boolean;
  speed: number;
  error: string | null;
};
type Context = {
  user: User | null;
  sessionReady: boolean;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  player: Player;
  play(lesson: Lesson): Promise<void>;
  toggle(): void;
  seek(position: number): void;
  speed(value: number): void;
  stop(): void;
  attachVideo(element: HTMLVideoElement | null): void;
  markComplete(): void;
};
const initialPlayer: Player = {
  lesson: null,
  position: 0,
  duration: 0,
  playing: false,
  loading: false,
  speed: 1,
  error: null,
};
const AppContext = createContext<Context | null>(null);
export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('App provider is missing');
  return value;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 60000, retry: 1 } } }),
  );
  const [user, setUser] = useState<User | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [player, setPlayer] = useState(initialPlayer);
  const media = useRef<HTMLMediaElement | null>(null);
  const lesson = useRef<Lesson | null>(null);
  const videoElement = useRef<HTMLVideoElement | null>(null);
  const checkpointAt = useRef(0);
  const cleanup = useRef<() => void>(() => {});
  const pendingVideo = useRef<Lesson | null>(null);

  const checkpoint = useCallback(() => {
    if (lesson.current && media.current && media.current.readyState >= 1) {
      library.saveProgress(lesson.current, media.current.currentTime);
      checkpointAt.current = Date.now();
    }
  }, []);
  const stop = useCallback(() => {
    checkpoint();
    cleanup.current();
    media.current?.pause();
    media.current = null;
    lesson.current = null;
    pendingVideo.current = null;
    setPlayer(initialPlayer);
    if ('mediaSession' in navigator) navigator.mediaSession.metadata = null;
  }, [checkpoint]);

  useEffect(() => {
    let alive = true;
    void api
      .me()
      .then((value) => {
        if (alive) {
          setUser(value);
          library.setUser(value?.id ?? null);
          void library.sync();
        }
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setSessionReady(true);
      });
    const sync = () => {
      checkpoint();
      void library.sync();
    };
    const interval = setInterval(sync, 15000);
    window.addEventListener('online', sync);
    window.addEventListener('pagehide', checkpoint);
    document.addEventListener('visibilitychange', sync);
    return () => {
      alive = false;
      clearInterval(interval);
      window.removeEventListener('online', sync);
      window.removeEventListener('pagehide', checkpoint);
      document.removeEventListener('visibilitychange', sync);
      cleanup.current();
      media.current?.pause();
    };
  }, [checkpoint]);

  async function start(item: Lesson, element: HTMLMediaElement) {
    cleanup.current();
    media.current?.pause();
    lesson.current = item;
    media.current = element;
    const position = resumePosition(
      library.progress(item.slug)?.value,
      item.asset.version,
      item.durationSeconds,
    );
    setPlayer({
      lesson: item,
      position,
      duration: item.durationSeconds,
      playing: false,
      loading: true,
      speed: 1,
      error: null,
    });
    let ready = false;
    const loaded = () => {
      if (ready || media.current !== element) return;
      ready = true;
      element.currentTime = position;
    };
    const onTime = () => {
      setPlayer((current) => ({
        ...current,
        position: element.currentTime,
        duration: Number.isFinite(element.duration) ? element.duration : item.durationSeconds,
      }));
      if (Date.now() - checkpointAt.current > 5000) checkpoint();
    };
    const onPlay = () =>
      setPlayer((current) => ({ ...current, playing: true, loading: false, error: null }));
    const onPause = () => {
      checkpoint();
      setPlayer((current) => ({ ...current, playing: false }));
      void library.sync();
    };
    const onError = () =>
      setPlayer((current) => ({
        ...current,
        loading: false,
        playing: false,
        error: 'This lesson could not be loaded. Please try again.',
      }));
    const onWaiting = () => setPlayer((current) => ({ ...current, loading: true }));
    const onCanPlay = () => setPlayer((current) => ({ ...current, loading: false }));
    const events = {
      loadedmetadata: loaded,
      timeupdate: onTime,
      play: onPlay,
      pause: onPause,
      ended: onPause,
      error: onError,
      waiting: onWaiting,
      canplay: onCanPlay,
    };
    for (const [event, handler] of Object.entries(events)) element.addEventListener(event, handler);
    cleanup.current = () => {
      for (const [event, handler] of Object.entries(events))
        element.removeEventListener(event, handler);
    };
    element.src = item.asset.url;
    element.preload = 'metadata';
    element.load();
    // Request playback in the user's click, before asynchronous media events lose activation.
    void element.play().catch(() => {
      if (media.current !== element) return;
      setPlayer((current) => ({
        ...current,
        loading: false,
        playing: false,
        error: 'Press play to begin this lesson.',
      }));
    });
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: item.title,
        artist: 'Bastiat Library',
        artwork: [{ src: item.coverUrl }],
      });
      navigator.mediaSession.setActionHandler('play', () => {
        void element.play();
      });
      navigator.mediaSession.setActionHandler('pause', () => element.pause());
      navigator.mediaSession.setActionHandler('seekbackward', () => {
        element.currentTime = Math.max(0, element.currentTime - 15);
      });
      navigator.mediaSession.setActionHandler('seekforward', () => {
        element.currentTime = Math.min(item.durationSeconds, element.currentTime + 15);
      });
    }
  }
  async function play(item: Lesson) {
    if (lesson.current?.slug === item.slug && media.current) {
      if (media.current.ended) media.current.currentTime = 0;
      await media.current.play();
      return;
    }
    checkpoint();
    media.current?.pause();
    if (item.format === 'audio') await start(item, new Audio());
    else {
      pendingVideo.current = item;
      setPlayer({ ...initialPlayer, lesson: item, duration: item.durationSeconds, loading: true });
      if (videoElement.current) {
        pendingVideo.current = null;
        await start(item, videoElement.current);
      }
    }
  }
  const attachVideo = useCallback(
    (element: HTMLVideoElement | null) => {
      videoElement.current = element;
      if (element && pendingVideo.current) {
        const item = pendingVideo.current;
        pendingVideo.current = null;
        void start(item, element);
      }
      if (!element && media.current instanceof HTMLVideoElement) {
        const detached = media.current;
        // React Strict Mode briefly detaches and reattaches refs. Stop only after a real unmount.
        queueMicrotask(() => {
          if (!videoElement.current && media.current === detached) {
            checkpoint();
            detached.pause();
            cleanup.current();
            media.current = null;
            lesson.current = null;
            setPlayer(initialPlayer);
          }
        });
      }
    },
    [checkpoint],
  ); // The video element belongs to the lesson view; audio lives at the application root.

  const context: Context = {
    user,
    sessionReady,
    player,
    play,
    stop,
    attachVideo,
    async login(email, password) {
      stop();
      const result = await api.login(email.trim(), password);
      setUser(result.user);
      library.setUser(result.user.id);
      await library.sync();
    },
    async logout() {
      stop();
      await api.logout();
      if (user) library.clearUser(user.id);
      setUser(null);
      library.setUser(null);
      queryClient.removeQueries({ queryKey: ['private'] });
    },
    toggle() {
      const element = media.current;
      if (!element) return;
      if (element.paused) {
        if (element.ended) element.currentTime = 0;
        void element
          .play()
          .catch(() =>
            setPlayer((current) => ({ ...current, error: 'Playback could not start. Try again.' })),
          );
      } else element.pause();
    },
    seek(position) {
      if (!media.current) return;
      media.current.currentTime = Math.max(0, Math.min(position, player.duration));
      checkpoint();
    },
    speed(value) {
      if (media.current) media.current.playbackRate = value;
      setPlayer((current) => ({ ...current, speed: value }));
    },
    markComplete() {
      if (lesson.current && media.current) {
        library.saveProgress(lesson.current, media.current.currentTime, true);
        void library.sync();
      }
    },
  };
  return (
    <QueryClientProvider client={queryClient}>
      <AppContext.Provider value={context}>{children}</AppContext.Provider>
    </QueryClientProvider>
  );
}
