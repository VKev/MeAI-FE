import { redirect } from 'react-router';

export async function loader() {
  return redirect('onboarding');
}

export default function UserIndex() {
  return null;
}
