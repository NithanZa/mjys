import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";
import { LiffProvider } from "@/lib/liff";

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
    subsets: ["thai", "latin"],
    weight: ["300", "400", "500", "600", "700"],
    variable: "--font-ibm-plex-sans-thai",
    display: "swap",
});

export const metadata: Metadata = {
    title: "MiTR Journey Yoga Studio",
    description: "Discover the strength and soul within your everyday journey.",
    icons: {
        icon: "/favicon.ico",
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    viewportFit: "cover",
    themeColor: "#FFF8EC",
    colorScheme: "light",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="th"
            className={`${ibmPlexSansThai.variable}`}
            data-semantic-theme="warm"
        >
            <body>
                <LiffProvider>{children}</LiffProvider>
            </body>
        </html>
    );
}
