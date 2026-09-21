import { spawn, execFileSync } from 'node:child_process';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';

// Run against the local seeded environment with a signed, signed-out iOS Simulator app.
const device = process.argv[2];
if (!device) throw new Error('Pass the booted iOS Simulator identifier.');
process.loadEnvFile('apps/web/.env.local');
const password = process.env.SEED_PASSWORD;
if (!password) throw new Error('Local seed credentials are missing.');
const email = 'second@bastiat.local';
const started = Date.now();
const destination = path.resolve('.local/native-resume', String(started));
await mkdir(destination, { recursive: true, mode: 0o700 });
const redact = (value) => value.replaceAll(password, '[REDACTED]');
let output = '';
const exitCode = await new Promise((resolve, reject) => {
  const child = spawn(
    'maestro',
    ['--device', device, 'test', '--test-output-dir', destination, '.maestro/native-sync.yaml'],
    {
      env: {
        ...process.env,
        MAESTRO_READER_EMAIL: email,
        MAESTRO_READER_PASSWORD: password,
        MAESTRO_CLI_NO_ANALYTICS: '1',
        MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED: 'true',
      },
    },
  );
  for (const stream of [child.stdout, child.stderr])
    stream.on('data', (chunk) => {
      output += chunk;
    });
  child.on('error', reject);
  child.on('exit', resolve);
});
async function redactArtifacts(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await redactArtifacts(file);
    else if (/\.(json|log|xml|yaml|txt)$/.test(entry.name)) {
      await writeFile(file, redact(await readFile(file, 'utf8')), { mode: 0o600 });
    }
  }
}
await redactArtifacts(destination);
await writeFile(path.join(destination, 'maestro.log'), redact(output), { mode: 0o600 });
assert.equal(exitCode, 0, `Native flow failed; inspect ${destination}`);

const container = execFileSync(
  'xcrun',
  ['simctl', 'get_app_container', device, 'com.gabrielpimenta.bastiatlibrary', 'data'],
  { encoding: 'utf8' },
).trim();
const database = new DatabaseSync(path.join(container, 'Documents/SQLite/bastiat-library.db'), {
  readOnly: true,
});
const records = database
  .prepare(
    "SELECT scope, value_json, updated_at FROM records WHERE namespace='progress' AND key='the-broken-window'",
  )
  .all();
database.close();
const browser = await chromium.launch({
  args: process.platform === 'darwin' ? ['--disable-features=HardwareMediaKeyHandling'] : [],
});
try {
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/profile');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
  const me = await (
    await page.request.get('http://localhost:3000/api/users/me', {
      headers: { Origin: 'http://localhost:3000' },
    })
  ).json();
  assert.ok(me.user, 'The authenticated browser session was not accepted by the API.');
  const record = records.find((item) => item.scope === `user:${me.user.id}`);
  assert.ok(
    record && record.updated_at >= started,
    'Native checkpoint was not written during this run.',
  );
  const native = JSON.parse(record.value_json);
  assert.equal(native.dirty, false, 'Native checkpoint has not synchronized.');
  assert.ok(native.value.positionSeconds >= 30, 'Native playback/seek did not advance.');
  await page.goto('http://localhost:3000/lesson/the-broken-window');
  await expect
    .poll(async () =>
      Math.abs(
        Number(await page.getByLabel('Playback position').inputValue()) -
          native.value.positionSeconds,
      ),
    )
    .toBeLessThanOrEqual(2);
  const observed = Number(await page.getByLabel('Playback position').inputValue());
  await page.screenshot({ path: path.join(destination, 'web-resumed.png'), fullPage: false });
  const evidence = {
    recordedAt: new Date().toISOString(),
    sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    nativeEnvironment: 'Signed iOS Simulator development client with Metro',
    webEnvironment: 'Local Next.js server / Chromium',
    lessonSlug: native.value.lessonSlug,
    nativePositionSeconds: native.value.positionSeconds,
    webPositionSeconds: observed,
    revision: native.value.revision,
    result: 'passed',
  };
  await writeFile(path.join(destination, 'evidence.json'), JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence, null, 2));
} finally {
  await browser.close();
}
