import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';

// FlowAI upload endpoint - use the dedicated FlowAI/FlowRMS endpoint
const FLOWAI_GRAPHQL_URL = process.env.NEXT_PUBLIC_FLOWRMS_GRAPHQL_URL 
  || process.env.NEXT_PUBLIC_FLOWCRM_GRAPHQL_URL 
  || 'https://staging.v6.api.flowrms.com/graphql';

/**
 * Upload proxy for FlowAI file uploads
 * Uses WorkOS authentication from the CRM
 * Handles multipart form data for file uploads
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

    console.log('🔄 FlowAI Upload Proxy - Forwarding request to:', FLOWAI_GRAPHQL_URL);

    // Get the form data from the request
    const formData = await request.formData();
    
    // Forward the multipart request to FlowAI
    const response = await fetch(FLOWAI_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-User-Email': user.email || '',
        'X-User-Id': user.id || '',
        // Don't set Content-Type - let fetch set it with the correct boundary for multipart
      },
      body: formData,
    });

    // Get the response
    const data = await response.json();
    
    console.log('✅ FlowAI Upload Proxy - Response received');
    
    // Return the response
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('❌ FlowAI Upload Proxy Error:', error);
    return NextResponse.json(
      { 
        errors: [{ 
          message: error instanceof Error ? error.message : 'Upload failed' 
        }] 
      },
      { status: 500 }
    );
  }
}
