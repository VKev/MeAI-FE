import { useMemo } from 'react';
import { testimonials } from '../data/testimonials';

export function Feedbacks() {
  const duplicatedTestimonials = useMemo(
    () => [...testimonials, ...testimonials],
    []
  );

  return (
    <section id='feedbacks' className="py-24 px-4 sm:px-6 lg:px-8 bg-dark-section-alt overflow-hidden relative">
      {/* Background Effects */}
      <div className="glow-orb-cyan -top-40 right-0 opacity-20" />

      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <p className="text-purple-400 font-medium mb-4 uppercase tracking-wider text-sm">Feedbacks</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            What Users Say About
            <span className="text-gradient-purple-pink"> MeAI</span>
          </h2>
          <p className="text-gray-400 text-lg">
            Thousands of creators and businesses trust MeAI
          </p>
        </div>

        <div className="relative overflow-hidden">
          <div
            className="flex gap-6 w-max animate-scroll-infinite"
            style={{ '--items': testimonials.length } as React.CSSProperties}
          >
            {duplicatedTestimonials.map((testimonial, index) => (
              <div
                key={`${testimonial.id}-${index}`}
                className="glass-card p-6 rounded-2xl w-80 flex-shrink-0"
              >
                <div className="text-gray-300 text-sm leading-relaxed">
                  {testimonial.content}
                </div>

                <div className="flex items-center gap-3 mt-5">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    loading="lazy"
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover border border-purple-500/30"
                  />

                  <div className="flex flex-col">
                    <div className="font-semibold text-sm text-white leading-5">
                      {testimonial.name}
                    </div>
                    <div className="text-xs text-purple-400 font-medium leading-5">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Gradient fade */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#0c0c14] to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0c0c14] to-transparent z-10" />
        </div>
      </div>

      <style>{`
        @keyframes scroll-infinite {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }

        .animate-scroll-infinite {
          animation: scroll-infinite calc(var(--items) * 5s) linear infinite;
          will-change: transform;
        }

        .animate-scroll-infinite:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}

