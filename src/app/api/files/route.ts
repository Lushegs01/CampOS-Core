import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getSession, requireTenant } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const where: any = { userId: session.userId };
    if (category) where.category = category;
    // Add institution filter for tenant isolation
    if (session.institutionId) {
      where.institutionId = session.institutionId;
    }

    const files = await prisma.fileUpload.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ files });
  } catch (error) {
    console.error("Files error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request);

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const category = (formData.get("category") as string) || "document";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf", "application/msword"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    const blob = await put(`${session.institutionId}/${category}/${session.userId}/${file.name}`, file, {
      access: "public",
      contentType: file.type,
    });

    const upload = await prisma.fileUpload.create({
      data: {
        userId: session.userId,
        institutionId: session.institutionId!,
        filename: file.name,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        url: blob.url,
        category,
      },
    });

    return NextResponse.json({ success: true, file: upload });
  } catch (error: any) {
    console.error("Upload error:", error);
    if (error.message === "Unauthorized" || error.message?.startsWith("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
