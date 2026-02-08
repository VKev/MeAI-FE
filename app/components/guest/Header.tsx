import { Link, useNavigate } from 'react-router';

export function Header() {
  const navigate = useNavigate();

  return (
    <header className='fixed top-0 left-0 right-0 z-50 border-b border-white/6 bg-[#050507]/70 backdrop-blur-xl'>
      <nav className='mx-auto flex h-16 w-full max-w-[1180px] items-center justify-between px-4 sm:px-6'>
        <Link to='/' className='shrink-0'>
          <img src='/logo-meai.png' alt='MeAI' className='h-10 w-auto' />
        </Link>

        <div className='hidden md:flex items-center gap-10 text-sm text-white/68 font-medium'>
          <a href='/' className='hover:text-white transition-colors'>
            Home
          </a>
          <a href='/#features' className='hover:text-white transition-colors'>
            Features
          </a>
          <Link to='/pricing' className='hover:text-white transition-colors'>
            Pricing
          </Link>
        </div>

        <button
          type='button'
          onClick={() => navigate('/auth/sign-in')}
          className='rounded-full border border-white/12 bg-white/8 px-6 py-2 text-sm font-semibold text-white hover:bg-white/14 transition-colors'
        >
          Get started
        </button>
      </nav>
    </header>
  );
}
