import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { setCurrentTenantContext } from "@/lib/db/tenant";
import { validateApiKey, extractApiKey, logApiRequest } from "@/lib/modules/api-key";

export const dynamic = "force-dynamic";

/**
 * POST /api/modules/attendance
 *
 * Ingest an attendance event reported by an external module (e.g. ScanMark).
 * Authenticated with a module API key (X-API-Key header or Authorization: Bearer <key>).
 *
 * Body: {
 *   camposId? | matricNumber? | email?   // at least one — the shared identity
 *   courseCode (required), courseTitle?, sessionId?, sessionTitle?,
 *   status? (present|late|absent), externalId?, scannedAt?
 * }
 *
 * Idempotent on (source, externalId) when externalId is supplied, so retries
 * and re-syncs never create duplicates.
 */
export async function POST(request: NextRequest) {
  const startedAt = Date.now();

  // This endpoint authenticates by API key, not a user session. Clear any
  // tenant context that may linger on a warm instance so RLS doesn't filter
  // our lookups — we enforce institution isolation explicitly below.
  setCurrentTenantContext(null);

  const apiKey = extractApiKey(request);
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key required (X-API-Key header or Authorization: Bearer <key>)" },
      { status: 401 }
    );
  }

  const validated = await validateApiKey(apiKey);
  if (!validated) {
    return NextResponse.json({ error: "Invalid or expired API key" }, { status: 401 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;

  const respond = (body: any, status: number) => {
    logApiRequest({
      moduleName: validated.moduleName,
      institutionId: validated.institutionId,
      endpoint: "/api/modules/attendance",
      method: "POST",
      statusCode: status,
      responseTime: Date.now() - startedAt,
      ipAddress: ip,
      apiKeyId: validated.keyId,
    }).catch(() => {});
    return NextResponse.json(body, { status });
  };

  try {
    const body = await request.json().catch(() => ({}));
    const {
      camposId,
      matricNumber,
      email,
      courseCode,
      courseTitle,
      sessionId,
      sessionTitle,
      status,
      externalId,
      scannedAt,
    } = body || {};

    if (!courseCode) {
      return respond({ error: "courseCode is required" }, 400);
    }
    if (!camposId && !matricNumber && !email) {
      return respond(
        { error: "One of camposId, matricNumber, or email is required" },
        400
      );
    }

    // Resolve the student profile (CampOS identity is the source of truth).
    let profile =
      (camposId
        ? await prisma.studentProfile.findUnique({ where: { camposId: String(camposId) } })
        : null) ||
      (matricNumber
        ? await prisma.studentProfile.findUnique({ where: { matricNumber: String(matricNumber) } })
        : null);

    if (!profile && email) {
      const user = await prisma.user.findUnique({
        where: { email: String(email).toLowerCase() },
        include: { studentProfile: true },
      });
      profile = user?.studentProfile ?? null;
    }

    if (!profile) {
      return respond({ error: "Student not found for the provided identity" }, 404);
    }

    // Tenant isolation: the student must belong to the API key's institution.
    if (profile.institutionId !== validated.institutionId) {
      return respond(
        { error: "Student does not belong to this module's institution" },
        403
      );
    }

    const parsedDate = scannedAt ? new Date(scannedAt) : new Date();
    const scannedAtDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    const safeStatus = ["present", "late", "absent"].includes(status)
      ? status
      : "present";

    const data = {
      studentProfileId: profile.id,
      camposId: profile.camposId,
      matricNumber: profile.matricNumber,
      institutionId: profile.institutionId,
      courseCode: String(courseCode),
      courseTitle: courseTitle ? String(courseTitle) : null,
      sessionId: sessionId ? String(sessionId) : null,
      sessionTitle: sessionTitle ? String(sessionTitle) : null,
      status: safeStatus,
      source: "scanmark",
      externalId: externalId ? String(externalId) : null,
      scannedAt: scannedAtDate,
    };

    const record = data.externalId
      ? await prisma.attendanceRecord.upsert({
          where: {
            source_externalId: { source: "scanmark", externalId: data.externalId },
          },
          update: {
            status: data.status,
            scannedAt: data.scannedAt,
            courseCode: data.courseCode,
            courseTitle: data.courseTitle,
            sessionId: data.sessionId,
            sessionTitle: data.sessionTitle,
          },
          create: data,
        })
      : await prisma.attendanceRecord.create({ data });

    // Best-effort activity entry for analytics/feeds.
    prisma.userActivity
      .create({
        data: {
          userId: profile.userId,
          institutionId: profile.institutionId,
          action: "attendance",
          module: "scanmark",
          metadata: JSON.stringify({
            courseCode: data.courseCode,
            status: data.status,
          }),
          ipAddress: ip,
        },
      })
      .catch(() => {});

    return respond(
      {
        success: true,
        id: record.id,
        recorded: {
          camposId: data.camposId,
          courseCode: data.courseCode,
          status: data.status,
          scannedAt: data.scannedAt,
        },
      },
      200
    );
  } catch (error: any) {
    console.error("Attendance ingest error:", error);
    return respond({ error: "Internal server error" }, 500);
  }
}
