import type { Liff } from "@line/liff";

const LOGIN_ATTEMPT_KEY = "mjys.liff.loginAttempted";

const CALLBACK_PARAMS = [
    "code",
    "state",
    "liffClientId",
    "liffRedirectUri",
    "liff.state",
];

/** Current page URL with LIFF/OAuth callback params stripped. */
export function getLiffLoginRedirectUri(): string {
    const url = new URL(window.location.href);
    for (const key of CALLBACK_PARAMS) {
        url.searchParams.delete(key);
    }
    url.hash = "";
    return url.toString();
}

export function hasAttemptedLiffLogin(): boolean {
    try {
        return sessionStorage.getItem(LOGIN_ATTEMPT_KEY) === "1";
    } catch {
        return false;
    }
}

export function markLiffLoginAttempted(): void {
    try {
        sessionStorage.setItem(LOGIN_ATTEMPT_KEY, "1");
    } catch {
        /* ignore quota / private-mode */
    }
}

export function clearLiffLoginAttempt(): void {
    try {
        sessionStorage.removeItem(LOGIN_ATTEMPT_KEY);
    } catch {
        /* ignore */
    }
}

/** Redirects to LINE Login, preserving the current path for deep links. */
export function startLiffLogin(liff: Liff): void {
    markLiffLoginAttempted();
    liff.login({ redirectUri: getLiffLoginRedirectUri() });
}

const MISSING_ID_TOKEN_MESSAGE =
    "LINE ID Token is missing. In LINE Developers Console, open this LIFF channel, enable the openid scope, then log out and back in.";

export function getLiffIdToken(liff: Liff | null | undefined): string {
    const token = liff?.getIDToken();
    if (!token) {
        throw new Error(MISSING_ID_TOKEN_MESSAGE);
    }
    return token;
}

export function getLiffAuthHeaders(
    liff: Liff | null | undefined,
): Record<string, string> {
    return { Authorization: `Bearer ${getLiffIdToken(liff)}` };
}
