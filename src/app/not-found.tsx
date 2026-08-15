import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button-variants';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-center">
      <Image src="/logo.png" alt="Wapas" width={56} height={56} className="mb-6 rounded-xl" />
      <p className="font-display text-6xl font-extrabold text-navy-600">404</p>
      <h1 className="mt-2 font-display text-xl font-bold text-navy-600">This route took a wrong turn</h1>
      <p className="mt-2 max-w-sm text-sm text-navy-400">The page you&apos;re looking for doesn&apos;t exist or may have moved.</p>
      <Link href="/dashboard" className={cn(buttonVariants(), 'mt-6')}>
        Back to dashboard
      </Link>
    </div>
  );
}
