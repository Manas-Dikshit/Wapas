import { redirect } from 'next/navigation';

/**
 * Backwards-compatibility alias: admin content now lives at /dashboard/admin.
 * Keeps any existing /admin links/bookmarks working.
 */
export default function AdminAliasPage() {
  redirect('/dashboard/admin');
}