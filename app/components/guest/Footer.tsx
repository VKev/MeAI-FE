import { ArrowRight, Github, Linkedin, Twitter } from 'lucide-react';
import { Link } from 'react-router';

type FooterLink = {
  label: string;
  to: string;
  badge?: string;
};

const productLinks: FooterLink[] = [
  { label: 'Features', to: '/#features' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Integrations', to: '/contact', badge: 'NEW' },
  { label: 'Changelog', to: '/about' },
  { label: 'Roadmap', to: '/about' }
];

const resourceLinks: FooterLink[] = [
  { label: 'Community', to: '/about' },
  { label: 'Help Center', to: '/contact' },
  { label: 'API Docs', to: '/contact' },
  { label: 'Blog', to: '/about' },
  { label: 'Contact', to: '/contact' }
];

const companyLinks: FooterLink[] = [
  { label: 'About Us', to: '/about' },
  { label: 'Careers', to: '/contact', badge: 'Hiring' },
  { label: 'Legal', to: '/contact' },
  { label: 'Contact', to: '/contact' }
];

const socialLinks = [
  { label: 'X', to: 'https://x.com', icon: Twitter },
  { label: 'LinkedIn', to: 'https://linkedin.com', icon: Linkedin },
  { label: 'GitHub', to: 'https://github.com', icon: Github }
];

export function Footer() {
  return (
    <footer className='relative bg-[#06070c] pb-8 pt-20'>
      <div className='mx-auto w-full max-w-[1240px] px-4 sm:px-6'>
        <div className='grid gap-12 border-y border-white/8 py-12 lg:grid-cols-[1.35fr_1fr_1fr_1fr_1.15fr] lg:gap-10'>
          <div>
            <Link to='/' className='inline-flex items-center'>
              <img src='/logo-meai.webp' alt='MeAI' className='h-12 w-auto' />
            </Link>
            <p className='mt-6 max-w-sm text-[17px] leading-relaxed text-white/58'>
              The all-in-one AI marketing platform for creators. Automate, scale, and grow your business without the
              burnout.
            </p>
            <div className='mt-8 flex items-center gap-3'>
              {socialLinks.map(({ label, to, icon: Icon }) => (
                <a
                  key={label}
                  href={to}
                  target='_blank'
                  rel='noreferrer'
                  aria-label={label}
                  className='flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-white/70 transition-all duration-200 hover:border-white/24 hover:bg-white/[0.08] hover:text-white'
                >
                  <Icon className='h-4 w-4' />
                </a>
              ))}
            </div>
          </div>

          <FooterColumn title='Product' links={productLinks} />
          <FooterColumn title='Resources' links={resourceLinks} />
          <FooterColumn title='Company' links={companyLinks} />

          <div className='lg:border-l lg:border-white/8 lg:pl-8'>
            <h3 className='text-sm font-semibold tracking-[0.08em] text-white/88 uppercase'>Stay Updated</h3>
            <p className='mt-4 text-[22px] leading-tight text-white/92'>Join 15,000+ marketers following AI trends.</p>
            <form action='/auth/sign-up' method='get' className='mt-5 space-y-3'>
              <label htmlFor='footer-email' className='sr-only'>
                Email address
              </label>
              <input
                id='footer-email'
                name='email'
                type='email'
                required
                autoComplete='email'
                placeholder='Enter your email'
                className='h-11 w-full rounded-[10px] border border-white/14 bg-black/35 px-4 text-sm text-white outline-none transition-colors placeholder:text-white/34 focus:border-[#9f6aff]/70 focus:ring-2 focus:ring-[#9f6aff]/25'
              />
              <button
                type='submit'
                className='inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[linear-gradient(90deg,#7b45f8_0%,#9c4df2_46%,#8047f2_100%)] px-4 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:brightness-110'
              >
                Subscribe
                <ArrowRight className='h-4 w-4' />
              </button>
            </form>
          </div>
        </div>

        <div className='mt-6 flex flex-col gap-4 text-sm text-white/38 md:flex-row md:items-center md:justify-between'>
          <div className='flex flex-wrap items-center gap-3'>
            <span>© 2024 MeAI Inc. All rights reserved.</span>
            <span className='hidden text-white/16 md:inline'>|</span>
            <span className='inline-flex items-center gap-2 text-white/52'>
              <span className='h-2 w-2 rounded-full bg-emerald-400/90' />
              All systems operational
            </span>
          </div>
          <div className='flex flex-wrap items-center gap-6'>
            <Link to='/contact' className='transition-colors hover:text-white/72'>
              Privacy Policy
            </Link>
            <Link to='/contact' className='transition-colors hover:text-white/72'>
              Terms of Service
            </Link>
            <Link to='/contact' className='transition-colors hover:text-white/72'>
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

type FooterColumnProps = {
  title: string;
  links: FooterLink[];
};

function FooterColumn({ title, links }: FooterColumnProps) {
  return (
    <div>
      <h3 className='text-sm font-semibold tracking-[0.08em] text-white/88 uppercase'>{title}</h3>
      <ul className='mt-5 space-y-3'>
        {links.map((link) => (
          <li key={link.label}>
            <Link
              to={link.to}
              className='inline-flex items-center gap-2 text-white/58 transition-colors hover:text-white'
            >
              <span>{link.label}</span>
              {link.badge && (
                <span className='rounded-full border border-white/12 bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white/88'>
                  {link.badge}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
