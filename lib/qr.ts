// Member-pass payload encoder.
//
// FRONTEND STUB — Phase 2 (frontend-only pass):
// Encodes { memberId, exp } as base64-JSON. NOT signed.
// When the backend lands, replace with HMAC-signed JWT (jose) using
// QR_SIGNING_SECRET, and verify on the studio-side scan endpoint.

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
