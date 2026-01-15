import type { Role } from '@/contants/type';
import { useUserStore } from '@/store/user.store';
import { getNavigateByRoles, normalizeRole } from '@/utils';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';

export function Header() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll for header background transition
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleClick = () => {
    if (!user) {
      navigate('/auth/sign-in');
      return;
    }

    const roles = user.roles.map(normalizeRole).filter(Boolean) as Role[];
    navigate(getNavigateByRoles(roles));
  };

  return (
    <header className='fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-purple-500/10'>
      <nav className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-20'>
          {/* Logo */}
          <Link to='/' className='shrink-0'>
            <img src='/logo.png' alt='MeAI' className='h-10 w-auto' />
          </Link>

          {/* Desktop Navigation */}
          <div className='hidden md:flex items-center space-x-8'>
            <Link to='/' className='text-gray-300 hover:text-white font-medium transition-colors duration-200'>
              Home
            </Link>
            <Link to='/about' className='text-gray-300 hover:text-white font-medium transition-colors duration-200'>
              About
            </Link>
            <Link to='/contact' className='text-gray-300 hover:text-white font-medium transition-colors duration-200'>
              Contact
            </Link>
            <Link to='/pricing' className='text-gray-300 hover:text-white font-medium transition-colors duration-200'>
              Pricing
            </Link>
          </div>

          {/* Desktop Auth Buttons */}
          <div className='hidden md:flex items-center space-x-3'>
            <button
              onClick={handleClick}
              className='px-5 py-2 rounded-lg bg-linear-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-700 hover:to-purple-700 hover:shadow-lg transition-all duration-200'
            >
              {user ? "Let's start" : 'Get started'}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className='md:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-colors duration-200'
            aria-label='Toggle menu'
          >
            {isMenuOpen ? (
              <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              </svg>
            ) : (
              <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 12h16M4 18h16' />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className='md:hidden py-4 border-t border-white/10 bg-[#0a0a0f]/95 backdrop-blur-xl'>
            <div className='flex flex-col space-y-3'>
              <Link
                to='/'
                onClick={() => setIsMenuOpen(false)}
                className='text-left px-4 py-2 text-gray-300 hover:bg-white/5 hover:text-white font-medium rounded-lg transition-colors duration-200'
              >
                Home
              </Link>
              <Link
                to='/about'
                onClick={() => setIsMenuOpen(false)}
                className='text-left px-4 py-2 text-gray-300 hover:bg-white/5 hover:text-white font-medium rounded-lg transition-colors duration-200'
              >
                About
              </Link>
              <Link
                to='/contact'
                onClick={() => setIsMenuOpen(false)}
                className='text-left px-4 py-2 text-gray-300 hover:bg-white/5 hover:text-white font-medium rounded-lg transition-colors duration-200'
              >
                Contact
              </Link>
              <Link
                to='/pricing'
                onClick={() => setIsMenuOpen(false)}
                className='text-left px-4 py-2 text-gray-300 hover:bg-white/5 hover:text-white font-medium rounded-lg transition-colors duration-200'
              >
                Pricing
              </Link>
              <div className='border-t border-white/10 pt-3 mt-3'>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleClick();
                  }}
                  className='w-full mt-2 glow-button px-4 py-2 rounded-lg text-white font-medium'
                >
                  {user ? "Let's start" : 'Get started'}
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
