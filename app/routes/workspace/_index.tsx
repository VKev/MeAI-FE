import { redirect } from 'react-router';

export async function loader() {
  return redirect('dashboard');
}

export default function WorkspaceIndex() {
  return null;
}
