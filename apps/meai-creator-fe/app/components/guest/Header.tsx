import { Link, NavLink, useNavigate } from 'react-router';

export function Header() {
  const navigate = useNavigate();
  const getNavLinkClass = ({ isActive, isPending }: { isActive: boolean; isPending: boolean }) =>
    `transition-colors ${isPending ? 'text-white/52' : isActive ? 'text-white' : 'text-white/68 hover:text-white'}`;

  return (
    <header className='fixed top-0 left-0 right-0 z-50 border-b border-white/6 bg-[#050507]/70 backdrop-blur-xl'>
      <nav className='mx-auto flex h-20 w-full max-w-[1180px] items-center justify-between px-4 sm:px-6'>
        <Link to='/' className='shrink-0'>
          <img src='/logo-meai.webp' alt='MeAI' className='h-16 w-auto' />
        </Link>

        <div className='hidden md:flex items-center gap-10 text-sm text-white/68 font-medium'>
          <NavLink to='/' end className={getNavLinkClass}>
            Home
          </NavLink>
          <NavLink to='/about' className={getNavLinkClass}>
            About
          </NavLink>
          <NavLink to='/contact' className={getNavLinkClass}>
            Contact
          </NavLink>
          <NavLink to='/pricing' className={getNavLinkClass}>
            Pricing
          </NavLink>
        </div>

        <Link
          to='/auth/sign-in'
          className='rounded-full border border-white/12 bg-white/8 px-6 py-2 text-sm font-semibold text-white hover:bg-white/14 transition-colors'
        >
          Get started
        </Link>
      </nav>
    </header>
  );
}
