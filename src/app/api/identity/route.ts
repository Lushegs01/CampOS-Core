import { NextRequest, NextResponse } from "next/server";
import { getSession, requireTenant, validateWorkspaceAccess } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { generateCamposId } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request);

    const profile = await prisma.studentProfile.findUnique({
      where: { userId: session.userId },
      include: {
        institution: true,
        faculty: true,
        department: true,
        program: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    // Verify the profile belongs to the user's institution
    if (session.institutionId && profile.institutionId !== session.institutionId) {
      return NextResponse.json({ error: "Forbidden: profile does not belong to your institution" }, { status: 403 });
    }

    return NextResponse.json({
      identity: {
        camposId: profile.camposId,
        matricNumber: profile.matricNumber,
        firstName: session.firstName,
        lastName: session.lastName,
        institution: profile.institution.name,
        faculty: profile.faculty.name,
        department: profile.department.name,
        program: profile.program?.name,
        level: profile.level,
        enrollmentStatus: profile.enrollmentStatus,
        graduationStatus: profile.graduationStatus,
        verificationStatus: profile.verificationStatus,
      },
    });
  } catch (error: any) {
    console.error("Identity error:", error);
    if (error.message === "Unauthorized" || error.message?.startsWith("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request);

    const body = await request.json();
    const { facultyId, departmentId, programId, level, matricNumber } = body;

    const existing = await prisma.studentProfile.findUnique({
      where: { userId: session.userId },
    });

    if (existing) {
      return NextResponse.json({ error: "Student profile already exists" }, { status: 409 });
    }

    const profile = await prisma.studentProfile.create({
      data: {
        camposId: generateCamposId(),
        userId: session.userId,
        institutionId: session.institutionId!,
        facultyId,
        departmentId,
        programId,
        level,
        matricNumber,
        enrollmentStatus: "active",
        verificationStatus: "pending",
      },
    });

    return NextResponse.json({
      success: true,
      identity: { camposId: profile.camposId },
    });
  } catch (error: any) {
    console.error("Create identity error:", error);
    if (error.message === "Unauthorized" || error.message?.startsWith("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
