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
    <>
      <SectionMenuUI sections={homeSections} />
      <Hero />
      <Features />
      <Workflow />
      <UseCases />
      <Feedbacks />
      <ValueProposition />
      <CTA />
    </>
  );
}
