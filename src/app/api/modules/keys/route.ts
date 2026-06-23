import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import {
  generateApiKey,
  hashApiKey,
  invalidateApiKeyCache,
} from "@/lib/modules/api-key";

export const dynamic = "force-dynamic";

/**
 * GET /api/modules/keys
 * List all API keys for the current institution (admin only).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can manage API keys
    const isAdmin = session.roles.some((r) =>
      ["super_admin", "institution_admin"].includes(r)
    );
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const institutionId = session.institutionId;
    if (!institutionId && !session.roles.includes("super_admin")) {
      return NextResponse.json(
        { error: "Institution context required" },
        { status: 403 }
      );
    }

    const where: any = {};
    if (institutionId) {
      where.institutionId = institutionId;
    }

    const keys = await prisma.moduleApiKey.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      keys: keys.map((k) => ({
        id: k.id,
        moduleName: k.moduleName,
        permissions: k.permissions,
        isActive: k.isActive,
        lastUsedAt: k.lastUsedAt,
        expiresAt: k.expiresAt,
        createdAt: k.createdAt,
      })),
    });
  } catch (error) {
    console.error("API keys list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/modules/keys
 * Generate a new API key for a module.
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

    const institutionId = session.institutionId;
    if (!institutionId && !session.roles.includes("super_admin")) {
      return NextResponse.json(
        { error: "Institution context required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { moduleId, moduleName, permissions = [], expiresInDays = 365 } = body;

    if (!moduleId || !moduleName) {
      return NextResponse.json(
        { error: "moduleId and moduleName are required" },
        { status: 400 }
      );
    }

    // Verify module exists and is registered for this institution
    const moduleReg = await prisma.moduleRegistration.findFirst({
      where: {
        id: moduleId,
        isActive: true,
        OR: [
          { isGlobal: true, institutionId: null },
          { institutionId },
        ],
      },
    });

    if (!moduleReg) {
      return NextResponse.json(
        { error: "Module not found or not registered for this institution" },
        { status: 404 }
      );
    }

    // Generate API key (only returned once)
    const plainKey = generateApiKey();
    const keyHash = hashApiKey(plainKey);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const apiKey = await prisma.moduleApiKey.create({
      data: {
        moduleId,
        moduleName,
        institutionId,
        apiKey: keyHash, // store hash in apiKey field
        secretKey: "", // not used currently
        permissions,
        expiresAt,
      },
    });

    return NextResponse.json({
      id: apiKey.id,
      moduleName: apiKey.moduleName,
      key: plainKey, // ONLY returned on creation
      module: { name: moduleReg.name, displayName: moduleReg.displayName },
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    });
  } catch (error) {
    console.error("API key creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
