import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/supabase/types';

const client = createBrowserClient<Database>('https://x.supabase.co', 'y');
const b = client.from('profiles').select('*');
type SelRet = Awaited<ReturnType<typeof b.then>>;
const s: SelRet = {} as never;
void s;
const ms = client.from('profiles').select('*').maybeSingle();
type MsRet = Awaited<ReturnType<typeof ms.then>>;
const m: MsRet = { data: null, error: null } as never;
void m;