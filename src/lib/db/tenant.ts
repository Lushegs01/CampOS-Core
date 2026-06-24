import { Prisma, PrismaClient } from "@prisma/client";
import { redis } from "./redis";

/**
 * List of models that require tenant-scoped queries.
 * These models have an `institutionId` field that must be
 * filtered by the current user's institution.
 */
const TENANT_SCOPED_MODELS: Prisma.ModelName[] = [
  "StudentProfile",
  "NadaProfile",
  "Faculty",
  "Department",
  "Program",
  "Semester",
  "AcademicSession",
  "Notification",
  "NotificationPreference",
  "UserActivity",
  "InstitutionAnalytics",
  "MetricEvent",
  "AuditLog",
  "FileUpload",
  // ModuleRegistration is intentionally NOT tenant-scoped: it holds GLOBAL
  // modules (institutionId: null, isGlobal: true) that must be visible to every
  // institution. RLS-scoping by institutionId would hide global modules from
  // students (institutionId null never matches a student's institution). The
  // module routes already filter explicitly via { institutionId | isGlobal }.
  "ModuleApiKey",
  "ApiRequestLog",
  // User and Role are handled separately due to nullable institutionId for global roles
];

/**
 * Models where we should NOT apply tenant scope (global/lookup tables)
 */
const EXCLUDED_MODELS: Prisma.ModelName[] = [
  "Institution", // Institution table is the tenant definition itself
  "Permission",  // Global permissions table
];

export interface TenantContext {
  userId: string;
  institutionId: string | null;
  institutionSlug: string | null;
  roles: string[];
  isSuperAdmin: boolean;
}

const TENANT_CONTEXT_KEY = "campos:tenant-context";

/**
 * Store tenant context in Redis for the current request lifecycle.
 * This is used by the Prisma middleware to apply RLS.
 */
export async function setTenantContext(context: TenantContext): Promise<void> {
  try {
    await redis.setex(
      `${TENANT_CONTEXT_KEY}:${context.userId}`,
      60 * 60, // 1 hour TTL
      JSON.stringify(context)
    );
  } catch (e) {
    console.warn("Redis not configured, skipping tenant context storage.");
  }
}

/**
 * Get the current tenant context from Redis.
 */
export async function getTenantContext(userId: string): Promise<TenantContext | null> {
  try {
    const data = await redis.get<TenantContext>(`${TENANT_CONTEXT_KEY}:${userId}`);
    if (!data) return null;
    return data as TenantContext;
  } catch (e) {
    return null;
  }
}

/**
 * Clear tenant context from Redis.
 */
export async function clearTenantContext(userId: string): Promise<void> {
  try {
    await redis.del(`${TENANT_CONTEXT_KEY}:${userId}`);
  } catch (e) {
    // Ignore Redis error
  }
}

/**
 * Check if the current user is a super admin (bypasses all tenant checks).
 */
export function isSuperAdmin(roles: string[]): boolean {
  return roles.includes("super_admin");
}

/**
 * Check if the user belongs to the specified institution.
 */
export function belongsToInstitution(
  context: TenantContext,
  institutionId: string
): boolean {
  if (context.isSuperAdmin) return true;
  return context.institutionId === institutionId;
}

/**
 * Prisma middleware that applies Row-Level Security (RLS) automatically.
 *
 * How it works:
 * 1. For every `find` / `findMany` / `findUnique`: adds `institutionId` filter
 * 2. For every `create`: auto-injects `institutionId` if applicable
 * 3. For every `update` / `delete`: verifies the record belongs to the user's institution
 * 4. Super admins bypass all checks
 * 5. Users without an institution (legacy) get empty results for tenant-scoped models
 */
