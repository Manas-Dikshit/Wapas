'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { BadgeCheck, Camera, FileText, Loader2, LogOut, Star, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCurrentProfile } from '@/lib/hooks/use-current-profile';
import { createClient } from '@/lib/supabase/client';
import { Avatar, Skeleton, Tabs } from '@/components/ui/primitives';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const staticDocuments = [
  { name: 'GST Certificate', status: 'Verified' },
  { name: 'PAN Card', status: 'Verified' },
  { name: 'Vehicle RC — MH12 GT 4521', status: 'Verified' },
  { name: 'Fitness Certificate', status: 'Expiring soon' },
  { name: 'Driving License — Suresh Yadav', status: 'Pending' }
];

type DocType = 'gst' | 'pan' | 'rc' | 'fitness' | 'driving_license';

const docOptions: { type: DocType; label: string; needsTruck: boolean; hasExpiry: boolean }[] = [
  { type: 'gst', label: 'GST Certificate', needsTruck: false, hasExpiry: false },
  { type: 'pan', label: 'PAN Card', needsTruck: false, hasExpiry: false },
  { type: 'rc', label: 'Vehicle RC', needsTruck: true, hasExpiry: true },
  { type: 'fitness', label: 'Fitness Certificate', needsTruck: true, hasExpiry: true },
  { type: 'driving_license', label: 'Driving License', needsTruck: true, hasExpiry: true }
];

