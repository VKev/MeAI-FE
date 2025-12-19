interface UseCase {
  title: string;
  benefit: string;
  icon: string;
}

const useCases: UseCase[] = [
  {
    title: 'Content Creators',
    benefit: '10x your content output without increasing workload',
    icon: ''
  },
  {
    title: 'Marketing Teams',
    benefit: 'Automate entire campaigns from creation to conversion',
    icon: ''
  },
  {
    title: 'Small Businesses',
    benefit: 'Professional marketing without hiring a team',
    icon: ''
  },
  {
    title: 'Agencies',
    benefit: 'Scale client work with AI-powered automation',
    icon: ''
  }
];

export function UseCases() {
  return (
    <section id="use-cases" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-4xl md:text-5xl font-extrabold text-center text-gray-900 mb-16">
          Built for Every Creator
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {useCases.map((useCase, index) => (
            <div
              key={index}
              className="text-center p-8 rounded-2xl bg-gradient-to-br from-white to-gray-50 border border-gray-100 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="text-5xl mb-4">{useCase.icon}</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{useCase.title}</h3>
              <p className="text-gray-600 text-lg">{useCase.benefit}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

