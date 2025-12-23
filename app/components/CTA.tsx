import { StartFreeTrialButton } from './StartFreeTrialButton';

export function CTA() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="container mx-auto max-w-4xl text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
          Ready to Transform Your Content Strategy?
        </h2>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Join thousands of creators and businesses using AI to automate their marketing. 
          Start your free trial today — no credit card required.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <StartFreeTrialButton size="lg" className="w-full sm:w-auto" />
        </div>
        <p className="text-sm text-gray-500">
          ✓ 14-day free trial • ✓ No credit card required • ✓ Cancel anytime
        </p>
      </div>
    </section>
  );
}

