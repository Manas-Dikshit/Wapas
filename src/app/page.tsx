import { SiteNavbar } from '@/components/landing/navbar';
import { Hero } from '@/components/landing/hero';
import { ProblemSolution, Features } from '@/components/landing/sections';
import { Testimonials, Pricing, FAQ, CTA } from '@/components/landing/more-sections';
import { SiteFooter } from '@/components/landing/footer';
import { landingSectionIds, type LandingSectionId } from '@/lib/landing-content';

const sectionComponents: Record<LandingSectionId, () => React.ReactNode> = {
  solution: ProblemSolution,
  features: Features,
  testimonials: Testimonials,
  pricing: Pricing,
  faq: FAQ,
  cta: CTA
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <SiteNavbar />
      <Hero />
      {landingSectionIds.map((id) => {
        const Section = sectionComponents[id];
        return <Section key={id} />;
      })}
      <SiteFooter />
    </div>
  );
}