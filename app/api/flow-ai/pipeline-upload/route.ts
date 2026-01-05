import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';

// Use the unified v6 API endpoint for pipeline operations
const PIPELINE_GRAPHQL_URL = process.env.NEXT_PUBLIC_FLOWRMS_GRAPHQL_URL 
  || process.env.NEXT_PUBLIC_FLOWCRM_GRAPHQL_URL 
  || 'https://staging.v6.api.flowrms.com/graphql';

// Nil UUID for tenant ID
const NIL_UUID = '00000000-0000-0000-0000-000000000000';

// Disable body parsing to get raw body - this is critical for multipart forwarding
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  console.log('🚨 PIPELINE UPLOAD ROUTE HIT!');

  try {
    // Get WorkOS auth
    const { user, accessToken } = await withAuth();

    if (!user || !accessToken) {
      console.error('❌ Missing authorization');
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    // Get the original content-type header - this contains the boundary
    const contentType = request.headers.get('content-type');
    console.log('📤 Original Content-Type:', contentType);

    if (!contentType || !contentType.includes('multipart/form-data')) {
      console.error('❌ Invalid content type:', contentType);
      return NextResponse.json(
        { error: 'Content-Type must be multipart/form-data' },
        { status: 400 }
      );
    }

    // Read the raw body as ArrayBuffer and convert to Buffer
    const arrayBuffer = await request.arrayBuffer();
    const body = Buffer.from(arrayBuffer);

    console.log('📤 Body size:', body.length, 'bytes');
    console.log('📤 Forwarding to:', PIPELINE_GRAPHQL_URL);

    // Build headers - forward the EXACT content-type with boundary
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Content-Length': body.length.toString(),
      'Authorization': `Bearer ${accessToken}`,
      'X-Tenant-ID': NIL_UUID,
      'X-User-Email': user.email || '',
      'X-User-Id': user.id || '',
    };

    console.log('📤 Request headers:', Object.keys(headers));

    // Forward the raw body directly - no parsing, no reconstruction
    const response = await fetch(PIPELINE_GRAPHQL_URL, {
      method: 'POST',
      headers,
      body,
    });

    console.log('📤 Response status:', response.status);

    const responseText = await response.text();
    console.log('📤 Response body:', responseText.substring(0, 500));

    if (!response.ok) {
      console.error('❌ Pipeline upload error:', responseText);
      return NextResponse.json(
        { error: 'Upload failed', details: responseText },
        { status: response.status }
      );
    }

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { raw: responseText };
    }

    console.log('✅ Pipeline upload successful');

    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Refresh-Token',
      },
    });
  } catch (error) {
    console.error('❌ Pipeline upload proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Refresh-Token',
    },
  });
}
