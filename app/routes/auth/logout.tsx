import { logoutAction } from '@/services/server/auth.server';
import { redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';

export async function action({ request }: ActionFunctionArgs) {
  return logoutAction(request);
}

export async function loader({}: LoaderFunctionArgs) {
  return redirect('/auth/sign-in');
}

export default function Logout() {
  return null;
}
