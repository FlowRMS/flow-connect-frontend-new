# FlowCRM Authentication Implementation

This document describes the authentication flow implemented for receiving tokens from FlowRMS.

## Overview

The application supports receiving authentication tokens from FlowRMS via form POST and manages them in localStorage with automatic refresh capabilities. This mirrors the exact implementation used in flow-analytics.

## Authentication Flow

1. **FlowRMS form POST** → `/api/auth/receive-token`
2. **Receive endpoint** → HTML page stores tokens → redirect to `/auth/bridge`
3. **Bridge page** → verify tokens → redirect to `/` (dashboard) or external app
4. **Protected requests** → use `crmGraphQLRequest()` → auto-refresh on 401/403
5. **Failed refresh** → clear tokens → redirect to `https://app2.flowrms.com`

## Components

### 1. Token Receiver Endpoint

**File:** `app/api/auth/receive-token/route.ts`

- **URL:** `POST /api/auth/receive-token`
- **Accepts:** Form data with `access_token` and `refresh_token` fields
- **Returns:** HTML page that stores tokens in localStorage and redirects to bridge page

**Usage by FlowRMS:**

```html
<form action="https://your-flowcrm-domain.com/api/auth/receive-token" method="POST">
  <input type="hidden" name="access_token" value="..." />
  <input type="hidden" name="refresh_token" value="..." />
  <input type="submit" value="Login to FlowCRM" />
</form>
```

### 2. Auth Bridge Page

**File:** `app/auth/bridge/page.tsx`

- **URL:** `/auth/bridge`
- **Purpose:** Verifies tokens exist and redirects to dashboard or external app
- **Behavior:**
  - If tokens exist → redirect to `/` (dashboard)
  - If tokens missing → redirect to `https://app2.flowrms.com`

### 3. Auth Utilities

**File:** `components/lib/auth.ts`

Functions:

- `getStoredAccessToken()` - Get access token from localStorage
- `getStoredRefreshToken()` - Get refresh token from localStorage
- `setTokens(access, refresh)` - Store tokens in localStorage
- `clearTokens()` - Remove all tokens
- `refreshAccessToken()` - Refresh access token using stored refresh token
- `getValidAccessToken()` - Get valid token, refreshing if necessary
- `isAuthenticated()` - Check if user has valid tokens
- `redirectToAuth()` - Redirect to external auth app
- `getUserInfoFromToken()` - Extract user info from JWT

### 4. Token Manager

**File:** `components/lib/tokenManager.ts`

Handles token refresh with proper concurrency control to prevent multiple simultaneous refresh requests.

### 5. HTTP Wrapper

**File:** `components/lib/http.ts`

Enhanced fetch wrapper with automatic authentication:

- `httpFetch(url, options)` - Fetch with auto token handling
- `httpFetchJson(url, options)` - JSON API calls
- `httpPost(url, data, options)` - POST requests
- `httpGet(url, options)` - GET requests

**Features:**

- Automatically adds `Authorization: Bearer <token>` header
- Handles 401/403 responses by refreshing token once
- Redirects to external app if authentication fails completely

### 6. Auth Guard Component

**File:** `components/auth/AuthGuard.tsx`

React component to protect routes:

```tsx
import { AuthGuard } from '@/components/auth/AuthGuard';

<AuthGuard>
  <YourProtectedComponent />
</AuthGuard>;
```

### 7. Redirect Utilities

**File:** `components/lib/redirect.ts`

- `LOGIN_URL` - The FlowRMS login URL (configurable via `NEXT_PUBLIC_LOGIN_URL`)
- `redirectToLogin()` - Redirect to FlowRMS login page

### 8. Server-Side Auth

**File:** `components/lib/server-auth.ts`

For use in API routes:

```typescript
import { validateAuth, createUnauthorizedResponse } from '@/components/lib/server-auth';

export async function GET(request) {
  const authResult = validateAuth(request);
  if (!authResult.isValid) {
    return createUnauthorizedResponse(authResult.error);
  }

  // Your protected logic here
}
```

## Token Storage

Tokens are stored in localStorage with these keys:

- `access_token` - JWT access token
- `refresh_token` - Refresh token for obtaining new access tokens

## Token Refresh

The refresh endpoint is: `https://py.report.flowrms.com/api/auth/refresh`

Request:

```json
{
  "refresh_token": "your_refresh_token_here"
}
```

Response:

```json
{
  "access_token": "new_access_token",
  "refresh_token": "new_refresh_token"
}
```

## Environment Variables

| Variable                  | Description             | Default                    |
| ------------------------- | ----------------------- | -------------------------- |
| `NEXT_PUBLIC_LOGIN_URL`   | FlowRMS login page URL  | `https://app2.flowrms.com` |
| `NEXT_PUBLIC_FLOWCRM_GRAPHQL_URL` | CRM GraphQL endpoint | (required)                 |

## URLs for FlowRMS Team

Provide these URLs to the FlowRMS team for redirect configuration:

### Production

- **Token Receive Endpoint:** `https://your-production-domain.com/api/auth/receive-token`
- **Method:** POST
- **Form Fields:** `access_token`, `refresh_token`

### Staging

- **Token Receive Endpoint:** `https://your-staging-domain.com/api/auth/receive-token`
- **Method:** POST
- **Form Fields:** `access_token`, `refresh_token`

### Development

- **Token Receive Endpoint:** `http://localhost:3000/api/auth/receive-token`
- **Method:** POST
- **Form Fields:** `access_token`, `refresh_token`

## Example FlowRMS Integration

The FlowRMS application should include a form like this to redirect users to FlowCRM:

```html
<!-- In FlowRMS application -->
<form
  id="flowcrm-redirect"
  action="https://your-flowcrm-domain.com/api/auth/receive-token"
  method="POST"
>
  <input type="hidden" name="access_token" id="access_token" />
  <input type="hidden" name="refresh_token" id="refresh_token" />
</form>

<script>
  function redirectToFlowCRM() {
    // Get tokens from FlowRMS session
    const accessToken = getAccessTokenFromSession(); // Implement this
    const refreshToken = getRefreshTokenFromSession(); // Implement this

    document.getElementById('access_token').value = accessToken;
    document.getElementById('refresh_token').value = refreshToken;
    document.getElementById('flowcrm-redirect').submit();
  }
</script>
```

Or as a simple link/button:

```html
<button onclick="redirectToFlowCRM()">Open FlowCRM</button>
```

## Testing

To test the authentication flow:

1. Navigate to `/auth/test` to access the test page
2. Use the test form to submit mock tokens
3. Verify redirection through bridge to dashboard
4. Test token refresh by making API calls with expired tokens
5. Test fallback to external app when tokens are invalid

## Security Considerations

- Tokens are stored in localStorage (client-side only)
- Server-side validation includes basic JWT format and expiration checks
- Automatic token refresh prevents unnecessary re-authentication
- Fallback to external authentication app ensures users can always authenticate
- 30-second buffer before token expiration to prevent edge cases

## Auth Priority

The GraphQL client checks for authentication in this order:

1. **SSO Tokens** (from FlowRMS redirect) - stored as `access_token`/`refresh_token`
2. **Token Server** - if enabled via configuration
3. **Manual Tokens** - stored as `flowcrm_access_token`/`flowcrm_refresh_token`

This ensures backward compatibility with existing authentication methods while prioritizing SSO.
