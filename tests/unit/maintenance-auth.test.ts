import { describe, expect, it } from 'vitest';
import { maintenanceAuthorized, retentionApplyAllowed } from '../../src/lib/maintenance/authorization';
describe('maintenance authentication', () => {
  const secret = 'local-test-secret-only'.repeat(3);
  it('requires an exact secret and rejects missing/short/forged/bare identity headers', () => {
    expect(maintenanceAuthorized(secret, `Bearer ${secret}`)).toBe(true);
    for (const header of [null, secret, 'Bearer forged', `Bearer ${secret}x`]) expect(maintenanceAuthorized(secret, header)).toBe(false);
    expect(maintenanceAuthorized(undefined, `Bearer ${secret}`)).toBe(false);
    expect(maintenanceAuthorized('short', 'Bearer short')).toBe(false);
  });
  it('deletion requires production, explicit opt-in and an exact independent project confirmation', () => {
    const env = { VERCEL_ENV: 'production', RETENTION_APPLY_ENABLED: 'true', RETENTION_FIREBASE_PROJECT_ID: 'merchant-prod', FIREBASE_PROJECT_ID: 'merchant-prod' };
    expect(retentionApplyAllowed(env)).toBe(true);
    expect(retentionApplyAllowed({ ...env, VERCEL_ENV: 'preview' })).toBe(false);
    expect(retentionApplyAllowed({ ...env, RETENTION_APPLY_ENABLED: undefined })).toBe(false);
    expect(retentionApplyAllowed({ ...env, RETENTION_FIREBASE_PROJECT_ID: 'merchant-s-bluff' })).toBe(false);
  });
});
