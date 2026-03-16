import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/dashboard", "/admin", "/onboarding", "/messages"];

export function middleware(request: NextRequest) {
  // Redirect HTTP to HTTPS in production (Cloud Run passes x-forwarded-proto)
  const proto = request.headers.get("x-forwarded-proto");
  if (proto === "http") {
    const httpsUrl = new URL(request.url);
    httpsUrl.protocol = "https:";
    return NextResponse.redirect(httpsUrl, { status: 301 });
  }

  const { pathname } = request.nextUrl;

  // Check if this is a protected route
  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isProtected) {
    // NextAuth v5 uses database sessions — cookie name is "authjs.session-token"
    // or "__Secure-authjs.session-token" in production
    const sessionToken =
      request.cookies.get("authjs.session-token")?.value ??
      request.cookies.get("__Secure-authjs.session-token")?.value;

    if (!sessionToken) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Admin route protection — check role cookie set by session
  // Note: actual role enforcement is in API routes; this is a UX redirect
  // Additional server-side checks exist in admin pages themselves

  const response = NextResponse.next();

  // Security headers
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  response.headers.set("X-XSS-Protection", "1; mode=block");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, icons, manifest, sw.js
     * - public files (images, downloads)
     */
    "/((?!api|_next/static|_next/image|favicon\\.ico|icons|manifest\\.json|sw\\.js|downloads|opengraph-image).*)",
  ],
};
