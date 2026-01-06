import { Button } from '@/components/ui/button';
import { StartFreeTrialButton } from './StartFreeTrialButton';
import { Sparkles, Play } from 'lucide-react';

const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId);
  if (element) {
    const headerHeight = 64;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
};

export function Hero() {
  return (
    <section className="relative min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-[#0a0a0f] overflow-hidden">
      {/* Background Effects - matching Features.tsx */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5" />

      {/* Glowing Orbs - positioned below header */}
      <div className="glow-orb-purple top-40 -left-40 opacity-30 animate-pulse-glow" />
      <div className="glow-orb-magenta top-60 right-0 opacity-25 animate-pulse-glow" style={{ animationDelay: '2s' }} />
      <div className="glow-orb-cyan bottom-20 left-1/4 opacity-20 animate-pulse-glow" style={{ animationDelay: '4s' }} />

      <div className="container mx-auto max-w-6xl text-center relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-8">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-purple-300 font-medium">AI-Powered Marketing Platform</span>
        </div>

        {/* Main Title */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight">
          Marketing
          <br />
          <span className="text-gradient-purple-pink">
            Automation, Unleashed
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
          Create, distribute, and automate your content across all channels.
          Let AI handle everything from video creation to multi-platform publishing.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <button className="glow-button px-8 py-4 rounded-xl text-white font-semibold text-lg">
            Start Creating for Free
          </button>
          <button
            className="ghost-button px-8 py-4 rounded-xl text-white font-medium text-lg flex items-center gap-2"
            onClick={() => scrollToSection('workflow')}
          >
            <Play className="w-5 h-5" />
            Watch Demo
          </button>
        </div>

        {/* Trust Badge */}
        <p className="text-sm text-gray-500 mb-16">
          No credit card required • 14-day free trial • Cancel anytime
        </p>

        {/* Floating Showcase Cards */}
        <div className="relative mt-8">
          <div className="flex justify-center gap-6 flex-wrap">
            {/* Card 1 */}
            <div className="glass-card rounded-2xl p-1 animate-float w-64 md:w-72">
              <div className="rounded-xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=300&fit=crop"
                  alt="AI Video Creation"
                  className="w-full h-40 object-cover"
                />
                <div className="p-4 bg-[#0c0c14]">
                  <p className="text-sm text-gray-400">AI Video Creation</p>
                  <p className="text-xs text-purple-400 mt-1">Auto-publish to Social media</p>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="glass-card rounded-2xl p-1 animate-float-delayed w-64 md:w-72 hidden md:block">
              <div className="rounded-xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop"
                  alt="Marketing Analytics"
                  className="w-full h-40 object-cover"
                />
                <div className="p-4 bg-[#0c0c14]">
                  <p className="text-sm text-gray-400">Marketing Analytics</p>
                  <p className="text-xs text-purple-400 mt-1">Track performance across channels</p>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="glass-card rounded-2xl p-1 animate-float w-64 md:w-72 hidden lg:block" style={{ animationDelay: '1s' }}>
              <div className="rounded-xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop"
                  alt="Campaign Automation"
                  className="w-full h-40 object-cover"
                />
                <div className="p-4 bg-[#0c0c14]">
                  <p className="text-sm text-gray-400">Campaign Automation</p>
                  <p className="text-xs text-purple-400 mt-1">Email, Social media</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
