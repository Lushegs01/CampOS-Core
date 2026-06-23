import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { invalidateApiKeyCache } from "@/lib/modules/api-key";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/modules/keys/:id
 * Revoke (deactivate) an API key.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const keyId = params.id;

    // Find the key and verify it belongs to this institution (or super admin can delete any)
    const where: any = { id: keyId };
    if (institutionId && !session.roles.includes("super_admin")) {
      where.institutionId = institutionId;
    }

    const key = await prisma.moduleApiKey.findFirst({ where });

    if (!key) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    // Deactivate (soft delete)
    await prisma.moduleApiKey.update({
      where: { id: keyId },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, message: "API key revoked" });
  } catch (error) {
    console.error("API key revocation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
