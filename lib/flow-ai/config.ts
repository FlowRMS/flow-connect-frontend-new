export const GRAPHQL_HTTP = process.env.NEXT_PUBLIC_FLOWRMS_GRAPHQL_URL!;
export const GRAPHQL_WS = process.env.NEXT_PUBLIC_FLOWRMS_WS_URL!;
export const FLOWRMS_API_URL = process.env.NEXT_PUBLIC_FLOWRMS_API_URL!;

if (!GRAPHQL_HTTP) {
  throw new Error("Missing NEXT_PUBLIC_FLOWRMS_GRAPHQL_URL in environment");
}

if (!FLOWRMS_API_URL) {
  throw new Error("Missing NEXT_PUBLIC_FLOWRMS_API_URL in environment");
}

if (typeof window !== "undefined" && !GRAPHQL_WS) {
  console.warn("NEXT_PUBLIC_FLOWRMS_WS_URL is not configured; subscriptions disabled.");
}





