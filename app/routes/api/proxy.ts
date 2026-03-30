import { proxyApiRequest } from '@/services/server/api-proxy.server';
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';

function getProxyPath(params: Record<string, string | undefined>) {
  const proxyPath = params['*'];

  if (!proxyPath) {
    throw new Response('Not Found', { status: 404 });
  }

  return proxyPath;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  return proxyApiRequest(request, getProxyPath(params));
}

export async function action({ request, params }: ActionFunctionArgs) {
  return proxyApiRequest(request, getProxyPath(params));
}
