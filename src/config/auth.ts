import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { APIError, createAuthMiddleware } from "better-auth/api";

import { database, mongoClient } from "./database.js";
import { env } from "./env.js";

const passwordStrengthPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/;

const socialProviders =
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
          prompt: "select_account" as const,
        },
      }
    : {};

export const auth = betterAuth({
  appName: "SkillForge AI",
  basePath: "/api/auth",
  baseURL: env.BETTER_AUTH_URL,
  database: mongodbAdapter(database, { client: mongoClient }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  hooks: {
    before: createAuthMiddleware(async (context) => {
      const passwordRoutes = ["/sign-up/email", "/change-password", "/set-password"];
      if (!passwordRoutes.includes(context.path)) return;

      const password =
        context.path === "/sign-up/email"
          ? context.body?.password
          : context.body?.newPassword;
      if (typeof password !== "string" || !passwordStrengthPattern.test(password)) {
        throw new APIError("BAD_REQUEST", {
          message:
            "Password must include uppercase, lowercase, number, and special characters.",
        });
      }
    }),
  },
  secret: env.BETTER_AUTH_SECRET,
  socialProviders,
  telemetry: { enabled: false },
  trustedOrigins: env.CLIENT_URL.split(",").map((origin) => origin.trim()),
  user: {
    deleteUser: {
      enabled: true,
      afterDelete: async (user) => {
        // Remove personalization data when the owning auth identity is deleted.
        await database.collection("profiles").deleteOne({ userId: user.id });
      },
    },
  },
});
