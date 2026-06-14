import {
  BottomNav,
  BottomNavSpacer,
  Container,
} from "@/components/layout";
import type { ReactNode } from "react";

export default function ShellLayout({ children }: { children: ReactNode }) {
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
