import type { NextConfig } from 'next';
import { networkInterfaces } from 'node:os';
const localAddresses = Object.values(networkInterfaces()).flatMap(entries => (entries ?? []).filter(entry => entry.family === 'IPv4').map(entry => entry.address));
const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Keep repeated local verification independent of stale Turbopack disk caches on Windows.
  experimental: { turbopackFileSystemCacheForDev: false },
  allowedDevOrigins: ['localhost', '127.0.0.1', ...localAddresses],
  distDir: process.env.MERCHANT_RESTART_TEST === 'true' ? '.next-restart' : process.env.MERCHANT_E2E === 'true' ? '.next-e2e' : '.next',
};
export default nextConfig;
