import { redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { getDefaultPathForRole, requireSession } from "@/lib/auth/session";

export default async function DashboardPage() {
  const session = await requireSession();

  if (session.user.role !== "admin") {
    redirect(getDefaultPathForRole(session.user.role));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back${session.user.name ? `, ${session.user.name}` : ""}. Review the current workspace and continue into your main admin flows.`}
      />
    </div>
  );
}
