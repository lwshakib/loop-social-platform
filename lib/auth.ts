/**
 * Server-Side Authentication Configuration
 * This file configures better-auth for the server, defining how users are authenticated,
 * how their data is stored, and how external services (Email, Google) are integrated.
 */

import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import prisma from './prisma';
import { username } from 'better-auth/plugins';
import { Resend } from 'resend';
import { AuthEmailTemplate } from '@/components/emails/auth-email-template';

// Initialize the Resend email service client
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * auth
 * The main server-side authentication instance.
 * It manages sessions, providers, and database interactions.
 */
export const auth = betterAuth({
  /**
   * database
   * Uses Prisma as the database adapter to persist user accounts and sessions.
   * provider is set to 'postgresql' to match the database engine.
   */
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  /**
   * emailAndPassword
   * Enables standard email-based sign-in.
   * Configured to require email verification before allowing access.
   */
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,

    /**
     * sendResetPassword
     * Triggered when a user requests a password reset.
     * Uses Resend to dispatch a styled HTML email with the reset link.
     */
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

  /**
   * emailVerification
   * Logic for confirming user emails on sign-up.
   */
  emailVerification: {
    sendOnSignUp: true, // Automatically send verification email when a user registers
    autoSignInAfterVerification: false, // Force them to manually sign in after verifying
    callbackURL: '/verify-email', // Where they land after clicking the email link

    /**
     * sendVerificationEmail
     * Uses Resend to send the initial account verification link.
     */
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

  /**
   * socialProviders
   * Configures OAuth providers for third-party sign-in.
   */
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  /**
   * account
   * Manages account behavior, such as linking multiple providers to one email.
   */
  account: {
    accountLinking: {
      enabled: true, // If a user signs up with Email then Google, link them together
    },
  },

  /**
   * user
   * Defines the user entity and custom schema extensions.
   */
  user: {
    deleteUser: {
      enabled: true, // Allows users to permanently remove their accounts
    },

    /**
     * additionalFields
     * Extends the base user model with platform-specific profile data.
     * These must be reflected in the Prisma schema as well.
     */
    additionalFields: {
      coverImage: { type: 'string', required: false },
      bio: { type: 'string', required: false },
      dateOfBirth: { type: 'date', required: false },
      gender: { type: 'string', required: false },
      displayUsername: { type: 'string', required: false }, // The "@handle" shown in UI
    },
  },

  /**
   * plugins
   * Extends core functionality. 'username()' adds support for unique user handles.
   */
  plugins: [username()],

  /**
   * databaseHooks
   * Lifecycle triggers that run before or after database operations.
   */
  databaseHooks: {
    user: {
      create: {
        /**
         * before hook
         * Runs before a new user is saved to the database.
         * Crucial for generating an initial unique handle (@username) if none exists.
         */
        before: async (user) => {
          if (!user.username) {
            // Clean the name to create a base handle
            const baseUsername = user.name ? user.name.toLowerCase().replace(/\s+/g, '') : 'user';
            // Add a random suffix to ensure uniqueness on generation
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
