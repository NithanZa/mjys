/**
 * Build-time auth mode. `NEXT_PUBLIC_STANDALONE_MODE=true` runs the app as a
 * regular email/password website. Any other value (unset/false) is LINE LIFF.
 */
export const isStandaloneMode =
    process.env.NEXT_PUBLIC_STANDALONE_MODE === "true";
