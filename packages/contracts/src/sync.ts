import type { Progress, ProgressMutation, ProgressResult } from './index';

export type DownloadState =
  'queued' | 'downloading' | 'verifying' | 'ready' | 'failed' | 'cancelled';
const transitions: Record<DownloadState, readonly DownloadState[]> = {
  queued: ['downloading', 'cancelled', 'failed'],
  downloading: ['verifying', 'failed', 'cancelled'],
  verifying: ['ready', 'failed', 'cancelled'],
  ready: ['queued'],
  failed: ['queued'],
  cancelled: ['queued'],
};

export function transitionDownload(from: DownloadState, to: DownloadState): DownloadState {
  if (!transitions[from].includes(to))
    throw new Error(`Invalid download transition: ${from} → ${to}`);
  return to;
}

export function verifyAsset(
  actual: { bytes: number; sha256: string },
  expected: { bytes: number; sha256: string },
): boolean {
  return (
    actual.bytes === expected.bytes && actual.sha256.toLowerCase() === expected.sha256.toLowerCase()
  );
}

// Run inside the server transaction; the server revision is the authority, not device clocks.
export function decideProgress(
  current: Progress | null,
  mutation: ProgressMutation,
  duration: number,
  now: string,
): ProgressResult {
  const revision = current?.revision ?? 0;
  if (revision !== mutation.baseRevision && current)
    return { status: 'conflict', progress: current };
  if (!current && mutation.baseRevision !== 0)
    throw new Error('Missing progress for non-zero revision');
  return {
    status: 'accepted',
    progress: {
      lessonSlug: mutation.lessonSlug,
      positionSeconds: Math.min(mutation.positionSeconds, duration),
      completed: mutation.completed,
      assetVersion: mutation.assetVersion,
      revision: revision + 1,
      updatedAt: now,
    },
  };
}

export function resumePosition(
  progress: Progress | undefined,
  assetVersion: string,
  duration: number,
): number {
  if (!progress || progress.assetVersion !== assetVersion) return 0;
  return Math.min(Math.max(0, progress.positionSeconds), duration);
}

export function retryDelay(attempt: number): number {
  return Math.min(1000 * 2 ** Math.min(attempt, 6), 60000);
}
