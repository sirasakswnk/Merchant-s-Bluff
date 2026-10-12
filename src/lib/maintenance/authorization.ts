import { timingSafeEqual } from 'node:crypto';
export function maintenanceAuthorized(secret: string | undefined, authorization: string | null): boolean {
  if (!secret || secret.length < 32 || !authorization?.startsWith('Bearer ')) return false;
  const value = Buffer.from(authorization.slice(7)); const expected = Buffer.from(secret);
  return value.length === expected.length && timingSafeEqual(value, expected);
}
export function retentionApplyAllowed(environment: Record<string, string | undefined>): boolean {
  return environment.RETENTION_APPLY_ENABLED === 'true' && environment.VERCEL_ENV === 'production'
    && !!environment.RETENTION_FIREBASE_PROJECT_ID && environment.RETENTION_FIREBASE_PROJECT_ID === environment.FIREBASE_PROJECT_ID;
}
