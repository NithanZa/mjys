"use client";

import { cn } from "@/lib/cn";
import { QRCodeSVG } from "qrcode.react";

export interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
  /** Background color (defaults to neutral card). */
  bgColor?: string;
  /** Foreground color (defaults to neutral ink). */
  fgColor?: string;
  ariaLabel?: string;
}

export function QRCode({
  value,
  size = 200,
  className,
  bgColor = "#FDF2E2",
  fgColor = "#2A1C14",
  ariaLabel = "Member pass QR code",
}: QRCodeProps) {
  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center justify-center rounded-md p-3 bg-neutral-card",
        className,
      )}
    >
      <QRCodeSVG
        value={value}
        size={size}
        bgColor={bgColor}
        fgColor={fgColor}
        level="M"
        marginSize={0}
      />
    </div>
  );
}
