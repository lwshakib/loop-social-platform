import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Get current authenticated user from x-user header (set by proxy middleware)
    const user = JSON.parse(request.headers.get('x-user') || 'null');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { postId, duration, completed } = body;

    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 });
    }

    // Verify if post exists and is a reel
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ error: 'Reel not found' }, { status: 404 });
    }

    // Create a new WatchEvent
    const watchEvent = await prisma.watchEvent.create({
      data: {
        userId: user.id,
        postId: postId,
        duration: parseInt(duration || '0'),
        completed: Boolean(completed),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: watchEvent.id,
        postId: watchEvent.postId,
        duration: watchEvent.duration,
        completed: watchEvent.completed,
      },
    });
  } catch (error) {
    console.error('Error logging reel interaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
