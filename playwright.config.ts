import { defineConfig, devices } from '@playwright/test';
process.env.PLAYWRIGHT_BROWSERS_PATH ||= `${process.cwd()}/.browsers`;
export default defineConfig({
  testDir: 'tests', testMatch: ['*.spec.ts'], timeout: 45_000, retries: 0, workers: 1,
  use: { launchOptions:{executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH}, ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:4210', viewport: {width: 1440, height: 810}, video: 'on', screenshot: 'on' },
  webServer: { command: 'npm run dev', url: 'http://127.0.0.1:4210', reuseExistingServer: false, timeout: 90_000 },
  outputDir: 'artifacts/playwright', reporter: [['list']],
});
