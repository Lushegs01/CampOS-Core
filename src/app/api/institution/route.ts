import { NextRequest, NextResponse } from "next/server";
import { getSession, requireTenant, requirePermission, isSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      // Only super_admin can access any institution by ID
      // Others can only access their own institution
      if (!isSuperAdmin(session) && session.institutionId !== id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const institution = await prisma.institution.findUnique({
        where: { id },
        include: {
          faculties: { include: { departments: { include: { programs: true } } } },
          _count: { select: { students: true } },
        },
      });
      return NextResponse.json({ institution });
    }

    // Super admin: list all institutions
    // Others: list only their own institution
    if (isSuperAdmin(session)) {
      const institutions = await prisma.institution.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          code: true,
          logoUrl: true,
          country: true,
          city: true,
          _count: { select: { students: true } },
        },
      });
      return NextResponse.json({ institutions });
    }

    // Non-super-admin: only their institution
    if (!session.institutionId) {
      return NextResponse.json({ institutions: [] });
    }

    const institution = await prisma.institution.findUnique({
      where: { id: session.institutionId },
      select: {
        id: true,
        name: true,
        slug: true,
        code: true,
        logoUrl: true,
        country: true,
        city: true,
        _count: { select: { students: true } },
      },
    });

    return NextResponse.json({ institutions: institution ? [institution] : [] });
  } catch (error) {
    console.error("Institution error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission(request, "institution", "manage");

    const body = await request.json();
    const { name, slug, code, description, country, city, website } = body;

    const institution = await prisma.institution.create({
      data: { name, slug, code, description, country, city, website },
    });

    return NextResponse.json({ success: true, institution });
  } catch (error: any) {
    console.error("Create institution error:", error);
    if (error.message === "Unauthorized" || error.message?.startsWith("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
