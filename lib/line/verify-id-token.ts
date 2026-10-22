import { decodeJwt } from "jose";

interface LineVerifySuccessResponse {
    iss: string;
    sub: string;
    aud: string;
    exp: number;
    name?: string;
    picture?: string;
    email?: string;
}

/**
 * Channel IDs whose ID tokens this deployment accepts. A LINE MINI App has
 * Developing, Review and Published internal channels, each with its own ID,
 * so LINE_CHANNEL_ID takes a comma-separated list.
 */
function allowedChannelIds(): string[] {
    const raw = process.env.LINE_CHANNEL_ID || process.env.LINE_LOGIN_CHANNEL_ID || "";
    return raw
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
}

/** The token's unverified `aud`, used only to pick which channel to verify against. */
function claimedAudience(idToken: string): string | null {
    try {
        const { aud } = decodeJwt(idToken);
        return typeof aud === "string" ? aud : null;
    } catch {
        return null;
    }
}

/**
 * Verify a LINE ID token with the LINE API server-side.
 * Resolves to the user claims if valid, or null if invalid/expired.
 */
export async function verifyLineIdToken(
    idToken: string,
): Promise<{ lineUserId: string; displayName?: string; email?: string } | null> {
    const channelIds = allowedChannelIds();
    if (channelIds.length === 0) {
        throw new Error("LINE_CHANNEL_ID is not configured");
    }

    const claimed = claimedAudience(idToken);
    const channelId = claimed && channelIds.includes(claimed) ? claimed : null;
    if (!channelId) {
        console.error(`[line-verify] Token audience ${claimed} is not an allowed channel`);
        return null;
    }

    try {
        const response = await fetch("https://api.line.me/oauth2/v2.1/verify", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                id_token: idToken,
                client_id: channelId,
            }),
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error(
                `[line-verify] Verification failed with status ${response.status}:`,
                errBody,
            );
            return null;
        }

        const data = (await response.json()) as LineVerifySuccessResponse;

        const now = Math.floor(Date.now() / 1000);
        if (data.aud !== channelId) {
            console.error(
                `[line-verify] Audience mismatch: got ${data.aud}, expected ${channelId}`,
            );
            return null;
        }
        if (data.iss !== "https://access.line.me") {
            console.error(`[line-verify] Issuer mismatch: got ${data.iss}`);
            return null;
        }
        if (data.exp < now) {
            console.error(
                `[line-verify] Token has expired: exp ${data.exp}, now ${now}`,
            );
            return null;
        }

        return {
            lineUserId: data.sub,
            displayName: data.name,
            email: data.email,
        };
    } catch (error) {
        console.error(
            "[line-verify] Network/unexpected error during verification:",
            error,
        );
        return null;
    }
}
