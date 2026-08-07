import { SiteNavbar } from '@/components/landing/navbar';
import { Hero } from '@/components/landing/hero';
import { ProblemSolution, Features } from '@/components/landing/sections';
import { Testimonials, Pricing, FAQ, CTA } from '@/components/landing/more-sections';
import { SiteFooter } from '@/components/landing/footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <SiteNavbar />
      <Hero />
      <ProblemSolution />
      <Features />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTA />
      <SiteFooter />
    </div>
  );
}
