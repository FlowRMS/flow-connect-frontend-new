import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';

// Use the unified v6 API endpoint
const GRAPHQL_URL = process.env.NEXT_PUBLIC_FLOWRMS_GRAPHQL_URL 
  || process.env.NEXT_PUBLIC_FLOWCRM_GRAPHQL_URL 
  || 'https://staging.v6.api.flowrms.com/graphql';

export async function POST(request: NextRequest) {
  try {
    // Get WorkOS auth
    const { user, accessToken } = await withAuth();

    if (!user || !accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    const { fileUploadProcessId } = await request.json();

    if (!fileUploadProcessId) {
      return NextResponse.json(
        { error: 'fileUploadProcessId is required' },
        { status: 400 }
      );
    }

    console.log('🔄 Calling continueWorkflow mutation:', {
      fileUploadProcessId,
      endpoint: GRAPHQL_URL,
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'X-User-Email': user.email || '',
      'X-User-Id': user.id || '',
    };

    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: `
          mutation ContinueWorkflow($fileUploadProcessId: ID!, $skipPlayground: Boolean!) {
            continueWorkflow(fileUploadProcessId: $fileUploadProcessId, skipPlayground: $skipPlayground) {
              status
              message
            }
          }
        `,
        variables: {
          fileUploadProcessId,
          skipPlayground: true,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ continueWorkflow API error:', response.status, errorText);
      return NextResponse.json(
        { error: `API returned ${response.status}: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ continueWorkflow response:', data);

    if (data.errors) {
      console.error('❌ GraphQL errors:', data.errors);
      return NextResponse.json(
        { error: 'GraphQL errors', details: data.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data.data?.continueWorkflow,
    });
  } catch (error) {
    console.error('❌ Error in continueWorkflow API route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
