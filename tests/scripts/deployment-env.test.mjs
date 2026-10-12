import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { parseEnv } from 'node:util';
import { fileURLToPath } from 'node:url';
import { checkDeploymentEnv, requiredKeys } from '../../scripts/check-deployment-env.mjs';

// Ephemeral key for syntax tests; never contacts Firebase or writes credentials to disk.
const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
const valid = {
  NEXT_PUBLIC_USE_FIREBASE_EMULATORS: 'false',
  NEXT_PUBLIC_FIREBASE_API_KEY: 'synthetic-api-key-not-a-real-credential',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'merchant-fixture.firebaseapp.com',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'merchant-fixture',
  NEXT_PUBLIC_FIREBASE_DATABASE_URL: 'https://fixture-db.asia-southeast1.firebasedatabase.app',
  NEXT_PUBLIC_FIREBASE_APP_ID: 'synthetic-web-app-id',
  FIREBASE_PROJECT_ID: 'merchant-fixture',
  FIREBASE_DATABASE_URL: 'https://fixture-db.asia-southeast1.firebasedatabase.app/',
  FIREBASE_CLIENT_EMAIL: 'firebase-adminsdk-test@merchant-fixture.iam.gserviceaccount.com',
  FIREBASE_PRIVATE_KEY: pem,
};
const issue = (report, name, reason) => report.issues.some(entry => entry.name === name && (!reason || entry.reason === reason));

test('accepts regional/US RTDB config, custom auth domain and both supported PEM newline forms', () => {
  assert.equal(checkDeploymentEnv(valid).ready, true);
  assert.equal(checkDeploymentEnv({ ...valid, FIREBASE_PRIVATE_KEY: pem.replaceAll('\n', '\\n') }).ready, true);
  assert.equal(checkDeploymentEnv({ ...valid, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'auth.example.org',
    FIREBASE_DATABASE_URL: 'https://named-instance.firebaseio.com/', NEXT_PUBLIC_FIREBASE_DATABASE_URL: 'https://named-instance.firebaseio.com' }).ready, true);
});

test('every required value must be supplied; blank production template fails', () => {
  for (const name of requiredKeys) assert.equal(issue(checkDeploymentEnv({ ...valid, [name]: '' }), name, 'missing'), true);
  const template = parseEnv(readFileSync(new URL('../../.env.production.example', import.meta.url), 'utf8'));
  const report = checkDeploymentEnv(template);
  assert.equal(report.ready, false);
  assert.equal(report.present, 1);
  assert.equal(report.issues.filter(entry => entry.reason === 'missing').length, 9);
});

test('local demo cannot pass as deployment config; nonempty hosts and test flags fail', () => {
  const demo = parseEnv(readFileSync(new URL('../../.env.example', import.meta.url), 'utf8'));
  assert.equal(checkDeploymentEnv(demo).ready, false);
  for (const name of ['FIREBASE_AUTH_EMULATOR_HOST', 'FIREBASE_DATABASE_EMULATOR_HOST', 'NEXT_PUBLIC_FIREBASE_EMULATOR_HOST']) {
    assert.equal(issue(checkDeploymentEnv({ ...valid, [name]: '127.0.0.1:19000' }), name), true);
  }
  for (const name of ['NEXT_PUBLIC_USE_FIREBASE_EMULATORS', 'MERCHANT_E2E', 'MERCHANT_RESTART_TEST']) {
    assert.equal(issue(checkDeploymentEnv({ ...valid, [name]: 'true' }), name), true);
  }
});

test('rejects mismatched client/server projects and databases, permits empty emulator overrides', () => {
  assert.equal(issue(checkDeploymentEnv({ ...valid, FIREBASE_PROJECT_ID: 'another-project' }), 'FIREBASE_PROJECT_ID'), true);
  assert.equal(issue(checkDeploymentEnv({ ...valid, FIREBASE_DATABASE_URL: 'https://other.firebaseio.com' }), 'FIREBASE_DATABASE_URL'), true);
  assert.equal(checkDeploymentEnv({ ...valid, FIREBASE_AUTH_EMULATOR_HOST: '', FIREBASE_DATABASE_EMULATOR_HOST: '' }).ready, true);
});

test('rejects malformed/local/foreign/credentialed RTDB URLs and misplaced auth URL', () => {
  for (const url of ['http://localhost:19000', 'https://foreign.example.org', 'https://demo-fixture.firebaseio.com',
    'https://named.firebaseio.com/rooms', 'https://named.firebaseio.com?auth=secret', 'https://user:secret@named.firebaseio.com',
    'https://named.firebaseio.com.evil.org', 'not-a-url']) {
    assert.equal(issue(checkDeploymentEnv({ ...valid, FIREBASE_DATABASE_URL: url }), 'FIREBASE_DATABASE_URL'), true);
  }
  assert.equal(issue(checkDeploymentEnv({ ...valid, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'https://auth.example.org' }), 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'), true);
});

test('rejects corrupt/non-RSA keys and secret contents pasted into public variables', () => {
  assert.equal(issue(checkDeploymentEnv({ ...valid, FIREBASE_PRIVATE_KEY: 'corrupt-secret-sentinel' }), 'FIREBASE_PRIVATE_KEY'), true);
  const ec = generateKeyPairSync('ec', { namedCurve: 'prime256v1' }).privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
  assert.equal(checkDeploymentEnv({ ...valid, FIREBASE_PRIVATE_KEY: ec }).ready, false);
  for (const name of ['NEXT_PUBLIC_FIREBASE_PRIVATE_KEY', 'VITE_FIREBASE_CLIENT_EMAIL']) {
    assert.equal(issue(checkDeploymentEnv({ ...valid, [name]: 'sensitive-sentinel' }), name), true);
  }
  assert.equal(issue(checkDeploymentEnv({ ...valid, NEXT_PUBLIC_FIREBASE_API_KEY: pem }), 'NEXT_PUBLIC_FIREBASE_API_KEY'), true);
  assert.equal(issue(checkDeploymentEnv({ ...valid, NEXT_PUBLIC_FIREBASE_API_KEY: '{"private_key":"sentinel"}' }), 'NEXT_PUBLIC_FIREBASE_API_KEY'), true);
});

test('CLI exit codes distinguish configuration success/failure and output never contains values', () => {
  const script = fileURLToPath(new URL('../../scripts/check-deployment-env.mjs', import.meta.url));
  const inherited = Object.fromEntries(Object.entries(process.env).filter(([name]) => !/^(NEXT_PUBLIC_|VITE_|FIREBASE_|MERCHANT_|NODE_OPTIONS$)/.test(name)));
  for (const [env, status] of [[valid, 0], [{ ...valid, FIREBASE_PRIVATE_KEY: 'corrupt-secret-sentinel', NEXT_PUBLIC_FIREBASE_PRIVATE_KEY: pem }, 1]]) {
    const child = spawnSync(process.execPath, [script], { env: { ...inherited, ...env }, encoding: 'utf8' });
    assert.equal(child.status, status);
    assert.equal(child.stderr, '');
    const report = JSON.parse(child.stdout);
    assert.equal(report.ready, status === 0);
    for (const secret of [pem, 'corrupt-secret-sentinel', valid.FIREBASE_CLIENT_EMAIL, valid.NEXT_PUBLIC_FIREBASE_API_KEY]) {
      assert.equal(child.stdout.includes(secret), false);
    }
  }
});
