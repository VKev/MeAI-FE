import { Link } from 'react-router';

export default function ServerError() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-slate-800 px-4'>
      <div className='max-w-lg w-full text-center bg-white rounded-2xl shadow-lg p-8'>
        {/* Status */}
        <div className='text-6xl font-extrabold text-red-500 mb-4'>500</div>

        {/* Title */}
        <h1 className='text-2xl font-semibold text-gray-900 mb-2'>Server Error</h1>

        {/* Description */}
        <p className='text-gray-600 mb-6'>An unexpected error occurred on the server.</p>

        {/* Actions */}
        <div className='flex justify-center gap-4'>
          <Link
            to='/'
            className='inline-flex items-center px-5 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition'
          >
            Go Home
          </Link>

          <button
            onClick={() => window.location.reload()}
            className='inline-flex items-center px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 transition'
          >
            Reload
          </button>
        </div>
      </div>
    </div>
  );
}
