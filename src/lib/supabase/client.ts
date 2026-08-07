import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

/**
 * Browser Supabase client.
 *
 * The Wapas demo runs entirely on mock data (see src/lib/mock-data.ts) so the
 * app works out of the box with zero configuration. Once NEXT_PUBLIC_SUPABASE_URL
 * and NEXT_PUBLIC_SUPABASE_ANON_KEY are set (see .env.example), swap the mock
 * data calls in src/lib for real queries against this client.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // No project configured yet — callers should fall back to mock data.
    return null;
  }

  return createBrowserClient<Database>(url, anonKey);
}
