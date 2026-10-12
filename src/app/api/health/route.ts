import { RULES_VERSION } from '@/lib/game/config';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
/** Liveness only: no secrets, game state, or database writes. */
export function GET() {
  return Response.json({ status: 'ok', milestone: 'M0', rulesVersion: RULES_VERSION }, { headers: { 'Cache-Control': 'no-store' } });
}
