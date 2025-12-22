import { NextRequest, NextResponse } from "next/server";
import { getUserByUsername } from "@/actions/user";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

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
      const currentDbUser = await prisma.user.findUnique({
        where: { clerkId: currentUserData.id },
      });

      if (currentDbUser) {
        // Check if current user is following the profile user
        const follow = await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: currentDbUser.id,
              followingId: user.id,
            },
          },
        });

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
      coverImageUrl: user.coverImageUrl || "",
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> | { username: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const usernameParam = resolvedParams.username;

    const authUser = await currentUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: authUser.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only allow editing your own profile
    if (dbUser.username !== usernameParam) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { name, username, bio, imageUrl, coverImageUrl } = body || {};

    const payload: {
      name?: string;
      username?: string;
      bio?: string;
      imageUrl?: string;
      coverImageUrl?: string;
    } = {};
    if (typeof name === "string") payload.name = name.trim();
    if (typeof username === "string") payload.username = username.trim();
    if (typeof bio === "string") payload.bio = bio;
    if (typeof imageUrl === "string") payload.imageUrl = imageUrl.trim();
    if (typeof coverImageUrl === "string")
      payload.coverImageUrl = coverImageUrl.trim();

    if (Object.keys(payload).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: dbUser.id },
      data: payload,
    });

    const refreshed = await getUserByUsername(updated.username);
    if (!refreshed) {
      return NextResponse.json(
        { error: "User not found after update" },
        { status: 404 }
      );
    }

    const response = {
      id: refreshed.id,
      username: refreshed.username,
      name: refreshed.name,
      email: refreshed.email,
      bio: refreshed.bio || "",
      imageUrl: refreshed.imageUrl,
      dateOfBirth: refreshed.dateOfBirth ? String(refreshed.dateOfBirth) : "",
      gender: refreshed.gender || "",
      coverImageUrl: refreshed.coverImageUrl || "",
      isVerified: refreshed.isVerified || false,
      createdAt: refreshed.createdAt.toISOString(),
      postsCount: refreshed.postsCount || 0,
      followers: refreshed.followersCount || 0,
      following: refreshed.followingCount || 0,
      isFollowing: false,
    };

    return NextResponse.json({ data: response });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const isDuplicate =
      message.includes("duplicate key value") ||
      message.toLowerCase().includes("unique constraint");
    if (isDuplicate) {
      return NextResponse.json(
        { error: "Username or email already exists" },
        { status: 409 }
      );
    }

    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
