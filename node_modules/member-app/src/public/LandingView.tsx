import React from 'react';
import { LandingHeader } from '../components/landing/LandingHeader';
import { HeroSection } from '../components/landing/HeroSection';
import { ProblemSection } from '../components/landing/ProblemSection';
import { HowItWorksSticky } from '../components/landing/HowItWorksSticky';
import { InteractiveDemo } from '../components/landing/InteractiveDemo';
import { FeaturesGrid } from '../components/landing/FeaturesGrid';
import { RoleTabsSection } from '../components/landing/RoleTabsSection';
import { PrivacyTrustSection } from '../components/landing/PrivacyTrustSection';
import { LanguageMarquee } from '../components/landing/LanguageMarquee';
import { FaqAccordion } from '../components/landing/FaqAccordion';
import { FinalCtaSection } from '../components/landing/FinalCtaSection';
import { LandingFooter } from '../components/landing/LandingFooter';
import landingBg from '../assets/landing-bg.jpg';

export const LandingView: React.FC = () => {
  return (
    <div
      className="min-h-screen text-navy-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white relative bg-[#F4F9FD]"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(244, 249, 253, 0.75) 0%, rgba(255, 255, 255, 0.88) 35%, rgba(240, 247, 255, 0.92) 100%), url(${landingBg})`,
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center top',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* 1. Header */}
      <LandingHeader />

      <main className="flex-1">
        {/* 2. Hero Section */}
        <HeroSection />

        {/* 3. Problem Section */}
        <ProblemSection />

        {/* 4. How It Works (Sticky Narrative) */}
        <HowItWorksSticky />

        {/* 5. Interactive Demo (Showpiece) */}
        <InteractiveDemo />

        {/* 6. Features Grid */}
        <FeaturesGrid />

        {/* 7. For Everyone in the Group (Role Showcase) */}
        <RoleTabsSection />

        {/* 8. Privacy and Trust */}
        <PrivacyTrustSection />

        {/* 9. Language Support */}
        <LanguageMarquee />

        {/* 10. Frequently Asked Questions */}
        <FaqAccordion />

        {/* 11. Final CTA */}
        <FinalCtaSection />
      </main>

      {/* 12. Footer */}
      <LandingFooter />
    </div>
  );
};

export default LandingView;
