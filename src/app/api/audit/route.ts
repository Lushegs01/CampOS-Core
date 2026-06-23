import { NextRequest, NextResponse } from "next/server";
import { getSession, requireTenant } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");
    const action = searchParams.get("action");
    const resource = searchParams.get("resource");

    // Strict tenant isolation: only show logs from user's institution
    const where: any = {};
    if (session.institutionId) {
      where.institutionId = session.institutionId;
    } else if (!session.roles.includes("super_admin")) {
      // Non-super-admin without institution = empty results
      return NextResponse.json({ logs: [], pagination: { page, limit, total: 0, pages: 0 } });
    }

    if (action) where.action = action;
    if (resource) where.resource = resource;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
        orderBy: { timestamp: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      logs: logs.map((log) => ({
        id: log.id,
        userId: log.userId,
        userName: log.user ? `${log.user.firstName} ${log.user.lastName}` : "System",
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId,
        status: log.status,
        timestamp: log.timestamp,
        ipAddress: log.ipAddress,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Audit logs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
