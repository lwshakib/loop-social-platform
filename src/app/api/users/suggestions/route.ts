import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import db from "@/db";
import { usersTable, followsTable } from "@/db/schema";
import { eq, sql, and, ne, notInArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Get current authenticated user
    const currentUserData = await currentUser();
    let currentUserId: string | undefined;

    if (currentUserData) {
      const [currentDbUser] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.clerkId, currentUserData.id))
        .limit(1);

      if (currentDbUser) {
        currentUserId = currentDbUser.id;
      }
    }

    if (!currentUserId) {
      return NextResponse.json({ data: [] });
    }

    // Get list of user IDs that the current user follows
    const following = await db
      .select({ followedUserId: followsTable.followedUserId })
      .from(followsTable)
      .where(eq(followsTable.followingUserId, currentUserId));

    const followingIds = following.map((f) => f.followedUserId);
    followingIds.push(currentUserId); // Exclude self and already following

    // Get suggested users (not following, not self, limit 10)
    const suggestions = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        name: usersTable.name,
        imageUrl: usersTable.imageUrl,
      })
      .from(usersTable)
      .where(
        and(
          ne(usersTable.id, currentUserId),
          followingIds.length > 0
            ? notInArray(usersTable.id, followingIds)
            : sql`1=1`
        )
      )
      .limit(10);

    // Transform to match expected format
    const response = suggestions.map((user) => ({
      userId: user.id,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        profileImage: user.imageUrl,
      },
      stories: [], // Empty stories array for suggestions
    }));

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
