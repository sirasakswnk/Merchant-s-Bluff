import { createPrivateKey } from 'node:crypto';
import { pathToFileURL } from 'node:url';

export const requiredKeys = [
  'NEXT_PUBLIC_USE_FIREBASE_EMULATORS',
  'NEXT_PUBLIC_FIREBASE_API_KEY', 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'NEXT_PUBLIC_FIREBASE_DATABASE_URL',
  'NEXT_PUBLIC_FIREBASE_APP_ID', 'FIREBASE_PROJECT_ID', 'FIREBASE_DATABASE_URL',
  'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY',
];

function databaseOrigin(value) {
  try {
    const url = new URL(value);
    const firebaseHost = /^[a-z0-9-]+\.firebaseio\.com$/.test(url.hostname)
      || /^[a-z0-9-]+\.[a-z0-9-]+\.firebasedatabase\.app$/.test(url.hostname);
    if (url.protocol !== 'https:' || !firebaseHost || url.hostname.startsWith('demo-')
      || url.port || url.username || url.password || url.search || url.hash || url.pathname !== '/') return null;
    return url.origin;
  } catch { return null; }
}

// Only key names and fixed reasons leave this function. Never return input values/errors.
export function checkDeploymentEnv(env) {
  const issues = [];
  const value = name => env[name] ?? '';
  const present = name => value(name).trim().length > 0;
  const reject = (name, reason) => issues.push({ name, reason });
  for (const name of requiredKeys) {
    if (!present(name)) reject(name, 'missing');
    else if (value(name).startsWith('demo-') || /<[^>]+>|\$\{[^}]+\}/.test(value(name))) reject(name, 'demo or unresolved placeholder');
  }
  if (present('NEXT_PUBLIC_USE_FIREBASE_EMULATORS') && value('NEXT_PUBLIC_USE_FIREBASE_EMULATORS') !== 'false') {
    reject('NEXT_PUBLIC_USE_FIREBASE_EMULATORS', 'must be false');
  }
  for (const name of ['FIREBASE_AUTH_EMULATOR_HOST', 'FIREBASE_DATABASE_EMULATOR_HOST', 'NEXT_PUBLIC_FIREBASE_EMULATOR_HOST']) {
    if (present(name)) reject(name, 'remove emulator host');
  }
  for (const name of ['MERCHANT_E2E', 'MERCHANT_RESTART_TEST']) {
    if (value(name) === 'true') reject(name, 'remove test build flag');
  }
  if (present('FIREBASE_PROJECT_ID') && present('NEXT_PUBLIC_FIREBASE_PROJECT_ID')
    && value('FIREBASE_PROJECT_ID') !== value('NEXT_PUBLIC_FIREBASE_PROJECT_ID')) {
    reject('FIREBASE_PROJECT_ID', 'must match NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  }
  const clientOrigin = databaseOrigin(value('NEXT_PUBLIC_FIREBASE_DATABASE_URL'));
  const serverOrigin = databaseOrigin(value('FIREBASE_DATABASE_URL'));
  for (const [name, origin] of [['NEXT_PUBLIC_FIREBASE_DATABASE_URL', clientOrigin], ['FIREBASE_DATABASE_URL', serverOrigin]]) {
    if (present(name) && !origin) reject(name, 'must be a real Firebase RTDB HTTPS root URL');
  }
  if (clientOrigin && serverOrigin && clientOrigin !== serverOrigin) {
    reject('FIREBASE_DATABASE_URL', 'must match NEXT_PUBLIC_FIREBASE_DATABASE_URL');
  }
  if (present('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN')
    && !/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(value('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'))) {
    reject('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 'must be a hostname without scheme, port or path');
  }
  if (present('FIREBASE_CLIENT_EMAIL') && !/^[^@\s]+@[^@\s]+\.gserviceaccount\.com$/.test(value('FIREBASE_CLIENT_EMAIL'))) {
    reject('FIREBASE_CLIENT_EMAIL', 'must be a service account email');
  }
  if (present('FIREBASE_PRIVATE_KEY')) {
    try {
      const key = createPrivateKey(value('FIREBASE_PRIVATE_KEY').replaceAll('\\n', '\n'));
      if (key.asymmetricKeyType !== 'rsa') reject('FIREBASE_PRIVATE_KEY', 'must be an RSA private key');
    } catch { reject('FIREBASE_PRIVATE_KEY', 'invalid PEM private key'); }
  }
  for (const [name, contents] of Object.entries(env)) {
    if (!name.startsWith('NEXT_PUBLIC_') && !name.startsWith('VITE_')) continue;
    if (/PRIVATE_KEY|CLIENT_EMAIL|SERVICE_ACCOUNT|ADMIN_CREDENTIAL/.test(name)
      || /-----BEGIN [A-Z ]*PRIVATE KEY-----|"private_key"\s*:/.test(contents ?? '')) {
      reject(name, 'server credential must not be public');
    }
  }
  return { ready: issues.length === 0, required: requiredKeys.length, present: requiredKeys.filter(present).length, issues };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = checkDeploymentEnv(process.env);
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  process.exitCode = report.ready ? 0 : 1;
}
