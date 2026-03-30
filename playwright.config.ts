import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  timeout: 5 * 60 * 1000,
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
    video: 'on', 
    screenshot: 'on',
    actionTimeout: 6000,
    navigationTimeout: 6000,
  },
  expect: {
    timeout: 6000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});