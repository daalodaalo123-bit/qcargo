import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export interface SessionUser {
  id: string;
  name: string;
  role: string;
}

// Reads the currently logged-in admin/staff user from the server session.
// Used to stamp who created a record / recorded a payment. Returns null when
// there is no valid session (e.g. unauthenticated call).
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  const u = session?.user as { id?: string; name?: string; role?: string } | undefined;
  if (!u?.id) return null;
  return { id: u.id, name: u.name || 'Unknown', role: u.role || '' };
}
