import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get('media_id');

    if (!mediaId) {
      return NextResponse.json({ error: 'media_id required' }, { status: 400 });
    }

    const token = process.env.WHATSAPP_META_API_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'WhatsApp token not configured' }, { status: 500 });
    }

    // Step 1: Get a fresh download URL from Meta using the media ID
    const metaResponse = await fetch(`https://graph.facebook.com/v19.0/${mediaId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!metaResponse.ok) {
      const err = await metaResponse.text();
      console.error('Meta API error fetching media URL:', err);
      return NextResponse.json({ error: `Meta API error: ${metaResponse.statusText}` }, { status: 502 });
    }

    const metaData = await metaResponse.json();
    const freshUrl = metaData.url;

    if (!freshUrl) {
      console.error('No URL returned from Meta API:', metaData);
      return NextResponse.json({ error: 'No URL returned from Meta API' }, { status: 502 });
    }

    // Step 2: Download the actual image using the fresh URL
    const imageResponse = await fetch(freshUrl, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!imageResponse.ok) {
      const err = await imageResponse.text();
      console.error('Image download error:', err);
      return NextResponse.json({ error: `Image download failed: ${imageResponse.statusText}` }, { status: 502 });
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
      },
    });

  } catch (error) {
    console.error('Error proxying WhatsApp image:', error);
    return NextResponse.json({ error: 'Failed to proxy image', detail: String(error) }, { status: 500 });
  }
}
