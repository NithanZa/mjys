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

/**
 * auth-js treats every HTTP 500 as AuthRetryableFetchError and JSON.stringifies
 * the Response, which becomes message "{}". Re-read the JSON body and return
 * 422 so callers get the real GoTrue `msg` (e.g. confirmation email failures).
 */
const authAwareFetch: typeof fetch = async (input, init) => {
    const response = await fetch(input, init);
    if (response.ok || response.status < 500) {
        return response;
    }

    const requestUrl =
        typeof input === "string"
            ? input
            : input instanceof URL
              ? input.href
              : input.url;
    if (!requestUrl.includes("/auth/v1/")) {
        return response;
    }

    const text = await response.text();
    let payload: Record<string, unknown> = {};
    try {
        payload = JSON.parse(text) as Record<string, unknown>;
    } catch {
        if (text) payload = { msg: text };
    }

    const msg =
        (typeof payload.msg === "string" && payload.msg) ||
        (typeof payload.message === "string" && payload.message) ||
        (typeof payload.error_description === "string" &&
            payload.error_description) ||
        `Auth request failed (${response.status})`;

    return new Response(JSON.stringify({ ...payload, msg, message: msg }), {
        status: 422,
        statusText: response.statusText,
        headers: { "Content-Type": "application/json" },
    });
};

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        persistSession: false,
    },
    global: {
        fetch: authAwareFetch,
    },
});
