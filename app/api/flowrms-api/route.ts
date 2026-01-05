import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';

// Use the unified v6 API endpoint for all FlowRMS operations
const FLOWRMS_GRAPHQL_URL = process.env.NEXT_PUBLIC_FLOWRMS_GRAPHQL_URL 
  || process.env.NEXT_PUBLIC_FLOWCRM_GRAPHQL_URL 
  || 'https://staging.v6.api.flowrms.com/graphql';

console.log('🔧 FlowRMS API Proxy configured with endpoint:', FLOWRMS_GRAPHQL_URL);

/**
 * FlowRMS API proxy for factory data, warehouses, etc.
 * Uses WorkOS authentication from the CRM
 */
export async function POST(request: NextRequest) {
  try {
    // Get WorkOS auth
    const { user, accessToken } = await withAuth();
    
    if (!user || !accessToken) {
      console.error('❌ No WorkOS access token available');
      return NextResponse.json(
        { 
          errors: [{ 
            message: 'Unauthorized. Access token is missing.',
            extensions: { code: 'UNAUTHENTICATED' }
          }] 
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    console.log('🔄 FlowRMS API Proxy - Operation:', body.operationName || 'unnamed');
    console.log('🔑 WorkOS auth available:', { hasUser: !!user, hasToken: !!accessToken });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'X-User-Email': user.email || '',
      'X-User-Id': user.id || '',
    };
    
    console.log('✅ Using WorkOS access token');

    const response = await fetch(FLOWRMS_GRAPHQL_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ FlowRMS API error:', response.status, data);
    } else {
      console.log('✅ FlowRMS API request successful for:', body.operationName || 'unnamed');
    }

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
      },
    });
  } catch (error) {
    console.error('❌ FlowRMS API Proxy Error:', error);
    return NextResponse.json(
      { 
        errors: [{ 
          message: error instanceof Error ? error.message : 'Internal server error',
          extensions: { code: 'INTERNAL_ERROR' }
        }] 
      },
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}
