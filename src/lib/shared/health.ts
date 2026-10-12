import { z } from 'zod';
import { RULES_VERSION } from '../game/config';
export const healthResponseSchema = z.object({
  status: z.literal('ok'), milestone: z.literal('M0'), rulesVersion: z.literal(RULES_VERSION),
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;
export const connectionRecordSchema = z.object({ nonce: z.uuid(), checkedAt: z.number().int().nonnegative() });
export type ConnectionRecord = z.infer<typeof connectionRecordSchema>;
export function connectionPath(uid: string): string {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(uid)) throw new Error('Invalid UID path');
  return 'healthChecks/' + uid + '/latest';
}
