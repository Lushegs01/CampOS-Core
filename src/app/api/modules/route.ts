import { NextRequest, NextResponse } from "next/server";
import { getSession, requireTenant } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/modules
 * List available modules for the current user/institution.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeGlobal = searchParams.get("includeGlobal") === "true";

    const where: any = { isActive: true };

    if (session.institutionId) {
      // Show institution-specific modules + global modules
      where.OR = [
        { institutionId: session.institutionId },
        { isGlobal: true },
      ];
    } else if (session.roles.includes("super_admin")) {
      // Super admin sees all
    } else {
      // No institution, no super admin = only global modules
      where.isGlobal = true;
    }

    const modules = await prisma.moduleRegistration.findMany({
      where,
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
        isGlobal: m.isGlobal,
      })),
    });
  } catch (error) {
    console.error("Modules error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/modules
 * Register a new module for an institution (admin only).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = session.roles.some((r) =>
      ["super_admin", "institution_admin"].includes(r)
    );
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      displayName,
      description,
      icon,
      baseUrl,
      requiredRoles = [],
      apiVersion = "v1",
      isGlobal = false,
    } = body;

    if (!name || !displayName) {
      return NextResponse.json(
        { error: "name and displayName are required" },
        { status: 400 }
      );
    }

    const institutionId = isGlobal ? null : session.institutionId;

    const moduleReg = await prisma.moduleRegistration.create({
      data: {
        name,
        displayName,
        description: description || null,
        icon: icon || "AppWindow",
        baseUrl: baseUrl || `/dashboard/student/${name}`,
        requiredRoles,
        apiVersion,
        isGlobal,
        institutionId,
      },
    });

    return NextResponse.json({ module: moduleReg }, { status: 201 });
  } catch (error: any) {
    console.error("Module registration error:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Module with this name already exists for this institution" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/modules
 * Update a module registration (admin only).
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = session.roles.some((r) =>
      ["super_admin", "institution_admin"].includes(r)
    );
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Module id is required" },
        { status: 400 }
      );
    }

    // Ensure non-super-admins can only update their institution's modules
    const where: any = { id };
    if (!session.roles.includes("super_admin") && session.institutionId) {
      where.institutionId = session.institutionId;
    }

    const existing = await prisma.moduleRegistration.findFirst({ where });
    if (!existing) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    const moduleReg = await prisma.moduleRegistration.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({ module: moduleReg });
  } catch (error) {
    console.error("Module update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/modules
 * Deactivate a module registration (admin only).
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = session.roles.some((r) =>
      ["super_admin", "institution_admin"].includes(r)
    );
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Module id is required" },
        { status: 400 }
      );
    }

    // Ensure non-super-admins can only delete their institution's modules
    const where: any = { id };
    if (!session.roles.includes("super_admin") && session.institutionId) {
      where.institutionId = session.institutionId;
    }

    const existing = await prisma.moduleRegistration.findFirst({ where });
    if (!existing) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    // Soft delete: deactivate instead of hard delete
    await prisma.moduleRegistration.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, message: "Module deactivated" });
  } catch (error) {
    console.error("Module deactivation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
