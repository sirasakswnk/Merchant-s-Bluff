import 'server-only';
import { adminAuth } from './firebase-admin';
export async function authenticatedUid(request: Request): Promise<string> {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ') || authorization.length > 8192) throw new Error('UNAUTHORIZED');
  const token = authorization.slice(7);
  if (!token) throw new Error('UNAUTHORIZED');
  try {
    const decoded = await adminAuth().verifyIdToken(token);
    return decoded.uid;
  } catch { throw new Error('UNAUTHORIZED'); }
}
