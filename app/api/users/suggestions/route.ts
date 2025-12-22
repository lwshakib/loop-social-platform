import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Get current authenticated user from x-user header (set by proxy middleware)
    const user = JSON.parse(request.headers.get("x-user") || "null");
    const currentUserId = user?.id;

    if (!currentUserId) {
      return NextResponse.json({ data: [] });
    }

    // Get list of user IDs that the current user follows
    const following = await prisma.follow.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    });

    const followingIds = following.map((f: any) => f.followingId);
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
        image: true,
      },
      take: 10,
    });

    // Transform to match expected format
    const response = suggestions.map((user: any) => ({
      userId: user.id,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        profileImage: user.image,
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
