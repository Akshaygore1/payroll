import { redirect } from "next/navigation";

import { getDefaultPathForRole, getSession } from "@/lib/auth/session";

export default async function Home() {
  const session = await getSession();

  redirect(session ? getDefaultPathForRole(session.user.role) : "/sign-in");
}
