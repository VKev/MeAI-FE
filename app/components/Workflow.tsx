import { useState } from 'react';
import { Upload, Cpu, Share2, TrendingUp, Check } from 'lucide-react';

interface Step {
  id: string;
  number: string;
  title: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
}

const steps: Step[] = [
  {
    id: 'input',
    number: '01',
    title: 'Input Content or Data',
    description: 'Upload your content, connect your data sources, or let AI discover relevant materials automatically.',
    features: ['Upload videos & images', 'Connect data sources', 'AI content discovery'],
    icon: <Upload className="w-6 h-6" strokeWidth={1.5} />
  },
  {
    id: 'process',
    number: '02',
    title: 'AI Processing',
    description: 'Our AI analyzes, creates, edits, and optimizes your content for maximum engagement and impact.',
    features: ['Smart content analysis', 'Auto video editing', 'Performance optimization'],
    icon: <Cpu className="w-6 h-6" strokeWidth={1.5} />
  },
  {
    id: 'distribute',
    number: '03',
    title: 'Multi-Channel Distribution',
    description: 'Automatically publish to TikTok, YouTube, Facebook, Instagram, and more with optimized timing.',
    features: ['One-click publishing', 'Optimal timing', 'Cross-platform sync'],
    icon: <Share2 className="w-6 h-6" strokeWidth={1.5} />
  },
  {
    id: 'convert',
    number: '04',
    title: 'Automation & Conversion',
    description: 'AI-powered campaigns drive engagement and conversions across all your marketing channels.',
    features: ['Email automation', 'Lead nurturing', 'Conversion tracking'],
    icon: <TrendingUp className="w-6 h-6" strokeWidth={1.5} />
  }
];

export function Workflow() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="workflow" className="py-24 px-4 sm:px-6 lg:px-8 bg-dark-section relative overflow-hidden">
      {/* Background Effects */}
      <div className="glow-orb-magenta -bottom-40 -left-40 opacity-30" />
      <div className="glow-orb-cyan top-20 right-0 opacity-20" />

      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-purple-400 font-medium mb-4 uppercase tracking-wider text-sm">How It Works</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
            From Idea to
            <span className="text-gradient-purple-pink"> Conversion</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Simple 4-step workflow to automate your entire marketing process
          </p>
        </div>

        {/* Steps Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Step Tabs */}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(index)}
                className={`w-full text-left p-6 rounded-2xl transition-all duration-300 ${activeStep === index
                    ? 'glass-card border-purple-500/50'
                    : 'bg-transparent hover:bg-white/5'
                  }`}
              >
                <div className="flex items-start gap-4">
                  {/* Number */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${activeStep === index
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                      : 'bg-white/5 text-gray-500'
                    }`}>
                    <span className="font-bold text-sm">{step.number}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className={`text-lg font-bold mb-1 transition-colors ${activeStep === index ? 'text-white' : 'text-gray-400'
                      }`}>
                      {step.title}
                    </h3>
                    <p className={`text-sm transition-colors ${activeStep === index ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                      {step.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Active Step Details */}
          <div className="glass-card rounded-3xl p-8 lg:sticky lg:top-24">
            {/* Icon Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                {steps[activeStep].icon}
              </div>
              <div>
                <p className="text-purple-400 text-sm font-medium">Step {steps[activeStep].number}</p>
                <h3 className="text-2xl font-bold text-white">{steps[activeStep].title}</h3>
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-400 mb-8 leading-relaxed">
              {steps[activeStep].description}
            </p>

            {/* Features List */}
            <div className="space-y-3">
              {steps[activeStep].features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-purple-400" />
                  </div>
                  <span className="text-gray-300">{feature}</span>
                </div>
              ))}
            </div>

            {/* Visual Placeholder */}
            <div className="mt-8 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 h-48 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center mb-3">
                  {steps[activeStep].icon}
                </div>
                <p className="text-gray-500 text-sm">Interactive Demo</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
