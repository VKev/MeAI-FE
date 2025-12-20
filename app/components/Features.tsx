import { Video, Sparkles, FileText, Wand2, Mail, Workflow, Scissors, Layers } from 'lucide-react';

interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
  theme: string;
}

const features: Feature[] = [
  {
    title: 'AI Video Creation & Auto-Publishing',
    description: 'AI automatically creates short videos and auto-publishes to TikTok, YouTube Shorts, Facebook Reels.',
    icon: (
      <div className="relative group-hover:scale-110 transition-transform duration-300">
        <Video className="w-8 h-8 text-indigo-600 group-hover:text-violet-600 transition-colors duration-300" strokeWidth={2} />
        <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" strokeWidth={2} />
      </div>
    ),
    theme: 'indigo-violet'
  },
  {
    title: 'AI Content Writing & Distribution',
    description: 'AI writes content and auto-posts to website, landing pages, and social media.',
    icon: (
      <div className="relative group-hover:scale-110 transition-transform duration-300">
        <FileText className="w-8 h-8 text-blue-600 group-hover:text-cyan-600 transition-colors duration-300" strokeWidth={2} />
        <Wand2 className="absolute -top-1 -right-1 w-4 h-4 text-cyan-500 opacity-0 group-hover:opacity-100 group-hover:rotate-12 transition-all duration-300" strokeWidth={2} />
      </div>
    ),
    theme: 'blue-cyan'
  },
  {
    title: 'Automated Marketing Campaigns',
    description: 'AI creates automated marketing campaigns (email / inbox) using existing data.',
    icon: (
      <div className="relative">
        <Mail className="w-8 h-8 text-emerald-600 group-hover:text-green-600 transition-colors duration-300" strokeWidth={2} />
        <Workflow className="absolute -bottom-1 -left-1 w-5 h-5 text-green-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" strokeWidth={2} />
      </div>
    ),
    theme: 'emerald-green'
  },
  {
    title: 'AI Video Editing',
    description: 'AI edits videos automatically based on provided sources or AI-discovered sources.',
    icon: (
      <div className="relative">
        <Scissors className="w-8 h-8 text-orange-600 group-hover:text-amber-600 group-hover:rotate-3 transition-all duration-300" strokeWidth={2} />
        <Layers className="absolute -bottom-1 -right-1 w-5 h-5 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" strokeWidth={2} />
      </div>
    ),
    theme: 'orange-amber'
  }
];

export function Features() {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-4xl md:text-5xl font-extrabold text-center text-gray-900 mb-16">
          Powerful Features for Modern Creators
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {features.map((feature, index) => {
            const hoverClasses = {
              'indigo-violet': 'hover:bg-gradient-to-br hover:from-indigo-50 hover:to-violet-50 hover:shadow-indigo-100/50',
              'blue-cyan': 'hover:bg-gradient-to-br hover:from-blue-50 hover:to-cyan-50 hover:shadow-blue-100/50',
              'emerald-green': 'hover:bg-gradient-to-br hover:from-emerald-50 hover:to-green-50 hover:shadow-emerald-100/50',
              'orange-amber': 'hover:bg-gradient-to-br hover:from-orange-50 hover:to-amber-50 hover:shadow-orange-100/50'
            };

            return (
            <div
              key={index}
              className={`group p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:shadow-xl transition-all duration-300 ${hoverClasses[feature.theme as keyof typeof hoverClasses]}`}
            >
              <div className="mb-4 flex items-center justify-center w-20 h-20 rounded-xl relative">
                {feature.icon}
                {/* Soft glow effect on hover */}
                <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 ${
                  feature.theme === 'indigo-violet' ? 'bg-gradient-to-br from-indigo-400 to-violet-400' :
                  feature.theme === 'blue-cyan' ? 'bg-gradient-to-br from-blue-400 to-cyan-400' :
                  feature.theme === 'emerald-green' ? 'bg-gradient-to-br from-emerald-400 to-green-400' :
                  'bg-gradient-to-br from-orange-400 to-amber-400'
                }`} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 text-lg leading-relaxed">{feature.description}</p>
            </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
