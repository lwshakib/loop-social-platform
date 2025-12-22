import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";
import { username } from "better-auth/plugins";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql", // or "mysql", "postgresql", ...etc
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  account: {
    accountLinking: {
      enabled: true,
    },
  },
  user: {
    additionalFields: {
      coverImage: { type: "string", required: false },
      bio: { type: "string", required: false },
      dateOfBirth: { type: "date", required: false },
      gender: { type: "string", required: false },
      displayUsername: { type: "string", required: false },
    },
  },
  plugins: [username()],
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (!user.username) {
            const baseUsername = user.name
              ? user.name.toLowerCase().replace(/\s+/g, "")
              : "user";
            const randomSuffix = Math.random().toString(36).substring(2, 7);
            user.username = `@${baseUsername}_${randomSuffix}`;
          }
          return {
            data: user,
          };
        },
      },
    },
  },
});
