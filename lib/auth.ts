import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import prisma from './prisma';
import { username } from 'better-auth/plugins';
import { Resend } from 'resend';
import { AuthEmailTemplate } from '@/components/emails/auth-email-template';

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      try {
        await resend.emails.send({
          from: 'Loop <noreply@lwshakib.site>',
          to: user.email,
          subject: 'Reset your password',
          react: AuthEmailTemplate({ type: 'forgot-password', url }),
        });
      } catch (err) {
        console.error('Resend error (Reset Password):', err);
      }
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    callbackURL: '/email-verified',
    sendVerificationEmail: async ({ user, url }) => {
      try {
        await resend.emails.send({
          from: 'Loop <noreply@lwshakib.site>',
          to: user.email,
          subject: 'Verify your email address',
          react: AuthEmailTemplate({ type: 'email-verification', url }),
        });
      } catch (err) {
        console.error('Verification email error:', err);
      }
    },
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
      coverImage: { type: 'string', required: false },
      bio: { type: 'string', required: false },
      dateOfBirth: { type: 'date', required: false },
      gender: { type: 'string', required: false },
      displayUsername: { type: 'string', required: false },
    },
  },
  plugins: [username()],
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (!user.username) {
            const baseUsername = user.name ? user.name.toLowerCase().replace(/\s+/g, '') : 'user';
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
