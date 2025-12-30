import { useNavigate } from 'react-router';

export default function ToggleContainer({ isActive }: { isActive: boolean }) {
  const navigate = useNavigate();

  const goSignup = () => navigate('/auth/signup');
  const goLogin = () => navigate('/auth/signin');
  return (
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
  );
}
