import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get<T>(key);
    if (!data) return null;
    return data;
  } catch (e) {
    return null;
  }
}

export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds: number = 3600
): Promise<void> {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (e) {}
}

export async function deleteCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (e) {}
}

export async function deleteCachePattern(pattern: string): Promise<void> {
  try {
    let cursor: string = "0";
    do {
      const [nextCursor, keys] = await redis.scan(cursor, { match: pattern, count: 100 });
      cursor = String(nextCursor);
      if (keys.length > 0) {
        await redis.del(...(keys as string[]));
      }
    } while (cursor !== "0");
  } catch (e) {}
}
