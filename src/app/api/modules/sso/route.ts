import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import {
  mintSsoToken,
  resolveModuleSsoBaseUrl,
  SSO_TOKEN_TTL_SECONDS,
} from "@/lib/modules/sso";

export const dynamic = "force-dynamic";

/**
 * GET /api/modules/sso?module=<name>&next=<relative-path>&format=<json>
 *
 * Single sign-on hand-off. The user must already be authenticated with CampOS
 * Core. We mint a short-lived signed token carrying their CampOS identity and
 * 302-redirect the browser to the module's `/sso/callback`, where the module
 * verifies the token and starts its own session.
 *
 *   - `module` (required): registered module name, e.g. "scanmark".
 *   - `next`   (optional): relative path to land on inside the module after login.
 *   - `format=json` (optional): return the token + url as JSON instead of
 *                                redirecting. Useful for local testing.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request);

    const { searchParams } = new URL(request.url);
    const moduleName = searchParams.get("module")?.trim().toLowerCase();
    const next = sanitizeNext(searchParams.get("next"));
    const format = searchParams.get("format");

    if (!moduleName) {
      return NextResponse.json(
        { error: "module query param is required" },
        { status: 400 }
      );
    }

    // Resolve the module within the user's workspace (institution-specific or global).
    const moduleReg = await prisma.moduleRegistration.findFirst({
      where: {
        name: moduleName,
        isActive: true,
        OR: [
          // A global module is available to every workspace, regardless of
          // whether its institutionId happens to be set (matches /api/modules).
          { isGlobal: true },
          { institutionId: session.institutionId ?? undefined },
        ],
      },
    });

    if (!moduleReg) {
      return NextResponse.json(
        { error: `Module "${moduleName}" not found or inactive for this workspace` },
        { status: 404 }
      );
    }

    // Honour the module's role requirements (super_admin bypasses).
    if (moduleReg.requiredRoles.length > 0) {
      const allowed =
        session.roles.includes("super_admin") ||
        moduleReg.requiredRoles.some((r) => session.roles.includes(r));
      if (!allowed) {
        return NextResponse.json(
          { error: "Forbidden: you do not have access to this module" },
          { status: 403 }
        );
      }
    }

    const baseUrl = resolveModuleSsoBaseUrl(moduleReg.name, moduleReg.baseUrl);
    if (!baseUrl) {
      return NextResponse.json(
        {
          error: `Module "${moduleName}" has no external URL configured. Set SSO_URL_${moduleName.toUpperCase()} (or the module baseUrl) to an absolute https URL.`,
        },
        { status: 409 }
      );
    }

    // CampOS identity is the source of truth — attach camposId / matric if the
    // user has a student profile. Admins without a profile still get a token.
    // findFirst (not findUnique): the tenant RLS middleware wraps the where in
    // an AND clause, which findUnique rejects but findFirst accepts.
    const profile = await prisma.studentProfile.findFirst({
      where: { userId: session.userId },
      select: { camposId: true, matricNumber: true, level: true },
    });

    const { token } = await mintSsoToken(
      {
        userId: session.userId,
        camposId: profile?.camposId ?? null,
        matricNumber: profile?.matricNumber ?? null,
        level: profile?.level ?? null,
        email: session.email,
        firstName: session.firstName,
        lastName: session.lastName,
        roles: session.roles,
        institutionId: session.institutionId,
        institutionSlug: session.institutionSlug,
        avatarUrl: session.avatarUrl ?? null,
      },
      moduleReg.name
    );

    const callbackUrl = new URL(`${baseUrl}/sso/callback`);
    callbackUrl.searchParams.set("token", token);
    if (next) callbackUrl.searchParams.set("next", next);

    // Audit the hand-off (non-blocking — never let logging break login).
    if (session.institutionId) {
      prisma.auditLog
        .create({
          data: {
            userId: session.userId,
            institutionId: session.institutionId,
            action: "SSO_HANDOFF",
            resource: "module",
            resourceId: moduleReg.id,
            newValue: JSON.stringify({ module: moduleReg.name }),
            ipAddress:
              request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
              undefined,
            userAgent: request.headers.get("user-agent") || undefined,
            status: "success",
          },
        })
        .catch((e) => console.error("SSO audit log failed:", e));
    }

    if (format === "json") {
      return NextResponse.json({
        module: moduleReg.name,
        url: callbackUrl.toString(),
        token,
        expiresInSeconds: SSO_TOKEN_TTL_SECONDS,
      });
    }

    return NextResponse.redirect(callbackUrl.toString(), { status: 302 });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      // Browser navigation → bounce to login so the user can sign in, then retry.
      if (request.headers.get("accept")?.includes("text/html")) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set(
          "redirect",
          request.nextUrl.pathname + request.nextUrl.search
        );
        return NextResponse.redirect(loginUrl.toString(), { status: 302 });
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.startsWith("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("SSO mint error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Only allow relative, single-leading-slash paths to prevent open-redirect
 * abuse via the `next` parameter. The destination origin always comes from
 * trusted config, never from the request.
 */
function sanitizeNext(next: string | null): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}
