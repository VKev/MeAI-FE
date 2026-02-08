import { Link } from 'react-router';
import { Twitter, Linkedin, MessageCircle } from 'lucide-react';

const productLinks = ['Features', 'Pricing', 'Integrations', 'Changelog', 'Roadmap'];
const resourceLinks = ['Community', 'Help Center', 'API Docs', 'Blog', 'Contact'];
const companyLinks = ['About Us', 'Careers', 'Legal', 'Privacy Policy'];

export function Footer() {
  return (
    <footer className='bg-[#07080c] py-18'>
      <div className='mx-auto w-full max-w-[1180px] rounded-[2px] border border-white/8 bg-black/20 px-4 py-14 sm:px-6'>
        <div className='grid gap-12 md:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1fr_1fr]'>
          <div>
            <Link to='/' className='inline-block'>
              <img src='/logo-meai.webp' alt='MeAI' className='h-12 w-auto' />
            </Link>
            <p className='mt-7 max-w-sm text-base leading-relaxed text-white/44 md:text-lg'>
              The all-in-one AI marketing platform for creators and businesses. Automate, scale, and grow without the
              burnout.
            </p>
            <div className='mt-8 flex items-center gap-4'>
              {[Twitter, Linkedin, MessageCircle].map((Icon, idx) => (
                <button
                  key={idx}
                  type='button'
                  className='flex h-12 w-12 items-center justify-center rounded-full bg-[#11131a] text-[#5ab6ff] hover:bg-[#161925] transition-colors'
                >
                  <Icon className='h-5 w-5' />
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className='text-xl font-semibold text-white'>Product</h4>
            <ul className='mt-6 space-y-4'>
              {productLinks.map((label) => (
                <li key={label} className='text-base text-white/46 hover:text-white transition-colors'>
                  <a href={label === 'Pricing' ? '/pricing' : '/#features'}>{label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className='text-xl font-semibold text-white'>Resources</h4>
            <ul className='mt-6 space-y-4'>
              {resourceLinks.map((label) => (
                <li key={label} className='text-base text-white/46 hover:text-white transition-colors'>
                  <a href='#'>{label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className='text-xl font-semibold text-white'>Company</h4>
            <ul className='mt-6 space-y-4'>
              {companyLinks.map((label) => (
                <li key={label} className='text-base text-white/46 hover:text-white transition-colors'>
                  <a href='#' className='inline-flex items-center gap-2'>
                    {label}
                    {label === 'Careers' && (
                      <span className='rounded-md bg-[#5b1a95]/65 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-[#d98dff]'>
                        Hiring
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className='mt-14 border-t border-white/8 pt-8 flex flex-col gap-5 text-sm text-white/30 md:flex-row md:items-center md:justify-between'>
          <p>@ 2024 MeAI Inc. All rights reserved.</p>
          <div className='flex flex-wrap gap-8'>
            <a href='#' className='hover:text-white/55 transition-colors'>
              Terms of Service
            </a>
            <a href='#' className='hover:text-white/55 transition-colors'>
              Privacy Policy
            </a>
            <a href='#' className='hover:text-white/55 transition-colors'>
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
