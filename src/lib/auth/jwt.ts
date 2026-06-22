import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { redis } from "@/lib/db/redis";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "campos-jwt-secret-change-in-production"
);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string[];
  institutionId?: string;
  iat?: number;
  exp?: number;
}

export async function createAccessToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    institutionId: payload.institutionId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(JWT_SECRET);
}

export async function createRefreshToken(payload: JWTPayload): Promise<string> {
  const refreshToken = new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    institutionId: payload.institutionId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  // Store in Redis for revocation support
  await redis.setex(
    `refresh:${payload.userId}`,
    7 * 24 * 60 * 60,
    refreshToken
  );

  return refreshToken;
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      clockTolerance: 15,
    });
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function revokeToken(userId: string): Promise<void> {
  await redis.del(`refresh:${userId}`);
  await redis.setex(`revoked:${userId}`, 2 * 60 * 60, "revoked");
}

export function generateVerificationToken(): string {
  return crypto.randomUUID();
}

export function generatePasswordResetToken(): string {
  return crypto.randomUUID();
}
