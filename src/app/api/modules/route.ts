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

    const modules = await prisma.moduleRegistration.findMany({
      where: { isActive: true },
      orderBy: { displayName: "asc" },
    });

    const userModules = modules.filter((m) =>
      m.requiredRoles.length === 0 || m.requiredRoles.some((r) => session.roles.includes(r))
    );

    return NextResponse.json({
      modules: userModules.map((m) => ({
        id: m.id,
        name: m.name,
        displayName: m.displayName,
        description: m.description,
        icon: m.icon,
        url: m.baseUrl,
        apiVersion: m.apiVersion,
      })),
    });
  } catch (error) {
    console.error("Modules error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
