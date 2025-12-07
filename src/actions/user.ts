import db from "@/db";
import { usersTable, postsTable, followsTable } from "@/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, sql } from "drizzle-orm";

export async function getOrCreateUser() {
  const user = await currentUser();
  if (!user) return null;
  try {
    const existUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkId, user.id))
      .limit(1);

    if (existUser[0]) {
      return existUser[0];
    }

    const name = user.fullName || "";
    const username =
      "@" + user.fullName?.toLowerCase().replace(/ /g, "") + "-" + Date.now();

    const email = user.emailAddresses[0]?.emailAddress || "";
    const imageUrl = user.imageUrl || "";

    const [newUser] = await db
      .insert(usersTable)
      .values({
        clerkId: user.id,
        email: email,
        username: username,
        imageUrl: imageUrl,
        name,
      })
      .returning();

    return newUser;
  } catch (error) {
    if (error instanceof Error) {
      // Error handled silently
    }
    return null;
  }
}

export async function getUserByUsername(username: string) {
  const [user] = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      clerkId: usersTable.clerkId,
      email: usersTable.email,
      username: usersTable.username,
      imageUrl: usersTable.imageUrl,
      bio: usersTable.bio,
      dateOfBirth: usersTable.dateOfBirth,
      gender: usersTable.gender,
      isVerified: usersTable.isVerified,
      createdAt: usersTable.createdAt,
      updatedAt: usersTable.updatedAt,
      // Use relations to get counts via subqueries
      // Followers count: users who follow this user (followedUserId = user.id)
      followersCount: sql<number>`(
        SELECT COUNT(*)::int
        FROM ${followsTable}
        WHERE ${followsTable.followedUserId} = ${usersTable.id}
      )`.as("followersCount"),
      // Following count: users this user follows (followingUserId = user.id)
      followingCount: sql<number>`(
        SELECT COUNT(*)::int
        FROM ${followsTable}
        WHERE ${followsTable.followingUserId} = ${usersTable.id}
      )`.as("followingCount"),
      // Posts count: posts by this user
      postsCount: sql<number>`(
        SELECT COUNT(*)::int
        FROM ${postsTable}
        WHERE ${postsTable.userId} = ${usersTable.id}
      )`.as("postsCount"),
    })
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);

  return user || null;
}
