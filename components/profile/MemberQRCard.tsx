"use client";

import { Card } from "@/components/ui/Card";
import { QRCode } from "@/components/ui/QRCode";
import { encodeMemberPass } from "@/lib/qr";
import { useEffect, useState } from "react";

export interface MemberQRCardProps {
  memberId: string;
  /** Refresh interval in ms. Defaults to 60s, matching the pass TTL. */
  refreshMs?: number;
}

/**
 * Shows a short-lived QR member-pass. The encoded token rotates every `refreshMs`
 * so a screenshot from yesterday can't be reused at the studio scanner.
 *
 * FRONTEND STUB: token is base64-JSON, not signed. See `lib/qr.ts`.
 */
export function MemberQRCard({ memberId, refreshMs = 60_000 }: MemberQRCardProps) {
  const [token, setToken] = useState(() => encodeMemberPass(memberId, refreshMs));
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setToken(encodeMemberPass(memberId, refreshMs));
      setTick((t) => t + 1);
    }, refreshMs);
    return () => clearInterval(id);
  }, [memberId, refreshMs]);

  return (
    <Card className="flex flex-col items-center gap-3" elevation="sm">
      <QRCode value={token} size={208} />
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
