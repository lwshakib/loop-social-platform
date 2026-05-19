import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSignedUrlIfNeeded } from '@/lib/s3';

async function resolveUsername(params: Promise<{ username: string }> | { username: string }) {
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
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get users this user follows
    const following = await prisma.follow.findMany({
      where: { followerId: user.id },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
          },
        },
      },
    });

    const response = await Promise.all(
      following.map(async (f) => ({
        id: f.following.id,
        username: f.following.username,
        name: f.following.name,
        image: await getSignedUrlIfNeeded(f.following.image),
        imageUrl: await getSignedUrlIfNeeded(f.following.image),
      }))
    );

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error('Error fetching following:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
