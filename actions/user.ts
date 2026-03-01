/**
 * User Server Actions
 * Handles fetching and updating user profile information on the server.
 */

import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

/**
 * UpdateUserProfileInput
 * Types for allowable fields when updating a user's profile.
 */
type UpdateUserProfileInput = {
  name?: string;
  username?: string;
  bio?: string;
  image?: string;
  coverImage?: string;
};

/**
 * getUserByUsername
 * Fetches a full user profile based on their unique handle.
 * Includes aggregated counts for posts, followers, and following.
 *
 * @param username The @handle of the user to retrieve.
 * @returns The user object with transformed count fields, or null if not found.
 */
export async function getUserByUsername(username: string) {
  // Fetch user from DB and include counts for related social entities
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      _count: {
        select: {
          posts: true,
          followers: true,
          following: true,
        },
      },
    },
  });

  if (!user) return null;

  // Flatten the _count object into top-level properties for easier UI consumption
  return {
    ...user,
    followersCount: user._count.followers,
    followingCount: user._count.following,
    postsCount: user._count.posts,
  };
}

/**
 * updateUserProfile
 * Updates the profile of the currently authenticated user.
 * Validates the session and sanitizes the input before committing to the DB.
 *
 * @param input The object containing fields to update (name, username, bio, etc.)
 */
export async function updateUserProfile(input: UpdateUserProfileInput) {
  // 1. SECURITY: Verify the user has an active session
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    throw new Error('Unauthorized');
  }

  // 2. Fetch the existing user to ensure they still exist in the database
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!dbUser) {
    throw new Error('User not found');
  }

  // 3. SANITIZATION: Only allowed fields are transferred to the payload to prevent over-posting
  const payload: UpdateUserProfileInput = {};
  if (typeof input.name === 'string') payload.name = input.name.trim();
  if (typeof input.username === 'string') payload.username = input.username.trim();
  if (typeof input.bio === 'string') payload.bio = input.bio;
  if (typeof input.image === 'string') payload.image = input.image.trim();
  if (typeof input.coverImage === 'string') payload.coverImage = input.coverImage.trim();

  // 4. VALIDATION: Check if we actually have anything to change
  if (Object.keys(payload).length === 0) {
    throw new Error('No fields to update');
  }

  // 5. DATABASE UPDATE: Persist the changes
  const updated = await prisma.user.update({
    where: { id: dbUser.id },
    data: payload,
  });

  return updated;
}
