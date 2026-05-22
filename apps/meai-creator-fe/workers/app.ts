// Cloudflare Workers entrypoint for React Router v7 SSR.
//
// `@cloudflare/vite-plugin` + `@react-router/dev` synthesise the
// `virtual:react-router/server-build` module at build time: a bundle of every
// route's loader/action/default export that the request handler renders.
//
// The handler's second argument is exposed to every loader/action as `context`.
// Putting `cloudflare.env` + `cloudflare.ctx` there lets server-side code
// (config.server.ts, session.server.ts, etc.) read runtime bindings directly
// when needed — without that, they'd have no access to Workers secrets.

import { createRequestHandler } from 'react-router';
import process from 'node:process';

// Async import form (instead of `import * as build from ...`) is required by
// React Router v7 on Workers: workerd can't evaluate the full server bundle at
// module load because it contains route components with top-level side effects.
// The plugin handles code-splitting transparently when you pass a thunk.
const requestHandler = createRequestHandler(
  () => import('virtual:react-router/server-build'),
  import.meta.env.MODE
);

const DefaultEditorOrigin = 'https://editor.meaiplatform.io.vn';

function syncProcessEnv(env: Env) {
  for (const [key, value] of Object.entries(env)) {
    if (typeof value === 'string') {
      process.env[key] = value;
    }
  }
}

function isEditorRequest(url: URL) {
  return url.pathname === '/editor' || url.pathname.startsWith('/editor/');
}

function getEditorOrigin(env: Env) {
  const configured = env.VITE_EDITOR_URL || DefaultEditorOrigin;
  try {
    return new URL(configured).origin;
  } catch {
    return DefaultEditorOrigin;
  }
}

async function proxyEditorRequest(request: Request, env: Env) {
  const requestUrl = new URL(request.url);
  const editorOrigin = getEditorOrigin(env);
  const targetUrl = new URL(requestUrl.pathname + requestUrl.search, editorOrigin);
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.set('x-forwarded-host', requestUrl.host);
  headers.set('x-forwarded-proto', requestUrl.protocol.replace(':', ''));

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: 'manual'
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body;
  }

  const proxiedResponse = await fetch(new Request(targetUrl, init));
  const response = new Response(proxiedResponse.body, proxiedResponse);
  const location = response.headers.get('location');

  if (location) {
    try {
      const locationUrl = new URL(location, editorOrigin);
      if (locationUrl.origin === editorOrigin) {
        locationUrl.protocol = requestUrl.protocol;
        locationUrl.host = requestUrl.host;
        response.headers.set('location', locationUrl.toString());
      }
    } catch {
      // Leave non-URL Location headers untouched.
    }
  }

  return response;
}

export default {
  async fetch(request, env, ctx) {
    syncProcessEnv(env);

    const url = new URL(request.url);
    if (isEditorRequest(url)) {
      return proxyEditorRequest(request, env);
    }

    return requestHandler(request, {
      cloudflare: { env, ctx }
    });
  }
} satisfies ExportedHandler<Env>;

// Typed env bindings — mirror entries in wrangler.jsonc so TypeScript catches
// typos at edit time. Secrets (SESSION_SECRET) are declared but set via
// `wrangler secret put` or the dashboard, NOT in wrangler.jsonc.
declare global {
  interface Env {
    SESSION_SECRET: string;
    SESSION_EXPIRES_IN_DAYS: string;
    VITE_API_URL: string;
    VITE_STRIPE_PUBLISHABLE_KEY: string;
    VITE_GOOGLE_CLIENT_ID: string;
    VITE_EDITOR_URL?: string;
  }
}

// Augment react-router's AppLoadContext so loaders/actions see `context.cloudflare`.
declare module 'react-router' {
  interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}
