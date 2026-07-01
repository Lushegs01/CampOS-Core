import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { rateLimitMiddleware } from "@/lib/security/rate-limit";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "campos-jwt-secret-change-in-production"
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limiting for API routes (run FIRST)
  if (pathname.startsWith("/api")) {
    const rateLimitResponse = await rateLimitMiddleware(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
  }

  // Public routes — always allowed (no session cookie required).
  // The module API endpoints below authenticate via API key in the route
  // handler itself, so the cookie-based middleware must let them through.
  const publicRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/api/auth", // allow all auth API endpoints
    "/api/modules/verify", // module API-key auth (external modules)
    "/api/modules/attendance", // module API-key auth (attendance ingest)
  ];
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Static assets — never gate Next internals or files served from /public
  // (they resolve at the root, e.g. /logo.png, so match by extension).
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    /\.(png|jpg|jpeg|gif|svg|ico|webp|avif|css|js|map|txt|woff2?|ttf|eot|otf)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Check auth token (from cookie or header)
  const cookieToken = request.cookies.get("accessToken")?.value;
  const token = cookieToken ?? "";

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  let payload: any;
  try {
    const verified = await jwtVerify(token, JWT_SECRET, { clockTolerance: 15 });
    payload = verified.payload;
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const userInstitutionSlug = payload.institutionSlug as string | undefined;
  const userRoles = (payload.role as string[]) || [];
  const isSuperAdmin = userRoles.includes("super_admin");

  // Redirect legacy routes to workspace routes
  if (pathname.startsWith("/student/") || pathname === "/student") {
    const suffix = pathname.replace("/student", "");
    const targetSlug = userInstitutionSlug || "default";
    return NextResponse.redirect(new URL(`/${targetSlug}/student${suffix}`, request.url));
  }

  if (pathname.startsWith("/admin/") || pathname === "/admin") {
    const suffix = pathname.replace("/admin", "");
    const targetSlug = userInstitutionSlug || "default";
    return NextResponse.redirect(new URL(`/${targetSlug}/admin${suffix}`, request.url));
  }

  // Workspace route validation: /:institutionSlug/student or /:institutionSlug/admin
  const workspaceMatch = pathname.match(/^\/([^\/]+)\/(student|admin)/);
  if (workspaceMatch) {
    const requestedSlug = workspaceMatch[1];
    const requestedRole = workspaceMatch[2];

    // Super admins can access any workspace
    if (!isSuperAdmin) {
      // Non-super-admins must match their institution slug
      if (userInstitutionSlug && userInstitutionSlug !== requestedSlug) {
        // Redirect to their correct workspace
        const correctPath = pathname.replace(
          /^\/[^\/]+/,
          `/${userInstitutionSlug}`
        );
        return NextResponse.redirect(new URL(correctPath, request.url));
      }

      // Role-based access control for workspace type
      if (requestedRole === "admin" && !userRoles.some((r) => ["super_admin", "institution_admin", "faculty_admin"].includes(r))) {
        return NextResponse.redirect(new URL(`/${userInstitutionSlug || requestedSlug}/student`, request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
