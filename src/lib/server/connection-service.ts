import 'server-only';
import { randomUUID } from 'node:crypto';
import type { ConnectionRepository } from './data/connection-repository';
export async function checkConnection(uid: string, repository: ConnectionRepository) {
  const record = { nonce: randomUUID(), checkedAt: Date.now() };
  await repository.write(uid, record);
  const saved = await repository.read(uid);
  if (saved?.nonce !== record.nonce) throw new Error('Connection verification failed');
  return record;
}
