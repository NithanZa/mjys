"use client";

import {
  BottomNav,
  BottomNavSpacer,
  Container,
  TopBar,
} from "@/components/layout";
import { LoginForm, RegistrationForm } from "@/components/profile";
import { Button, EmptyState } from "@/components/ui";
import { BookingsProvider } from "@/lib/api/bookings";
import { PurchasesProvider } from "@/lib/api/purchases";
import { isStandaloneMode } from "@/lib/auth/mode";
import { LiffProvider, useLiff } from "@/lib/liff";
import { MemberProvider, useMember } from "@/lib/profile/use-member";
import { Smartphone, Loader2 } from "lucide-react";
import { useState, type ReactNode } from "react";

export default function ShellLayout({ children }: { children: ReactNode }) {
  return (
    <LiffProvider>
      <MemberProvider>
        <PurchasesProvider>
          <BookingsProvider>
            <ShellLayoutContent>{children}</ShellLayoutContent>
          </BookingsProvider>
        </PurchasesProvider>
      </MemberProvider>
    </LiffProvider>
  );
}

function ShellLayoutContent({ children }: { children: ReactNode }) {
  const { status, isLoggedIn, liff, error: liffError, login: liffLogin } = useLiff();
  const { member, loading, register, login } = useMember();
  const [showLogin, setShowLogin] = useState(isStandaloneMode);

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
        <main className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
          <EmptyState
            icon={<Smartphone strokeWidth={1.75} className="h-6 w-6" />}
            title="Couldn't connect to LINE"
            description={
              liffError ?? "Try reopening this page from inside the LINE app."
            }
            action={
              <Button type="button" onClick={liffLogin}>
                Continue with LINE
              </Button>
            }
          />
        </main>
      </div>
    );
  }

  if (!isStandaloneMode && (status !== "ready" || !isLoggedIn || !liff)) {
    return (
      <div className="flex min-h-dvh flex-col bg-neutral-bg">
        <main className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
          <EmptyState
            icon={<Smartphone strokeWidth={1.75} className="h-6 w-6" />}
            title="Sign in with LINE to continue"
            description="Your MiTR member profile needs an authenticated LINE session. Open the LIFF link inside the LINE app, or continue with LINE Login here."
            action={
              <Button type="button" onClick={liffLogin}>
                Continue with LINE
              </Button>
            }
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
            {isStandaloneMode && showLogin ? (
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
                onSwitchToLogin={isStandaloneMode ? () => setShowLogin(true) : undefined}
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
