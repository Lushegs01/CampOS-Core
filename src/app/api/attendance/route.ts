import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/attendance
 * Returns the signed-in student's attendance records (reported by ScanMark)
 * plus a per-course summary, for the CampOS dashboard.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request);

    // findFirst (not findUnique): the tenant RLS middleware wraps where in AND.
    const profile = await prisma.studentProfile.findFirst({
      where: { userId: session.userId },
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json({ records: [], summary: { total: 0, courses: [] } });
    }

    const records = await prisma.attendanceRecord.findMany({
      where: { studentProfileId: profile.id },
      orderBy: { scannedAt: "desc" },
      take: 100,
    });

    // Per-course summary
    const byCourse = new Map<
      string,
      { courseCode: string; courseTitle: string | null; count: number; lastScannedAt: Date }
    >();
    for (const r of records) {
      const existing = byCourse.get(r.courseCode);
      if (existing) {
        existing.count += 1;
        if (r.scannedAt > existing.lastScannedAt) existing.lastScannedAt = r.scannedAt;
      } else {
        byCourse.set(r.courseCode, {
          courseCode: r.courseCode,
          courseTitle: r.courseTitle,
          count: 1,
          lastScannedAt: r.scannedAt,
        });
      }
    }

    return NextResponse.json({
      records: records.map((r) => ({
        id: r.id,
        courseCode: r.courseCode,
        courseTitle: r.courseTitle,
        sessionTitle: r.sessionTitle,
        status: r.status,
        scannedAt: r.scannedAt,
      })),
      summary: {
        total: records.length,
        courses: Array.from(byCourse.values()).sort((a, b) => b.count - a.count),
      },
    });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message?.startsWith("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Attendance read error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
