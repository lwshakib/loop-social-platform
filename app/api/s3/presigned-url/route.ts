import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getUploadPresignedUrl } from '@/lib/s3';
import crypto from 'crypto';

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

    // Clean folder name to prevent directory traversal issues
    const safeFolder = folder.replace(/\.\./g, '').replace(/[^a-zA-Z0-9_\-\/]/g, '');

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
