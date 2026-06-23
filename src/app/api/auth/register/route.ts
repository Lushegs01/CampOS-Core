import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { hashPassword, createAccessToken, createRefreshToken } from "@/lib/auth/jwt";
import { setCurrentTenantContext } from "@/lib/db/tenant";
import { rateLimit } from "@/lib/security/rate-limit";

const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  institutionId: z.string().min(1, "Institution is required"),
});

export async function POST(request: NextRequest) {
  // Rate limit registration by IP
  const ip = request.ip || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimit(`register:${ip}`, { requests: 3, window: 300 });
  
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, password, institutionId } = result.data;

    // Validate institution exists and is active
    const institution = await prisma.institution.findUnique({
      where: { id: institutionId },
      select: { id: true, isActive: true, slug: true },
    });

    if (!institution) {
      return NextResponse.json({ error: "Institution not found" }, { status: 404 });
    }

    if (!institution.isActive) {
      return NextResponse.json({ error: "Institution is not active" }, { status: 403 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        institutionId,
        isEmailVerified: false,
      },
    });

    // Find or create institution-specific student role
    let studentRole = await prisma.role.findFirst({
      where: { name: "student", institutionId },
    });

    if (!studentRole) {
      studentRole = await prisma.role.create({
        data: { name: "student", description: "Student role", institutionId },
      });
    }

    await prisma.userRole.create({
      data: { userId: user.id, roleId: studentRole.id },
    });

    // Create notification preferences scoped to institution
    await prisma.notificationPreference.create({
      data: { userId: user.id, institutionId },
    });

    const roles = ["student"];
    const payload = {
      userId: user.id,
      email: user.email,
      role: roles,
      institutionId: user.institutionId,
      institutionSlug: institution.slug,
    };

    const accessToken = await createAccessToken(payload);
    const refreshToken = await createRefreshToken(payload);

    await prisma.session.create({
      data: {
        userId: user.id,
        institutionId,
        token: accessToken,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userAgent: request.headers.get("user-agent") || undefined,
        ipAddress: request.ip || undefined,
      },
    });

    setCurrentTenantContext({
      userId: user.id,
      institutionId,
      institutionSlug: institution.slug,
      roles,
      isSuperAdmin: false,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
      },
      accessToken,
      refreshToken,
      message: "Registration successful. Please verify your email.",
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
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
