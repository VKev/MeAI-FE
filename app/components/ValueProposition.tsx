import { StartFreeTrialButton } from './StartFreeTrialButton';

export function ValueProposition() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 to-purple-600">
      <div className="container mx-auto max-w-4xl text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
          More Than Just Repurposing
        </h2>
        <p className="text-xl md:text-2xl text-blue-100 mb-12 leading-relaxed">
          While others only repurpose existing content, MeAI provides a complete end-to-end solution:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-2">Full AI Content Creation</h3>
            <p className="text-blue-100">Generate videos, text, and campaigns from scratch</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-2">Marketing Automation</h3>
            <p className="text-blue-100">Automated campaigns that drive real conversions</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-2">End-to-End Workflow</h3>
            <p className="text-blue-100">From idea to published content to conversion</p>
          </div>
        </div>
        <StartFreeTrialButton size="lg" className="w-full sm:w-auto" />
      </div>
    </section>
  );
}

