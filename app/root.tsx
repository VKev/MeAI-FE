import { isRouteErrorResponse, Link, Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';

import type { Route } from './+types/root';
import './app.css';

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous'
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap'
  },
  {
    rel: 'stylesheet',
    href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css',
    integrity: 'sha512-z3gLpd7yknf1YoNbCzqRKc4qyor8gaKU1qmn+CShxbuBusANI9QpRohGBreCFkKxLhei6S9CQXFEbbKuqLg0DA==',
    crossOrigin: 'anonymous'
  },
  { rel: 'icon', href: '/logo.ico', type: 'image/x-icon', sizes: '32x32' }
];

export function meta({}: Route.MetaArgs) {
  return [{ title: 'MeAI App' }, { name: 'description', content: 'Welcome to MeAI App!' }];
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <head>
        <meta charSet='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!';
  let details = 'An unexpected error occurred.';
  let statusCode: number | null = null;
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error';
    details = error.status === 404 ? 'The requested page could not be found.' : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 px-4'>
      <div className='max-w-lg w-full text-center bg-white rounded-2xl shadow-lg p-8'>
        {/* Status */}
        <div className='text-6xl font-extrabold text-red-500 mb-4'>{statusCode ?? '!'}</div>

        {/* Title */}
        <h1 className='text-2xl font-semibold text-gray-900 mb-2'>{message}</h1>

        {/* Description */}
        <p className='text-gray-600 mb-6'>{details}</p>

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

        {/* DEV stack trace */}
        {stack && (
          <div className='mt-6 text-left'>
            <p className='text-sm font-semibold text-gray-700 mb-2'>Stack trace (DEV only):</p>
            <pre className='text-xs bg-gray-100 rounded-lg p-4 overflow-x-auto text-red-600'>{stack}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
