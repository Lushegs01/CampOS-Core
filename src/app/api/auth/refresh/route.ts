import { NextRequest, NextResponse } from "next/server";
import { verifyToken, createAccessToken, createRefreshToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db/prisma";
import { redis } from "@/lib/db/redis";

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refreshToken")?.value ||
      request.headers.get("x-refresh-token") || "";

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token required" },
        { status: 401 }
      );
    }

    const payload = await verifyToken(refreshToken as string);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 401 }
      );
    }

    const storedToken = await redis.get(`refresh:${payload.userId}`);
    if (!storedToken || storedToken !== refreshToken) {
      return NextResponse.json(
        { error: "Refresh token revoked" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        roles: { include: { role: { include: { permissions: true } } } },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const roles = user.roles.map((ur) => ur.role.name);
    const newPayload = {
      userId: user.id,
      email: user.email,
      role: roles,
      institutionId: user.institutionId || undefined,
    };

    const newAccessToken = await createAccessToken(newPayload);
    const newRefreshToken = await createRefreshToken(newPayload);

    await prisma.session.updateMany({
      where: { userId: user.id, refreshToken: refreshToken as string },
      data: { token: newAccessToken, refreshToken: newRefreshToken },
    });

    const response = NextResponse.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });

    response.cookies.set("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 2 * 60 * 60,
      path: "/",
    });

    response.cookies.set("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Refresh error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
