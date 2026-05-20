import { redirect } from 'react-router';

export function loader() {
  return redirect('/editor');
}

export default function EditorRedirect() {
  return null;
}
