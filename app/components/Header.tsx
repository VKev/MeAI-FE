import { StartFreeTrialButton } from './StartFreeTrialButton';

<<<<<<< Updated upstream
const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId);
  if (element) {
    const headerHeight = 64;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
=======
// Scroll to section functionality - commented out for future use
// const scrollToSection = (sectionId: string) => {
//   const element = document.getElementById(sectionId);
//   if (element) {
//     const headerHeight = 80; // Tăng lên để match với header cao hơn
//     const elementPosition = element.getBoundingClientRect().top;
//     const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
>>>>>>> Stashed changes

//     window.scrollTo({
//       top: offsetPosition,
//       behavior: 'smooth'
//     });
//   }
// };

export function Header() {
<<<<<<< Updated upstream
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <img src="/logo.png" alt="MeAI" className="h-40 w-auto" />
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <button
=======
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Handle navigation click - commented out for future use
  // const handleNavClick = (sectionId: string) => {
  //   scrollToSection(sectionId);
  //   setIsMenuOpen(false); // Đóng menu sau khi click
  // };

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
            {/* Scroll to section - commented out for future use */}
            {/* <button
>>>>>>> Stashed changes
              onClick={() => scrollToSection('features')}
              className="text-gray-700 hover:text-gray-900 font-medium"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('workflow')}
              className="text-gray-700 hover:text-gray-900 font-medium"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('use-cases')}
              className="text-gray-700 hover:text-gray-900 font-medium"
            >
              Use Cases
<<<<<<< Updated upstream
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="text-gray-700 hover:text-gray-900 font-medium"
=======
            </button> */}

            {/* Page Navigation */}
            <Link
              to='/about'
              className='text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200'
            >
              About
            </Link>
            <Link
              to='/contact'
              className='text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200'
            >
              Contact
            </Link>
            <Link
              to='/pricing'
              className='text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200'
>>>>>>> Stashed changes
            >
              Pricing
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <button className="hidden md:block px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-700 hover:to-purple-700 hover:shadow-lg transition-all duration-200">
              Sign up
            </button>
            <button className="hidden md:block text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200">
              Log in
            </button>
          </div>
        </div>
<<<<<<< Updated upstream
=======

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className='md:hidden py-4 border-t border-gray-200'>
            <div className='flex flex-col space-y-3'>
              {/* Scroll to section - commented out for future use */}
              {/* <button
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
              </button> */}

              {/* Page Navigation */}
              <Link
                to='/about'
                onClick={() => setIsMenuOpen(false)}
                className='text-left px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium rounded-lg transition-colors duration-200'
              >
                About
              </Link>
              <Link
                to='/contact'
                onClick={() => setIsMenuOpen(false)}
                className='text-left px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium rounded-lg transition-colors duration-200'
              >
                Contact
              </Link>
              <Link
                to='/pricing'
                onClick={() => setIsMenuOpen(false)}
                className='text-left px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium rounded-lg transition-colors duration-200'
              >
                Pricing
              </Link>
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
>>>>>>> Stashed changes
      </nav>
    </header>
  );
}

