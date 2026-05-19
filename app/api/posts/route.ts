import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PostType } from '@/generated/prisma/enums';
import { getEmbedding } from '@/lib/embeddings';
import { upsertVideoEmbedding } from '@/lib/pinecone';

export async function POST(request: NextRequest) {
  try {
    // Get current authenticated user from x-user header (set by proxy middleware)
    const user = JSON.parse(request.headers.get('x-user') || 'null');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentDbUser = user;

    if (!currentDbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { content, url, type } = body;

    // Validate post type
    const validTypes = ['text', 'image', 'reel'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid post type' }, { status: 400 });
    }

    // Validate content
    if (!content && !url) {
      return NextResponse.json(
        { error: 'Post must have either content or an image/video' },
        { status: 400 }
      );
    }

    // Map type string to PostType enum
    const postTypeMap: Record<string, PostType> = {
      text: PostType.TEXT,
      image: PostType.IMAGE,
      reel: PostType.VIDEO,
    };

    // Create post
    const newPost = await prisma.post.create({
      data: {
        userId: currentDbUser.id,
        content: content || '',
        url: url || '',
        type: postTypeMap[type],
      },
    });

    // If the post is a reel (VIDEO), generate embeddings and save them
    if (newPost.type === PostType.VIDEO) {
      try {
        const embedding = await getEmbedding(content || '', {
          category: 'general',
          authorId: currentDbUser.id,
        });

        // Update local Postgres embedding JSON
        await prisma.post.update({
          where: { id: newPost.id },
          data: { embeddingJson: JSON.stringify(embedding) },
        });

        // Upsert to Pinecone if index configuration exists
        await upsertVideoEmbedding(newPost.id, embedding, {
          userId: currentDbUser.id,
          category: 'general',
          createdAt: newPost.createdAt.getTime(),
          contentType: 'video',
        });
      } catch (err) {
        console.error('Failed to generate or store vector embedding for reel:', err);
      }
    }

    return NextResponse.json({
      data: {
        id: newPost.id,
        userId: newPost.userId,
        content: newPost.content,
        url: newPost.url,
        type: newPost.type === 'IMAGE' ? 'image' : newPost.type === 'VIDEO' ? 'reel' : 'text',
        createdAt: newPost.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
