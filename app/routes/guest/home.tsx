import type { Route } from '.react-router/types/app/+types/root';
import { Hero } from '@/components/Hero';
import { Features } from '@/components/Features';
import { Workflow } from '@/components/Workflow';
import { UseCases } from '@/components/UseCases';
import { Testimonials } from '@/components/Testimonials';
import { ValueProposition } from '@/components/ValueProposition';
import { CTA } from '@/components/CTA';

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
    <>
      <Hero />
      <Features />
      <Workflow />
      <UseCases />
      <Testimonials />
      <ValueProposition />
      <CTA />
    </>
  );
}
