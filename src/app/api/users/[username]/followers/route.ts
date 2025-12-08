import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import db from "@/db";
import { usersTable, followsTable } from "@/db/schema";

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

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const followers = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        name: usersTable.name,
        imageUrl: usersTable.imageUrl,
        isVerified: usersTable.isVerified,
      })
      .from(followsTable)
      .innerJoin(
        usersTable,
        eq(followsTable.followingUserId, usersTable.id) // follower user
      )
      .where(eq(followsTable.followedUserId, user.id));

    return NextResponse.json({ data: followers });
  } catch (error) {
    console.error("Error fetching followers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
