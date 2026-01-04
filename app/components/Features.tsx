import { Video, FileText, Mail, Scissors, ArrowUpRight } from 'lucide-react';

interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
}

const features: Feature[] = [
  {
    title: 'AI Video Creation',
    description: 'Automatically create short videos and publish to TikTok, YouTube Shorts, Facebook Reels.',
    icon: <Video className="w-8 h-8" strokeWidth={1.5} />,
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    title: 'Content Writing & Distribution',
    description: 'AI writes content and auto-posts to website, landing pages, and social media.',
    icon: <FileText className="w-8 h-8" strokeWidth={1.5} />,
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    title: 'Marketing Automation',
    description: 'AI creates automated marketing campaigns using your existing customer data.',
    icon: <Mail className="w-8 h-8" strokeWidth={1.5} />,
    gradient: 'from-emerald-500 to-teal-500'
  },
  {
    title: 'AI Video Editing',
    description: 'AI edits videos automatically based on provided sources or AI-discovered content.',
    icon: <Scissors className="w-8 h-8" strokeWidth={1.5} />,
    gradient: 'from-orange-500 to-amber-500'
  }
];

export function Features() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-dark-section-alt relative overflow-hidden">
      {/* Background Effects */}
      <div className="glow-orb-purple top-1/2 -right-40 opacity-30" />

      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-purple-400 font-medium mb-4 uppercase tracking-wider text-sm">Features</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
            Powerful Tools for
            <span className="text-gradient-purple-pink block mt-2">Modern Creators</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Everything you need to create, automate, and scale your marketing efforts
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="glass-card rounded-2xl p-8 group cursor-pointer"
            >
              {/* Icon with gradient background */}
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <div className="text-white">
                  {feature.icon}
                </div>
              </div>

              {/* Content */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-300 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Arrow Icon */}
                <ArrowUpRight className="w-5 h-5 text-gray-600 group-hover:text-purple-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300 ml-4 mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
