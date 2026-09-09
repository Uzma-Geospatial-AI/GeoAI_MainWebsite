const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:8080',
    viewport: { width: 1440, height: 1000 },
    channel: process.env.CI ? undefined : 'chrome',
    headless: true,
    screenshot: 'only-on-failure',
    launchOptions: { args: process.env.CI ? ['--enable-unsafe-swiftshader'] : [] },
  },
  webServer: { command: 'npm start', url: 'http://localhost:8080', reuseExistingServer: !process.env.CI },
});
