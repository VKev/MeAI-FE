import { Button } from '@/components/ui/button';
import { StartFreeTrialButton } from './StartFreeTrialButton';

const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId);
  if (element) {
    const headerHeight = 64;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
};

export function Hero() {
  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto max-w-5xl text-center">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
          AI-Powered Marketing
          <br />
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Automation Platform
          </span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
          Create, distribute, and automate your content across all channels. 
          Let AI handle everything from video creation to multi-platform publishing and marketing campaigns.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <StartFreeTrialButton size="lg" className="w-full sm:w-auto" />
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => scrollToSection('workflow')}
          >
            See How It Works
          </Button>
        </div>
        <p className="text-sm text-gray-500">No credit card required • 14-day free trial</p>
      </div>
    </section>
  );
}

