import { maintenanceAuthorized, retentionApplyAllowed } from '@/lib/maintenance/authorization';
import { adminDatabase } from '@/lib/server/firebase-admin';
import { runRetentionJob } from '@/lib/server/retention-job';

export const runtime = 'nodejs';
export const maxDuration = 300;
const headers = { 'Cache-Control': 'no-store' };
export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) return Response.json({ error: 'NOT_CONFIGURED' }, { status: 404, headers });
  if (!maintenanceAuthorized(process.env.CRON_SECRET, request.headers.get('authorization'))) return Response.json({ error: 'UNAUTHORIZED' }, { status: 401, headers });
  // Setting a secret alone never enables deletion. Production must opt in after Rules/config review.
  const apply = retentionApplyAllowed(process.env);
  try { return Response.json(await runRetentionJob(adminDatabase(), apply), { headers }); }
  catch { console.error('Retention maintenance failed'); return Response.json({ error: 'MAINTENANCE_FAILED' }, { status: 503, headers }); }
}
