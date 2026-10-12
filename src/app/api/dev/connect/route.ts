import { authenticatedUid } from '@/lib/server/auth';
import { isLocalEmulatorMode } from '@/lib/server/firebase-admin';
import { connectionRepository } from '@/lib/server/data/connection-repository';
import { checkConnection } from '@/lib/server/connection-service';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Emulator-only smoke check. Never a production debug or game endpoint. */
export async function POST(request: Request) {
  const headers = { 'Cache-Control': 'no-store' };
  if (!isLocalEmulatorMode()) return Response.json({ error: 'NOT_FOUND' }, { status: 404, headers });
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      const originURL = new URL(origin);
      if (originURL.host !== request.headers.get('host') || originURL.protocol !== new URL(request.url).protocol) {
        return Response.json({ error: 'INVALID_ORIGIN' }, { status: 403, headers });
      }
    } catch { return Response.json({ error: 'INVALID_ORIGIN' }, { status: 403, headers }); }
  }
  let uid: string;
  try { uid = await authenticatedUid(request); } catch {
    return Response.json({ error: 'UNAUTHORIZED' }, { status: 401, headers });
  }
  try { return Response.json(await checkConnection(uid, connectionRepository), { headers }); } catch {
    console.error('M0 connection check failed');
    return Response.json({ error: 'CONNECTION_FAILED' }, { status: 503, headers });
  }
}
