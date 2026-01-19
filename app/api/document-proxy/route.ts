/**
 * Document Proxy API Route
 *
 * Proxies document downloads from cloud storage.
 * Needed to avoid CORS restrictions when downloading documents
 * for ZIP creation.
 */

const ALLOWED_HOSTS = new Set([
  "nyc3.digitaloceanspaces.com",
  "sfo3.digitaloceanspaces.com",
  "storage.googleapis.com",
  "s3.amazonaws.com",
  "s3.us-east-1.amazonaws.com",
  "s3.us-west-2.amazonaws.com",
]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");
  const requestedFilename = searchParams.get("filename");

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

  // Check if host is allowed, or allow if it's a known cloud storage pattern
  const hostname = parsedUrl.hostname;
  const isAllowed =
    ALLOWED_HOSTS.has(hostname) ||
    hostname.endsWith('.digitaloceanspaces.com') ||
    hostname.endsWith('.amazonaws.com') ||
    hostname.endsWith('.googleapis.com') ||
    hostname.endsWith('.cloudfront.net');

  if (!isAllowed) {
    return new Response(
      JSON.stringify({ error: "URL host is not permitted", hostname }),
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
      return new Response(
        JSON.stringify({
          error: "Failed to fetch document",
          status: upstreamResponse.status,
        }),
        {
          status: upstreamResponse.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get the content type from the response
    const contentType = upstreamResponse.headers.get("content-type") || "application/octet-stream";

    // Get the file data as ArrayBuffer
    const fileData = await upstreamResponse.arrayBuffer();

    // Use requested filename, or extract from URL, or use default
    const urlPath = parsedUrl.pathname;
    const urlFilename = urlPath.split('/').pop() || 'document';
    const filename = requestedFilename || urlFilename;

    return new Response(fileData, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Unexpected error fetching document",
        message: error instanceof Error ? error.message : "Unknown server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
