import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "mysql",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3002",
  trustedOrigins: ["http://localhost:3002", "http://127.0.0.1:3002"],
  advanced: {
    generateId: () => {
      return `user_${Math.random().toString(36).substring(2, 15)}${Date.now()}`;
    },
    crossSubDomainCookies: {
      enabled: false,
    },
    disableCSRFCheck: true, // Disable CSRF check for development
  },
});

export type Session = typeof auth.$Infer.Session;
