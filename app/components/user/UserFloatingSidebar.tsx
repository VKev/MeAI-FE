import { useState } from 'react';
import { 
  Home, 
  Grid3x3, 
  Image, 
  Film, 
  Zap, 
  Wand2, 
  Infinity, 
  Gem, 
  Settings, 
  Rocket,
  Sparkles,
  MoreHorizontal 
} from 'lucide-react';
import { Link, useLocation } from 'react-router';

export default function UserFloatingSidebar() {
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === '/user' && location.pathname === '/user') return true;
    if (href !== '/user' && location.pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <div className='fixed bottom-0 left-0 z-50 hidden h-screen py-3 pl-3 md:flex'>
      <div className='relative h-full w-18'>
        {/* SVG Filter Definition */}
        <svg className='hidden'>
          <defs>
            <filter id='glass-blur' x='0' y='0' width='100%' height='100%' filterUnits='objectBoundingBox'>
              <feTurbulence type='fractalNoise' baseFrequency='0.003 0.007' numOctaves='1' result='turbulence' />
              <feDisplacementMap in='SourceGraphic' in2='turbulence' scale='200' xChannelSelector='R' yChannelSelector='G' />
            </filter>
          </defs>
        </svg>

        {/* Glass-morphism Container */}
        <div className='pointer-events-none relative h-full bg-[#0a0a0a]/50' style={{ borderRadius: '16px' }}>
          {/* Backdrop Blur Layer */}
          <div 
            className='absolute inset-0 backdrop-blur-xl pointer-events-none z-0' 
            style={{ 
              borderRadius: '16px',
              filter: 'url(#glass-blur)'
            }}
          />
          
          {/* Shadow Layer */}
          <div 
            className='pointer-events-none absolute inset-0 z-10' 
            style={{ 
              borderRadius: '16px',
              boxShadow: 'rgba(0, 0, 0, 0.05) 0px 4px 4px, rgba(0, 0, 0, 0.05) 0px 0px 12px'
            }}
          />
          
          {/* Inner Glow Layer */}
          <div 
            className='pointer-events-none absolute inset-0 z-20' 
            style={{ 
              borderRadius: '16px',
              boxShadow: 'rgba(255, 255, 255, 0.1) 1px 1px 1px 0px inset, rgba(255, 255, 255, 0.1) -1px -1px 1px 0px inset'
            }}
          />

          {/* Content Layer */}
          <div className='pointer-events-auto relative z-30 h-full'>
            <div className='relative flex h-full flex-col justify-between px-2 py-4'>
              {/* Navigation Content */}
              <div className='h-full overflow-hidden p-1'>
                <nav aria-label='Main navigation'>
                  {/* Logo */}
                  <div className='mb-3 flex justify-center'>
                    <Link 
                      to='/user/dashboard'
                      aria-label='MeAI Home' 
                      title='Go to MeAI Home' 
                      className='ring-offset-background focus-visible:ring-ring rounded-3xl p-2 transition duration-120 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-none'
                    >
                      <img src='/logo.png' alt='Logo' className='h-9 w-9 rounded-full' />
                    </Link>
                  </div>

                  {/* Main Navigation Items */}
                  <ul className='flex flex-col items-center gap-2 text-xs'>
                    {/* Home */}
                    <li className='w-full'>
                      <Link
                        to='/user/dashboard'
                        className={`ring-offset-background focus-visible:ring-ring mx-auto flex h-auto w-full flex-col items-center gap-0.5 rounded-3xl py-2 text-[0.6875rem] font-medium whitespace-nowrap transition duration-120 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-none hover:bg-white/10 ${
                          isActive('/user/dashboard') ? 'bg-white/10' : ''
                        }`}
                      >
                        <Home className='size-5' />
                        <span>Home</span>
                      </Link>
                    </li>

                    {/* Library */}
                    <li className='w-full'>
                      <Link
                        to='/user/library'
                        className={`ring-offset-background focus-visible:ring-ring mx-auto flex h-auto w-full flex-col items-center gap-0.5 rounded-3xl py-2 text-[0.6875rem] font-medium whitespace-nowrap transition duration-120 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-none hover:bg-white/10 ${
                          isActive('/user/library') ? 'bg-white/10' : ''
                        }`}
                      >
                        <Grid3x3 className='size-5' />
                        <span>Library</span>
                      </Link>
                    </li>

                    {/* Image */}
                    <li className='w-full'>
                      <Link
                        to='/user/image'
                        className={`ring-offset-background focus-visible:ring-ring mx-auto flex h-auto w-full flex-col items-center gap-0.5 rounded-3xl py-2 text-[0.6875rem] font-medium whitespace-nowrap transition duration-120 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-none hover:bg-white/10 ${
                          isActive('/user/image') ? 'bg-white/10' : ''
                        }`}
                      >
                        <Image className='size-5' />
                        <span>Image</span>
                      </Link>
                    </li>

                    {/* Video */}
                    <li className='w-full'>
                      <Link
                        to='/user/video'
                        className={`ring-offset-background focus-visible:ring-ring mx-auto flex h-auto w-full flex-col items-center gap-0.5 rounded-3xl py-2 text-[0.6875rem] font-medium whitespace-nowrap transition duration-120 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-none hover:bg-white/10 ${
                          isActive('/user/video') ? 'bg-white/10' : ''
                        }`}
                      >
                        <Film className='size-5' />
                        <span>Video</span>
                      </Link>
                    </li>

                    {/* Blueprints */}
                    <li className='w-full'>
                      <Link
                        to='/user/blueprints'
                        className={`ring-offset-background focus-visible:ring-ring mx-auto flex h-auto w-full flex-col items-center gap-0.5 rounded-3xl py-2 text-[0.6875rem] font-medium whitespace-nowrap transition duration-120 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-none hover:bg-white/10 ${
                          isActive('/user/blueprints') ? 'bg-white/10' : ''
                        }`}
                      >
                        <Zap className='size-5' />
                        <span>Blueprints</span>
                      </Link>
                    </li>

                    {/* Upscaler */}
                    <li className='w-full'>
                      <Link
                        to='/user/upscaler'
                        className={`ring-offset-background focus-visible:ring-ring mx-auto flex h-auto w-full flex-col items-center gap-0.5 rounded-3xl py-2 text-[0.6875rem] font-medium whitespace-nowrap transition duration-120 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-none hover:bg-white/10 ${
                          isActive('/user/upscaler') ? 'bg-white/10' : ''
                        }`}
                      >
                        <Wand2 className='size-5' />
                        <span>Upscaler</span>
                      </Link>
                    </li>

                    {/* Flow State */}
                    <li className='w-full'>
                      <Link
                        to='/user/flow-state'
                        className={`ring-offset-background focus-visible:ring-ring mx-auto flex h-auto w-full flex-col items-center gap-0.5 rounded-3xl py-2 text-[0.6875rem] font-medium whitespace-nowrap transition duration-120 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-none hover:bg-white/10 ${
                          isActive('/user/flow-state') ? 'bg-white/10' : ''
                        }`}
                      >
                        <Infinity className='size-5' />
                        <span>Flow State</span>
                      </Link>
                    </li>

                    {/* Divider */}
                    <li className='w-full'>
                      <hr className='mx-auto h-px w-full max-w-6 bg-white/25' />
                    </li>

                    {/* Plans */}
                    <li className='w-full'>
                      <Link
                        to='/user/plans'
                        className={`ring-offset-background focus-visible:ring-ring mx-auto flex h-auto w-full flex-col items-center gap-0.5 rounded-3xl py-2 text-[0.6875rem] font-medium whitespace-nowrap transition duration-120 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-none hover:bg-white/10 ${
                          isActive('/user/plans') ? 'bg-white/10' : ''
                        }`}
                      >
                        <Gem className='size-5' />
                        <span>Plans</span>
                      </Link>
                    </li>

                    {/* API */}
                    <li className='w-full'>
                      <Link
                        to='/user/api'
                        className={`ring-offset-background focus-visible:ring-ring mx-auto flex h-auto w-full flex-col items-center gap-0.5 rounded-3xl py-2 text-[0.6875rem] font-medium whitespace-nowrap transition duration-120 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-none hover:bg-white/10 ${
                          isActive('/user/api') ? 'bg-white/10' : ''
                        }`}
                      >
                        <Settings className='size-5' />
                        <span>API</span>
                      </Link>
                    </li>

                    {/* What's New */}
                    <li className='w-full'>
                      <Link
                        to='/user/changelog'
                        className={`ring-offset-background focus-visible:ring-ring mx-auto flex h-auto w-full flex-col items-center gap-0.5 rounded-3xl py-2 text-[0.6875rem] font-medium whitespace-nowrap transition duration-120 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-none hover:bg-white/10 ${
                          isActive('/user/changelog') ? 'bg-white/10' : ''
                        }`}
                      >
                        <Rocket className='size-5' />
                        <span>What's new</span>
                      </Link>
                    </li>
                  </ul>
                </nav>
              </div>

              {/* Bottom Section */}
              <div>
                {/* More Button */}
                <button className='mx-auto flex h-auto w-full flex-col items-center gap-0.5 rounded-3xl py-2 text-[0.6875rem] font-medium whitespace-nowrap transition duration-120 hover:bg-white/10 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-none'>
                  <MoreHorizontal className='size-5' />
                  <span>More</span>
                </button>

                {/* Auth Buttons */}
                <div className='flex w-full items-center justify-center' style={{ minHeight: '4.5rem' }}>
                  <div className='flex w-full flex-col gap-2'>
                    <Link
                      to='/auth/sign-up'
                      className='relative inline-flex items-center justify-center border font-medium whitespace-nowrap transition duration-120 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-hidden border-transparent bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white h-6 gap-1 px-1.5 py-1 text-xs rounded-full'
                    >
                      Sign Up
                    </Link>
                    <Link
                      to='/auth/sign-in'
                      className='relative inline-flex items-center justify-center border font-medium whitespace-nowrap transition duration-120 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-hidden border-white/20 bg-transparent hover:bg-white/10 text-white h-6 gap-1 px-1.5 py-1 text-xs rounded-full'
                    >
                      Sign In
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
