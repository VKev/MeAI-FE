import type { Route } from './+types/home';
import { Header } from '../components/Header';
import { Hero } from '../components/Hero';
import { Features } from '../components/Features';
import { Workflow } from '../components/Workflow';
import { UseCases } from '../components/UseCases';
import { Testimonials } from '../components/Testimonials';
import { ValueProposition } from '../components/ValueProposition';
import { CTA } from '../components/CTA';
import { Footer } from '../components/Footer';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'MeAI - AI-Powered Marketing Automation Platform' },
    { name: 'description', content: 'Create, distribute, and automate your content across all channels with AI-powered marketing automation.' }
  ];
}

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <Features />
      <Workflow />
      <UseCases />
      <Testimonials />
      <ValueProposition />
      <CTA />
      <Footer />
    </div>
  );
}
