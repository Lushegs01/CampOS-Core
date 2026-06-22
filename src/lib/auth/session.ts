import { type NextRequest } from "next/server";
import { verifyToken } from "./jwt";
import { prisma } from "@/lib/db/prisma";

export async function getSession(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "") ?? "";

  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      roles: {
        include: { role: { include: { permissions: true } } },
      },
      institution: true,
    },
  });

  if (!user) return null;

  return {
    userId: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    roles: user.roles.map((ur) => ur.role.name),
    permissions: user.roles.flatMap((ur) =>
      ur.role.permissions.map((p) => `${p.resource}:${p.action}`)
    ),
    institutionId: user.institutionId,
    avatarUrl: user.avatarUrl,
  };
}

export async function requireAuth(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requirePermission(
  req: NextRequest,
  resource: string,
  action: string
) {
  const session = await requireAuth(req);
  const permission = `${resource}:${action}`;

  if (!session.permissions.includes(permission)) {
    throw new Error("Forbidden");
  }

  return session;
}

export async function requireRole(req: NextRequest, roles: string[]) {
  const session = await requireAuth(req);
  const hasRole = session.roles.some((r) => roles.includes(r));

  if (!hasRole) {
    throw new Error("Forbidden");
  }

  return session;
}

export function isAdmin(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session) return false;
  return session.roles.some((r) =>
    ["super_admin", "institution_admin", "faculty_admin"].includes(r)
  );
}

export function isStudent(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session) return false;
  return session.roles.includes("student");
}
