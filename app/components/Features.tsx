interface Feature {
  icon: string;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: '',
    title: 'AI Video Creation & Auto-Publishing',
    description: 'AI automatically creates short videos and auto-publishes to TikTok, YouTube Shorts, Facebook Reels.'
  },
  {
    icon: '',
    title: 'AI Content Writing & Distribution',
    description: 'AI writes content and auto-posts to website, landing pages, and social media.'
  },
  {
    icon: '',
    title: 'Automated Marketing Campaigns',
    description: 'AI creates automated marketing campaigns (email / inbox) using existing data.'
  },
  {
    icon: '',
    title: 'AI Video Editing',
    description: 'AI edits videos automatically based on provided sources or AI-discovered sources.'
  }
];

export function Features() {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-4xl md:text-5xl font-extrabold text-center text-gray-900 mb-16">
          Powerful Features for Modern Creators
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:shadow-xl transition-shadow duration-300"
            >
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 text-lg leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

