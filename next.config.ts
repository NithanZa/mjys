import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    allowedDevOrigins: ["estella-tapelike-eulogistically.ngrok-free.dev"],
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**.supabase.co",
            },
        ],
    },
};

export default nextConfig;