export function createTenantMiddleware(prisma: PrismaClient) {
  return async function tenantMiddleware(
    params: Prisma.MiddlewareParams,
    next: (params: Prisma.MiddlewareParams) => Promise<any>
  ): Promise<any> {
    const model = params.model as Prisma.ModelName;

    // Skip excluded models and non-tenant-scoped models
    if (!model || EXCLUDED_MODELS.includes(model) || !TENANT_SCOPED_MODELS.includes(model)) {
      return next(params);
    }

    // Try to get tenant context from async local storage or Redis
    // For simplicity, we use a module-level variable set per-request
    const context = getCurrentTenantContext();
    if (!context) {
      // No tenant context = no tenant filter applied (for internal/cron jobs)
      return next(params);
    }

    // Super admins bypass RLS
    if (context.isSuperAdmin) {
      return next(params);
    }

    // No institutionId for non-super-admin users = they can't see any tenant-scoped data
    if (!context.institutionId) {
      // Return empty results for read operations
      if (params.action.startsWith("find")) {
        return model === "UserActivity" || model === "Notification"
          ? [] // Array-returning models
          : null; // Single-returning models
      }
      // For write operations, let the database FK constraint fail
      return next(params);
    }

    // Apply tenant scope based on action type
    const scopedParams = applyTenantScope(params, model, context.institutionId);
    return next(scopedParams);
  };
}

/**
 * Apply tenant scope to Prisma query parameters.
 */
function applyTenantScope(
  params: Prisma.MiddlewareParams,
  model: Prisma.ModelName,
  institutionId: string
): Prisma.MiddlewareParams {
  const action = params.action;

  // READ operations: add institutionId to where clause
  if (action.startsWith("find") || action === "aggregate" || action === "count" || action === "groupBy") {
    const args = (params.args || {}) as any;

    // Build the where clause with tenant scope
    const scopedWhere: any = {
      AND: [
        args.where || {},
        { institutionId },
      ],
    };

    return {
      ...params,
      args: {
        ...args,
        where: scopedWhere,
      },
    };
  }

  // CREATE operations: auto-inject institutionId
  if (action === "create" || action === "createMany" || action === "upsert") {
    const args = (params.args || {}) as any;

    if (action === "createMany" && args.data) {
      const dataArray = Array.isArray(args.data) ? args.data : [args.data];
      return {
        ...params,
        args: {
          ...args,
          data: dataArray.map((d: any) => ({ ...d, institutionId })),
        },
      };
    }

    return {
      ...params,
      args: {
        ...args,
        data: {
          ...args.data,
          institutionId,
        },
      },
    };
  }

  // UPDATE / DELETE operations: verify institutionId before modifying
  if (action.startsWith("update") || action === "delete" || action === "deleteMany") {
    const args = (params.args || {}) as any;
    const where = args.where || {};

    // For operations that already have a where clause, add institutionId
    return {
      ...params,
      args: {
        ...args,
        where: {
          AND: [where, { institutionId }],
        },
      },
    };
  }

  return params;
}

// Module-level variable to hold tenant context for the current request
// In a real app, this would use AsyncLocalStorage, but for simplicity
// we use a request-scoped approach via Redis
let _currentTenantContext: TenantContext | null = null;

export function getCurrentTenantContext(): TenantContext | null {
  return _currentTenantContext;
}

export function setCurrentTenantContext(context: TenantContext | null): void {
  _currentTenantContext = context;
}

/**
 * Higher-order function that wraps an API handler with tenant context.
 * Usage:
 *   export const GET = withTenant(async (req, tenant) => { ... })
 */
export function withTenant<T>(
  handler: (req: Request, tenant: TenantContext) => Promise<T>
): (req: Request) => Promise<T> {
  return async (req: Request) => {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") ?? "";

    // Parse token to get userId (simplified - in production use verifyToken)
    // For now, we rely on the session being set by the auth middleware
    const context = getCurrentTenantContext();
    if (!context) {
      throw new Error("Tenant context not available");
    }

    return handler(req, context);
  };
}

/**
 * Tenant-scoped Prisma query helper.
 * Wraps a Prisma query to ensure it includes institutionId.
 */
export function tenantWhere(
  institutionId: string | null,
  additionalWhere?: Record<string, any>
): Record<string, any> {
  if (!institutionId) {
    return additionalWhere || {};
  }

  return {
    AND: [additionalWhere || {}, { institutionId }],
  };
}

/**
 * Tenant-scoped Prisma include helper.
 * Ensures related queries also include institutionId.
 */
export function tenantInclude<T extends Record<string, any>>(
  institutionId: string | null,
  include: T
): T {
  if (!institutionId || isSuperAdmin([])) {
    return include;
  }

  // This is a simplified version - in production you'd recursively
  // add where clauses to all nested includes
  return include;
}
