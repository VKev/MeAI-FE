type Props = {
  isActive: boolean;
};

export default function SigninForm({ isActive }: Props) {
  return (
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
  );
}
