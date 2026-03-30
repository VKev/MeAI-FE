import envConfig from '@/config';

const API_URL = envConfig.VITE_API_URL;

const REQUEST_HEADER_BLOCKLIST = new Set([
  'accept-encoding',
  'connection',
  'content-length',
  'host',
  'origin',
  'referer',
  'transfer-encoding',
]);

const RESPONSE_HEADER_BLOCKLIST = new Set([
  'connection',
  'content-length',
  'content-encoding',
  'set-cookie',
  'transfer-encoding',
]);

const METHODS_WITHOUT_BODY = new Set(['GET', 'HEAD']);
const NGROK_HOST_PATTERN = /(^|\.)ngrok(?:-free)?\.(?:app|dev|io)$/i;

function buildBackendUrl(proxyPath: string, requestUrl: string) {
  const incomingUrl = new URL(requestUrl);
  const backendUrl = new URL(API_URL);
  const basePath = backendUrl.pathname.replace(/\/$/, '');

  backendUrl.pathname = `${basePath}/api/${proxyPath}`.replace(/\/{2,}/g, '/');
  backendUrl.search = incomingUrl.search;

  return backendUrl;
}

function isNgrokHost(hostname: string) {
  return NGROK_HOST_PATTERN.test(hostname);
}

function buildRequestHeaders(request: Request, targetUrl: URL) {
  const headers = new Headers();
  const shouldSkipNgrokWarning = isNgrokHost(targetUrl.hostname);

  for (const [key, value] of request.headers.entries()) {
    const normalizedKey = key.toLowerCase();

    if (REQUEST_HEADER_BLOCKLIST.has(normalizedKey) || normalizedKey.startsWith('sec-')) {
      continue;
    }

    if (shouldSkipNgrokWarning && normalizedKey === 'user-agent') {
      continue;
    }

    headers.append(key, value);
  }

  if (shouldSkipNgrokWarning) {
    headers.set('ngrok-skip-browser-warning', 'true');
  }

  return headers;
}

function buildResponseHeaders(response: Response) {
  const headers = new Headers();

  for (const [key, value] of response.headers.entries()) {
    const normalizedKey = key.toLowerCase();

    if (RESPONSE_HEADER_BLOCKLIST.has(normalizedKey)) {
      continue;
    }

    headers.append(key, value);
  }

  const getSetCookie = (response.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  const setCookies = typeof getSetCookie === 'function' ? getSetCookie.call(response.headers) : [];

  if (setCookies.length > 0) {
    setCookies.forEach((cookie) => headers.append('Set-Cookie', cookie));
  } else {
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      headers.append('Set-Cookie', setCookie);
    }
  }

  return headers;
}

export async function proxyApiRequest(request: Request, proxyPath: string) {
  const targetUrl = buildBackendUrl(proxyPath, request.url);
  const init: RequestInit = {
    method: request.method,
    headers: buildRequestHeaders(request, targetUrl),
    redirect: 'manual',
    signal: request.signal,
  };

  if (!METHODS_WITHOUT_BODY.has(request.method.toUpperCase())) {
    init.body = await request.arrayBuffer();
  }

  try {
    const response = await fetch(targetUrl, init);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: buildResponseHeaders(response),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Proxy request failed';

    return Response.json(
      { message: 'Backend request failed', detail: message },
      { status: 502 }
    );
  }
}
