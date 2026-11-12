import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import authConfig from "@/auth.config";

const { auth } = NextAuth(authConfig);

const isProduction = process.env.NODE_ENV === "production";

const NO_INDEX_PREFIXES = [
  "/app",
  "/admin",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

function shouldNoIndex(pathname: string): boolean {
  return NO_INDEX_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function buildContentSecurityPolicy(): string {
  const directives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ];

  return directives.join("; ");
}

function applySecurityHeaders(response: NextResponse, pathname: string) {
  response.headers.set("Content-Security-Policy", buildContentSecurityPolicy());
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()",
  );
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set(
    "Strict-Transport-Security",
    isProduction ? "max-age=63072000; includeSubDomains; preload" : "max-age=0",
  );

  if (shouldNoIndex(pathname)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const search = request.nextUrl.searchParams;
  const isAuthenticated = Boolean(request.auth);

  // WooCommerce remote Mollie payment server (WP-plugin compatible query params).
  const isRemotePaymentRoot =
    pathname === "/" &&
    (search.get("wrp_mollie_health") === "1" ||
      search.get("ro") === "1" ||
      search.get("mrp") === "1" ||
      search.has("rop") ||
      search.has("ros") ||
      search.has("rof"));

  if (isRemotePaymentRoot) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = "/api/remote-payments";
    return applySecurityHeaders(
      NextResponse.rewrite(rewriteUrl),
      "/api/remote-payments",
    );
  }

  let response = NextResponse.next();

  // Admin area uses a separate session cookie (ir_admin_session), not Auth.js.
  if (pathname.startsWith("/admin")) {
    const isAdminLogin = pathname === "/admin/login";
    const hasAdminSession = Boolean(request.cookies.get("ir_admin_session")?.value);
    if (!isAdminLogin && !hasAdminSession) {
      response = NextResponse.redirect(new URL("/admin/login", request.url));
    } else if (isAdminLogin && hasAdminSession) {
      response = NextResponse.redirect(new URL("/admin", request.url));
    }
    return applySecurityHeaders(response, pathname);
  }

  if (pathname.startsWith("/app")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set(
        "callbackUrl",
        `${pathname}${request.nextUrl.search}`,
      );
      response = NextResponse.redirect(loginUrl);
    }
  }

  return applySecurityHeaders(response, pathname);
});

export const config = {
  matcher: [
    "/app/:path*",
    "/admin/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
