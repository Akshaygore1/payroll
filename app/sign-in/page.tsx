import { redirect } from "next/navigation";

import { SignInForm } from "@/components/auth/sign-in-form";
import { APP_NAME } from "@/lib/app-config";
import { getDefaultPathForRole, getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function SignInPage() {
  const session = await getSession();

  if (session) {
    redirect(getDefaultPathForRole(session.user.role));
  }

  return (
    <main className="grid min-h-screen bg-[radial-gradient(circle_at_top_left,var(--muted),transparent_32rem)] px-6 py-12">
      <section className="mx-auto flex w-full max-w-md flex-col justify-center">
        <div className="border bg-card p-8 shadow-[12px_12px_0_var(--border)]">
          <div className="mb-8 flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              {APP_NAME}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
            <p className="text-sm text-muted-foreground">
              Secure access for payroll administrators and school accounts.
            </p>
          </div>
          <SignInForm />
          <div className="mt-6 border-t pt-4 text-xs text-muted-foreground">
            Use your assigned credentials. Public sign up is disabled.
          </div>
        </div>
      </section>
    </main>
  );
}
