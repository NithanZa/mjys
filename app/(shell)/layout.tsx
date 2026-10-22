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
import { Loader2, LogIn, Smartphone } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

/** Pages that act on a member's own data. Everything else is open to guests. */
const MEMBER_ONLY_ROUTES = [
  /^\/profile(\/|$)/,
  /^\/book\/[^/]+\/pay$/,
  /^\/promotion\/[^/]+\/pay$/,
];

function isMemberOnly(pathname: string): boolean {
  return MEMBER_ONLY_ROUTES.some((route) => route.test(pathname));
}

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
  const { account, browsingAsGuest, requestSignIn } = useMember();
  const pathname = usePathname();

  if (account.kind === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-neutral-bg">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <p className="font-display text-h3 font-medium text-neutral-ink">
            Connecting to MiTR...
          </p>
        </div>
      </div>
    );
  }

  if (account.kind !== "member" && !browsingAsGuest) {
    return <SignInGate />;
  }

  const page =
    account.kind !== "member" && isMemberOnly(pathname) ? (
      <EmptyState
        icon={<LogIn strokeWidth={1.75} className="h-6 w-6" />}
        title="Sign in to continue"
        description="This page shows your own classes, packages and payments, so it needs a member profile."
        action={
          <Button type="button" onClick={requestSignIn}>
            Sign in
          </Button>
        }
      />
    ) : (
      children
    );

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="flex-1">
        <Container className="py-4">{page}</Container>
        <BottomNavSpacer />
      </main>
      <BottomNav />
    </div>
  );
}

/** Shown on first open until the visitor signs in or skips. */
function SignInGate() {
  const { account, register, login, continueAsGuest } = useMember();
  const { error: liffError, login: liffLogin } = useLiff();
  const [showLogin, setShowLogin] = useState(isStandaloneMode);

  let content: ReactNode;
  if (!isStandaloneMode && account.kind === "signedOut") {
    content = (
      <EmptyState
        icon={<Smartphone strokeWidth={1.75} className="h-6 w-6" />}
        title="Sign in with LINE"
        description={
          liffError
            ? `LINE sign-in is unavailable right now (${liffError}). You can still browse the schedule.`
            : "Sign in to book classes, track your packages and keep your member pass."
        }
        action={
          <Button type="button" onClick={liffLogin}>
            Continue with LINE
          </Button>
        }
      />
    );
  } else if (isStandaloneMode && showLogin) {
    content = (
      <LoginForm
        onSubmit={async ({ email, password }) => {
          await login({ email, password });
        }}
        onSwitchToRegister={() => setShowLogin(false)}
      />
    );
  } else {
    content = (
      <RegistrationForm
        onSubmit={({ displayName, email, password, phone, dob, address, tocAccepted }) =>
          register({ displayName, email, password, phone, dob, address, tocAccepted })
        }
        onSwitchToLogin={isStandaloneMode ? () => setShowLogin(true) : undefined}
      />
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-neutral-bg">
      <TopBar title="Welcome to MiTR" />
      <main className="flex-1">
        <Container className="flex flex-col gap-3 py-4">
          {content}
          <Button type="button" variant="ghost" fullWidth onClick={continueAsGuest}>
            Skip for now
          </Button>
        </Container>
      </main>
    </div>
  );
}
