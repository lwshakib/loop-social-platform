import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import db from "@/db";
import { usersTable, followsTable } from "@/db/schema";

async function resolveUsername(
  params: Promise<{ username: string }> | { username: string }
) {
  const resolved = await Promise.resolve(params);
  return resolved.username;
}

async function getCurrentDbUserId() {
  const authUser = await currentUser();
  if (!authUser) return null;
  const [dbUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, authUser.id))
    .limit(1);
  return dbUser?.id ?? null;
}

async function getTargetUser(username: string) {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);
  return user ?? null;
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

    const currentUserId = await getCurrentDbUserId();
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

    const [existing] = await db
      .select()
      .from(followsTable)
      .where(
        and(
          eq(followsTable.followingUserId, currentUserId),
          eq(followsTable.followedUserId, targetUser.id)
        )
      )
      .limit(1);

    if (!existing) {
      await db
        .insert(followsTable)
        .values({
          followingUserId: currentUserId,
          followedUserId: targetUser.id,
        })
        .returning({ id: followsTable.id });
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

    const currentUserId = await getCurrentDbUserId();
    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const targetUser = await getTargetUser(username);
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await db
      .delete(followsTable)
      .where(
        and(
          eq(followsTable.followingUserId, currentUserId),
          eq(followsTable.followedUserId, targetUser.id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
