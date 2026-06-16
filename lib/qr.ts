import { SignJWT, jwtVerify } from "jose";

// Member-pass payload encoder.
// Uses jose to HMAC-sign (HS256) short-lived JWTs on the server.
// Fallback to unsigned base64-JSON is kept for client-side local mock mode.

const DEFAULT_TTL_MS = 60_000; // 60 s

export interface MemberPassPayload {
  memberId: string;
  /** Unix ms expiry. */
  exp: number;
}

function toBase64Url(input: string): string {
  if (typeof window === "undefined") {
    return Buffer.from(input, "utf-8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }
  return btoa(input)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? padded : padded + "=".repeat(4 - (padded.length % 4));
  if (typeof window === "undefined") {
    return Buffer.from(pad, "base64").toString("utf-8");
  }
  return atob(pad);
}

/**
 * Client-side unsigned base64-JSON encoder for mock/local development testing.
 */
export function encodeMemberPass(
  memberId: string,
  ttlMs: number = DEFAULT_TTL_MS,
): string {
  const payload: MemberPassPayload = {
    memberId,
    exp: Date.now() + ttlMs,
  };
  return toBase64Url(JSON.stringify(payload));
}

/**
 * Client-side unsigned base64-JSON decoder for mock/local development testing.
 */
export function decodeMemberPass(token: string): MemberPassPayload | null {
  try {
    const json = fromBase64Url(token);
    const data = JSON.parse(json) as MemberPassPayload;
    if (typeof data.memberId !== "string" || typeof data.exp !== "number") {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function isMemberPassExpired(payload: MemberPassPayload): boolean {
  return Date.now() >= payload.exp;
}

/**
 * Server-side secure HMAC-SHA256 signer using jose.
 * Safe to call from API routes (Node.js/Edge).
 */
export async function encodeMemberPassSecure(
  memberId: string,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<string> {
  const secretString = process.env.QR_SIGNING_SECRET;
  if (!secretString) {
    throw new Error("QR_SIGNING_SECRET is not configured on the server");
  }

  const secret = new TextEncoder().encode(secretString);
  const expSeconds = Math.floor((Date.now() + ttlMs) / 1000);

  return await new SignJWT({ memberId })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(expSeconds)
      .sign(secret);
}

/**
 * Server-side secure HMAC-SHA256 verifier using jose.
 * Returns the decoded memberId if signature is valid and not expired, otherwise null.
 */
export async function decodeMemberPassSecure(
  token: string,
): Promise<string | null> {
  const secretString = process.env.QR_SIGNING_SECRET;
  if (!secretString) {
    throw new Error("QR_SIGNING_SECRET is not configured on the server");
  }

  try {
    const secret = new TextEncoder().encode(secretString);
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });

    return (payload.memberId as string) || null;
  } catch (error) {
    console.error("[qr-verify] JWT verification failed:", error);
    return null;
  }
}
