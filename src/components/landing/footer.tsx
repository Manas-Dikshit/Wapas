import Link from 'next/link';
import Image from 'next/image';
import { footer } from '@/lib/landing-content';

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
            <p className="mt-4 max-w-xs text-sm text-white/60">{footer.tagline}</p>
          </div>
          {footer.columns.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-bold uppercase tracking-widest text-white/40">{col.title}</p>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-white/70 hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row">
          <p>{footer.copyright}</p>
          <p>{footer.tag}</p>
        </div>
      </div>
    </footer>
  );
}