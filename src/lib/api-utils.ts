import { NextResponse } from "next/server";

type RouteHandler = (
  req: Request,
  context?: { params: Promise<Record<string, string | string[]>> }
) => Promise<Response>;

export function withErrorHandling(handler: (...args: never[]) => Promise<Response>): RouteHandler {
  return async (req, context) => {
    try {
      return await (handler as RouteHandler)(req, context);
    } catch (error) {
      if (error instanceof SyntaxError) {
        return NextResponse.json(
          { error: "Invalid JSON in request body" },
          { status: 400 }
        );
      }

      console.error(`Unhandled error in ${req.method} ${req.url}:`, error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

/**
 * Create a JSON response with Cache-Control headers for browser caching.
 * - `private`: Response varies by user (contains isLiked, isFollowing, etc.)
 * - `public`: Response is identical for all users (or no auth)
 */
export function cachedJson(
  data: unknown,
  opts: {
    /** "private" for user-specific, "public" for shared */
    scope?: "private" | "public";
    /** Browser cache max-age in seconds (default 30) */
    maxAge?: number;
    /** CDN/proxy stale-while-revalidate in seconds (default 60) */
    swr?: number;
    /** HTTP status code (default 200) */
    status?: number;
  } = {}
) {
  const { scope = "private", maxAge = 30, swr = 60, status = 200 } = opts;
  const cacheControl =
    scope === "public"
      ? `public, s-maxage=${maxAge}, stale-while-revalidate=${swr}`
      : `private, max-age=${maxAge}, stale-while-revalidate=${swr}`;

  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": cacheControl },
  });
}
