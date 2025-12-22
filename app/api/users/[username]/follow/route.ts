import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

async function resolveUsername(
  params: Promise<{ username: string }> | { username: string }
) {
  const resolved = await Promise.resolve(params);
  return resolved.username;
}

async function getCurrentDbUserId(request: NextRequest) {
  const user = JSON.parse(request.headers.get("x-user") || "null");
  if (!user) return null;
  return user.id;
}

async function getTargetUser(username: string) {
  return prisma.user.findUnique({
    where: { username },
  });
}

export async function POST(
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

    const currentUserId = await getCurrentDbUserId(_req);
    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const targetUser = await getTargetUser(username);
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.id === currentUserId) {
      return NextResponse.json(
        { error: "You cannot follow yourself" },
        { status: 400 }
      );
    }

    // Check if already following
    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUser.id,
        },
      },
    });

    if (!existing) {
      await prisma.follow.create({
        data: {
          followerId: currentUserId,
          followingId: targetUser.id,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error following user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const currentUserId = await getCurrentDbUserId(_req);
    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const targetUser = await getTargetUser(username);
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.follow.deleteMany({
      where: {
        followerId: currentUserId,
        followingId: targetUser.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
