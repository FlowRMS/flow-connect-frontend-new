import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      );
    }

    console.log('🔄 PDF Proxy - Fetching:', url);

    // Fetch the file from the presigned URL
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf,*/*',
      },
    });

    if (!response.ok) {
      console.error('❌ Failed to fetch PDF:', response.status);
      return NextResponse.json(
        { error: 'Failed to fetch PDF' },
        { status: response.status }
      );
    }

    const buffer = await response.arrayBuffer();
    
    console.log('✅ PDF fetched successfully, size:', buffer.byteLength);

    // Return the PDF with proper headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('❌ PDF Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
