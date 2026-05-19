import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getDownloadSignedUrl } from '@/lib/s3';

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
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'key query parameter is required' }, { status: 400 });
    }

    const url = await getDownloadSignedUrl(key);

    return NextResponse.json({
      data: {
        url,
      },
    });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
