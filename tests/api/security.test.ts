import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { catalogSchema, progressResultSchema, type Progress } from '../../packages/contracts/src';

if (existsSync('apps/web/.env.local')) process.loadEnvFile('apps/web/.env.local');
const base = process.env.TEST_BASE_URL ?? 'http://localhost:3000';
let token = '';
let otherToken = '';
let editorToken = '';
let owner = 0;
let draftId = 0;
const request = (
  path: string,
  auth = '',
  data?: unknown,
  method = data === undefined ? 'GET' : 'POST',
  extra: Record<string, string> = {},
) =>
  fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(auth ? { Authorization: `JWT ${auth}` } : {}),
      ...extra,
    },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
async function current(): Promise<Progress | undefined> {
  return (await (await request('/api/v1/library', token)).json()).progress.find(
    (p: Progress) => p.lessonSlug === 'the-broken-window',
  );
}
const mutation = (revision = 0, position = 35) => ({
  operationId: randomUUID(),
  lessonSlug: 'the-broken-window',
  positionSeconds: position,
  completed: false,
  assetVersion: '1',
  baseRevision: revision,
});
beforeAll(async () => {
  if (!process.env.SEED_PASSWORD)
    throw new Error('SEED_PASSWORD is required for the isolated test database.');
  for (const [email, assign] of [
    [
      process.env.SEED_STUDENT_EMAIL ?? 'reader@bastiat.local',
      (data: { token: string; user: { id: number } }) => {
        token = data.token;
        owner = data.user.id;
      },
    ],
    [
      'second@bastiat.local',
      (data: { token: string }) => {
        otherToken = data.token;
      },
    ],
    [
      process.env.SEED_ADMIN_EMAIL ?? 'editor@bastiat.local',
      (data: { token: string }) => {
        editorToken = data.token;
      },
    ],
  ] as const) {
    const response = await request('/api/users/login', '', {
      email,
      password: process.env.SEED_PASSWORD,
    });
    expect(response.status).toBe(200);
    assign(await response.json());
  }
});
afterAll(async () => {
  if (draftId) await request(`/api/articles/${draftId}`, editorToken, undefined, 'DELETE');
});

