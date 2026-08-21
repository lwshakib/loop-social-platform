import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getUploadPresignedUrl } from '@/lib/s3';
import crypto from 'crypto';

const ALLOWED_CONTENT_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  // Videos
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/ogg',
  // Audio
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/webm',
  'audio/aac',
  'audio/m4a',
  'audio/x-m4a',
];

const ALLOWED_FOLDERS = ['general', 'posts', 'reels', 'profiles', 'avatars', 'stories'];

export async function GET(request: NextRequest) {
  try {
    // Check session server-side
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename') || 'file';
    const contentType = searchParams.get('contentType');
    const folder = searchParams.get('folder') || 'general';

    if (!contentType) {
      return NextResponse.json(
        { error: 'contentType query parameter is required' },
        { status: 400 }
      );
    }

    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    if (!ALLOWED_FOLDERS.includes(folder)) {
      return NextResponse.json({ error: 'Invalid folder' }, { status: 400 });
    }

    // Clean folder name to prevent directory traversal issues
    // Strip forward slashes to ensure top-level folder usage
    const safeFolder = folder.replace(/\.\./g, '').replace(/[^a-zA-Z0-9_\-]/g, '');

    // Generate unique key
    const fileExtension = filename.split('.').pop() || '';
    const uniqueId = crypto.randomUUID();
    // Strip special characters from filename, but keep base name
    const baseName = filename
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[^a-zA-Z0-9_\-]/g, '') // Keep only alphanumeric, dash, underscore
      .substring(0, 50); // Limit length

    const key = `uploads/${safeFolder}/${uniqueId}${baseName ? `-${baseName}` : ''}${fileExtension ? `.${fileExtension}` : ''}`;

    const url = await getUploadPresignedUrl(key, contentType);

    return NextResponse.json({
      data: {
        url,
        key,
      },
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
