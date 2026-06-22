import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        roles: { include: { role: { include: { permissions: true } } } },
        institution: true,
        studentProfile: {
          include: {
            institution: true,
            faculty: true,
            department: true,
            program: true,
          },
        },
        _count: {
          select: { notifications: { where: { isRead: false } } },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const roles = user.roles.map((ur) => ur.role.name);
    const permissions = user.roles.flatMap((ur) =>
      ur.role.permissions.map((p) => `${p.resource}:${p.action}`)
    );

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        roles,
        permissions,
        institution: user.institution
          ? { id: user.institution.id, name: user.institution.name, slug: user.institution.slug }
          : null,
        studentProfile: user.studentProfile
          ? {
              camposId: user.studentProfile.camposId,
              matricNumber: user.studentProfile.matricNumber,
              level: user.studentProfile.level,
              enrollmentStatus: user.studentProfile.enrollmentStatus,
              verificationStatus: user.studentProfile.verificationStatus,
              faculty: user.studentProfile.faculty.name,
              department: user.studentProfile.department.name,
              program: user.studentProfile.program?.name,
            }
          : null,
        unreadNotifications: user._count.notifications,
      },
    });
  } catch (error) {
    console.error("Me endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
