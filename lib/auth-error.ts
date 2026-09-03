/**
 * supabase-js maps Auth HTTP 500s to AuthRetryableFetchError and stringifies
 * the Response object, which produces message "{}". Use this whenever we
 * return an Auth error to the client.
 */
export function formatAuthError(
    error:
        | {
              message?: unknown;
              code?: string | null;
              status?: number;
          }
        | null
        | undefined,
    fallback = "Authentication failed. Please try again.",
): string {
    if (!error) return fallback;

    const raw = error.message;
    const message =
        typeof raw === "string"
            ? raw
            : raw != null
              ? JSON.stringify(raw)
              : "";

    if (message && message !== "{}" && message !== "[object Object]") {
        return message;
    }

    if (error.code && error.code !== "unexpected_failure") {
        return error.code;
    }

    return fallback;
}

const CONFIRMATION_EMAIL_MESSAGE =
    "Could not send a confirmation email. Supabase's default mailer only delivers to organization members — use a team-member email, or add custom SMTP under Authentication > SMTP.";

export function formatMailerError(
    error:
        | {
              message?: unknown;
              code?: string | null;
              status?: number;
          }
        | null
        | undefined,
    fallback = CONFIRMATION_EMAIL_MESSAGE,
): string {
    const message = formatAuthError(error, fallback);
    if (
        /confirmation email|sending confirmation|error sending .*email/i.test(
            message,
        ) ||
        message === "{}" ||
        message === fallback
    ) {
        return CONFIRMATION_EMAIL_MESSAGE;
    }
    if (isAlreadyRegisteredAuthError(message, error?.code)) {
        return "An account with this email already exists. Try signing in or resetting your password.";
    }
    return message;
}

export function isAlreadyRegisteredAuthError(message: string, code?: string | null): boolean {
    if (
        code === "email_exists" ||
        code === "user_already_exists" ||
        code === "identity_already_exists"
    ) {
        return true;
    }
    return /already registered|already been registered|already exists/i.test(message);
}
