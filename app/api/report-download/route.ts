/**
 * Report Download API Route
 * 
 * Proxies CSV report downloads from DigitalOcean Spaces.
 * This is needed because the presigned URLs from the GraphQL API
 * may have CORS restrictions that prevent direct browser access.
 */

const ALLOWED_HOSTS = new Set(["nyc3.digitaloceanspaces.com"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return new Response(
      JSON.stringify({ error: "Missing url query parameter" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(targetUrl);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid url parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!ALLOWED_HOSTS.has(parsedUrl.hostname)) {
    return new Response(
      JSON.stringify({ error: "URL host is not permitted" }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const upstreamResponse = await fetch(parsedUrl.toString(), {
      method: "GET",
      cache: "no-store",
    });

    if (!upstreamResponse.ok) {
      const errorPayload = await upstreamResponse
        .text()
        .catch(() => "Upstream fetch failed");
      return new Response(
        JSON.stringify({
          error: "Failed to fetch upstream report",
          status: upstreamResponse.status,
          message: errorPayload.slice(0, 2048),
        }),
        {
          status: upstreamResponse.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const csvPayload = await upstreamResponse.text();

    return new Response(csvPayload, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Unexpected error fetching report",
        message:
          error instanceof Error ? error.message : "Unknown server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
