import Link from 'next/link';
import Image from 'next/image';

const columns = [
  { title: 'Product', links: [['Marketplace', '/marketplace'], ['Dashboard', '/dashboard'], ['Tracking', '/bookings'], ['Pricing', '#pricing']] },
  { title: 'Company', links: [['About', '#'], ['Careers', '#'], ['Blog', '#'], ['Contact', '#']] },
  { title: 'Support', links: [['Help Center', '/help'], ['Safety', '#'], ['Terms', '#'], ['Privacy', '#']] }
];

export function SiteFooter() {
  return (
    <footer className="border-t border-navy-100/60 bg-navy-600">
      <div className="container-app py-14">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_repeat(3,1fr)]">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="Wapas" width={34} height={34} className="rounded-lg" />
              <span className="font-display text-xl font-extrabold text-white">Wapas</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-white/60">
              India&apos;s AI-matched truck backhaul marketplace — fewer empty miles, faster capacity, fairer freight.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-bold uppercase tracking-widest text-white/40">{col.title}</p>
              <ul className="mt-4 space-y-3">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-white/70 hover:text-white">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row">
          <p>© 2026 Wapas Technologies Pvt Ltd. All rights reserved.</p>
          <p>Made for the road, built in India 🇮🇳</p>
        </div>
      </div>
    </footer>
  );
}
