/**
 * Auth Client Configuration
 * This file initializes the better-auth client for use in React components.
 * It enables client-side authentication features like sign-in, sign-up, and session management.
 */

import { createAuthClient } from 'better-auth/react';
import { usernameClient, inferAdditionalFields } from 'better-auth/client/plugins';
import type { auth } from './auth';

/**
 * authClient
 * The main entry point for client-side authentication.
 * Configured with base URL and essential plugins for user management.
 */
export const authClient = createAuthClient({
  /**
   * baseURL
   * The root URL of the application, used for absolute redirects and API calls.
   * Defaults to localhost for development.
   */
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',

  /**
   * plugins
   * Extends the base auth functionality:
   * 1. usernameClient: Adds support for username-based authentication.
   * 2. inferAdditionalFields: Ensures TypeScript awareness of custom schema fields from the server.
   */
  plugins: [usernameClient(), inferAdditionalFields<typeof auth>()],
});
