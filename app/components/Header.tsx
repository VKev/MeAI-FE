import { useState } from 'react';
import { Link } from 'react-router';

const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId);
  if (element) {
    const headerHeight = 80; // Tăng lên để match với header cao hơn
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
};

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavClick = (sectionId: string) => {
    scrollToSection(sectionId);
    setIsMenuOpen(false); // Đóng menu sau khi click
  };

  return (
    <header className='fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm'>
      <nav className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-20'>
          {/* Logo */}
          <Link to='/' className='flex-shrink-0'>
            <img src='/logo.png' alt='MeAI' className='h-10 w-auto' />
          </Link>

          {/* Desktop Navigation */}
          <div className='hidden md:flex items-center space-x-8'>
            <button
              onClick={() => scrollToSection('features')}
              className='text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200'
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('workflow')}
              className='text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200'
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('use-cases')}
              className='text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200'
            >
              Use Cases
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className='text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200'
            >
              Pricing
            </button>
          </div>

          {/* Desktop Auth Buttons */}
          <div className='hidden md:flex items-center space-x-3'>
            <button className='px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200'>
              Log in
            </button>
            <button className='px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-700 hover:to-purple-700 hover:shadow-lg transition-all duration-200'>
              Sign up
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className='md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-200'
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
          <div className='md:hidden py-4 border-t border-gray-200'>
            <div className='flex flex-col space-y-3'>
              <button
                onClick={() => handleNavClick('features')}
                className='text-left px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium rounded-lg transition-colors duration-200'
              >
                Features
              </button>
              <button
                onClick={() => handleNavClick('workflow')}
                className='text-left px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium rounded-lg transition-colors duration-200'
              >
                How It Works
              </button>
              <button
                onClick={() => handleNavClick('use-cases')}
                className='text-left px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium rounded-lg transition-colors duration-200'
              >
                Use Cases
              </button>
              <button
                onClick={() => handleNavClick('pricing')}
                className='text-left px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium rounded-lg transition-colors duration-200'
              >
                Pricing
              </button>
              <div className='border-t border-gray-200 pt-3 mt-3'>
                <button className='w-full px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium rounded-lg transition-colors duration-200 text-left'>
                  Log in
                </button>
                <button className='w-full mt-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-700 hover:to-purple-700 hover:shadow-lg transition-all duration-200'>
                  Sign up
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
