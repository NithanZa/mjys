"use client";

import { Button, Modal } from "@/components/ui";
import { MessageCircle } from "lucide-react";
import Link from "next/link";

export interface PaidSpecialClassContactModalProps {
  open: boolean;
  onClose: () => void;
  className: string;
}

export function PaidSpecialClassContactModal({
  open,
  onClose,
  className,
}: PaidSpecialClassContactModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Need to change your booking?" size="md">
      <div className="flex flex-col gap-5 font-sans">
        <p className="text-body text-neutral-text-2">
          Your spot in <strong className="font-medium text-neutral-ink">{className}</strong> is already
          reserved. Please contact the studio to discuss cancellation, transfer, or refund options.
        </p>
        <p className="text-body-sm text-neutral-text-3">
          Your booking will stay active until the studio confirms a change.
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>
            Keep my booking
          </Button>
          <Link href="/contact" onClick={onClose}>
            <Button variant="primary" leftIcon={<MessageCircle className="h-4 w-4" />}>
              Contact the studio
            </Button>
          </Link>
        </div>
      </div>
    </Modal>
  );
}
