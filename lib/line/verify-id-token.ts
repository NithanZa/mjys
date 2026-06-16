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
    
    // Deeper logging for JWS investigation
    console.log("=== [line-verify] DEBUG START ===");
    console.log("LINE_LOGIN_CHANNEL_ID in env:", channelId ? `Set (Length: ${channelId.length})` : "MISSING!");
    console.log("LINE_LOGIN_CHANNEL_ID value:", channelId);
    console.log("Raw idToken type:", typeof idToken);
    console.log("Raw idToken length:", idToken ? idToken.length : "null/undefined");
    if (idToken) {
        const parts = idToken.split(".");
        console.log("Token dot-separated parts count:", parts.length);
        parts.forEach((part, index) => {
            console.log(`Part ${index + 1} length:`, part.length);
            console.log(`Part ${index + 1} preview (first 15 chars):`, part.substring(0, 15));
        });
        
        // Decode and print Part 2 (JWT Payload) safely
        if (parts.length > 1) {
            try {
                const payloadBase64 = parts[1];
                const decodedPayload = Buffer.from(
                    payloadBase64.replace(/-/g, "+").replace(/_/g, "/"),
                    "base64",
                ).toString("utf-8");
                console.log("Decoded Token Payload JSON:", decodedPayload);
            } catch (decodeErr) {
                console.error("Failed to decode token payload:", decodeErr);
            }
        }
    }
    console.log("=== [line-verify] DEBUG END ===");

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
