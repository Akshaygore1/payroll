import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createAuth } from "@/lib/auth/server";
import { getDefaultPathForRole } from "@/lib/auth/roles";

export async function getSession() {
  return createAuth().api.getSession({
    headers: await headers(),
  });
}

export async function requireSession() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  return session;
}

export async function requireAdminSession() {
  const session = await requireSession();

  if (session.user.role !== "admin") {
    redirect(getDefaultPathForRole(session.user.role));
  }

  return session;
}

export async function requireSchoolSession() {
  const session = await requireSession();

  if (session.user.role !== "school") {
    redirect(getDefaultPathForRole(session.user.role));
  }

  return session;
}
