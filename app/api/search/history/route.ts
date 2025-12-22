import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

async function getCurrentDbUserId() {
  const authUser = await currentUser();
  if (!authUser) return null;
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: authUser.id },
    select: { id: true },
  });
  return dbUser?.id ?? null;
}

export async function GET() {
  try {
    const userId = await getCurrentDbUserId();
    if (!userId) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    const history = await prisma.searchHistory.findMany({
      where: { userId },
      select: {
        id: true,
        searchQuery: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const response = history.map((h) => ({
      id: h.id,
      term: h.searchQuery,
      createdAt: h.createdAt,
    }));

    return NextResponse.json({ data: response });
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
    const searchQuery =
      typeof term === "string" ? term.trim().slice(0, 255) : "";

    if (!searchQuery) {
      return NextResponse.json({ error: "Invalid term" }, { status: 400 });
    }

    await prisma.searchHistory.create({
      data: {
        userId,
        searchQuery,
      },
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
