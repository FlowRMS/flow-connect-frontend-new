import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';

// FlowAI GraphQL endpoint - use the dedicated Flow AI endpoint
// TEMPORARY: Changed to use NEXT_PUBLIC_FLOW_AI_GRAPHQL_URL for Flow AI module
// TO REVERT: Change back to NEXT_PUBLIC_FLOWRMS_GRAPHQL_URL || NEXT_PUBLIC_FLOWCRM_GRAPHQL_URL
const FLOWAI_GRAPHQL_URL = process.env.NEXT_PUBLIC_FLOW_AI_GRAPHQL_URL
  || 'https://staging.v6.ai.flowrms.com/graphql';

/**
 * GraphQL proxy for FlowAI requests
 * Uses WorkOS authentication from the CRM
 */
export async function POST(request: NextRequest) {
  try {
    // Get WorkOS auth
    const { user, accessToken } = await withAuth();
    
    if (!user || !accessToken) {
      return NextResponse.json(
        { errors: [{ message: 'Unauthorized - Please sign in' }] },
        { status: 401 }
      );
    }

    // Get the GraphQL request body
    const body = await request.text();
    
    console.log('🔄 FlowAI GraphQL Proxy - Forwarding request to:', FLOWAI_GRAPHQL_URL);
    
    // Forward the request to the FlowAI GraphQL endpoint
    const response = await fetch(FLOWAI_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        // Forward any additional headers that might be needed
        'X-User-Email': user.email || '',
        'X-User-Id': user.id || '',
      },
      body,
    });

    // Get the response
    const data = await response.json();
    
    // Return the response with appropriate headers
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('❌ FlowAI GraphQL Proxy Error:', error);
    return NextResponse.json(
      { 
        errors: [{ 
          message: error instanceof Error ? error.message : 'Internal server error' 
        }] 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'FlowAI GraphQL Proxy - Use POST for GraphQL queries' },
    { status: 405 }
  );
}
