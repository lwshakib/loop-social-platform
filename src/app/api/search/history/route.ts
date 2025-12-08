import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import db from "@/db";
import { searchHistoryTable, usersTable } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

async function getCurrentDbUserId() {
  const authUser = await currentUser();
  if (!authUser) return null;
  const [dbUser] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.clerkId, authUser.id))
    .limit(1);
  return dbUser?.id ?? null;
}

export async function GET() {
  try {
    const userId = await getCurrentDbUserId();
    if (!userId) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    const history = await db
      .select({
        id: searchHistoryTable.id,
        term: searchHistoryTable.searchTerm,
        createdAt: searchHistoryTable.createdAt,
      })
      .from(searchHistoryTable)
      .where(eq(searchHistoryTable.userId, userId))
      .orderBy(desc(searchHistoryTable.createdAt))
      .limit(10);

    return NextResponse.json({ data: history });
  } catch (error) {
    console.error("Error fetching search history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentDbUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { term } = await req.json();
    const searchTerm =
      typeof term === "string" ? term.trim().slice(0, 255) : "";

    if (!searchTerm) {
      return NextResponse.json({ error: "Invalid term" }, { status: 400 });
    }

    await db.insert(searchHistoryTable).values({
      userId,
      searchTerm,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving search history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
