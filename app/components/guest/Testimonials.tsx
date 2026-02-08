import { MessageCircle, Ban } from 'lucide-react';

const reviews = [
  {
    quote:
      '"MeAI\'s AI marketing campaigns helped increase conversion rate by 40%. Smart email automation is incredibly effective and saves our team hours daily."',
    name: 'Hoang Thi Huong',
    role: 'E-commerce Manager'
  },
  {
    quote:
      '"MeAI\'s auto video editing saves so much time. Just provide the source, AI edits and optimizes for every platform automatically."',
    name: 'Mai Lisa',
    role: 'Video Producer'
  },
  {
    quote:
      '"MeAI helps our small team run multi-platform campaigns with clarity. We now plan and publish faster without extra headcount."',
    name: 'Hoang Kim Khanh',
    role: 'Brand Manager'
  }
];

export function Feedbacks() {
  return (
    <section id='feedbacks' className='relative border-b border-white/6 py-20 overflow-hidden'>
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute inset-0 landing-grid opacity-18' />
      </div>

      <div className='relative mx-auto w-full max-w-[1180px] px-4 sm:px-6'>
        <div className='mx-auto max-w-4xl text-center'>
          <div className='inline-flex items-center gap-2 rounded-full border border-[#7f31d2]/55 bg-[#20102e]/70 px-4 py-1.5 text-xs font-semibold tracking-[0.08em] text-[#c861ff]'>
            <MessageCircle className='h-3.5 w-3.5' />
            FEEDBACKS
          </div>
          <h2 className='mt-5 text-4xl leading-tight tracking-[-0.025em] font-semibold text-white md:text-6xl'>
            What Users Say About <span className='text-gradient-primary'>MeAI</span>
          </h2>
          <p className='mt-4 text-lg text-white/44 md:text-2xl'>Thousands of creators and businesses trust MeAI</p>
        </div>

        <div className='feedback-marquee relative mt-12 overflow-hidden'>
          <div className='feedback-marquee-track flex min-w-max items-stretch gap-6 px-4 pb-2'>
            {[0, 1].map((setIndex) => (
              <div key={setIndex} className='flex items-stretch gap-6' aria-hidden={setIndex === 1}>
                {reviews.map((review) => (
                  <article
                    key={`${setIndex}-${review.name}`}
                    className='w-[340px] shrink-0 rounded-[22px] border border-white/10 bg-[#090a0f]/88 p-7 md:w-[380px]'
                  >
                    <p className='text-lg leading-relaxed text-white/78 md:text-2xl'>{review.quote}</p>
                    <div className='mt-6 flex items-center gap-3'>
                      <span className='flex h-10 w-10 items-center justify-center rounded-full border border-white/12 text-white/38'>
                        <Ban className='h-5 w-5' />
                      </span>
                      <div>
                        <p className='text-lg font-semibold text-white md:text-xl'>{review.name}</p>
                        <p className='text-sm text-white/42 md:text-base'>{review.role}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ))}
          </div>

          <div className='pointer-events-none absolute left-0 top-0 h-full w-28 bg-gradient-to-r from-[#050507] to-transparent' />
          <div className='pointer-events-none absolute right-0 top-0 h-full w-28 bg-gradient-to-l from-[#050507] to-transparent' />
        </div>
      </div>
    </section>
  );
}
