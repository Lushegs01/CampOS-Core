import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, extractApiKey } from "@/lib/modules/api-key";

export const dynamic = "force-dynamic";

/**
 * POST /api/modules/verify
 * Verify a module API key and return institution context.
 * Called by external modules to authenticate with the core platform.
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = extractApiKey(request);

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key required. Provide X-API-Key header or Authorization: Bearer <key>" },
        { status: 401 }
      );
    }

    const validated = await validateApiKey(apiKey);

    if (!validated) {
      return NextResponse.json(
        { error: "Invalid or expired API key" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      valid: true,
      module: {
        id: validated.moduleId,
        name: validated.moduleName,
      },
      institution: {
        id: validated.institutionId,
      },
      permissions: validated.permissions,
    });
  } catch (error) {
    console.error("Module verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/modules/verify
 * Health check for module connectivity.
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "campos-core",
    version: "1.0.0",
  });
}
