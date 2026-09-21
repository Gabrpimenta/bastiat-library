import { z } from 'zod';
import {
  catalogSchema,
  homeSchema,
  contentSchema,
  librarySchema,
  progressResultSchema,
  bookmarkSchema,
  userSchema,
  type ProgressMutation,
  type BookmarkMutation,
} from './index';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly token: () => string | null = () => null,
  ) {}

  async request<T>(path: string, schema: z.ZodType<T>, init: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const cancel = () => controller.abort();
    if (init.signal?.aborted) cancel();
    else init.signal?.addEventListener('abort', cancel, { once: true });
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const token = this.token();
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        credentials: 'include',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `JWT ${token}` } : {}),
          ...init.headers,
        },
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        const message = z.object({ error: z.string() }).safeParse(data);
        throw new ApiError(
          response.status,
          message.success
            ? message.data.error
            : response.status === 401
              ? 'Please sign in again.'
              : 'We could not complete that request. Please try again.',
        );
      }
      const parsed = schema.safeParse(data);
      if (!parsed.success)
        throw new ApiError(502, 'This content is not compatible with this version of the app.');
      return parsed.data;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError' && !init.signal?.aborted)
        throw new ApiError(408, 'The request took too long. Please try again.');
      throw error;
    } finally {
      clearTimeout(timeout);
      init.signal?.removeEventListener('abort', cancel);
    }
  }

  home() {
    return this.request('/api/v1/home', homeSchema);
  }
  catalog(query = '', kind = 'all', page = 1) {
    return this.request(
      `/api/v1/catalog?q=${encodeURIComponent(query)}&kind=${encodeURIComponent(kind)}&page=${page}`,
      catalogSchema,
    );
  }
  content(kind: string, slug: string) {
    return this.request(
      `/api/v1/content/${encodeURIComponent(kind)}/${encodeURIComponent(slug)}`,
      contentSchema,
    );
  }
  library() {
    return this.request('/api/v1/library', librarySchema);
  }
  progress(mutation: ProgressMutation) {
    return this.request('/api/v1/progress', progressResultSchema, {
      method: 'POST',
      body: JSON.stringify(mutation),
    });
  }
  bookmark(mutation: BookmarkMutation) {
    return this.request('/api/v1/bookmarks', bookmarkSchema, {
      method: 'POST',
      body: JSON.stringify(mutation),
    });
  }
  async me() {
    const result = await this.request('/api/users/me', z.object({ user: userSchema.nullable() }));
    return result.user;
  }
  login(email: string, password: string) {
    return this.request(
      '/api/users/login',
      z.object({ user: userSchema, token: z.string(), exp: z.number() }),
      { method: 'POST', body: JSON.stringify({ email, password }) },
    );
  }
  async logout() {
    await this.request('/api/users/logout', z.object({ message: z.string() }), { method: 'POST' });
  }
}
