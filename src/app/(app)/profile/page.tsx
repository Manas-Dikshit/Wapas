'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { BadgeCheck, Camera, FileText, LogOut, Star, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { currentProfile } from '@/lib/mock-data';
import { Avatar, Tabs } from '@/components/ui/primitives';
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
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({ name: currentProfile.fullName, company: currentProfile.companyName, gst: currentProfile.gstNumber ?? '', city: currentProfile.city });

  function save(e: React.FormEvent) {
    e.preventDefault();
    toast.success('Profile updated');
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-6 animate-fade-up">
      <div className="card-surface flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
        <div className="relative">
          <Avatar name={currentProfile.fullName} className="h-20 w-20 text-xl" />
          <button className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-navy-600 text-white shadow-soft">
            <Camera className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-center gap-1.5 sm:justify-start">
            <p className="font-display text-lg font-bold text-navy-600">{currentProfile.fullName}</p>
            {currentProfile.verified && <BadgeCheck className="h-4 w-4 text-blue-500" />}
          </div>
          <p className="text-sm text-navy-400">{currentProfile.companyName}</p>
          <div className="mt-2 flex items-center justify-center gap-3 text-xs text-navy-400 sm:justify-start">
            <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {currentProfile.rating}</span>
            <span>{currentProfile.city}</span>
            <span>Member since {currentProfile.memberSince}</span>
          </div>
        </div>
        <Badge variant="success">KYC {currentProfile.kycStatus}</Badge>
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
          <Button type="submit">Save changes</Button>
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

      <Button variant="destructive" className="w-full" onClick={() => { toast.success('Signed out'); router.push('/login'); }}>
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
