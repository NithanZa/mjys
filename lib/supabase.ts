import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Prefer the new secret key (`sb_secret_...`); fall back to the legacy
// service_role JWT so existing .env.local files keep working until rotated.
// See docs/guides/supabase-publishable-secret.md.
const supabaseServiceKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
    throw new Error(
        "NEXT_PUBLIC_SUPABASE_URL is not set. Please configure it in .env.local"
    );
}

if (!supabaseServiceKey) {
    throw new Error(
        "SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY) is not set. Please configure it in .env.local"
    );
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        persistSession: false,
    },
});
