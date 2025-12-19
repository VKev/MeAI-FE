interface Step {
  number: string;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    number: '1',
    title: 'Input Content or Data',
    description: 'Upload your content, connect your data sources, or let AI discover relevant materials.'
  },
  {
    number: '2',
    title: 'AI Processing',
    description: 'Our AI analyzes, creates, edits, and optimizes your content for maximum impact.'
  },
  {
    number: '3',
    title: 'Multi-Channel Distribution',
    description: 'Automatically publish to TikTok, YouTube, Facebook, Instagram, and more.'
  },
  {
    number: '4',
    title: 'Marketing Automation & Conversion',
    description: 'AI-powered campaigns drive engagement and conversions across all channels.'
  }
];

export function Workflow() {
  return (
    <section id="workflow" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-4xl md:text-5xl font-extrabold text-center text-gray-900 mb-16">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold mb-6">
                {step.number}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
              <p className="text-gray-600 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

