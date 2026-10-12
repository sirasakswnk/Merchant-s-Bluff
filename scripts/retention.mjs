import { loadEnvFile } from 'node:process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { getApps, deleteApp } from 'firebase-admin/app';
import { z } from 'zod';

const args = process.argv.slice(2);
const allowed = new Set(['--apply', '--env-file', '--plan', '--confirm-project', '--room-cursor', '--code-cursor']);
const values = {}; let apply = false;
for (let i = 0; i < args.length; i++) {
  if (!allowed.has(args[i])) throw new Error('Unknown retention option');
  if (args[i] === '--apply') { apply = true; continue; }
  if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error('Missing retention option value');
  values[args[i]] = args[++i];
}
if (values['--env-file']) loadEnvFile(values['--env-file']);
const planPath = resolve(values['--plan'] ?? 'work/runtime/retention/plan.json');
const privateDirectory = resolve('work/runtime/retention');
const distance = relative(privateDirectory, planPath);
if (!distance || distance.startsWith('..') || distance.includes(':')) throw new Error('Retention plans must stay under work/runtime/retention');
const candidateBase = { roomId: z.string().regex(/^[a-f0-9]{32}$/), code: z.string().regex(/^[A-HJ-NP-Z2-9]{4}$/) };
const candidate = z.discriminatedUnion('type', [
  z.object({ ...candidateBase, type: z.literal('room'), revision: z.number().int().nonnegative(), activity: z.number().int().positive(), dueAt: z.number().int().nonnegative() }).strict(),
  z.object({ ...candidateBase, type: z.literal('finalize'), retiredAt: z.number().int().nonnegative() }).strict(),
  z.object({ ...candidateBase, type: z.literal('orphan'), createdAt: z.number().int().nonnegative(), fingerprint: z.string().min(1).max(128) }).strict(),
]);
const schema = z.object({ version: z.literal(1), policyVersion: z.literal(1), projectId: z.string(), databaseURL: z.string().url(),
  createdAt: z.number().int().nonnegative(), expiresAt: z.number().int().nonnegative(), candidates: z.array(candidate).max(200),
  counts: z.record(z.string(), z.number().int().nonnegative()), nextRooms: z.string().nullable(), nextCodes: z.string().nullable() }).strict();
let success = false;
try {
  const { adminDatabase } = await import('../src/lib/server/firebase-admin.ts');
  const { retentionService } = await import('../src/lib/server/retention-service.ts');
  const database = adminDatabase(); const service = retentionService(database);
  if (apply && values['--confirm-project'] !== database.app.options.projectId) throw new Error('RETENTION_CONFIRM_PROJECT_REQUIRED');
  const plan = apply ? schema.parse(JSON.parse(await readFile(planPath, 'utf8')))
    : await service.plan({ roomCursor: values['--room-cursor'], codeCursor: values['--code-cursor'] });
  const result = apply ? await service.apply(plan) : null;
  if (!apply) { await mkdir(privateDirectory, { recursive: true }); await writeFile(planPath, JSON.stringify(plan, null, 2)); }
  const summary = { checkedAt: new Date().toISOString(), mode: apply ? 'apply' : 'dry-run', projectId: database.app.options.projectId,
    retentionHours: 24, candidates: plan.candidates.length, skipped: plan.counts, result,
    hasMoreRooms: plan.nextRooms !== null, hasMoreCodes: plan.nextCodes !== null, planExpiresAt: new Date(plan.expiresAt).toISOString() };
  await mkdir('work/verification/retention', { recursive: true });
  await writeFile(`work/verification/retention/${apply ? 'apply' : 'dry-run'}-summary.json`, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2)); success = true;
} catch {
  // Never print parser input, credential errors, room snapshots, tokens, or participant IDs.
  console.error('Retention failed safely. Check configuration, project confirmation, plan expiry/schema, deployed presence fence, and network access.');
  process.exitCode = 1;
} finally {
  for (const app of getApps().filter(app => app.name === 'merchant-server')) await deleteApp(app);
}
if (!success) process.exitCode = 1;
