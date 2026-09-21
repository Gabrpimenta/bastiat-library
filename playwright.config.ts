import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';
if (existsSync('apps/web/.env.local')) process.loadEnvFile('apps/web/.env.local');
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.TEST_BASE_URL ?? 'http://localhost:3000',
    trace: 'off',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } },
    },
  ],
  webServer: {
    command: process.env.TEST_SERVER_COMMAND ?? 'pnpm dev',
    url: 'http://localhost:3000/api/health',
    reuseExistingServer: !process.env.CI || process.env.CI_SERVER_ALREADY_RUNNING === 'true',
    timeout: 120000,
  },
});
