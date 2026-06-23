import { prisma } from "@/lib/db/prisma";
import { redis } from "@/lib/db/redis";
import crypto from "crypto";

const API_KEY_PREFIX = "campos_api_";
const API_KEY_CACHE_TTL = 60 * 5; // 5 minutes

export interface ValidatedApiKey {
  keyId: string;
  moduleName: string;
  moduleId: string;
  institutionId: string;
  permissions: string[];
}

/**
 * Generate a secure API key for a module.
 * Format: campos_api_<random_hex>
 */
export function generateApiKey(): string {
  return `${API_KEY_PREFIX}${crypto.randomBytes(32).toString("hex")}`;
}

/**
 * Hash an API key for storage (SHA-256).
 */
export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

/**
 * Validate an API key and return its associated module/institution info.
 * Uses Redis caching for performance.
 */
export async function validateApiKey(
  apiKey: string
): Promise<ValidatedApiKey | null> {
  if (!apiKey.startsWith(API_KEY_PREFIX)) {
    return null;
  }

  const keyHash = hashApiKey(apiKey);
  const cacheKey = `campos:apikey:${keyHash}`;

  // Check cache first
  const cached = await redis.get<ValidatedApiKey>(cacheKey);
  if (cached) {
    return cached;
  }

  // Lookup in database by hashed key
  const keyRecord = await prisma.moduleApiKey.findFirst({
    where: {
      apiKey: keyHash, // storing hash in apiKey field
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });

  if (!keyRecord) {
    return null;
  }

  const validated: ValidatedApiKey = {
    keyId: keyRecord.id,
    moduleName: keyRecord.moduleName,
    moduleId: keyRecord.moduleId,
    institutionId: keyRecord.institutionId!,
    permissions: keyRecord.permissions,
  };

  // Cache for 5 minutes
  await redis.setex(cacheKey, API_KEY_CACHE_TTL, JSON.stringify(validated));

  return validated;
}

/**
 * Clear API key from cache (e.g., after revocation).
 */
export async function invalidateApiKeyCache(apiKey: string): Promise<void> {
  const keyHash = hashApiKey(apiKey);
  await redis.del(`campos:apikey:${keyHash}`);
}

/**
 * Log an API request for analytics and audit.
 */
export async function logApiRequest(params: {
  moduleName: string;
  institutionId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  ipAddress?: string;
  apiKeyId?: string;
}): Promise<void> {
  try {
    await prisma.apiRequestLog.create({
      data: {
        moduleName: params.moduleName,
        institutionId: params.institutionId,
        endpoint: params.endpoint,
        method: params.method,
        statusCode: params.statusCode,
        responseTime: params.responseTime,
        ipAddress: params.ipAddress || null,
      },
    });
  } catch (error) {
    // Non-blocking: log to console but don't fail the request
    console.error("API request log failed:", error);
  }
}

/**
 * Check if a module is registered and active for an institution.
 */
export async function isModuleActiveForInstitution(
  moduleName: string,
  institutionId: string
): Promise<boolean> {
  const moduleReg = await prisma.moduleRegistration.findFirst({
    where: {
      name: moduleName,
      isActive: true,
      OR: [
        { isGlobal: true, institutionId: null },
        { institutionId },
      ],
    },
  });
  return !!moduleReg;
}

/**
 * Extract API key from request headers.
 * Looks for X-API-Key header or Authorization: Bearer <key>
 */
export function extractApiKey(request: Request): string | null {
  const xApiKey = request.headers.get("x-api-key");
  if (xApiKey) return xApiKey;

  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7);
  }

  return null;
}
