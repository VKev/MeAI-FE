import { redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';
import { logout } from '@/services/session.server';

export async function action({ request }: ActionFunctionArgs) {
  return logout(request);
}

export async function loader({}: LoaderFunctionArgs) {
  return redirect('/auth/sign-in');
}

export default function Logout() {
  return null;
}
