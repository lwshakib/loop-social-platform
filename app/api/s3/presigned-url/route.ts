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
  let userId: string | undefined;
  let folder: string | null = null;
  let contentType: string | null = null;

  try {
    const { searchParams } = new URL(request.url);
    folder = searchParams.get('folder');
    contentType = searchParams.get('contentType');

    // Check session server-side
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    userId = session.user.id;
    const filename = searchParams.get('filename') || 'file';
    const targetFolder = folder || 'general';

    if (!contentType) {
      return NextResponse.json(
        { error: 'contentType query parameter is required' },
        { status: 400 }
      );
    }

    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    if (!ALLOWED_FOLDERS.includes(targetFolder)) {
      return NextResponse.json({ error: 'Invalid folder' }, { status: 400 });
    }

    // Clean folder name to prevent directory traversal issues
    // Strip forward slashes to ensure top-level folder usage
    const safeFolder = targetFolder.replace(/\.\./g, '').replace(/[^a-zA-Z0-9_\-]/g, '');

    // Generate unique key using UUID to prevent user filename metadata leakage
    const fileExtension = filename.includes('.') ? filename.split('.').pop() || '' : '';
    const uniqueId = crypto.randomUUID();

    const key = `uploads/${safeFolder}/${uniqueId}${fileExtension ? `.${fileExtension}` : ''}`;

    const url = await getUploadPresignedUrl(key, contentType);

    return NextResponse.json({
      data: {
        url,
        key,
      },
    });
  } catch (error) {
    console.error('Error generating presigned URL:', {
      error,
      userId,
      folder,
      contentType,
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
