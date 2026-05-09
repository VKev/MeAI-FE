import type { Route } from './+types/contact';
import { useState } from 'react';
import { Link, useLoaderData } from 'react-router';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  Clock,
  Twitter,
  Linkedin,
  Github,
  Facebook,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

type ContactLoaderData = {
  origin: string;
  pageUrl: string;
  imageUrl: string;
  schema: {
    '@context': string;
    '@graph': Array<Record<string, unknown>>;
  };
};

const contactInfo = [
  {
    icon: <Mail className='w-6 h-6' strokeWidth={1.5} />,
    title: 'Email Us',
    content: 'support@meai.com',
    description: 'Send us an email anytime'
  },
  {
    icon: <Phone className='w-6 h-6' strokeWidth={1.5} />,
    title: 'Call Us',
    content: '+89 949 53 9999',
    description: '24/7'
  },
  {
    icon: <MapPin className='w-6 h-6' strokeWidth={1.5} />,
    title: 'Visit Us',
    content: 'FPT University',
    description: 'HCMC, Vietnam'
  },
  {
    icon: <Clock className='w-6 h-6' strokeWidth={1.5} />,
    title: 'Working Hours',
    content: '24/7',
    description: 'Weekend: Closed'
  }
];

const socialLinks = [
  { icon: <Twitter className='w-5 h-5' />, name: 'Twitter', href: '#' },
  { icon: <Linkedin className='w-5 h-5' />, name: 'LinkedIn', href: '#' },
  { icon: <Github className='w-5 h-5' />, name: 'GitHub', href: '#' },
  { icon: <Facebook className='w-5 h-5' />, name: 'Facebook', href: '#' }
];

const faqItems = [
  {
    q: "What's the average response time?",
    a: 'We typically respond to all inquiries within 24 hours during business days.'
  },
  {
    q: 'Do you offer technical support?',
    a: 'Yes! Our technical support team is available to help you with any platform-related questions.'
  },
  {
    q: 'Can I schedule a demo?',
    a: "Absolutely! Mention it in your message and we'll arrange a personalized demo for you."
  }
];

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const origin = url.origin;

  return {
    origin,
    pageUrl: `${origin}/contact`,
    imageUrl: `${origin}/logo-meai.webp`,
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          name: 'MeAI',
          url: origin,
          logo: `${origin}/logo-meai.webp`
        },
        {
          '@type': 'ContactPage',
          name: 'Contact MeAI',
          url: `${origin}/contact`,
          description: 'Get in touch with MeAI for support, questions, or partnership inquiries.'
        }
      ]
    }
  } satisfies ContactLoaderData;
}

export const headers: Route.HeadersFunction = () => ({
  'Cache-Control': 'public, max-age=300, s-maxage=1800, stale-while-revalidate=86400'
});

export function shouldRevalidate() {
  return false;
}

export const links: Route.LinksFunction = () => [{ rel: 'canonical', href: '/contact' }];

