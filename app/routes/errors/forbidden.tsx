import { Link } from 'react-router';

export default function Forbidden() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-slate-800 px-4'>
      <div className='text-center'>
        <div className='mb-8'>
          <h1 className='text-9xl font-bold text-transparent bg-clip-text bg-linear-to-r from-red-500 to-pink-500 mb-2'>
            403
          </h1>
          <h2 className='text-4xl font-bold text-white mb-4'>Access Forbidden</h2>
          <p className='text-xl text-slate-400 mb-8'>You don't have permission to access this resource.</p>
        </div>

        <div className='flex flex-col sm:flex-row gap-4 justify-center'>
          <Link
            to='/'
            className='px-8 py-3 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all'
          >
            Back to Home
          </Link>
          {/* <Link
            to="/auth/sign-in"
            className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-all"
          >
            Sign In
          </Link> */}
        </div>
      </div>
    </div>
  );
}
