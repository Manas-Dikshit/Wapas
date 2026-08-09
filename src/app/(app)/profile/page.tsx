'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { BadgeCheck, Camera, FileText, LogOut, Star, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCurrentProfile } from '@/lib/hooks/use-current-profile';
import { createClient } from '@/lib/supabase/client';
import { Avatar, Skeleton, Tabs } from '@/components/ui/primitives';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const documents = [
  { name: 'GST Certificate', status: 'Verified' },
  { name: 'PAN Card', status: 'Verified' },
  { name: 'Vehicle RC — MH12 GT 4521', status: 'Verified' },
  { name: 'Fitness Certificate', status: 'Expiring soon' },
  { name: 'Driving License — Suresh Yadav', status: 'Pending' }
];

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const { profile, loading } = useCurrentProfile();

  const [tab, setTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', company: '', gst: '', city: '' });

  // Keep the edit form in sync once the real (or mock) profile resolves.
  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.fullName,
        company: profile.companyName,
        gst: profile.gstNumber ?? '',
        city: profile.city
      });
    }
  }, [profile]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    if (!supabase) {
      // Demo mode — nothing to persist, but keep the UX consistent.
      toast.success('Profile updated');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: form.name, company_name: form.company, gst_number: form.gst, city: form.city })
      .eq('id', profile.id);
    setSaving(false);

    if (error) {
      toast.error("Couldn't save changes", { description: error.message });
      return;
    }
    toast.success('Profile updated');
  }

  async function logOut() {
    if (supabase) {
      await supabase.auth.signOut();
    }
    toast.success('Signed out');
    router.push('/login');
    router.refresh();
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 pb-6">
        <Skeleton className="h-32 w-full rounded-xl3" />
        <Skeleton className="h-64 w-full rounded-xl3" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-20 text-center">
        <p className="font-display text-lg font-bold text-navy-600">You&apos;re not signed in</p>
        <p className="text-sm text-navy-400">Log in to view and edit your profile.</p>
        <Button onClick={() => router.push('/login')}>Go to login</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-6 animate-fade-up">
      <div className="card-surface flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
        <div className="relative">
          <Avatar name={profile.fullName} className="h-20 w-20 text-xl" />
          <button className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-navy-600 text-white shadow-soft">
            <Camera className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-center gap-1.5 sm:justify-start">
            <p className="font-display text-lg font-bold text-navy-600">{profile.fullName}</p>
            {profile.verified && <BadgeCheck className="h-4 w-4 text-blue-500" />}
          </div>
          <p className="text-sm text-navy-400">{profile.companyName || 'No company set'}</p>
          <div className="mt-2 flex items-center justify-center gap-3 text-xs text-navy-400 sm:justify-start">
            <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {profile.rating}</span>
            <span>{profile.city || 'City not set'}</span>
            <span>Member since {profile.memberSince}</span>
          </div>
        </div>
        <Badge variant={profile.kycStatus === 'verified' ? 'success' : profile.kycStatus === 'pending' ? 'warning' : 'danger'}>
          KYC {profile.kycStatus}
        </Badge>
      </div>

      <Tabs
        tabs={[
          { key: 'profile', label: 'Profile' },
          { key: 'documents', label: 'Documents' },
          { key: 'preferences', label: 'Preferences' }
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'profile' && (
        <form onSubmit={save} className="card-surface space-y-4 p-5 sm:p-6">
          <Field label="Full name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Company name">
            <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          </Field>
          <Field label="GST number">
            <Input value={form.gst} onChange={(e) => setForm({ ...form, gst: e.target.value })} />
          </Field>
          <Field label="City">
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </Field>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      )}

      {tab === 'documents' && (
        <div className="card-surface p-5 sm:p-6">
          <div className="space-y-3">
            {documents.map((d) => (
              <div key={d.name} className="flex items-center gap-3 rounded-2xl border border-navy-100 p-3.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-50 text-navy-500">
                  <FileText className="h-4 w-4" />
                </div>
                <p className="flex-1 text-sm font-semibold text-navy-600">{d.name}</p>
                <Badge variant={d.status === 'Verified' ? 'success' : d.status === 'Pending' ? 'navy' : 'warning'}>{d.status}</Badge>
              </div>
            ))}
          </div>
          <button className="mt-4 flex items-center gap-2 text-sm font-bold text-blue-500">
            <Upload className="h-4 w-4" /> Upload new document
          </button>
        </div>
      )}

      {tab === 'preferences' && (
        <div className="card-surface p-5 sm:p-6">
          <p className="text-sm text-navy-400">Notification and appearance preferences live in Settings.</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/settings')}>
            Go to settings
          </Button>
        </div>
      )}

      <Button variant="destructive" className="w-full" onClick={logOut}>
        <LogOut className="h-4 w-4" /> Log out
      </Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold text-navy-500">{label}</label>
      {children}
    </div>
  );
}