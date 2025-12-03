import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const accessToken = formData.get('access_token') as string;
    const refreshToken = formData.get('refresh_token') as string;

    // Validate required fields
    if (!accessToken || !refreshToken) {
      return NextResponse.json({ error: 'Missing access_token or refresh_token' }, { status: 400 });
    }

    // Return HTML page that sets localStorage and redirects
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Authenticating...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      background-color: #f5f5f5;
    }
    .container {
      text-align: center;
      padding: 2rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h2>Signing you in...</h2>
    <p>Please wait while we authenticate your session.</p>
  </div>
  
  <script>
    try {
      // Store tokens in localStorage
      localStorage.setItem('access_token', ${JSON.stringify(accessToken)});
      localStorage.setItem('refresh_token', ${JSON.stringify(refreshToken)});
      
      // Redirect to bridge page
      window.location.replace('/auth/bridge');
    } catch (error) {
      console.error('Failed to store tokens:', error);
      // Fallback: redirect to external app
      window.location.href = '${process.env.NEXT_PUBLIC_LOGIN_URL || 'https://app2.flowrms.com'}';
    }
  </script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error in receive-token endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Only allow POST method
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
