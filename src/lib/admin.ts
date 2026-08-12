/**
 * Single shared constant for the locked admin email.
 *
 * The authoritative definition of "who is admin" lives in the database — the
 * handle_new_user() trigger in supabase/migrations/0009_single_admin_lock.sql
 * grants `admin` ONLY to this email and demotes every other admin row. That DB
 * trigger is the real enforcement and must never be bypassed.
 *
 * This constant exists purely so the admin dashboard's client-side guard
 * (src/app/(app)/dashboard/admin/page.tsx) has exactly ONE shared place to
 * reference the same address for defense in depth. It is deliberately not
 * scattered across the frontend. Only this file may name the locked email in
 * application code.
 */
export const LOCKED_ADMIN_EMAIL = 'manasdikshit48@gmail.com';