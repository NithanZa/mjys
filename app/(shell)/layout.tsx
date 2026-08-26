"use client";

import {
  BottomNav,
  BottomNavSpacer,
  Container,
  TopBar,
} from "@/components/layout";
import { LoginForm, RegistrationForm } from "@/components/profile";
import { EmptyState } from "@/components/ui";
import { BookingsProvider } from "@/lib/api/bookings";
import { PurchasesProvider } from "@/lib/api/purchases";
import { useLiff } from "@/lib/liff";
import { MemberProvider, useMember } from "@/lib/profile/use-member";
import { Smartphone, Loader2 } from "lucide-react";
import { useState, type ReactNode } from "react";

const isStandalone = process.env.NEXT_PUBLIC_STANDALONE_MODE === "true";

export default function ShellLayout({ children }: { children: ReactNode }) {
  return (
    <MemberProvider>
      <PurchasesProvider>
        <BookingsProvider>
          <ShellLayoutContent>{children}</ShellLayoutContent>
        </BookingsProvider>
      </PurchasesProvider>
    </MemberProvider>
  );
}

function ShellLayoutContent({ children }: { children: ReactNode }) {
  const { status, isLoggedIn, liff, error: liffError } = useLiff();
  const { member, loading, register, login } = useMember();
  const [showLogin, setShowLogin] = useState(isStandalone);

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

  if (!isStandalone && (status !== "ready" || !isLoggedIn || !liff)) {
    return (
      <div className="flex min-h-dvh flex-col bg-neutral-bg">
        <main className="flex-1 flex items-center justify-center p-4">
          <EmptyState
            icon={<Smartphone strokeWidth={1.75} className="h-6 w-6" />}
            title="Open in LINE to continue"
            description="Your MiTR member profile requires an authenticated LINE session. Open this link inside the LINE app and sign in to continue."
          />
        </main>
      </div>
    );
  }

  // If not registered, show the authentication gate.
  // In standalone mode we toggle between login and signup.
  // In LINE mode we only show the registration form.
  if (!member) {
    return (
      <div className="flex min-h-dvh flex-col bg-neutral-bg">
        <TopBar title="Welcome to MiTR" />
        <main className="flex-1">
          <Container className="py-4">
            {isStandalone && showLogin ? (
              <LoginForm
                onSubmit={async ({ email, password }) => {
                  await login({ email, password });
                }}
                onSwitchToRegister={() => setShowLogin(false)}
              />
            ) : (
              <RegistrationForm
                onSubmit={({
                  displayName,
                  email,
                  password,
                  phone,
                  dob,
                  address,
                  tocAccepted,
                }) => {
                  return register({
                    displayName,
                    email,
                    password,
                    phone,
                    dob,
                    address,
                    tocAccepted,
                  });
                }}
                onSwitchToLogin={isStandalone ? () => setShowLogin(true) : undefined}
              />
            )}
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
