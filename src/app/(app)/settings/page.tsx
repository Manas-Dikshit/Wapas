'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Bell, Globe, Lock, Palette, Shield } from 'lucide-react';
import { Switch } from '@/components/ui/primitives';

const initialToggles = {
  bookingUpdates: true,
  aiMatches: true,
  promotions: false,
  smsAlerts: true,
  profileVisibility: true,
  darkMode: false
};

export default function SettingsPage() {
  const [toggles, setToggles] = useState(initialToggles);

  function update(key: keyof typeof initialToggles, value: boolean) {
    setToggles((t) => ({ ...t, [key]: value }));
    toast.success('Preference updated');
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-6 animate-fade-up">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-navy-600 sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-navy-400">Manage notifications, privacy and appearance.</p>
      </div>

      <SettingsGroup icon={<Bell className="h-4 w-4" />} title="Notifications">
        <SettingRow label="Booking updates" desc="Confirmations, status changes, cancellations" checked={toggles.bookingUpdates} onChange={(v) => update('bookingUpdates', v)} />
        <SettingRow label="AI backhaul matches" desc="Get notified about new high-match loads" checked={toggles.aiMatches} onChange={(v) => update('aiMatches', v)} />
        <SettingRow label="Promotions & offers" desc="Occasional platform news and discounts" checked={toggles.promotions} onChange={(v) => update('promotions', v)} />
        <SettingRow label="SMS alerts" desc="Critical updates via text message" checked={toggles.smsAlerts} onChange={(v) => update('smsAlerts', v)} />
      </SettingsGroup>

      <SettingsGroup icon={<Shield className="h-4 w-4" />} title="Privacy">
        <SettingRow label="Public profile visibility" desc="Let other verified users view your rating and trip history" checked={toggles.profileVisibility} onChange={(v) => update('profileVisibility', v)} />
      </SettingsGroup>

      <SettingsGroup icon={<Palette className="h-4 w-4" />} title="Appearance">
        <SettingRow label="Dark mode" desc="Reduce glare in low-light conditions" checked={toggles.darkMode} onChange={(v) => update('darkMode', v)} />
      </SettingsGroup>

      <SettingsGroup icon={<Globe className="h-4 w-4" />} title="Language & region">
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-semibold text-navy-600">App language</p>
            <p className="text-xs text-navy-400">English</p>
          </div>
          <select className="h-10 rounded-full border border-navy-100 bg-canvas px-3 text-sm font-semibold text-navy-500">
            <option>English</option>
            <option>हिंदी</option>
            <option>मराठी</option>
            <option>தமிழ்</option>
          </select>
        </div>
      </SettingsGroup>

      <SettingsGroup icon={<Lock className="h-4 w-4" />} title="Security">
        <div className="py-3">
          <p className="text-sm font-semibold text-navy-600">Two-factor authentication</p>
          <p className="text-xs text-navy-400">Add an extra layer of security to your account.</p>
          <button className="mt-3 text-sm font-bold text-blue-500 transition-colors hover:text-blue-600">Enable 2FA</button>
        </div>
      </SettingsGroup>

      <p className="text-center text-xs text-navy-300">Wapas v1.0.0 · <a href="#" className="underline">Terms</a> · <a href="#" className="underline">Privacy Policy</a></p>
    </div>
  );
}

function SettingsGroup({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="card-surface p-5 sm:p-6">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-navy-400">{icon}</span>
        <h3 className="font-display text-base font-bold text-navy-600">{title}</h3>
      </div>
      <div className="divide-y divide-navy-100">{children}</div>
    </div>
  );
}

function SettingRow({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-navy-600">{label}</p>
        <p className="text-xs text-navy-400">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} label={label} />
    </div>
  );
}
