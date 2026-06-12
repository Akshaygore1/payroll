import { redirect } from "next/navigation";

import { getDefaultPathForRole, requireSession } from "@/lib/auth/session";

export default async function DashboardPage() {
  const session = await requireSession();

  if (session.user.role !== "admin") {
    redirect(getDefaultPathForRole(session.user.role));
  }

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome back{session?.user.name ? `, ${session.user.name}` : ""}. This
        dashboard is protected by Better Auth.
      </p>
    </div>
  );
}
