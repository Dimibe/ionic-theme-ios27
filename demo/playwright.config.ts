import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for screenshot testing
 * See https://playwright.dev/docs/test-configuration
 */
const port = process.env['PLAYWRIGHT_PORT'] ?? '4200';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  workers: process.env['CI'] ? 4 : undefined,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  snapshotPathTemplate: '{testDir}/{testFileDir}/{testFileName}-snapshots/{arg}{ext}',
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Explicitly enable headless mode for better performance in CI
        headless: true,
      },
    },
  ],
  webServer: {
    command: `npm run start -- --port=${port}${process.env['IONIC_MAJOR'] === '8' ? ' --configuration=ionic8' : ''}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env['CI'] && process.env['IONIC_MAJOR'] === undefined && process.env['PLAYWRIGHT_PORT'] === undefined,
    timeout: 120000,
  },
});
