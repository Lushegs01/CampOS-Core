import { type NextRequest } from "next/server";
import { verifyToken } from "./jwt";
import { prisma } from "@/lib/db/prisma";
import { setCurrentTenantContext, type TenantContext } from "@/lib/db/tenant";

export interface WorkspaceSession {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
  institutionId: string | null;
  institutionSlug: string | null;
  avatarUrl?: string;
}

/**
 * Get the current session with full tenant context.
 * Extracts token from Authorization header or cookies.
 * Validates that the user's institution matches the requested workspace.
 */
export async function getSession(req: NextRequest): Promise<WorkspaceSession | null> {
  const authHeader = req.headers.get("authorization");
  const cookieToken = req.cookies.get("accessToken")?.value;
  const token = authHeader?.replace("Bearer ", "") ?? cookieToken ?? "";

  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      roles: { include: { role: { include: { permissions: true } } } },
      institution: true,
    },
  });

  if (!user) return null;

  const roles = user.roles.map((ur) => ur.role.name);
  const permissions = user.roles.flatMap((ur) =>
    ur.role.permissions.map((p) => `${p.resource}:${p.action}`)
  );

  const isSuperAdmin = roles.includes("super_admin");

  // Build tenant context
  const tenantContext: TenantContext = {
    userId: user.id,
    institutionId: user.institutionId,
    institutionSlug: user.institution?.slug || null,
    roles,
    isSuperAdmin,
  };

  // Set the current tenant context for Prisma RLS middleware
  setCurrentTenantContext(tenantContext);

  return {
    userId: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    roles,
    permissions,
    institutionId: user.institutionId,
    institutionSlug: user.institution?.slug || null,
    avatarUrl: user.avatarUrl || undefined,
  };
}

/**
 * Require authentication. Returns session or throws.
 */
export async function requireAuth(req: NextRequest): Promise<WorkspaceSession> {
  const session = await getSession(req);
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

/**
 * Require a specific permission. Returns session or throws.
 */
export async function requirePermission(
  req: NextRequest,
  resource: string,
  action: string
): Promise<WorkspaceSession> {
  const session = await requireAuth(req);
  const permission = `${resource}:${action}`;

  if (!session.permissions.includes(permission) && !session.roles.includes("super_admin")) {
    throw new Error("Forbidden: insufficient permissions");
  }

  return session;
}

/**
 * Require one of the specified roles. Returns session or throws.
 */
export async function requireRole(
  req: NextRequest,
  allowedRoles: string[]
): Promise<WorkspaceSession> {
  const session = await requireAuth(req);
  const hasRole = session.roles.some((r) => allowedRoles.includes(r));

  if (!hasRole && !session.roles.includes("super_admin")) {
    throw new Error("Forbidden: insufficient role");
  }

  return session;
}

/**
 * Require tenant context. Validates that the user belongs to an institution.
 * For non-super-admin users, institutionId is mandatory.
 */
export async function requireTenant(req: NextRequest): Promise<WorkspaceSession> {
  const session = await requireAuth(req);

  // Super admins can operate without institution context
  if (session.roles.includes("super_admin")) {
    return session;
  }

  // All other users MUST have an institution
  if (!session.institutionId) {
    throw new Error("Forbidden: user not assigned to an institution");
  }

  return session;
}

/**
 * Validate that the session's institution matches the requested institution slug.
 * Used in workspace routes to prevent cross-tenant access.
 */
export async function validateWorkspaceAccess(
  req: NextRequest,
  institutionSlug: string
): Promise<WorkspaceSession> {
  const session = await requireTenant(req);

  // Super admins can access any workspace
  if (session.roles.includes("super_admin")) {
    return session;
  }

  // Verify the requested institution matches the user's institution
  if (session.institutionSlug !== institutionSlug) {
    throw new Error(
      `Forbidden: workspace mismatch. User belongs to "${session.institutionSlug}", requested "${institutionSlug}"`
    );
  }

  return session;
}

/**
 * Check if the session has admin privileges.
 */
export function isAdmin(session: WorkspaceSession | null): boolean {
  if (!session) return false;
  return session.roles.some((r) =>
    ["super_admin", "institution_admin", "faculty_admin"].includes(r)
  );
}

/**
 * Check if the session is a student.
 */
export function isStudent(session: WorkspaceSession | null): boolean {
  if (!session) return false;
  return session.roles.includes("student");
}

/**
 * Check if the session is a super admin.
 */
export function isSuperAdmin(session: WorkspaceSession | null): boolean {
  if (!session) return false;
  return session.roles.includes("super_admin");
}
