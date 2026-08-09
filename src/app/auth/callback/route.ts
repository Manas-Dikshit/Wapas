import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * Handles the redirect back from Supabase after a magic-link click,
 * exchanging the `code` for a real session cookie.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = createServerSupabaseClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Session exchange failed (expired link, wrong device, misconfigured
  // redirect URL) — send them back to login with a flag instead of silently
  // landing on a page that looks logged in but isn't.
  return NextResponse.redirect(`${origin}/login?error=auth`);
}