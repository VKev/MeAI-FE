import type { Route } from '.react-router/types/app/+types/root';
import {
  Hero,
  Features,
  Workflow,
  UseCases,
  Feedbacks,
  ValueProposition,
  CTA,
  SectionMenuUI,
  type Section,
} from '@/components/ui/guest';

const homeSections: Section[] = [
  { id: 'features', label: 'Features' },
  { id: 'workflow', label: 'How It Works' },
  { id: 'use-cases', label: 'Use Cases' },
  { id: 'feedbacks', label: 'Feedbacks' },
];

export function meta({ }: Route.MetaArgs) {
  return [
    { title: 'MeAI - AI-Powered Marketing Automation Platform' },
    {
      name: 'description',
      content: 'Create, distribute, and automate your content across all channels with AI-powered marketing automation.'
    }
  ];
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] relative">
      {/* Global Background - Single unified layer */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Grid pattern - consistent across all sections */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:64px_64px]" />

        {/* Global gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 via-transparent to-pink-900/10" />
      </div>

      {/* Floating Glow Orbs - positioned globally for flow effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="glow-orb-purple top-[5%] -left-[10%] opacity-20 animate-pulse-glow" />
        <div className="glow-orb-magenta top-[25%] -right-[5%] opacity-15 animate-pulse-glow" style={{ animationDelay: '2s' }} />
        <div className="glow-orb-cyan top-[45%] -left-[8%] opacity-15 animate-pulse-glow" style={{ animationDelay: '4s' }} />
        <div className="glow-orb-purple top-[65%] -right-[10%] opacity-20 animate-pulse-glow" style={{ animationDelay: '3s' }} />
        <div className="glow-orb-magenta top-[85%] -left-[5%] opacity-15 animate-pulse-glow" style={{ animationDelay: '5s' }} />
      </div>

      <SectionMenuUI sections={homeSections} />
      <Hero />
      <Features />
      <Workflow />
      <UseCases />
      <Feedbacks />
      <ValueProposition />
      <CTA />
    </div>
  );
}

