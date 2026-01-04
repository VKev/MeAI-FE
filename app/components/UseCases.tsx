import { Users, UsersRound, Store, Building2, ArrowRight } from 'lucide-react';

interface UseCase {
  title: string;
  description: string;
  benefit: string;
  icon: React.ReactNode;
  gradient: string;
}

const useCases: UseCase[] = [
  {
    title: 'Content Creators',
    description: 'Scale your content production without burning out',
    benefit: '10x your output',
    icon: <Users className="w-7 h-7" strokeWidth={1.5} />,
    gradient: 'from-purple-500 to-violet-500'
  },
  {
    title: 'Marketing Teams',
    description: 'Automate campaigns from creation to conversion',
    benefit: 'Save 20hrs/week',
    icon: <UsersRound className="w-7 h-7" strokeWidth={1.5} />,
    gradient: 'from-pink-500 to-rose-500'
  },
  {
    title: 'Small Businesses',
    description: 'Professional marketing without hiring a team',
    benefit: 'Cut costs by 80%',
    icon: <Store className="w-7 h-7" strokeWidth={1.5} />,
    gradient: 'from-cyan-500 to-blue-500'
  },
  {
    title: 'Agencies',
    description: 'Scale client work with AI-powered automation',
    benefit: '3x more clients',
    icon: <Building2 className="w-7 h-7" strokeWidth={1.5} />,
    gradient: 'from-emerald-500 to-teal-500'
  }
];

export function UseCases() {
  return (
    <section id="use-cases" className="py-24 px-4 sm:px-6 lg:px-8 bg-dark-section-alt relative overflow-hidden">
      {/* Background Effects */}
      <div className="glow-orb-purple top-0 left-1/2 -translate-x-1/2 opacity-20" />

      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-purple-400 font-medium mb-4 uppercase tracking-wider text-sm">Use Cases</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
            Built for
            <span className="text-gradient-purple-pink"> Every Creator</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Whether you're a solo creator or an enterprise team, MeAI scales with your needs
          </p>
        </div>

        {/* Use Case Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {useCases.map((useCase, index) => (
            <div
              key={index}
              className="glass-card rounded-2xl p-6 text-center group cursor-pointer"
            >
              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${useCase.gradient} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <div className="text-white">
                  {useCase.icon}
                </div>
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                {useCase.title}
              </h3>

              {/* Description */}
              <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                {useCase.description}
              </p>

              {/* Benefit Badge */}
              <div className="inline-flex items-center gap-1 text-purple-400 text-sm font-medium">
                <span>{useCase.benefit}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
