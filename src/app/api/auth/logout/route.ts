import { NextRequest, NextResponse } from "next/server";
import { verifyToken, revokeToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") ?? "";
    const refreshToken = request.cookies.get("refreshToken")?.value;

    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        await revokeToken(payload.userId);
        await prisma.session.updateMany({
          where: { userId: payload.userId, isRevoked: false },
          data: { isRevoked: true },
        });
      }
    }

    const response = NextResponse.json({ success: true, message: "Logged out successfully" });
    response.cookies.delete("accessToken");
    response.cookies.delete("refreshToken");
    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// NOTE: Logout is intentionally POST-only. A GET handler here is dangerous
// because Next.js <Link> prefetching (and browser prefetch) would fire a GET
// to this route in the background and silently delete the session cookies.
