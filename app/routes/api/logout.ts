import { destroySession, getSession } from "@/services/server/session.server";
import { redirect, type ActionFunctionArgs } from "react-router";

export async function action({ request }: ActionFunctionArgs) {
  const session = await getSession(request);
  const headers = new Headers();

  headers.append(
    "Set-Cookie",
    await destroySession(session)
  );

  return redirect("/", { headers });
}