export function meta({ data }: Route.MetaArgs) {
  const routeData = data as ContactLoaderData | undefined;
  const pageUrl = routeData?.pageUrl ?? '/contact';
  const imageUrl = routeData?.imageUrl ?? '/logo-meai.webp';

  return [
    { title: 'Contact Us - MeAI' },
    {
      name: 'description',
      content: "Get in touch with MeAI. We're here to help you with your marketing automation needs."
    },
    { name: 'keywords', content: 'contact MeAI, support, help, questions, partnership, demo' },
    { name: 'robots', content: 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1' },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'MeAI' },
    { property: 'og:title', content: 'Contact MeAI - Get Support and Answers' },
    {
      property: 'og:description',
      content: 'Reach out to the MeAI team for support, questions, or to schedule a personalized demo.'
    },
    { property: 'og:url', content: pageUrl },
    { property: 'og:image', content: imageUrl },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Contact MeAI - Get Support and Answers' },
    { name: 'twitter:description', content: 'Contact the MeAI team for support, questions, or partnership inquiries.' },
    { name: 'twitter:image', content: imageUrl }
  ];
}

export default function Contact() {
  const { schema } = useLoaderData<typeof loader>();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className='landing-page relative min-h-screen overflow-x-hidden'>
      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className='relative z-10'>
        <section className='relative border-b border-white/6 pt-28 pb-16 md:pt-36 md:pb-24'>
          <div className='pointer-events-none absolute inset-0'>
            <div className='absolute inset-0 landing-grid opacity-20' />
            <div className='absolute left-1/2 top-4 h-[460px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(164,93,255,0.2),rgba(164,93,255,0)_74%)] blur-3xl' />
          </div>

          <div className='relative mx-auto w-full max-w-[1180px] px-4 sm:px-6'>
            <div className='mx-auto mb-7 flex w-fit items-center gap-2 rounded-full border border-white/12 bg-[#11111a]/72 px-3 py-1.5 text-xs font-medium text-white/78'>
              <Sparkles className='h-3.5 w-3.5 text-[#d66bff]' />
              <span>Get in touch</span>
            </div>

            <div className='mx-auto max-w-4xl text-center'>
              <h1 className='text-5xl leading-[0.95] tracking-[-0.03em] font-semibold text-white sm:text-6xl md:text-8xl'>
                We're here to
                <span className='block text-gradient-primary'>Help You Grow</span>
              </h1>

              <p className='mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-white/62 md:text-2xl'>
                Have questions about MeAI? Our team is here to help you get started with AI-powered marketing automation.
              </p>

              <div className='mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row'>
                <Link
                  to='/auth/sign-in'
                  className='group flex items-center gap-3 rounded-full bg-white px-9 py-4 text-base font-semibold text-black transition-transform hover:-translate-y-0.5 md:text-lg'
                >
                  Start Creating Free
                  <ArrowRight className='h-5 w-5 transition-transform group-hover:translate-x-1' />
                </Link>
                <a
                  href='#contact-form'
                  className='flex items-center gap-3 rounded-full border border-white/18 px-9 py-4 text-base font-semibold text-white hover:bg-white/6 transition-colors md:text-lg'
                >
                  Send a Message
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id='contact-form' className='section-auto relative border-b border-white/6 py-16 md:py-24'>
          <div className='pointer-events-none absolute inset-0'>
            <div className='absolute inset-0 landing-grid opacity-12' />
          </div>

          <div className='relative mx-auto w-full max-w-[1180px] px-4 sm:px-6'>
            <div className='mb-10 text-center'>
              <div className='mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/78'>
                <Send className='h-3.5 w-3.5 text-[#d66bff]' />
                Send Message
              </div>
              <h2 className='text-4xl leading-tight font-semibold tracking-tight text-white md:text-6xl'>
                Send Us a <span className='text-gradient-primary'>Message</span>
              </h2>
              <p className='mt-3 text-lg text-white/62'>Fill out the form below and we'll get back to you within 24 hours</p>
            </div>

            <form onSubmit={handleSubmit} className='mx-auto max-w-2xl'>
              <div className='grid gap-6 sm:grid-cols-2'>
                <div>
                  <label htmlFor='name' className='mb-2 block text-sm font-medium text-white/72'>
                    Your Name
                  </label>
                  <input
                    type='text'
                    id='name'
                    name='name'
                    value={formData.name}
                    onChange={handleChange}
                    className='w-full rounded-2xl border border-white/10 bg-[#0a0a13]/82 px-4 py-3 text-white placeholder:text-white/40 focus:border-[#d66bff]/40 focus:outline-none focus:ring-1 focus:ring-[#d66bff]/20'
                    placeholder='John Doe'
                    required
                  />
                </div>
                <div>
                  <label htmlFor='email' className='mb-2 block text-sm font-medium text-white/72'>
                    Email Address
                  </label>
                  <input
                    type='email'
                    id='email'
                    name='email'
                    value={formData.email}
                    onChange={handleChange}
                    className='w-full rounded-2xl border border-white/10 bg-[#0a0a13]/82 px-4 py-3 text-white placeholder:text-white/40 focus:border-[#d66bff]/40 focus:outline-none focus:ring-1 focus:ring-[#d66bff]/20'
                    placeholder='john@example.com'
                    required
                  />
                </div>
              </div>
              <div className='mt-6'>
                <label htmlFor='subject' className='mb-2 block text-sm font-medium text-white/72'>
                  Subject
                </label>
                <input
                  type='text'
                  id='subject'
                  name='subject'
                  value={formData.subject}
                  onChange={handleChange}
                  className='w-full rounded-2xl border border-white/10 bg-[#0a0a13]/82 px-4 py-3 text-white placeholder:text-white/40 focus:border-[#d66bff]/40 focus:outline-none focus:ring-1 focus:ring-[#d66bff]/20'
                  placeholder='How can we help you?'
                  required
                />
              </div>
              <div className='mt-6'>
                <label htmlFor='message' className='mb-2 block text-sm font-medium text-white/72'>
                  Message
                </label>
                <textarea
                  id='message'
                  name='message'
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  className='w-full rounded-2xl border border-white/10 bg-[#0a0a13]/82 px-4 py-3 text-white placeholder:text-white/40 focus:border-[#d66bff]/40 focus:outline-none focus:ring-1 focus:ring-[#d66bff]/20'
                  placeholder='Tell us more about your needs...'
                  required
                />
              </div>
              <button
                type='submit'
                className='mt-8 w-full rounded-full bg-white px-8 py-4 text-base font-semibold text-black transition-transform hover:-translate-y-0.5 md:text-lg'
              >
                <div className='flex items-center justify-center gap-2'>
                  <Send className='h-5 w-5' />
                  Send Message
                </div>
              </button>
            </form>
          </div>
        </section>

        <section className='section-auto relative border-b border-white/6 py-16 md:py-24'>
          <div className='relative mx-auto w-full max-w-[1180px] px-4 sm:px-6'>
            <div className='mb-10 text-center'>
              <div className='mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/78'>
                <MessageSquare className='h-3.5 w-3.5 text-[#d66bff]' />
                FAQ
              </div>
              <h2 className='text-4xl leading-tight font-semibold tracking-tight text-white md:text-6xl'>
                Quick <span className='text-gradient-primary'>Answers</span>
              </h2>
            </div>

            <div className='grid gap-4 md:grid-cols-3'>
              {faqItems.map((faq, index) => (
                <article
                  key={index}
                  className='rounded-3xl border border-white/10 bg-[#0a0a13]/82 p-6 transition-colors hover:border-white/20'
                >
                  <div className='mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#d89dff]'>
                    <MessageSquare className='h-5 w-5' />
                  </div>
                  <h3 className='text-2xl font-semibold text-white'>{faq.q}</h3>
                  <p className='mt-3 text-base leading-relaxed text-white/58'>{faq.a}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className='section-auto relative border-b border-white/6 py-16 md:py-24'>
          <div className='relative mx-auto w-full max-w-[1180px] px-4 sm:px-6'>
            <div className='mb-10 text-center'>
              <div className='mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/78'>
                <Mail className='h-3.5 w-3.5 text-[#d66bff]' />
                Contact Info
              </div>
              <h2 className='text-4xl leading-tight font-semibold tracking-tight text-white md:text-6xl'>
                Get In <span className='text-gradient-primary'>Touch</span>
              </h2>
              <p className='mt-3 text-lg text-white/62'>Multiple ways to reach us</p>
            </div>

            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              {contactInfo.map((info, index) => (
                <article
                  key={index}
                  className='rounded-3xl border border-white/10 bg-[#0a0a13]/82 p-6 transition-colors hover:border-white/20'
                >
                  <div className='mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#d89dff]'>
                    {info.icon}
                  </div>
                  <h3 className='text-2xl font-semibold text-white'>{info.title}</h3>
                  <p className='mt-2 text-lg font-medium text-white'>{info.content}</p>
                  <p className='mt-1 text-sm text-white/56'>{info.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className='section-auto relative py-16 md:py-24'>
          <div className='relative mx-auto w-full max-w-[1180px] px-4 sm:px-6'>
            <div className='mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#11111a]/66 px-3 py-1 text-xs font-medium text-white/72'>
              <ShieldCheck className='h-3.5 w-3.5 text-[#dca3ff]' />
              Connect with us
            </div>

            <div className='grid gap-4 md:grid-cols-3'>
              <article className='rounded-3xl border border-white/10 bg-[#0a0a13]/82 p-6'>
                <h3 className='text-balance text-2xl font-semibold text-white'>Social Media</h3>
                <p className='text-pretty mt-3 text-sm leading-relaxed text-white/58'>
                  Follow us on social media for updates, tips, and insights
                </p>
                <div className='mt-4 flex gap-3'>
                  {socialLinks.map((social, index) => (
                    <a
                      key={index}
                      href={social.href}
                      className='flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition-colors hover:border-white/20 hover:bg-white/10'
                      aria-label={social.name}
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              </article>
              <article className='rounded-3xl border border-white/10 bg-[#0a0a13]/82 p-6'>
                <h3 className='text-balance text-2xl font-semibold text-white'>Response Time</h3>
                <p className='text-pretty mt-3 text-sm leading-relaxed text-white/58'>
                  We typically respond to all inquiries within 24 hours during business days.
                </p>
              </article>
              <article className='rounded-3xl border border-white/10 bg-[#0a0a13]/82 p-6'>
                <h3 className='text-balance text-2xl font-semibold text-white'>Technical Support</h3>
                <p className='text-pretty mt-3 text-sm leading-relaxed text-white/58'>
                  Our technical support team is available to help you with any platform-related questions.
                </p>
              </article>
            </div>

            <div className='mt-8 flex flex-wrap items-center gap-3'>
              <Link
                to='/auth/sign-in'
                className='inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-white/90'
              >
                Start creating free
                <ArrowRight className='h-4 w-4' />
              </Link>
              <Link
                to='/pricing'
                className='inline-flex items-center gap-2 rounded-full border border-white/18 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/8'
              >
                <ShieldCheck className='h-4 w-4' />
                View pricing
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
