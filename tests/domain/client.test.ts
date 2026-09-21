import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { homeSchema } from '../../packages/contracts/src/index';
import { ApiClient, ApiError } from '../../packages/contracts/src/client';

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal(
    'fetch',
    vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          const abort = () => reject(new DOMException('Request cancelled', 'AbortError'));
          if (init.signal?.aborted) abort();
          else init.signal?.addEventListener('abort', abort, { once: true });
        }),
    ),
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it('still times out when a caller provides its own cancellation signal', async () => {
  const caller = new AbortController();
  const result = new ApiClient('https://example.test').request('/slow', homeSchema, {
    signal: caller.signal,
  });
  const check = expect(result).rejects.toMatchObject({ status: 408 });
  await vi.advanceTimersByTimeAsync(15000);
  await check;
  expect(caller.signal.aborted).toBe(false);
  expect(vi.getTimerCount()).toBe(0);
});

it('preserves explicit cancellation instead of reporting a timeout', async () => {
  const caller = new AbortController();
  const result = new ApiClient('https://example.test').request('/cancelled', homeSchema, {
    signal: caller.signal,
  });
  const check = expect(result).rejects.toMatchObject({ name: 'AbortError' });
  caller.abort();
  await check;
  expect(vi.getTimerCount()).toBe(0);
});

it('does not start a live request with an already-cancelled signal', async () => {
  const caller = new AbortController();
  caller.abort();
  await expect(
    new ApiClient('https://example.test').request('/cancelled', homeSchema, {
      signal: caller.signal,
    }),
  ).rejects.not.toBeInstanceOf(ApiError);
  expect(vi.mocked(fetch).mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
  expect(vi.getTimerCount()).toBe(0);
});
