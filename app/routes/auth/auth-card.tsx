import { useNavigate } from 'react-router';

type AuthMode = 'signin' | 'signup';

export function AuthCard({ mode }: { mode: AuthMode }) {
  const navigate = useNavigate();

  const isActive = mode === 'signup';

  const goSignup = () => navigate('/auth/signup');
  const goLogin = () => navigate('/auth/signin');

  return (
    <div className='relative bg-white rounded-[30px] shadow-[0_5px_15px_rgba(0,0,0,0.35)] overflow-hidden w-3xl max-w-full min-h-120'>
      {/* Sign Up Form */}
      <div
        className={`absolute top-0 h-full w-1/2 left-0 transition-all duration-600 ease-in-out ${
          isActive ? 'translate-x-full opacity-100 z-5' : 'translate-x-0 opacity-0 z-1 invisible'
        }`}
      >
        <form className='bg-white flex items-center justify-center flex-col px-10 h-full'>
          <h1 className='text-3xl font-bold mb-4'>Create account</h1>
          <div className='flex gap-3 my-5'>
            <a
              href='#'
              className='border border-gray-300 rounded-[20%] inline-flex justify-center items-center w-10 h-10 hover:border-gray-400 transition-colors'
            >
              <i className='fa-brands fa-google-plus-g'></i>
            </a>
            <a
              href='#'
              className='border border-gray-300 rounded-[20%] inline-flex justify-center items-center w-10 h-10 hover:border-gray-400 transition-colors'
            >
              <i className='fa-brands fa-facebook-f'></i>
            </a>
            <a
              href='#'
              className='border border-gray-300 rounded-[20%] inline-flex justify-center items-center w-10 h-10 hover:border-gray-400 transition-colors'
            >
              <i className='fa-brands fa-github'></i>
            </a>
            <a
              href='#'
              className='border border-gray-300 rounded-[20%] inline-flex justify-center items-center w-10 h-10 hover:border-gray-400 transition-colors'
            >
              <i className='fa-brands fa-linkedin-in'></i>
            </a>
          </div>
          <span className='text-xs mb-2'>or use your email for registration</span>
          <input
            type='text'
            placeholder='Name'
            className='bg-gray-300 border-none my-2 px-4 py-2.5 text-sm rounded-lg w-full outline-none'
          />
          <input
            type='email'
            placeholder='Email'
            className='bg-gray-300 border-none my-2 px-4 py-2.5 text-sm rounded-lg w-full outline-none'
          />
          <input
            type='password'
            placeholder='Password'
            className='bg-gray-300 border-none my-2 px-4 py-2.5 text-sm rounded-lg w-full outline-none'
          />
          <button
            type='button'
            className='bg-[#512da8] text-white text-xs px-11 py-2.5 border border-transparent rounded-lg font-semibold tracking-wide uppercase mt-2.5 cursor-pointer hover:bg-[#673ab7] transition-colors'
          >
            Sign Up
          </button>
        </form>
      </div>

      {/* Sign In Form */}
      <div
        className={`absolute top-0 h-full w-1/2 left-0 transition-all duration-600 ease-in-out ${
          isActive ? 'translate-x-full z-5 opacity-0 invisible' : 'translate-x-0 z-2 opacity-100'
        }`}
      >
        <form className='bg-white flex items-center justify-center flex-col px-10 h-full'>
          <h1 className='text-3xl font-bold mb-4'>Sign in</h1>
          <div className='flex gap-3 my-5'>
            <a
              href='#'
              className='border border-gray-300 rounded-[20%] inline-flex justify-center items-center w-10 h-10 hover:border-gray-400 transition-colors'
            >
              <i className='fa-brands fa-google-plus-g'></i>
            </a>
            <a
              href='#'
              className='border border-gray-300 rounded-[20%] inline-flex justify-center items-center w-10 h-10 hover:border-gray-400 transition-colors'
            >
              <i className='fa-brands fa-facebook-f'></i>
            </a>
            <a
              href='#'
              className='border border-gray-300 rounded-[20%] inline-flex justify-center items-center w-10 h-10 hover:border-gray-400 transition-colors'
            >
              <i className='fa-brands fa-github'></i>
            </a>
            <a
              href='#'
              className='border border-gray-300 rounded-[20%] inline-flex justify-center items-center w-10 h-10 hover:border-gray-400 transition-colors'
            >
              <i className='fa-brands fa-linkedin-in'></i>
            </a>
          </div>
          <span className='text-xs mb-2'>or use your email password</span>
          <input
            type='email'
            placeholder='Email'
            className='bg-gray-300 border-none my-2 px-4 py-2.5 text-sm rounded-lg w-full outline-none'
          />
          <input
            type='password'
            placeholder='Password'
            className='bg-gray-300 border-none my-2 px-4 py-2.5 text-sm rounded-lg w-full outline-none'
          />
          <a href='' className='text-[#333] text-xs my-4'>
            Forget your password
          </a>
          <button
            type='button'
            className='bg-[#512da8] text-white text-xs px-11 py-2.5 border border-transparent rounded-lg font-semibold tracking-wide uppercase mt-2.5 cursor-pointer hover:bg-[#673ab7] transition-colors'
          >
            Sign In
          </button>
        </form>
      </div>

      {/* Toggle Container */}
      <div
        className={`absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-all duration-600 ease-in-out z-1000 ${
          isActive ? '-translate-x-full rounded-r-[150px] rounded-br-[100px]' : 'rounded-l-[150px] rounded-bl-[100px]'
        }`}
      >
        <div
          className={`bg-linear-to-r from-blue-600 to-purple-600 h-full text-white relative -left-full w-[200%] transition-all duration-600 ease-in-out ${
            isActive ? 'translate-x-1/2' : 'translate-x-0'
          }`}
        >
          <div
            className={`absolute left-0 w-1/2 h-full flex items-center justify-center flex-col px-8 text-center top-0 transition-transform duration-600 ease-in-out ${
              isActive ? 'translate-x-0' : '-translate-x-[200%]'
            }`}
          >
            <h1 className='text-3xl font-bold mb-4'>Welcome back!</h1>
            <p className='text-sm leading-5 tracking-wide my-5'>
              Enter your personal details to use all of site features
            </p>
            <button
              className='bg-transparent text-white text-xs px-11 py-2.5 border border-white rounded-lg font-semibold tracking-wide uppercase mt-2.5 cursor-pointer hover:bg-white/10 transition-colors'
              onClick={goLogin}
              type='button'
            >
              Sign In
            </button>
          </div>
          <div
            className={`absolute right-0 w-1/2 h-full flex items-center justify-center flex-col px-8 text-center top-0 transition-transform duration-600 ease-in-out ${
              isActive ? 'translate-x-[200%]' : 'translate-x-0'
            }`}
          >
            <h1 className='text-3xl font-bold mb-4'>Hello there!</h1>
            <p className='text-sm leading-5 tracking-wide my-5'>
              Register with your personal details to use all of site features
            </p>
            <button
              className='bg-transparent text-white text-xs px-11 py-2.5 border border-white rounded-lg font-semibold tracking-wide uppercase mt-2.5 cursor-pointer hover:bg-white/10 transition-colors'
              onClick={goSignup}
              type='button'
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
