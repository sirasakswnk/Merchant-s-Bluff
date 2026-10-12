import 'server-only';
import type { ConnectionRecord } from '@/lib/shared/health';
import { connectionPath } from '@/lib/shared/health';
import { adminDatabase } from '../firebase-admin';
export interface ConnectionRepository {
  write(uid: string, record: ConnectionRecord): Promise<void>;
  read(uid: string): Promise<ConnectionRecord | null>;
}
/** Adapter only. No game rules or HTTP concerns belong here. */
export const connectionRepository: ConnectionRepository = {
  async write(uid, record) { await adminDatabase().ref(connectionPath(uid)).set(record); },
  async read(uid) { return (await adminDatabase().ref(connectionPath(uid)).get()).val(); },
};
