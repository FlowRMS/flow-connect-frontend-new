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

    const body = await request.json();
    console.log('🔄 Presigned URL API - Request body:', body);
    
    const { documentId } = body;

    if (!documentId) {
      console.error('❌ Missing documentId');
      return NextResponse.json(
        { error: 'documentId is required' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    console.log('🔄 Making request to GraphQL endpoint:', GRAPHQL_URL);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'X-User-Email': user.email || '',
      'X-User-Id': user.id || '',
    };

    // First, get file info to determine file type
    const fileInfoResponse = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: `
          query GetFileInfo($id: ID!) {
            getFileInfo(id: $id) {
              id
              fileName
              fileType
            }
          }
        `,
        variables: { id: documentId },
      }),
    });

    let fileInfo = null;
    if (fileInfoResponse.ok) {
      const fileInfoResult = await fileInfoResponse.json();
      if (!fileInfoResult.errors) {
        fileInfo = fileInfoResult.data?.getFileInfo;
        console.log('📄 File info:', fileInfo);
      }
    }

    // Make the request to get presigned URL
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: `
          query GeneratePresignedUrl($id: ID!) {
            generatePresignedUrl(id: $id) {
              downloadFilePresignedUrl
              renderFilePresignedUrl
            }
          }
        `,
        variables: { 
          id: documentId
        },
      }),
    });

    console.log('🔄 External API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ External API error:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const result = await response.json();
    console.log('🔄 External API response data:', result);

    if (result.errors) {
      console.error('❌ GraphQL errors:', result.errors);
      return NextResponse.json(
        { error: 'GraphQL errors', details: result.errors },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, Refresh-Token',
          },
        }
      );
    }

    const data = result.data?.generatePresignedUrl;
    const presignedUrl = data?.renderFilePresignedUrl || data?.downloadFilePresignedUrl;

    // Determine if this is a CSV file
    const isCsv = fileInfo?.fileType?.toLowerCase().includes('csv') || 
                  fileInfo?.fileName?.toLowerCase().endsWith('.csv') ||
                  fileInfo?.fileName?.toLowerCase().endsWith('.xlsx');

    console.log('✅ Generated presigned URLs:', { 
      presignedUrl, 
      isCsv,
      fileType: fileInfo?.fileType,
      fileName: fileInfo?.fileName
    });
    
    return NextResponse.json({ 
      presignedUrl, 
      isCsv,
      fileInfo
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Refresh-Token',
      },
    });
  } catch (error) {
    console.error('❌ Presigned URL API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate presigned URL', details: error instanceof Error ? error.message : 'Unknown error' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, Refresh-Token',
        },
      }
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