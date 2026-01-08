import { Zap, Target, Workflow, Check } from 'lucide-react';

const values = [
  {
    icon: <Zap className="w-6 h-6" strokeWidth={1.5} />,
    title: 'Full AI Content Creation',
    description: 'Generate videos, text, and campaigns from scratch'
  },
  {
    icon: <Target className="w-6 h-6" strokeWidth={1.5} />,
    title: 'Marketing Automation',
    description: 'Automated campaigns that drive real conversions'
  },
  {
    icon: <Workflow className="w-6 h-6" strokeWidth={1.5} />,
    title: 'End-to-End Workflow',
    description: 'From idea to published content to conversion'
  }
];

export function ValueProposition() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="container mx-auto max-w-5xl relative z-10">
        {/* Main Content */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
            More Than Just
            <span className="text-gradient-purple-pink block mt-2">Repurposing</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            While others only repurpose existing content, MeAI provides a complete end-to-end solution for your entire marketing workflow.
          </p>
        </div>

        {/* Value Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {values.map((value, index) => (
            <div
              key={index}
              className="glass-card rounded-2xl p-6 text-center group"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 mb-4 text-purple-300 group-hover:scale-110 transition-transform">
                {value.icon}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{value.title}</h3>
              <p className="text-gray-400 text-sm">{value.description}</p>
            </div>
          ))}
        </div>

        {/* Comparison */}
        <div className="glass-card rounded-3xl p-8 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Other Tools */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-400 mb-4">Other Tools</h3>
              {['Repurpose existing content only', 'Manual publishing required', 'No marketing automation', 'Limited AI capabilities'].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-gray-500">
                  <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center">
                    <span className="text-xs">✕</span>
                  </div>
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>

            {/* MeAI */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-purple-300 mb-4">MeAI Platform</h3>
              {['Full AI content creation from scratch', 'Auto-publish to all platforms', 'Complete marketing automation', 'Advanced AI for every task'].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-gray-300">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
