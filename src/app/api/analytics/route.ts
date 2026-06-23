import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request);

    const { searchParams } = new URL(request.url);
    // STRICT: always use session.institutionId, never accept client override
    const institutionId = session.institutionId!;
    const range = searchParams.get("range") || "30d";

    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [institutionStats, dailyMetrics, moduleStats] = await Promise.all([
      prisma.institutionAnalytics.findFirst({
        where: { institutionId },
        orderBy: { date: "desc" },
      }),
      prisma.institutionAnalytics.findMany({
        where: { institutionId, date: { gte: startDate } },
        orderBy: { date: "asc" },
      }),
      prisma.metricEvent.groupBy({
        by: ["type"],
        where: { institutionId, createdAt: { gte: startDate } },
        _sum: { value: true },
        _count: true,
      }),
    ]);

    const totalStudents = await prisma.studentProfile.count({
      where: { institutionId },
    });

    const activeStudents = await prisma.studentProfile.count({
      where: { institutionId, enrollmentStatus: "active" },
    });

    const newRegistrations = await prisma.studentProfile.count({
      where: { institutionId, createdAt: { gte: startDate } },
    });

    return NextResponse.json({
      overview: {
        totalStudents,
        activeStudents,
        newRegistrations,
        attendanceRate: institutionStats?.attendanceRate || 0,
        housingOccupancy: institutionStats?.housingOccupancy || 0,
        nadaActiveUsers: institutionStats?.nadaActiveUsers || 0,
      },
      dailyMetrics: dailyMetrics.map((d) => ({
        date: d.date.toISOString().split("T")[0],
        totalStudents: d.totalStudents,
        activeStudents: d.activeStudents,
        newRegistrations: d.newRegistrations,
      })),
      moduleStats: moduleStats.map((m) => ({
        type: m.type,
        total: m._sum.value || 0,
        count: m._count,
      })),
    });
  } catch (error: any) {
    console.error("Analytics error:", error);
    if (error.message === "Unauthorized" || error.message?.startsWith("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request);

    if (!session.roles.some((r) => ["super_admin", "institution_admin"].includes(r))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { type, value, metadata } = body;

    const event = await prisma.metricEvent.create({
      data: {
        type,
        institutionId: session.institutionId!,
        value: value || 0,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    return NextResponse.json({ success: true, event });
  } catch (error: any) {
    console.error("Create metric error:", error);
    if (error.message === "Unauthorized" || error.message?.startsWith("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
