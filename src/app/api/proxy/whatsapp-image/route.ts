import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    const mediaId = searchParams.get('media_id');

    if (!imageUrl && !mediaId) {
      return NextResponse.json({ error: 'URL or media_id required' }, { status: 400 });
    }

    // If we have media_id, construct the WhatsApp URL
    const finalUrl = imageUrl || `https://graph.facebook.com/v19.0/${mediaId}`;
    
    // Download the image with proper authentication
    const response = await fetch(finalUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_META_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Return the image as a response
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('Error proxying WhatsApp image:', error);
    return NextResponse.json({ error: 'Failed to proxy image' }, { status: 500 });
  }
}
