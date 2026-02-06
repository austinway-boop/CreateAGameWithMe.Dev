import { Session } from 'next-auth';

/**
 * Check if the current session user is an admin.
 * Reads ADMIN_EMAILS env var (comma-separated list of emails).
 */
export function isAdmin(session: Session | null): boolean {
  if (!session?.user?.email) return false;

  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return adminEmails.includes(session.user.email.toLowerCase());
}
