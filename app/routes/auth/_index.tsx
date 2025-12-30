import { redirect } from "react-router";

export async function loader() {
  return redirect("signin");
}

export default function AuthIndex() {
  return null;
}
