import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Load both .env.local (Next.js convention) and .env so DATABASE_URL / DIRECT_URL
// can live in either file. .env.local takes precedence (loaded first).
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

// Prisma CLI (migrations / introspection) uses the DIRECT Supabase URL.
// Runtime app code uses the pooled DATABASE_URL via @prisma/adapter-pg in lib/db.ts.
const directUrl = process.env.DIRECT_URL;

if (!directUrl) {
    throw new Error(
        "DIRECT_URL is not set.\n" +
            "Add it to .env.local — copy the 'Direct connection' string from\n" +
            "Supabase → Project Settings → Database → Connection string.\n" +
            "(DATABASE_URL is the pooled 'Transaction pooler' string for runtime.)",
    );
}

export default defineConfig({
    schema: "prisma/schema.prisma",
    datasource: {
        url: directUrl,
    },
});
