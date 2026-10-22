import type { Liff } from "@line/liff";

const CALLBACK_PARAMS = [
    "code",
    "state",
    "liffClientId",
    "liffRedirectUri",
    "liff.state",
];

/** Treat tokens this close to expiry as already expired. */
const EXPIRY_MARGIN_MS = 60_000;

/** Current page URL with LIFF/OAuth callback params stripped. */
export function getLiffLoginRedirectUri(): string {
    const url = new URL(window.location.href);
    for (const key of CALLBACK_PARAMS) {
        url.searchParams.delete(key);
    }
    url.hash = "";
    return url.toString();
}

/**
 * The LIFF ID token if it can still be exchanged for a server session.
 * LIFF caches tokens across reloads, so a logged-in LIFF can hold an expired one.
 */
export function getFreshIdToken(liff: Liff): string | null {
    if (!liff.isLoggedIn()) return null;
    const token = liff.getIDToken();
    const exp = liff.getDecodedIDToken()?.exp;
    if (!token || !exp) return null;
    return exp * 1000 - EXPIRY_MARGIN_MS > Date.now() ? token : null;
}

/**
 * Starts LINE Login, returning to the current path afterwards.
 * Inside the LINE app login is part of liff.init(), so dropping the cached
 * tokens and reloading is what fetches fresh ones.
 */
export function startLiffLogin(liff: Liff): void {
    if (liff.isLoggedIn()) liff.logout();
    if (liff.isInClient()) {
        window.location.reload();
        return;
    }
    liff.login({ redirectUri: getLiffLoginRedirectUri() });
}

/** Exchanges the LIFF ID token for the server's session cookie. */
export async function startServerSession(liff: Liff): Promise<void> {
    const idToken = getFreshIdToken(liff);
    if (!idToken) return;
    const res = await fetch("/api/auth/line-session", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
        signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
        console.error(`[liff] session exchange failed with status ${res.status}`);
    }
}
