import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src/', import.meta.url)) } },
  test: { projects: [
    { extends: true, test: { name: 'unit', include: ['tests/unit/**/*.test.ts'], environment: 'node' } },
    { extends: true, resolve: { alias: { 'server-only': fileURLToPath(new URL('./tests/fixtures/server-only.ts', import.meta.url)) } }, test: { name: 'integration', include: ['tests/integration/**/*.test.ts'], environment: 'node', testTimeout: 15000, hookTimeout: 15000 } },
  ] },
});
