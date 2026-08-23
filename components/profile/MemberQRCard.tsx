"use client";

import { Card } from "@/components/ui/Card";
import { QRCode } from "@/components/ui/QRCode";
import { useLiff } from "@/lib/liff";
import { useEffect, useState, useCallback } from "react";

export interface MemberQRCardProps {
  /** Refresh interval in ms. Defaults to 60s, matching the pass TTL. */
  refreshMs?: number;
}

/**
 * Shows a short-lived QR member-pass. The encoded token rotates every `refreshMs`
 * so a screenshot from yesterday can't be reused at the studio scanner.
 *
 * The HMAC-signed JWT token is always requested from the server.
 */
export function MemberQRCard({ refreshMs = 60_000 }: MemberQRCardProps) {
  const { liff, status, isLoggedIn } = useLiff();
  const [token, setToken] = useState("");
  const [tick, setTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isStandalone = process.env.NEXT_PUBLIC_STANDALONE_MODE === "true";

  const rotateToken = useCallback(async () => {
    try {
      const fetchOptions: RequestInit = { credentials: "same-origin" };
      if (!isStandalone) {
        if (status !== "ready" || !isLoggedIn || !liff) {
          throw new Error("LINE authentication is unavailable");
        }

        const idToken = liff.getIDToken();
        if (!idToken) throw new Error("No LINE ID token available");
        fetchOptions.headers = {
          Authorization: `Bearer ${idToken}`,
        };
      }

      const res = await fetch("/api/members/me/qr", fetchOptions);

      if (!res.ok) throw new Error("Failed to fetch secure QR pass");

      const data = await res.json();
      if (typeof data.token !== "string" || !data.token) {
        throw new Error("The server did not issue a QR pass");
      }

      setToken(data.token);
      setError(null);
    } catch (err) {
      console.error("[MemberQRCard] Secure QR fetch failed:", err);
      setToken("");
      setError("Your secure member pass is unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, isStandalone, liff, status]);

  useEffect(() => {
    rotateToken();
  }, [rotateToken]);

  useEffect(() => {
    const id = setInterval(() => {
      rotateToken();
      setTick((t) => t + 1);
    }, refreshMs);
    return () => clearInterval(id);
  }, [rotateToken, refreshMs]);

  return (
    <Card className="flex flex-col items-center gap-3" elevation="sm">
      {loading ? (
        <div className="h-[208px] w-[208px] bg-neutral-line/20 rounded-xl animate-pulse flex items-center justify-center font-sans text-caption text-neutral-text-3">
          Generating…
        </div>
      ) : error ? (
        <div
          className="h-[208px] w-[208px] rounded-xl border border-error-fg/30 bg-error-bg flex items-center justify-center p-4 text-center font-sans text-caption text-error-fg"
          role="alert"
        >
          {error}
        </div>
      ) : (
        <QRCode value={token} size={208} />
      )}
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="font-display text-h3 font-medium text-neutral-ink">
          Member Pass
        </p>
        <p className="font-sans text-caption text-neutral-text-2">
          Show this at the studio counter to check in.
        </p>
        <p
          className="font-sans text-overline uppercase tracking-[0.08em] text-neutral-text-3"
          aria-live="polite"
        >
          Refreshes every {Math.round(refreshMs / 1000)}s · #{tick + 1}
        </p>
      </div>
    </Card>
  );
}
