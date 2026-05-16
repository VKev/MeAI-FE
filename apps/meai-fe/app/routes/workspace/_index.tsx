import { redirect } from 'react-router';

export async function loader() {
  return redirect('product');
}

export default function WorkspaceIndex() {
  return null;
}
