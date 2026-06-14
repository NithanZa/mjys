import type { Liff } from "@line/liff";

let liffPromise: Promise<Liff> | null = null;

/**
 * Initialize LIFF exactly once per browser session.
 * Safe to call from multiple components — they share the same promise.
 * Never call this on the server (it will throw).
 */
export function initLiff(): Promise<Liff> {
  if (typeof window === "undefined") {
    throw new Error("LIFF can only be initialized in the browser");
  }

  if (!liffPromise) {
    liffPromise = (async () => {
      const liff = (await import("@line/liff")).default;
      const liffId = process.env.NEXT_PUBLIC_LIFF_ID;

      if (!liffId) {
        throw new Error("Missing NEXT_PUBLIC_LIFF_ID");
      }

      await liff.init({ liffId });
      return liff;
    })();
  }

  return liffPromise;
}
