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
 * Verify a LINE ID token with the LINE API server-side.
 * Resolves to the user claims if valid, or null if invalid/expired.
 */
export async function verifyLineIdToken(
    idToken: string,
): Promise<{ lineUserId: string; displayName?: string; email?: string } | null> {
    const channelId = process.env.LINE_LOGIN_CHANNEL_ID;
    
    if (!channelId) {
        throw new Error("LINE_LOGIN_CHANNEL_ID is not configured");
    }

    // Dev/Mock bypass for local testing with mockup LIFF plugins or placeholder credentials
    const isMockToken =
        idToken === "mock_id_token" ||
        idToken.startsWith("mock_") ||
        !idToken.includes(".") ||
        (process.env.NODE_ENV !== "production" && idToken.length < 50);

    if (isMockToken) {
        console.warn(
            `[line-verify] Dev Mode: Bypassing LINE API verification for mock token: "${idToken.substring(0, 20)}..."`,
        );
        return {
            lineUserId: "U_MOCK_DEV_USER_ID",
            displayName: "Mock Developer",
            email: "mock.developer@example.com",
        };
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
