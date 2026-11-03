import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "sentinel_session";
export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

type AuthConfig = {
  password: string;
  secret: string;
};

export function getAuthConfig(): AuthConfig | null {
  const password = process.env.SITE_PASSWORD;
  const secret = process.env.SESSION_SECRET;
  if (!password || password.length < 12 || !secret || secret.length < 32) return null;
  return { password, secret };
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

export function passwordsMatch(candidate: string, expected: string): boolean {
  return timingSafeEqual(digest(candidate), digest(expected));
}

function signature(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSessionToken(secret: string): string {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const payload = String(expiresAt);
  return `${payload}.${signature(payload, secret)}`;
}

export function verifySessionToken(token: string | undefined, secret: string): boolean {
  if (!token) return false;
  const [payload, suppliedSignature, extra] = token.split(".");
  if (!payload || !suppliedSignature || extra) return false;

  const expiresAt = Number(payload);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) return false;

  const expectedSignature = signature(payload, secret);
  return timingSafeEqual(digest(suppliedSignature), digest(expectedSignature));
}
