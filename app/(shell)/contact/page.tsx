"use client";

import { TopBar } from "@/components/layout";
import { Card } from "@/components/ui/Card";
import { useLiff } from "@/lib/liff";
import { HOME_CONTENT } from "@/lib/mock/home-content";
import {
  ChevronRight,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";

export default function ContactPage() {
  const { liff, isInClient } = useLiff();
  const { phone, address, mapQuery, lineBasicId } = HOME_CONTENT.contact;

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
  const telUrl = `tel:${phone.replace(/[^+0-9]/g, "")}`;
  // LINE OA deep link — strips the leading @ for the URL form.
  const oaId = lineBasicId.replace(/^@/, "");
  const lineUrl = `https://line.me/R/ti/p/@${oaId}`;

  function openLineOA() {
    // Inside the LINE app, prefer liff.openWindow so it stays in-client.
    if (liff && isInClient) {
      liff.openWindow({ url: lineUrl, external: false });
      return;
    }
    window.open(lineUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <TopBar title="Contact us" />

      <div className="flex flex-col gap-4">
        <Card className="flex flex-col gap-2">
          <h1 className="font-display text-h1 font-semibold text-neutral-ink">
            Drop by, call, or chat.
          </h1>
          <p className="font-sans text-body text-neutral-text-2">
            We answer every LINE message within a few hours during open days.
          </p>
        </Card>

        <ContactRow
          icon={<MessageCircle strokeWidth={1.75} className="h-5 w-5" />}
          tone="primary"
          title="Chat on LINE"
          description={lineBasicId}
          onClick={openLineOA}
        />

        <ContactRow
          icon={<Phone strokeWidth={1.75} className="h-5 w-5" />}
          tone="accent"
          title="Call the studio"
          description={phone}
          href={telUrl}
        />

        <ContactRow
          icon={<MapPin strokeWidth={1.75} className="h-5 w-5" />}
          tone="neutral"
          title="Visit us"
          description={address}
          href={mapsUrl}
          external
        />
      </div>
    </>
  );
}

interface ContactRowProps {
  icon: React.ReactNode;
  tone: "primary" | "accent" | "neutral";
  title: string;
  description: string;
  href?: string;
  external?: boolean;
  onClick?: () => void;
}

const tones = {
  primary: "bg-primary-100 text-primary-700",
  accent: "bg-accent-100 text-accent-800",
  neutral: "bg-neutral-card text-neutral-text-2",
};

function ContactRow({
  icon,
  tone,
  title,
  description,
  href,
  external,
  onClick,
}: ContactRowProps) {
  const inner = (
    <Card elevation="sm" interactive className="flex items-center gap-3">
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${tones[tone]}`}
        aria-hidden
      >
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-display text-h3 font-medium text-neutral-ink">
          {title}
        </div>
        <p className="font-sans text-body-sm text-neutral-text-2 truncate">
          {description}
        </p>
      </div>
      <ChevronRight
        strokeWidth={1.75}
        className="h-5 w-5 shrink-0 text-neutral-text-3"
        aria-hidden
      />
    </Card>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        {inner}
      </button>
    );
  }

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      {inner}
    </a>
  );
}
