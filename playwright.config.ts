import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', fullyParallel: false, workers: 1, timeout: 30000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:3100', trace: 'retain-on-failure', actionTimeout: 15000 },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev -- --port 3100', url: 'http://127.0.0.1:3100/api/health',
    reuseExistingServer: !process.env.CI, timeout: 120000,
    env: {
      MERCHANT_E2E: 'true',
      NEXT_PUBLIC_USE_FIREBASE_EMULATORS: 'true',
      NEXT_PUBLIC_FIREBASE_API_KEY: 'demo-api-key', NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'demo-merchants-bluff.firebaseapp.com',
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-merchants-bluff', NEXT_PUBLIC_FIREBASE_DATABASE_URL: 'https://demo-merchants-bluff-default-rtdb.firebaseio.com',
      NEXT_PUBLIC_FIREBASE_APP_ID: 'demo-app-id', NEXT_PUBLIC_FIREBASE_EMULATOR_HOST: '127.0.0.1',
      NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT: '19099', NEXT_PUBLIC_FIREBASE_DATABASE_EMULATOR_PORT: '19000',
      FIREBASE_PROJECT_ID: 'demo-merchants-bluff', FIREBASE_DATABASE_URL: 'https://demo-merchants-bluff-default-rtdb.firebaseio.com',
      FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:19099', FIREBASE_DATABASE_EMULATOR_HOST: '127.0.0.1:19000',
    },
  },
});
