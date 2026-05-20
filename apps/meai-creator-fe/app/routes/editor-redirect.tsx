import { redirect } from 'react-router';

export function loader() {
  return redirect('/user/editor/');
}

export default function EditorRedirect() {
  return null;
}