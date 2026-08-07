'use client';

import { useState } from 'react';
import { ChevronDown, Mail, MessageCircle, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

const topics = [
  {
    category: 'Bookings',
    items: [
      { q: 'How do I cancel a booking?', a: 'Go to My Trips, open the booking and tap Cancel booking. Cancellation fees may apply within 6 hours of pickup.' },
      { q: 'Can I modify a load after posting it?', a: 'Yes, as long as no transporter has accepted it yet. Open the load from Marketplace and tap Edit.' }
    ]
  },
  {
    category: 'Payments',
    items: [
      { q: 'When is payment released to the transporter?', a: 'Funds are held in escrow and released automatically within 24 hours of confirmed delivery.' },
      { q: 'What if a payment fails?', a: 'Failed payments are retried automatically. If it fails again, you can retry manually from the Wallet page.' }
    ]
  },
  {
    category: 'Verification',
    items: [
      { q: 'What documents are required for KYC?', a: 'GST certificate, PAN card, and for transporters, vehicle RC and driving licence for each registered truck.' }
    ]
  }
];

export default function HelpPage() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-6 animate-fade-up">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-navy-600 sm:text-3xl">Help Center</h1>
        <p className="mt-1 text-sm text-navy-400">Find answers or reach out to our support team.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <ContactTile icon={<MessageCircle className="h-4 w-4" />} label="Live chat" />
        <ContactTile icon={<Phone className="h-4 w-4" />} label="Call us" />
        <ContactTile icon={<Mail className="h-4 w-4" />} label="Email" />
      </div>

      {topics.map((topic) => (
        <div key={topic.category} className="card-surface p-5 sm:p-6">
          <h3 className="mb-2 font-display text-base font-bold text-navy-600">{topic.category}</h3>
          <div className="divide-y divide-navy-100">
            {topic.items.map((item) => {
              const key = `${topic.category}-${item.q}`;
              const isOpen = open === key;
              return (
                <div key={key} className="py-3">
                  <button onClick={() => setOpen(isOpen ? null : key)} className="flex w-full items-center justify-between gap-3 text-left">
                    <span className="text-sm font-semibold text-navy-600">{item.q}</span>
                    <ChevronDown className={cn('h-4 w-4 shrink-0 text-navy-400 transition-transform', isOpen && 'rotate-180')} />
                  </button>
                  {isOpen && <p className="mt-2 text-sm text-navy-400">{item.a}</p>}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function ContactTile({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="card-surface flex flex-col items-center gap-2 p-4 transition-colors hover:border-blue-300 hover:bg-blue-50/50">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-500">{icon}</div>
      <span className="text-xs font-bold text-navy-600">{label}</span>
    </button>
  );
}
