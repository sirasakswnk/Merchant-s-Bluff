import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
export default defineConfig([
  ...nextVitals, ...nextTs,
  { files: ['src/lib/game/**/*.ts'], rules: { 'no-restricted-imports': ['error', { patterns: ['firebase', 'firebase/*', 'firebase-admin', 'firebase-admin/*', 'next', 'next/*', 'react', '@/lib/server/*', '@/lib/client/*'] }] } },
  { files: ['src/lib/client/**/*.ts', 'src/components/**/*.tsx'], rules: { 'no-restricted-imports': ['error', { patterns: ['firebase-admin', 'firebase-admin/*', '@/lib/server/*'] }] } },
  globalIgnores(['.next*/**', 'node_modules/**', 'next-env.d.ts', 'test-results/**', 'playwright-report/**', 'work/**']),
]);
