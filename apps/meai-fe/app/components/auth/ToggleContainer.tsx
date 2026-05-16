import { Link, useNavigate } from 'react-router';
import bg from '/bg_auth_meai.png';

export default function ToggleContainer({ isActive }: { isActive: boolean }) {
  const navigate = useNavigate();

  const goSignup = () => navigate('/auth/sign-up');
  const goLogin = () => navigate('/auth/sign-in');
  return (
    <div
      className={`absolute left-1/2 top-0 z-20 hidden h-full w-1/2 overflow-hidden transition-all duration-500 ease-out md:block ${
        isActive ? '-translate-x-full rounded-r-[38px]' : 'rounded-l-[38px]'
      }`}
    >
      <div
        className={`relative -left-full h-full w-[200%] text-white transition-all duration-500 ease-out ${
          isActive ? 'translate-x-1/2' : 'translate-x-0'
        }`}
        style={{
          backgroundImage: `linear-gradient(132deg, rgba(8, 10, 20, 0.86), rgba(22, 18, 34, 0.64)), url(${bg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div
          className={`absolute left-0 top-0 flex h-full w-1/2 translate-x-0 flex-col items-center justify-center px-10 text-center transition-transform duration-500 ease-out ${
            isActive ? 'translate-x-0' : '-translate-x-[200%]'
          }`}
        >
          <Link to='/' className='absolute top-8 flex items-center justify-center transition-opacity hover:opacity-90'>
            <img src='/logo-meai.webp' alt='MeAI' className='h-14 w-auto lg:h-16' />
          </Link>
          <p className='mb-3 inline-flex items-center rounded-full border border-white/20 bg-white/8 px-3 py-1 text-[11px] font-semibold tracking-[0.12em] text-white/75 uppercase'>
            Returning user
          </p>
          <h1 className='mb-4 text-4xl leading-tight font-semibold tracking-tight'>Welcome back</h1>
          <p className='my-5 max-w-[280px] text-sm leading-6 text-white/72'>
            Sign in with your account and continue building campaigns in minutes.
          </p>
          <button
            className='mt-2.5 cursor-pointer rounded-xl border border-white/28 bg-white/6 px-8 py-3 text-xs font-semibold tracking-[0.14em] text-white uppercase transition-colors hover:bg-white/12'
            onClick={goLogin}
            type='button'
          >
            Sign In
          </button>
        </div>
        <div
          className={`absolute right-0 top-0 flex h-full w-1/2 flex-col items-center justify-center px-10 text-center transition-transform duration-500 ease-out ${
            isActive ? 'translate-x-[200%]' : 'translate-x-0'
          }`}
        >
          <Link to='/' className='absolute top-8 flex items-center justify-center transition-opacity hover:opacity-90'>
            <img src='/logo-meai.webp' alt='MeAI' className='h-14 w-auto lg:h-16' />
          </Link>
          <p className='mb-3 inline-flex items-center rounded-full border border-white/20 bg-white/8 px-3 py-1 text-[11px] font-semibold tracking-[0.12em] text-white/75 uppercase'>
            New here
          </p>
          <h1 className='mb-4 text-4xl leading-tight font-semibold tracking-tight'>Create your space</h1>
          <p className='my-5 max-w-[280px] text-sm leading-6 text-white/72'>
            Open an account to generate content, publish faster, and scale with automation.
          </p>
          <button
            className='mt-2.5 cursor-pointer rounded-xl border border-white/28 bg-white/6 px-8 py-3 text-xs font-semibold tracking-[0.14em] text-white uppercase transition-colors hover:bg-white/12'
            onClick={goSignup}
            type='button'
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}
