import { setTokens, getAccessToken, getRefreshToken } from "@/lib/analytics/tokenManager";

// Helper to decode JWT and check expiration
function isTokenExpired(token) {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    // exp is in seconds
    return Date.now() / 1000 > payload.exp - 30; // 30s leeway
  } catch {
    return true;
  }
}

async function fetchAccessTokenWithRefresh(refreshToken) {
  const res = await fetch("https://py.report.flowrms.com/api/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!res.ok) throw new Error("Failed to refresh access token");
  const data = await res.json();
  setTokens({ access: data.access_token, refresh: data.refresh_token });
  return data.access_token;
}

// Main function to get a valid access token
export async function getValidAccessToken() {
  let accessToken = getAccessToken();
  if (!accessToken || isTokenExpired(accessToken)) {
    const refreshToken = getRefreshToken();
    if (!refreshToken) throw new Error("No refresh token available");
    accessToken = await fetchAccessTokenWithRefresh(refreshToken);
  }
  return accessToken;
}

