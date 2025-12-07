import { NextRequest, NextResponse } from "next/server";
import { getUserByUsername } from "@/actions/user";
import { currentUser } from "@clerk/nextjs/server";
import db from "@/db";
import { followsTable, usersTable } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> | { username: string } }
) {
  try {
    // Handle both Promise and direct params (for Next.js 15+ compatibility)
    const resolvedParams = await Promise.resolve(params);
    const username = resolvedParams.username;

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Get user by username (don't clean the username)
    const user = await getUserByUsername(username);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get current authenticated user
    const currentUserData = await currentUser();
    let isFollowing = false;

    // Check if current user is following this user
    if (currentUserData) {
      // Get current user's database record
      const [currentDbUser] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.clerkId, currentUserData.id))
        .limit(1);

      if (currentDbUser) {
        // Check if current user is following the profile user
        const [follow] = await db
          .select()
          .from(followsTable)
          .where(
            and(
              eq(followsTable.followingUserId, currentDbUser.id),
              eq(followsTable.followedUserId, user.id)
            )
          )
          .limit(1);

        isFollowing = !!follow;
      }
    }

    // Map database user to response format
    const response = {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      bio: user.bio || "",
      imageUrl: user.imageUrl,
      dateOfBirth: user.dateOfBirth ? String(user.dateOfBirth) : "",
      gender: user.gender || "",
      isVerified: user.isVerified || false,
      createdAt: user.createdAt.toISOString(),
      postsCount: user.postsCount || 0,
      followers: user.followersCount || 0,
      following: user.followingCount || 0,
      isFollowing,
    };

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

