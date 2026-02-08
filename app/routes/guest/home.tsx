import type { Route } from '.react-router/types/app/+types/root';
import {
  Hero,
  Features,
  Workflow,
  UseCases,
  Feedbacks,
  ValueProposition,
  CTA,
  HeroVideoBackground
} from '@/components/guest';

export function meta({}: Route.MetaArgs) {
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
    <div className='landing-page relative min-h-screen overflow-x-hidden bg-[#050507]'>
      <div className='pointer-events-none fixed inset-0 z-0'>
        <HeroVideoBackground />
      </div>
      <div className='relative z-10'>
        <Hero />
        <Features />
        <Workflow />
        <UseCases />
        <ValueProposition />
        <Feedbacks />
        <CTA />
      </div>
    </div>
  );
}
