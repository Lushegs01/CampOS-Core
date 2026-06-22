import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
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
      const institution = await prisma.institution.findUnique({
        where: { id },
        include: {
          faculties: { include: { departments: { include: { programs: true } } } },
          _count: { select: { students: true } },
        },
      });
      return NextResponse.json({ institution });
    }

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
  } catch (error) {
    console.error("Institution error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session || !session.roles.some((r) => ["super_admin", "institution_admin"].includes(r))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, slug, code, description, country, city, website } = body;

    const institution = await prisma.institution.create({
      data: { name, slug, code, description, country, city, website },
    });

    return NextResponse.json({ success: true, institution });
  } catch (error) {
    console.error("Create institution error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