type DocRow = {
  id: string;
  truck_id: string | null;
  doc_type: DocType;
  file_path: string;
  original_name: string | null;
  status: 'pending' | 'verified' | 'rejected';
  expires_at: string | null;
  created_at: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const { profile, loading, isAuthEnabled } = useCurrentProfile();

  const [tab, setTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', company: '', gst: '', city: '' });
  const [documents, setDocuments] = useState<DocRow[]>([]);
  const [trucks, setTrucks] = useState<{ id: string; reg_number: string }[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [uploadDoc, setUploadDoc] = useState<DocType>('gst');
  const [uploadTruckId, setUploadTruckId] = useState('');
  const [uploadExpiresAt, setUploadExpiresAt] = useState('');
  const [uploadBusy, setUploadBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const isTransporter = profile?.role === 'transporter';

  // Load real documents + fleet when viewing as a transporter with Supabase on.
  useEffect(() => {
    if (!isAuthEnabled || !profile || profile.role !== 'transporter') {
      setDocuments([]);
      setDocsLoading(false);
      return;
    }
    const sb = createClient();
    if (!sb) {
      setDocuments([]);
      setDocsLoading(false);
      return;
    }
    let active = true;
    setDocsLoading(true);
    Promise.all([
      sb.from('transporter_documents').select('*').eq('transporter_id', profile.id).then((res) => res.data as DocRow[] | null),
      sb.from('trucks').select('id, reg_number').eq('transporter_id', profile.id).then((res) => res.data as { id: string; reg_number: string }[] | null)
    ]).then(([docData, truckData]) => {
      if (!active) return;
      setDocuments(docData ?? []);
      setTrucks(truckData ?? []);
      setDocsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [isAuthEnabled, profile]);

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

  async function uploadDocument(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !profile || profile.role !== 'transporter') return;
    if (!file) {
      toast.error('Choose a file to upload');
      return;
    }
    const opt = docOptions.find((d) => d.type === uploadDoc);
    if (opt?.needsTruck && !uploadTruckId) {
      toast.error('Select a truck for this document');
      return;
    }
    setUploadBusy(true);
    const ext = file.name.split('.').pop() || 'bin';
    const path = `${profile.id}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('transporter-documents').upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });
    if (upErr) {
      setUploadBusy(false);
      toast.error('Upload failed', { description: upErr.message });
      return;
    }
    const { error: insErr } = await supabase.from('transporter_documents').insert({
      transporter_id: profile.id,
      truck_id: opt?.needsTruck ? uploadTruckId : null,
      doc_type: uploadDoc,
      file_path: path,
      original_name: file.name,
      status: 'pending',
      expires_at: opt?.hasExpiry && uploadExpiresAt ? uploadExpiresAt : null
    });
    setUploadBusy(false);
    if (insErr) {
      toast.error("Couldn't record document", { description: insErr.message });
      return;
    }
    toast.success('Document uploaded', { description: 'It will be reviewed by our KYC team.' });
    setFile(null);
    setUploadExpiresAt('');
    setUploadTruckId('');
    setDocsLoading(true);
    const res = await supabase.from('transporter_documents').select('*').eq('transporter_id', profile.id);
    setDocuments((res.data as DocRow[] | null) ?? []);
    setDocsLoading(false);
  }

  function docStatusVariant(status: DocRow['status'] | string): 'success' | 'warning' | 'navy' {
    if (status === 'verified') return 'success';
    if (status === 'rejected') return 'warning';
    return 'navy';
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
          {isTransporter ? (
            <>
              {docsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-2xl" />)}
                </div>
              ) : documents.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-navy-200 p-5 text-center text-sm text-navy-400">
                  No documents uploaded yet. Upload your KYC and vehicle documents to keep your fleet active.
                </p>
              ) : (
                <div className="space-y-3">
                  {documents.map((d) => {
                    const opt = docOptions.find((o) => o.type === d.doc_type);
                    return (
                      <div key={d.id} className="flex items-center gap-3 rounded-2xl border border-navy-100 p-3.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-500">
                          <FileText className="h-4 w-4" />
                        </div>
                        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-navy-600">{opt?.label ?? d.doc_type}</p>
                        {d.expires_at && (
                          <span className="shrink-0 text-[11px] text-navy-400">exp {new Date(d.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                        )}
                        <Badge variant={docStatusVariant(d.status)} className="shrink-0">{d.status}</Badge>
                      </div>
                    );
                  })}
                </div>
              )}

              <form onSubmit={uploadDocument} className="mt-5 space-y-3 rounded-2xl border border-navy-100 p-4">
                <p className="text-xs font-bold text-navy-600">Upload a document</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-navy-500">Document type</label>
                    <select value={uploadDoc} onChange={(e) => setUploadDoc(e.target.value as DocType)} className="h-10 w-full rounded-xl border border-navy-100 bg-canvas px-3 text-sm text-navy-600 focus:border-blue-400">
                      {docOptions.map((o) => (
                        <option key={o.type} value={o.type}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  {docOptions.find((o) => o.type === uploadDoc)?.needsTruck && (
                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-navy-500">Truck</label>
                      <select value={uploadTruckId} onChange={(e) => setUploadTruckId(e.target.value)} className="h-10 w-full rounded-xl border border-navy-100 bg-canvas px-3 text-sm text-navy-600 focus:border-blue-400">
                        <option value="">Select truck</option>
                        {trucks.map((t) => (
                          <option key={t.id} value={t.id}>{t.reg_number}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {docOptions.find((o) => o.type === uploadDoc)?.hasExpiry && (
                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-navy-500">Expiry date</label>
                      <input type="date" value={uploadExpiresAt} onChange={(e) => setUploadExpiresAt(e.target.value)} className="h-10 w-full rounded-xl border border-navy-100 bg-canvas px-3 text-sm text-navy-600 focus:border-blue-400" />
                    </div>
                  )}
                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-navy-500">File</label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                      className="h-10 w-full rounded-xl border border-navy-100 bg-canvas px-3 text-sm text-navy-600"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={uploadBusy || docsLoading} className="h-11 w-full sm:w-auto">
                  {uploadBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploadBusy ? 'Uploading…' : 'Upload document'}
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="space-y-3">
                {staticDocuments.map((d) => (
                  <div key={d.name} className="flex items-center gap-3 rounded-2xl border border-navy-100 p-3.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-500">
                      <FileText className="h-4 w-4" />
                    </div>
                    <p className="min-w-0 flex-1 truncate text-sm font-semibold text-navy-600">{d.name}</p>
                    <Badge variant={d.status === 'Verified' ? 'success' : d.status === 'Pending' ? 'navy' : 'warning'} className="shrink-0">{d.status}</Badge>
                  </div>
                ))}
              </div>
            </>
          )}
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