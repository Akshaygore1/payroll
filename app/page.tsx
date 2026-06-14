import { redirect } from "next/navigation";

import { getDefaultPathForRole } from "@/lib/auth/roles";
import { getSession } from "@/lib/auth/session";

export default async function Home() {
  const session = await getSession();

  redirect(session ? getDefaultPathForRole(session.user.role) : "/sign-in");
}
