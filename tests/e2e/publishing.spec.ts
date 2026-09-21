import { randomUUID } from 'node:crypto';
import { test, expect } from '@playwright/test';

test('an editor publishes a draft lesson in the studio and a guest can study it', async ({
  page,
  request,
  browser,
}) => {
  test.setTimeout(60000);
  page.setDefaultTimeout(10000);
  const email = process.env.SEED_ADMIN_EMAIL ?? 'editor@bastiat.local';
  const password = process.env.SEED_PASSWORD!;
  const auth = await request.post('/api/users/login', { data: { email, password } });
  expect(auth.ok()).toBe(true);
  const { token } = await auth.json();
  const headers = { Authorization: `JWT ${token}` };
  const sourceResponse = await request.get(
    '/api/lessons?where[slug][equals]=the-broken-window&depth=0',
    { headers },
  );
  const source = (await sourceResponse.json()).docs[0];
  const slug = `qa-publish-${randomUUID()}`;
  const title = 'QA fixture: published through the editorial studio';
  const create = await request.post('/api/lessons', {
    headers,
    data: {
      title,
      slug,
      description: 'Temporary synthetic publishing acceptance fixture.',
      author: source.author,
      topic: source.topic,
      cover: source.cover,
      course: source.course,
      order: 98,
      format: source.format,
      asset: source.asset,
      transcript: source.transcript,
      sources: source.sources.map(({ title, url }: { title: string; url: string }) => ({
        title,
        url,
      })),
      _status: 'draft',
    },
  });
  expect(create.status()).toBe(201);
  const id = (await create.json()).doc.id;
  const guest = await browser.newContext();
  try {
    expect((await guest.request.get(`/api/v1/content/lesson/${slug}`)).status()).toBe(404);
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await page.getByRole('link', { name: 'Show all Lessons', exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/collections\/lessons(?:\?|$)/);
    await page.goto(`/admin/collections/lessons/${id}`);
    await page.getByRole('button', { name: 'Publish changes', exact: true }).click();
    await expect
      .poll(async () => (await guest.request.get(`/api/v1/content/lesson/${slug}`)).status())
      .toBe(200);
    const reader = await guest.newPage();
    await reader.goto(`/lesson/${slug}`);
    await expect(reader.getByRole('heading', { name: title })).toBeVisible();
    await reader.getByRole('button', { name: 'Play lesson', exact: true }).click();
    await expect
      .poll(async () => Number(await reader.getByLabel('Playback position').inputValue()))
      .toBeGreaterThan(0.2);
    await reader.getByRole('button', { name: 'Pause lesson', exact: true }).click();
  } finally {
    // Keep cleanup independent of Playwright contexts, which close on a test timeout.
    const cleanup = await fetch(
      `${process.env.TEST_BASE_URL ?? 'http://localhost:3000'}/api/lessons/${id}`,
      { method: 'DELETE', headers },
    );
    expect(cleanup.ok).toBe(true);
    await guest.close();
  }
});
