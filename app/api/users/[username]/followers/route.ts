import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

async function resolveUsername(
  params: Promise<{ username: string }> | { username: string }
) {
  const resolved = await Promise.resolve(params);
  return resolved.username;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> | { username: string } }
) {
  try {
    const username = await resolveUsername(params);
    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get followers (users who follow this user)
    const followers = await prisma.follow.findMany({
      where: { followingId: user.id },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
          },
        },
      },
    });

    const response = followers.map((f) => f.follower);

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error("Error fetching followers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
