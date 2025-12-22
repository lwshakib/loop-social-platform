import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Get current authenticated user
    const currentUserData = await currentUser();
    let currentUserId: string | undefined;

    if (currentUserData) {
      const currentDbUser = await prisma.user.findUnique({
        where: { clerkId: currentUserData.id },
        select: { id: true },
      });

      if (currentDbUser) {
        currentUserId = currentDbUser.id;
      }
    }

    if (!currentUserId) {
      return NextResponse.json({ data: [] });
    }

    // Get list of user IDs that the current user follows
    const following = await prisma.follow.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);
    followingIds.push(currentUserId); // Exclude self and already following

    // Get suggested users (not following, not self, limit 10)
    const suggestions = await prisma.user.findMany({
      where: {
        id: { notIn: followingIds },
      },
      select: {
        id: true,
        username: true,
        name: true,
        imageUrl: true,
      },
      take: 10,
    });

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
