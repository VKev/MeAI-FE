import { redirect } from "react-router";

export async function loader() {
  return redirect("sign-in");
}

export default function AuthIndex() {
  return null;
}
