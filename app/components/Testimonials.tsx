import { useMemo } from 'react';
import { testimonials } from '../data/testimonials';

export function Testimonials() {
  const duplicatedTestimonials = useMemo(
    () => [...testimonials, ...testimonials],
    []
  );

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white overflow-hidden">
      <div className="container mx-auto max-w-7xl">
        <h2 className="text-4xl md:text-5xl font-extrabold text-center text-gray-900 mb-4">
          What Users Say About MeAI
        </h2>
        <p className="text-center text-gray-600 text-lg mb-12">
          Thousands of creators and businesses trust MeAI
        </p>

        <div className="relative overflow-hidden">
          <div
            className="flex gap-6 w-max animate-scroll-infinite"
            style={{ '--items': testimonials.length } as React.CSSProperties}
          >
            {duplicatedTestimonials.map((testimonial, index) => (
              <div
                key={`${testimonial.id}-${index}`}
                className="p-6 rounded-3xl border bg-white shadow-lg shadow-blue-900/5
                           w-80 flex-shrink-0"
              >
                <div className="text-gray-600 text-sm leading-relaxed">
                  {testimonial.content}
                </div>

                <div className="flex items-center gap-3 mt-5">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    loading="lazy"
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover border border-gray-100"
                  />

                  <div className="flex flex-col">
                    <div className="font-semibold text-sm text-gray-900 leading-5">
                      {testimonial.name}
                    </div>
                    <div className="text-xs text-blue-600 font-medium leading-5">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Gradient fade */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-gray-50 to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-gray-50 to-transparent z-10" />
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
