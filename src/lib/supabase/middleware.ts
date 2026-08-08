// src/lib/supabase/middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Refreshes the Supabase auth session cookie on every request. Required so
 * server components always see a valid (non-expired) session. No-ops
 * gracefully when Supabase env vars aren't set, so the app keeps working on
 * mock data / mocked login until real auth is configured.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        // Update the request cookies so the *current* request's
        // server-client calls (later in this same middleware run) see the
        // refreshed session too, then mirror it onto the response.
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({ request: { headers: request.headers } });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: '', ...options });
        response = NextResponse.next({ request: { headers: request.headers } });
        response.cookies.set({ name, value: '', ...options });
      }
    }
  });

  // Touching getUser() is what actually refreshes an expiring session token.
  await supabase.auth.getUser();

  return response;
}