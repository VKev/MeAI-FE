import { Sparkles, ArrowRight } from 'lucide-react';

export function CTA() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="container mx-auto max-w-4xl relative z-10 text-center">
        {/* User Avatars Stack */}
        <div className="flex justify-center mb-8">
          <div className="flex -space-x-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-[#0a0a0f] flex items-center justify-center text-white text-xs font-bold"
              >
                {String.fromCharCode(64 + i)}
              </div>
            ))}
          </div>
          <div className="ml-4 flex items-center">
            <span className="text-white font-bold">18K+</span>
            <span className="text-gray-400 ml-2">creators already using MeAI</span>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6">
          Ready to Transform Your
          <span className="text-gradient-purple-pink block mt-2">Content Strategy?</span>
        </h2>

        {/* Subtitle */}
        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
          Join thousands of creators and businesses using AI to automate their marketing.
          Start your free trial today.
        </p>

        {/* CTA Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <button className="glow-button px-10 py-5 rounded-xl text-white font-semibold text-lg flex items-center gap-3 group">
            <Sparkles className="w-5 h-5" />
            Start Creating for Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
          <span className="flex items-center gap-2">
            <span className="text-green-400">✓</span> 14-day free trial
          </span>
          <span className="flex items-center gap-2">
            <span className="text-green-400">✓</span> No credit card required
          </span>
          <span className="flex items-center gap-2">
            <span className="text-green-400">✓</span> Cancel anytime
          </span>
        </div>
      </div>
    </section>
  );
}