describe('public API and authentication boundaries', () => {
  it('returns validated, paginated content and rejects invalid queries', async () => {
    const response = await request('/api/v1/catalog');
    expect(response.status).toBe(200);
    const catalog = catalogSchema.parse(await response.json());
    expect(catalog.totalItems).toBeGreaterThanOrEqual(6);
    expect((await request('/api/v1/catalog?page=0')).status).toBe(400);
    const audio = catalogSchema.parse(await (await request('/api/v1/catalog?kind=audio')).json());
    expect(audio.items.every((item) => item.kind === 'lesson' && item.format === 'audio')).toBe(
      true,
    );
  });
  it('requires authentication and prevents cross-origin writes', async () => {
    expect((await request('/api/v1/library')).status).toBe(401);
    expect((await request('/api/v1/progress', '', mutation())).status).toBe(401);
    expect(
      (
        await request('/api/v1/progress', token, mutation(), 'POST', {
          Origin: 'https://untrusted.example',
        })
      ).status,
    ).toBe(403);
    expect((await request('/api/v1/progress', token, { ...mutation(), owner: 999 })).status).toBe(
      400,
    );
    expect(
      (await request('/api/v1/progress', token, { ...mutation(), positionSeconds: -10 })).status,
    ).toBe(400);
  });
  it('does not allow bypassing progress validation through Payload REST', async () => {
    expect(
      (
        await request('/api/progress', token, {
          owner,
          lessonSlug: 'the-broken-window',
          positionSeconds: 999,
          completed: false,
          assetVersion: '1',
          revision: 999,
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await request('/api/users', '', {
          email: `injected-${randomUUID()}@example.test`,
          password: 'test-only-password-123456789',
          name: 'Injected',
          role: 'editor',
        })
      ).status,
    ).toBe(403);
    const result = await request(`/api/users/${owner}`, token, { role: 'editor' }, 'PATCH');
    if (result.ok) expect((await result.json()).doc.role).toBe('student');
    else expect(result.status).toBe(403);
  });
  it('keeps editor drafts out of public routes even for an editor session', async () => {
    const published = (await (await request('/api/articles?limit=1', editorToken)).json()).docs[0];
    const slug = `test-draft-${randomUUID()}`;
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...fields } = published;
    const created = await request('/api/articles', editorToken, {
      ...fields,
      sources: fields.sources.map((source: { title: string; url: string }) => ({
        title: source.title,
        url: source.url,
      })),
      slug,
      author: typeof fields.author === 'object' ? fields.author.id : fields.author,
      topic: typeof fields.topic === 'object' ? fields.topic.id : fields.topic,
      title: slug,
      _status: 'draft',
    });
    expect(created.status).toBe(201);
    draftId = (await created.json()).doc.id;
    expect((await request(`/api/v1/content/article/${slug}`)).status).toBe(404);
    expect((await request(`/api/v1/content/article/${slug}`, editorToken)).status).toBe(404);
    const result = catalogSchema.parse(await (await request(`/api/v1/catalog?q=${slug}`)).json());
    expect(result.items).toEqual([]);
  });
  it('serves byte ranges for real media', async () => {
    const lesson = await (await request('/api/v1/content/lesson/the-broken-window')).json();
    const response = await fetch(lesson.asset.url, { headers: { Range: 'bytes=0-1023' } });
    expect(response.status).toBe(206);
    expect(response.headers.get('content-range')).toMatch(/^bytes 0-1023\//);
    expect((await response.arrayBuffer()).byteLength).toBe(1024);
  });
});

describe('transactional progress and idempotency', () => {
  it('replays one committed operation and rejects reuse with a different payload', async () => {
    const input = mutation((await current())?.revision ?? 0);
    const a = progressResultSchema.parse(
      await (await request('/api/v1/progress', token, input)).json(),
    );
    expect(a.status).toBe('accepted');
    const b = await (await request('/api/v1/progress', token, input)).json();
    expect(b).toEqual(a);
    expect(
      (await request('/api/v1/progress', token, { ...input, positionSeconds: 70 })).status,
    ).toBe(409);
  });
  it('serializes simultaneous edits and exposes an explicit conflict', async () => {
    const revision = (await current())!.revision;
    const responses = await Promise.all([
      request('/api/v1/progress', token, mutation(revision, 65)),
      request('/api/v1/progress', token, mutation(revision, 90)),
    ]);
    const results = await Promise.all(responses.map((response) => response.json()));
    expect(results.map((result) => result.status).sort()).toEqual(['accepted', 'conflict']);
    expect((await current())?.revision).toBe(revision + 1);
  });
  it('scopes records to the authenticated user and marks responses private', async () => {
    const own = await request('/api/v1/library', token);
    expect(own.headers.get('cache-control')).toContain('no-store');
    const ownDoc = (await (await request('/api/progress', token)).json()).docs.find(
      (doc: { lessonSlug: string }) => doc.lessonSlug === 'the-broken-window',
    );
    expect(ownDoc).toBeDefined();
    expect((await request(`/api/progress/${ownDoc.id}`, otherToken)).status).toBe(404);
    const foreign = await request(`/api/progress?where[owner][equals]=${owner}`, otherToken);
    expect((await foreign.json()).docs).toEqual([]);
  });
  it('does not reapply a stale bookmark retry after a later removal', async () => {
    const save = {
      operationId: randomUUID(),
      targetKind: 'article',
      targetSlug: 'trade-and-cooperation',
      saved: true,
    };
    expect((await request('/api/v1/bookmarks', token, save)).status).toBe(200);
    await request('/api/v1/bookmarks', token, { ...save, operationId: randomUUID(), saved: false });
    await request('/api/v1/bookmarks', token, save);
    const library = await (await request('/api/v1/library', token)).json();
    expect(
      library.bookmarks.find((item: { targetSlug: string }) => item.targetSlug === save.targetSlug)
        .saved,
    ).toBe(false);
  });
});

describe('catalog scale and session lifecycle', () => {
  it('pages beyond a single batch without duplicate or missing content', async () => {
    const original = (await (await request('/api/articles?limit=1&depth=0', editorToken)).json())
      .docs[0];
    const prefix = `qa-pagination-${randomUUID()}`;
    const ids: number[] = [];
    try {
      for (let index = 0; index < 26; index++) {
        const response = await request('/api/articles', editorToken, {
          title: `${prefix} ${String(index).padStart(2, '0')}`,
          slug: `${prefix}-${index}`,
          description: 'Synthetic pagination fixture. Removed after the test.',
          author: original.author,
          topic: original.topic,
          cover: 'law',
          body: 'Synthetic test content.',
          readingMinutes: 1,
          sources: [],
          _status: 'published',
        });
        expect(response.status).toBe(201);
        ids.push((await response.json()).doc.id);
      }
      const pages = await Promise.all(
        [1, 2, 3].map(async (page) =>
          catalogSchema.parse(
            await (await request(`/api/v1/catalog?kind=article&q=${prefix}&page=${page}`)).json(),
          ),
        ),
      );
      expect(pages.map((page) => page.items.length)).toEqual([12, 12, 2]);
      expect(pages.every((page) => page.totalItems === 26 && page.totalPages === 3)).toBe(true);
      expect(new Set(pages.flatMap((page) => page.items.map((item) => item.slug))).size).toBe(26);
    } finally {
      for (const id of ids) await request(`/api/articles/${id}`, editorToken, undefined, 'DELETE');
    }
  });
  it('revokes the native token on logout while other sessions remain valid', async () => {
    const logged = await request('/api/users/login', '', {
      email: process.env.SEED_STUDENT_EMAIL ?? 'reader@bastiat.local',
      password: process.env.SEED_PASSWORD,
    });
    const temporary = (await logged.json()).token;
    expect((await request('/api/v1/library', temporary)).status).toBe(200);
    expect((await request('/api/users/logout', temporary, undefined, 'POST')).status).toBe(200);
    expect((await request('/api/v1/library', temporary)).status).toBe(401);
    expect((await request('/api/v1/library', token)).status).toBe(200);
    expect((await request('/api/v1/library', 'invalid-token')).status).toBe(401);
  });
});
