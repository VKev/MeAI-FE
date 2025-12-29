type Props = {
  isActive: boolean;
};

export default function SignupForm({ isActive }: Props) {
  return (
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
  );
}
