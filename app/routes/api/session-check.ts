import { checkSession } from '@/services/server/session.server';
import type { LoaderFunctionArgs } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
  const hasSession = await checkSession(request);
  return Response.json({ hasSession });
}
