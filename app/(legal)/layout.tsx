import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export default function LegalLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-dvh bg-neutral-bg">
            <header
                className="sticky top-0 z-20 bg-neutral-bg/95 backdrop-blur-sm"
                style={{ paddingTop: "env(safe-area-inset-top)" }}
            >
                <div className="mx-auto flex h-14 max-w-2xl items-center px-4">
                    <Link
                        href="/"
                        className="flex items-center gap-1 font-sans text-body font-medium text-primary-700"
                    >
                        <ChevronLeft strokeWidth={1.75} className="h-5 w-5" />
                        MiTR Journey
                    </Link>
                </div>
            </header>
            <main
                className="mx-auto max-w-2xl px-4 pb-12 pt-2 font-sans text-body text-neutral-text-2 [&_h1]:mb-1 [&_h1]:font-display [&_h1]:text-h1 [&_h1]:font-semibold [&_h1]:text-neutral-ink [&_h2]:mb-2 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-h3 [&_h2]:font-medium [&_h2]:text-neutral-ink [&_li]:mb-1 [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5"
                style={{ paddingBottom: "max(env(safe-area-inset-bottom), 3rem)" }}
            >
                {children}
            </main>
        </div>
    );
}
