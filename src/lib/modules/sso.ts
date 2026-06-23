import { SignJWT } from "jose";
import crypto from "crypto";

/**
 * SSO hand-off between CampOS Core (the identity provider) and external module
 * apps (ScanMark, UniReg, FunaaBnB, NADA).
 *
 * CampOS Core mints a short-lived, signed JWT carrying the student's CampOS
 * identity. The external app verifies the signature with the SAME shared secret,
 * trusts the claims, and establishes its own session — so the student logs in
 * once at CampOS and lands in any module already authenticated.
 *
 * The token is intentionally short-lived (60s) because it only needs to survive
 * a single browser redirect. Treat it like a one-time hand-off code.
 */

const SSO_SECRET = new TextEncoder().encode(
  process.env.SSO_JWT_SECRET ||
    process.env.JWT_SECRET ||
    "campos-jwt-secret-change-in-production"
);

export const SSO_ISSUER = "campos-core";
export const SSO_TOKEN_TTL_SECONDS = 60;

export interface SsoTokenClaims {
  userId: string;
  camposId: string | null;
  matricNumber: string | null;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  institutionId: string | null;
  institutionSlug: string | null;
  avatarUrl?: string | null;
}

/**
 * Mint a signed, short-lived SSO token for a specific module.
 *
 * The `audience` is the module name (e.g. "scanmark"). The receiving app should
 * verify `aud` matches itself so a token minted for one module can't be replayed
 * against another.
 */
export async function mintSsoToken(
  claims: SsoTokenClaims,
  audience: string
): Promise<{ token: string; jti: string }> {
  const jti = crypto.randomUUID();

  const token = await new SignJWT({
    camposId: claims.camposId,
    matricNumber: claims.matricNumber,
    email: claims.email,
    firstName: claims.firstName,
    lastName: claims.lastName,
    roles: claims.roles,
    institutionId: claims.institutionId,
    institutionSlug: claims.institutionSlug,
    avatarUrl: claims.avatarUrl ?? null,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(claims.userId)
    .setIssuer(SSO_ISSUER)
    .setAudience(audience)
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(`${SSO_TOKEN_TTL_SECONDS}s`)
    .sign(SSO_SECRET);

  return { token, jti };
}

/**
 * Resolve the external base URL for a module's SSO callback.
 *
 * Resolution order (first match wins):
 *   1. Env override  SSO_URL_<MODULE>   e.g. SSO_URL_SCANMARK=https://scanmark.example.com
 *   2. The module's registered `baseUrl`, if it is an absolute http(s) URL.
 *
 * Returns null when no absolute URL is configured (internal-only modules), so
 * the caller can fail loudly instead of redirecting to a relative path.
 */
export function resolveModuleSsoBaseUrl(
  moduleName: string,
  registeredBaseUrl?: string | null
): string | null {
  const envKey = `SSO_URL_${moduleName.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;
  const envUrl = process.env[envKey];
  if (envUrl && isAbsoluteHttpUrl(envUrl)) {
    return stripTrailingSlash(envUrl);
  }

  if (registeredBaseUrl && isAbsoluteHttpUrl(registeredBaseUrl)) {
    return stripTrailingSlash(registeredBaseUrl);
  }

  return null;
}

function isAbsoluteHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}
