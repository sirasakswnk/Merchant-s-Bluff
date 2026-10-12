import 'server-only';
import { randomUUID } from 'node:crypto';
import type { Database } from 'firebase-admin/database';
import { retentionService } from './retention-service.ts';

/** Daily production runner. Cursor/lease state is server-only; previews default to dry-run. */
export async function runRetentionJob(database: Database, apply: boolean) {
  const service = retentionService(database); const ref = database.ref('_maintenance/retention');
  const startedAt = Date.now(); const jobId = randomUUID();
  let cursor = (await ref.get()).val() as { roomCursor?: string; codeCursor?: string; roomsDone?: boolean; codesDone?: boolean } | null;
  if (apply) {
    const result = await ref.transaction(value => (value?.leaseUntil ?? 0) > Date.now() ? value : { ...value, jobId, leaseUntil: Date.now() + 300000 });
    if (result.snapshot.child('jobId').val() !== jobId) return { mode: 'apply', busy: true, batches: 0 };
    cursor = result.snapshot.val();
  }
  const totals: Record<string, number> = {}; let batches = 0; let candidates = 0; let hasMore = false;
  try {
    do {
      const plan = await service.plan({ roomCursor: cursor?.roomCursor, codeCursor: cursor?.codeCursor,
        ...(cursor?.roomsDone ? { roomIds: [] } : {}), ...(cursor?.codesDone ? { codeIds: [] } : {}) });
      candidates += plan.candidates.length;
      const result = apply ? await service.apply(plan) : plan.counts;
      for (const [key, value] of Object.entries(result)) totals[key] = (totals[key] ?? 0) + value;
      hasMore = plan.nextRooms !== null || plan.nextCodes !== null; batches++;
      if (apply) {
        cursor = hasMore ? { ...(plan.nextRooms ? { roomCursor: plan.nextRooms } : { roomsDone: true }),
          ...(plan.nextCodes ? { codeCursor: plan.nextCodes } : { codesDone: true }) } : {};
        await ref.transaction(value => value?.jobId === jobId ? { ...cursor, jobId, leaseUntil: startedAt + 300000, lastRunAt: Date.now() } : value);
      }
    } while (apply && hasMore && batches < 5 && Date.now() - startedAt < 180000);
    return { mode: apply ? 'apply' : 'dry-run', busy: false, batches, candidates, counts: totals, hasMore };
  } finally {
    if (apply) await ref.transaction(value => {
      if (value?.jobId !== jobId) return value;
      const next = { ...value }; delete next.jobId; delete next.leaseUntil; return next;
    });
  }
}
