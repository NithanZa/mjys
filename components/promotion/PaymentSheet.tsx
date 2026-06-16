"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { QRCode } from "@/components/ui/QRCode";
import { Sheet } from "@/components/ui/Sheet";
import { formatTHB, type PackageOffer } from "@/lib/mock/packages";
import { CheckCircle2, Clock, Copy } from "lucide-react";
import { useState } from "react";

export interface PaymentSheetProps {
  open: boolean;
  onClose: () => void;
  offer: PackageOffer;
  /**
   * Studio's PromptPay number for QR display. In the backend pass this comes
   * from a config record. For the frontend stub we accept a prop with a default.
   */
  promptpayId?: string;
  /** Called when the user has paid and asks the studio to confirm. */
  onMarkPaid: () => void;
  /** True once the user has clicked "Mark as paid" — flips the sheet to a waiting state. */
  isPending: boolean;
}

/**
 * FRONTEND STUB: the QR encodes a stable but non-functional payload.
 * The backend pass will swap to a real PromptPay EMVCo string via `promptpay-qr`.
 */
function buildStubQrPayload(offerId: string, amount: number, promptpayId: string) {
  return `MJYS-PAY:v1:${promptpayId}:${offerId}:${amount}`;
}

export function PaymentSheet({
  open,
  onClose,
  offer,
  promptpayId = "0812345678",
  onMarkPaid,
  isPending,
}: PaymentSheetProps) {
  const [copied, setCopied] = useState(false);

  async function copyAmount() {
    try {
      await navigator.clipboard.writeText(String(offer.priceTHB));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard not available — silently noop */
    }
  }

  const qrValue = buildStubQrPayload(offer.id, offer.priceTHB, promptpayId);

  return (
    <Sheet open={open} onClose={onClose} title={`Pay for ${offer.name}`}>
      {isPending ? (
        <PendingState offer={offer} onClose={onClose} />
      ) : (
        <div className="flex flex-col gap-4">
          <Card elevation="sm" className="flex flex-col items-center gap-3">
            <QRCode value={qrValue} size={208} ariaLabel="Payment QR code" />
            <div className="flex flex-col items-center gap-1 text-center">
              <p className="font-display text-h3 font-medium text-neutral-ink">
                Scan to pay {formatTHB(offer.priceTHB)}
              </p>
              <p className="font-sans text-caption text-neutral-text-2">
                PromptPay · {promptpayId}
              </p>
            </div>
          </Card>

          <Card>
            <h3 className="font-display text-h3 font-medium text-neutral-ink">
              {offer.name}
            </h3>
            <p className="mt-1 font-sans text-body-sm text-neutral-text-2">
              {offer.tagline}
            </p>
            <div className="mt-3 flex items-center justify-between border-t border-neutral-card pt-3">
              <span className="font-sans text-body-sm text-neutral-text-2">
                Amount
              </span>
              <button
                type="button"
                onClick={copyAmount}
                className="inline-flex items-center gap-1.5 font-display text-h3 font-medium text-neutral-ink hover:text-primary-700"
                aria-label="Copy amount"
              >
                {formatTHB(offer.priceTHB)}
                {copied ? (
                  <CheckCircle2
                    strokeWidth={1.75}
                    className="h-4 w-4 text-success-fg"
                    aria-hidden
                  />
                ) : (
                  <Copy
                    strokeWidth={1.75}
                    className="h-4 w-4 text-neutral-text-3"
                    aria-hidden
                  />
                )}
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-sans text-body-sm text-neutral-text-2">
                Validity
              </span>
              <span className="font-sans text-body-sm font-medium text-neutral-ink">
                {offer.validityDays} days from approval
              </span>
            </div>
          </Card>

          <Button variant="primary" fullWidth onClick={onMarkPaid}>
            I&apos;ve sent the slip — request approval
          </Button>
          <p className="text-center font-sans text-caption text-neutral-text-3">
            Send your payment slip and email to our LINE OA. The studio will
            verify and activate the pack within 24 hours.
          </p>
        </div>
      )}
    </Sheet>
  );
}

function PendingState({
  offer,
  onClose,
}: {
  offer: PackageOffer;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-warning-bg text-warning-fg">
        <Clock strokeWidth={1.75} className="h-7 w-7" aria-hidden />
      </span>
      <div className="flex flex-col gap-1">
        <h3 className="font-display text-h2 font-medium text-neutral-ink">
          Waiting for studio approval
        </h3>
        <p className="font-sans text-body text-neutral-text-2">
          Your {offer.name} request is in the queue. We&apos;ll send a LINE
          notification once it&apos;s approved.
        </p>
      </div>
      <Button variant="secondary" fullWidth onClick={onClose}>
        Close
      </Button>
    </div>
  );
}
