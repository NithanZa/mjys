import { Button, Card } from "@/components/ui";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function AuthCodeErrorPage() {
    return (
        <div className="flex min-h-dvh items-center justify-center bg-neutral-bg px-4 py-12 font-sans">
            <Card elevation="lg" className="w-full max-w-md p-8 flex flex-col items-center gap-4 text-center border border-neutral-line">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-red-100 text-red-600">
                    <AlertTriangle className="h-6 w-6" strokeWidth={2} />
                </span>
                <h1 className="font-display text-h2 font-semibold text-neutral-ink">
                    Link expired or invalid
                </h1>
                <p className="text-body-sm text-neutral-text-2">
                    This confirmation or reset link is no longer valid. It may have already
                    been used or expired. Please try again from the login screen.
                </p>
                <Link href="/" className="w-full">
                    <Button fullWidth>Back to MiTR</Button>
                </Link>
            </Card>
        </div>
    );
}
