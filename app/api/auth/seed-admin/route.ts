import { eq } from "drizzle-orm";

import { createAuth } from "@/lib/auth/server";
import { getDb } from "@/lib/db";
import { user } from "@/lib/db/schema";

type SeedAdminBody = {
  email?: unknown;
  password?: unknown;
  name?: unknown;
};

function jsonResponse(body: unknown, init: ResponseInit) {
  return Response.json(body, {
    ...init,
    headers: {
      "cache-control": "no-store",
      ...init.headers,
    },
  });
}

export async function POST(request: Request) {
  const seedToken = process.env.AUTH_SEED_TOKEN;
  const providedToken = request.headers.get("x-seed-token");

  if (!seedToken || providedToken !== seedToken) {
    return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const existingUser = await db.select({ id: user.id }).from(user).limit(1);

  if (existingUser.length > 0) {
    return jsonResponse({ error: "An initial user already exists" }, { status: 409 });
  }

  const body = (await request.json().catch(() => null)) as SeedAdminBody | null;
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!email || !password || !name) {
    return jsonResponse(
      { error: "email, password, and name are required" },
      { status: 400 },
    );
  }

  const auth = createAuth({ disableSignUp: false });
  const result = await auth.api.signUpEmail({
    body: {
      email,
      password,
      name,
    },
  });

  await db.update(user).set({ role: "admin" }).where(eq(user.id, result.user.id));

  return jsonResponse(
    { user: { id: result.user.id, email: result.user.email, role: "admin" } },
    { status: 201 },
  );
}
