import { destroySession, getSession } from "@/services/server/session.server";
import type { ActionFunctionArgs } from "react-router";

export async function action({ request }: ActionFunctionArgs) {
  const session = await getSession(request);
  return await destroySession(session);
}