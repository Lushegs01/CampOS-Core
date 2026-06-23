import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword, createAccessToken, createRefreshToken } from "@/lib/auth/jwt";
import { setCurrentTenantContext } from "@/lib/db/tenant";
import { rateLimit } from "@/lib/security/rate-limit";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  // Apply IP-based rate limiting for login attempts
  const ip = request.ip || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed, remaining } = await rateLimit(`login:${ip}`, { requests: 5, window: 60 });
  
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        roles: { include: { role: { include: { permissions: true } } } },
        institution: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!user.isEmailVerified) {
      return NextResponse.json(
        { error: "Please verify your email before logging in" },
        { status: 403 }
      );
    }

    const roles = user.roles.map((ur) => ur.role.name);
    const isSuperAdmin = roles.includes("super_admin");

    // Non-super-admin users MUST belong to an institution
    if (!isSuperAdmin && !user.institutionId) {
      return NextResponse.json(
        { error: "User is not assigned to any institution. Please contact support." },
        { status: 403 }
      );
    }

    // Validate institution is active (for non-super-admin)
    if (!isSuperAdmin && user.institutionId) {
      const institution = await prisma.institution.findUnique({
        where: { id: user.institutionId },
        select: { isActive: true },
      });
      if (!institution || !institution.isActive) {
        return NextResponse.json(
          { error: "Institution is inactive or not found" },
          { status: 403 }
        );
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const permissions = user.roles.flatMap((ur) =>
      ur.role.permissions.map((p) => `${p.resource}:${p.action}`)
    );

    const payload = {
      userId: user.id,
      email: user.email,
      role: roles,
      institutionId: user.institutionId,
      institutionSlug: user.institution?.slug || null,
    };

    const accessToken = await createAccessToken(payload);
    const refreshToken = await createRefreshToken(payload);

    await prisma.session.create({
      data: {
        userId: user.id,
        institutionId: user.institutionId,
        token: accessToken,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userAgent: request.headers.get("user-agent") || undefined,
        ipAddress: request.ip || undefined,
      },
    });

    await prisma.userActivity.create({
      data: {
        userId: user.id,
        institutionId: user.institutionId,
        action: "login",
        module: "core",
        ipAddress: request.ip || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      },
    });

    // Set tenant context for RLS middleware
    setCurrentTenantContext({
      userId: user.id,
      institutionId: user.institutionId,
      institutionSlug: user.institution?.slug || null,
      roles,
      isSuperAdmin,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        roles,
        permissions,
        institution: user.institution
          ? {
              id: user.institution.id,
              name: user.institution.name,
              slug: user.institution.slug,
              code: user.institution.code,
            }
          : null,
      },
      accessToken,
      refreshToken,
    });

    response.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 2 * 60 * 60,
      path: "/",
    });

    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
