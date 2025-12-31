import type { Route } from '.react-router/types/app/+types/root';
import { Target, Users, Zap, Heart, TrendingUp, Award, Globe, Rocket } from 'lucide-react';
import { SectionMenuUI } from '@/components/SectionMenuUI';
import type { Section } from '@/components/SectionMenuUI';

const aboutSections: Section[] = [
  { id: 'values', label: 'Values' },
  { id: 'stats', label: 'Impact' },
  { id: 'vision', label: 'Vision' },
];

export function meta({ }: Route.MetaArgs) {
  return [
    { title: 'About Us - MeAI' },
    {
      name: 'description',
      content: 'Learn about MeAI\'s mission to revolutionize marketing automation with AI-powered solutions.'
    }
  ];
}

const values = [
  {
    icon: <Target className="w-8 h-8" strokeWidth={2} />,
    title: 'Innovation First',
    description: 'We push the boundaries of AI technology to deliver cutting-edge marketing solutions.',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    icon: <Users className="w-8 h-8" strokeWidth={2} />,
    title: 'Customer Success',
    description: 'Your growth is our success. We\'re committed to helping you achieve your marketing goals.',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    icon: <Zap className="w-8 h-8" strokeWidth={2} />,
    title: 'Speed & Efficiency',
    description: 'Automate hours of work in minutes with our intelligent AI-powered platform.',
    gradient: 'from-orange-500 to-amber-500'
  },
  {
    icon: <Heart className="w-8 h-8" strokeWidth={2} />,
    title: 'Built with Care',
    description: 'Every feature is crafted with attention to detail and user experience in mind.',
    gradient: 'from-rose-500 to-red-500'
  }
];

const stats = [
  { icon: <TrendingUp className="w-6 h-6" />, value: '10,000+', label: 'Active Users' },
  { icon: <Award className="w-6 h-6" />, value: '50M+', label: 'Content Pieces Created' },
  { icon: <Globe className="w-6 h-6" />, value: '120+', label: 'Countries Served' },
  { icon: <Rocket className="w-6 h-6" />, value: '99.9%', label: 'Uptime' }
];

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      <SectionMenuUI sections={aboutSections} />
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
        <div className="container mx-auto max-w-5xl text-center relative z-10">
          <div className="inline-block mb-4 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-purple-200 shadow-sm">
            <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              About MeAI
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
            Revolutionizing Marketing
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              with AI Innovation
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            We're on a mission to empower creators and businesses with AI-powered tools that automate marketing,
            amplify creativity, and accelerate growth.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section id="mission" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
              Our Mission
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              To democratize marketing automation by making powerful AI tools accessible to everyone—from
              solo creators to enterprise teams. We believe that great marketing shouldn't require a massive
              budget or technical expertise.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section id="values" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl md:text-5xl font-extrabold text-center text-gray-900 mb-16">
            Our Core Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="group relative p-8 rounded-2xl bg-white border border-gray-100 hover:border-transparent hover:shadow-2xl transition-all duration-300 overflow-hidden"
              >
                {/* Gradient background on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${value.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                {/* Icon with gradient */}
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br ${value.gradient} text-white mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  {value.icon}
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl md:text-5xl font-extrabold text-center mb-16">
            Our Impact in Numbers
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 mb-4">
                  {stat.icon}
                </div>
                <div className="text-4xl md:text-5xl font-extrabold mb-2">
                  {stat.value}
                </div>
                <div className="text-lg text-white/90">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section id="vision" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
            Looking Ahead
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed mb-8">
            We're just getting started. Our vision is to create a world where AI handles the repetitive tasks,
            freeing humans to focus on creativity, strategy, and meaningful connections. Join us on this journey
            to reshape the future of marketing.
          </p>
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
            <Rocket className="w-5 h-5" />
            <span>Join Our Mission</span>
          </div>
        </div>
      </section>
    </div>
  );
}
