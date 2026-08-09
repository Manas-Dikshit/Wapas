import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/supabase/types';

const client = createBrowserClient<Database>('https://x.supabase.co', 'y');

async function main() {
  const user = { id: 'x' };
  const q = client.from('profiles').select('*').eq('auth_user_id', user.id).maybeSingle();
  type Row = Awaited<ReturnType<typeof q.then>> extends { data: infer D } ? D : never;
  const _check: Row = null;
  void _check;

  const up = client
    .from('profiles')
    .update({ full_name: 'a', gst_number: 'b', city: 'c', company_name: 'd', role: 'shipper' })
    .eq('id', 'x');
  await up;
}

void main;