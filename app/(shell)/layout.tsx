"use client";

import {
  BottomNav,
  BottomNavSpacer,
  Container,
  TopBar,
} from "@/components/layout";
import { RegistrationForm } from "@/components/profile";
import { Button, EmptyState } from "@/components/ui";
import { useLiff } from "@/lib/liff";
import { useMember } from "@/lib/profile/use-member";
import { Smartphone, Loader2 } from "lucide-react";
import { useState, type ReactNode } from "react";

export default function ShellLayout({ children }: { children: ReactNode }) {
  const { status, isInClient, isLoggedIn, liff, error: liffError } = useLiff();
  const { member, loading, register } = useMember();
  const [bypassLineCheck, setBypassLineCheck] = useState(false);

  // Determine if we should show the LINE fallback
  const isMock = status !== "ready" || !isLoggedIn || !liff;
  const showLineFallback =
    status === "ready" && !isInClient && !bypassLineCheck && !isMock;

  if (status === "loading" || (status === "ready" && loading)) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-neutral-bg">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <p className="font-display text-h3 font-medium text-neutral-ink">
            Connecting to MiTR...
          </p>
          <p className="font-sans text-caption text-neutral-text-3">
            Please wait while we set up your session.
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-dvh flex-col bg-neutral-bg">
        <main className="flex-1 flex items-center justify-center p-4">
          <EmptyState
            icon={<Smartphone strokeWidth={1.75} className="h-6 w-6" />}
            title="Couldn't connect to LINE"
            description={
              liffError ?? "Try reopening this page from inside the LINE App."
            }
          />
        </main>
      </div>
    );
  }

  if (showLineFallback) {
    return (
      <div className="flex min-h-dvh flex-col bg-neutral-bg">
        <main className="flex-1 flex items-center justify-center p-4">
          <EmptyState
            icon={<Smartphone strokeWidth={1.75} className="h-6 w-6" />}
            title="Open in LINE to continue"
            description="Your MiTR member profile is tied to your LINE account. Open this link inside the LINE app to register."
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setBypassLineCheck(true)}
              >
                Continue anyway (dev)
              </Button>
            }
          />
        </main>
      </div>
    );
  }

  // If not registered, force registration form
  if (!member) {
    return (
      <div className="flex min-h-dvh flex-col bg-neutral-bg">
        <TopBar title="Welcome to MiTR" />
        <main className="flex-1">
          <Container className="py-4">
            <RegistrationForm
              onSubmit={({
                displayName,
                email,
                phone,
                dob,
                address,
                tocAccepted,
              }) => {
                register({
                  displayName,
                  email,
                  phone,
                  dob,
                  address,
                  tocAccepted,
                });
              }}
            />
          </Container>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="flex-1">
        <Container className="py-4">{children}</Container>
        <BottomNavSpacer />
      </main>
      <BottomNav />
    </div>
  );
}
