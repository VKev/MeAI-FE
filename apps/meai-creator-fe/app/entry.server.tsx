// Cloudflare Workers SSR entrypoint for React Router v7.
//
// The default entry.server.tsx that `@react-router/dev` synthesizes uses
// `renderToPipeableStream` from `react-dom/server` — that's a Node-streams
// API that bundles `node:stream` internals. Workers (workerd) doesn't have
// Node streams, which is why the raw default blew up with
// `ReferenceError: module is not defined` at request time.
//
// Replacing it with `renderToReadableStream` (Web Streams API) gives us the
// same progressive HTML streaming while staying in Workers-compatible land.

import type { AppLoadContext, EntryContext } from 'react-router';
import { ServerRouter } from 'react-router';
import { isbot } from 'isbot';
import { renderToReadableStream } from 'react-dom/server';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: AppLoadContext
) {
  let status = responseStatusCode;
  let shellRendered = false;
  const userAgent = request.headers.get('user-agent');

  const body = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      onError(error: unknown) {
        status = 500;
        // Log early render failures too; Workers otherwise returns a blank
        // 500 response with no useful local signal during development.
        console.error(error);
      }
    }
  );
  shellRendered = true;

  // For bot user-agents (search engine crawlers, link previewers) and for SPA
  // renders, wait for all content so the crawled HTML is complete. Humans get
  // the progressive stream.
  if ((userAgent && isbot(userAgent)) || routerContext.isSpaMode) {
    await body.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  return new Response(body, {
    headers: responseHeaders,
    status
  });
}
