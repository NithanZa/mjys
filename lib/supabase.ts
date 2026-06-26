import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
    throw new Error(
        "NEXT_PUBLIC_SUPABASE_URL is not set. Please configure it in .env.local"
    );
}

if (!supabaseServiceKey) {
    throw new Error(
        "SUPABASE_SERVICE_ROLE_KEY is not set. Please configure it in .env.local"
    );
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        persistSession: false,
    },
});
