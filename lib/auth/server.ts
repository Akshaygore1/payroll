import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins/admin";

import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { APP_NAME } from "@/lib/app-config";

type CreateAuthOptions = {
  disableSignUp?: boolean;
};

export function createAuth(options: CreateAuthOptions = {}) {
  const disableSignUp = options.disableSignUp ?? true;

  return betterAuth({
    appName: APP_NAME,
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema,
    }),
    emailAndPassword: {
      enabled: true,
      disableSignUp,
      minPasswordLength: 8,
    },
    advanced: {
      ipAddress: {
        ipAddressHeaders: ["x-forwarded-for", "x-real-ip"],
      },
    },
    plugins: [
      admin({
        adminRoles: ["admin"],
        defaultRole: "user",
      }),
      nextCookies(),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
export type Session = Awaited<ReturnType<Auth["api"]["getSession"]>>;
