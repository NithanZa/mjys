---
name: line-liff
description: A brief description, shown to the model to help it understand when to use this skill
---

Yep — here’s an updated **Next.js-specific LINE LIFF / LINE MINI App `SKILL.md`**. I tuned it for **Next.js App Router**, where LIFF must run client-side, `NEXT_PUBLIC_LIFF_ID` is allowed, and secrets must stay server-only. LINE’s docs say LIFF SDK methods should only be called after `liff.init()`, and Next.js docs confirm browser-exposed env vars need the `NEXT_PUBLIC_` prefix. ([LINE Developers][1])

# LINE LIFF / LINE MINI App Skill for Next.js

## Purpose

Help build, debug, and secure LINE LIFF and LINE MINI App projects using Next.js.

Use this skill when the project involves:
- Next.js App Router
- React client components
- LINE LIFF SDK
- `@line/liff`
- `liff.init()`
- LINE MINI App
- LINE Login
- LINE Developers Console
- LIFF ID / Endpoint URL
- LINE in-app browser
- Messaging API integration through a backend

This skill should prioritize:
1. Security
2. Official LINE documentation
3. Correct Next.js client/server boundaries
4. Minimal working examples
5. LINE MINI App environment correctness

---

## Official Documentation Priority

Prefer official docs before third-party blogs.

Important official sources:
- LINE LIFF overview: https://developers.line.biz/en/docs/liff/overview/
- LIFF API reference: https://developers.line.biz/en/reference/liff/
- Developing a LIFF app: https://developers.line.biz/en/docs/liff/developing-liff-apps/
- LINE MINI App docs: https://developers.line.biz/en/docs/line-mini-app/
- Next.js environment variables: https://nextjs.org/docs/pages/guides/environment-variables
- Next.js client components: https://nextjs.org/docs/app/building-your-application/rendering/client-components

---

## Core Rule: LIFF Is Client-Side in Next.js

The LIFF SDK must be used in client-side code.

In Next.js App Router:
- Put LIFF code inside files with `"use client"`.
- Do not call LIFF methods in Server Components.
- Do not import `@line/liff` in server-only files.
- Do not call `liff.init()` during server-side rendering.
- Prefer dynamic import if SSR issues appear.

LINE requires `liff.init()` before using most LIFF SDK methods.

Correct:

```tsx
"use client";

import { useEffect } from "react";

export default function LiffPage() {
  useEffect(() => {
    async function main() {
      const liff = (await import("@line/liff")).default;

      await liff.init({
        liffId: process.env.NEXT_PUBLIC_LIFF_ID!,
      });

      console.log("LIFF initialized");
    }

    main().catch(console.error);
  }, []);

  return <main>Loading LINE...</main>;
}
````

Incorrect:

```tsx
import liff from "@line/liff";

export default async function Page() {
  await liff.init({
    liffId: process.env.NEXT_PUBLIC_LIFF_ID!,
  });

  return <main>LINE</main>;
}
```

Reason: this tries to use LIFF from a Server Component.

---

## Environment Variables

### Public frontend env vars

The LIFF ID is safe to expose to the browser because the frontend needs it for `liff.init()`.

Use:

```env
NEXT_PUBLIC_LIFF_ID=1234567890-AbCdEfGh
```

In code:

```ts
const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
```

Next.js only exposes env vars to browser code when they are prefixed with `NEXT_PUBLIC_`.

### Private server env vars

Never expose these in frontend code:

```env
LINE_CHANNEL_SECRET=replace_me
LINE_CHANNEL_ACCESS_TOKEN=replace_me
LINE_LOGIN_CHANNEL_SECRET=replace_me
DATABASE_URL=replace_me
```

Never use:

```env
NEXT_PUBLIC_LINE_CHANNEL_SECRET=...
NEXT_PUBLIC_LINE_CHANNEL_ACCESS_TOKEN=...
```

That would leak secrets into the browser bundle.

---

## Recommended Next.js Project Structure

```txt
src/
  app/
    line/
      page.tsx
    api/
      line/
        session/
          route.ts
      line/
        webhook/
          route.ts

  components/
    line/
      LiffProvider.tsx
      LiffStatus.tsx
      LoginButton.tsx

  lib/
    line/
      liff-client.ts
      liff-profile.ts
      line-auth.ts

  server/
    line/
      messaging.ts
      webhook.ts
      verify-signature.ts
```

Rules:

* `components/line/*` can use LIFF if marked `"use client"`.
* `lib/line/liff-client.ts` can use LIFF only if imported by client components.
* `server/line/*` must never import `@line/liff`.
* API routes can use LINE secrets, but must never return secrets to the browser.

---

## Standard LIFF Client Helper

Create:

```ts
// src/lib/line/liff-client.ts

import type { Liff } from "@line/liff";

let liffPromise: Promise<Liff> | null = null;

export function initLiff() {
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
```

Why:

* Prevents multiple duplicate initialization attempts.
* Avoids SSR import problems.
* Keeps LIFF initialization consistent.

---

## Standard LIFF Provider

```tsx
// src/components/line/LiffProvider.tsx

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Liff } from "@line/liff";
import { initLiff } from "@/lib/line/liff-client";

type LiffContextValue = {
  liff: Liff | null;
  ready: boolean;
  error: string | null;
};

const LiffContext = createContext<LiffContextValue>({
  liff: null,
  ready: false,
  error: null,
});

export function LiffProvider({ children }: { children: React.ReactNode }) {
  const [liff, setLiff] = useState<Liff | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function main() {
      try {
        const instance = await initLiff();
        setLiff(instance);
        setReady(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown LIFF error");
      }
    }

    main();
  }, []);

  return (
    <LiffContext.Provider value={{ liff, ready, error }}>
      {children}
    </LiffContext.Provider>
  );
}

export function useLiff() {
  return useContext(LiffContext);
}
```

---

## Example App Router Page

```tsx
// src/app/line/page.tsx

import { LiffProvider } from "@/components/line/LiffProvider";
import { LiffStatus } from "@/components/line/LiffStatus";

export default function LinePage() {
  return (
    <LiffProvider>
      <main>
        <h1>LINE App</h1>
        <LiffStatus />
      </main>
    </LiffProvider>
  );
}
```

```tsx
// src/components/line/LiffStatus.tsx

"use client";

import { useLiff } from "@/components/line/LiffProvider";

export function LiffStatus() {
  const { liff, ready, error } = useLiff();

  if (error) {
    return <p>LIFF error: {error}</p>;
  }

  if (!ready || !liff) {
    return <p>Initializing LIFF...</p>;
  }

  return (
    <div>
      <p>LIFF ready: yes</p>
      <p>Inside LINE: {liff.isInClient() ? "yes" : "no"}</p>
      <p>Logged in: {liff.isLoggedIn() ? "yes" : "no"}</p>
    </div>
  );
}
```

---

## Login Pattern

```tsx
"use client";

import { useLiff } from "@/components/line/LiffProvider";

export function LineLoginButton() {
  const { liff, ready } = useLiff();

  if (!ready || !liff) {
    return <button disabled>Loading...</button>;
  }

  async function handleLogin() {
    if (!liff) return;

    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }

    const profile = await liff.getProfile();
    console.log(profile.displayName);
  }

  return <button onClick={handleLogin}>Continue with LINE</button>;
}
```

Rules:

* Call `liff.init()` before `liff.isLoggedIn()`.
* Call `liff.login()` only after LIFF is initialized.
* Do not call `getProfile()` unless the user is logged in.
* Do not store profile data unless needed.

---

## Profile Pattern

```ts
import type { Liff } from "@line/liff";

export async function getLineProfile(liff: Liff) {
  if (!liff.isLoggedIn()) {
    throw new Error("User is not logged in");
  }

  const profile = await liff.getProfile();

  return {
    userId: profile.userId,
    displayName: profile.displayName,
    pictureUrl: profile.pictureUrl,
    statusMessage: profile.statusMessage,
  };
}
```

Privacy rules:

* Avoid logging full profile objects in production.
* Store only fields needed by the product.
* Treat `userId` as personal data.
* Do not trust user identity purely from frontend-submitted `userId`.

---

## Server API Pattern

Frontend can send a request to your Next.js API route:

```ts
await fetch("/api/line/session", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    lineUserId: profile.userId,
  }),
});
```

But warn the user:

This is not strong authentication by itself. A malicious user can fake a `lineUserId` in a request body. For production auth, use a proper LINE Login flow, identity token verification, or secure server-side session strategy.

---

## API Route Rules

In Next.js App Router, API routes live in `route.ts`.

Example:

```ts
// src/app/api/line/session/route.ts

import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();

  if (!body.lineUserId) {
    return NextResponse.json(
      { error: "Missing lineUserId" },
      { status: 400 },
    );
  }

  // TODO: verify identity properly before trusting this in production.

  return NextResponse.json({
    ok: true,
  });
}
```

Rules:

* API routes may access server-side env vars.
* API routes must never return secrets.
* API routes must validate input.
* API routes should not blindly trust frontend LINE profile data.

---

## Messaging API Separation

Never call Messaging API directly from frontend code if it requires a Channel Access Token.

Correct:

* Frontend uses LIFF.
* Backend uses Messaging API.
* Backend stores `LINE_CHANNEL_ACCESS_TOKEN`.
* Frontend calls your backend API.

Incorrect:

* Frontend imports Channel Access Token.
* Frontend calls LINE Messaging API directly.
* Token is stored in `NEXT_PUBLIC_` env var.

---

## LINE MINI App Handling

For LINE MINI App, internal channels may have separate LIFF IDs.

Recommended env setup:

```env
NEXT_PUBLIC_APP_ENV=development

NEXT_PUBLIC_LIFF_ID_DEV=replace_me
NEXT_PUBLIC_LIFF_ID_REVIEW=replace_me
NEXT_PUBLIC_LIFF_ID_PROD=replace_me
```

Selector:

```ts
export function getLiffId() {
  const env = process.env.NEXT_PUBLIC_APP_ENV;

  if (env === "production") {
    return process.env.NEXT_PUBLIC_LIFF_ID_PROD;
  }

  if (env === "review") {
    return process.env.NEXT_PUBLIC_LIFF_ID_REVIEW;
  }

  return process.env.NEXT_PUBLIC_LIFF_ID_DEV;
}
```

Then:

```ts
await liff.init({
  liffId: getLiffId()!,
});
```

Warn the user if:

* Developing channel uses Review LIFF ID.
* Review channel uses Production LIFF ID.
* Published channel uses Development LIFF ID.
* Endpoint URL points to the wrong Vercel deployment.
* The Vercel preview URL is not registered as the LIFF endpoint URL.
* The LIFF endpoint URL does not use HTTPS.

---

## Vercel Deployment Notes

For Vercel:

* Add `NEXT_PUBLIC_LIFF_ID` in Project Settings → Environment Variables.
* Add separate values for Development, Preview, and Production if needed.
* Rebuild after changing `NEXT_PUBLIC_` variables.
* Make sure the deployed URL matches the LIFF Endpoint URL in LINE Developers Console.

Recommended:

```env
NEXT_PUBLIC_LIFF_ID=...
```

Do not add:

```env
NEXT_PUBLIC_LINE_CHANNEL_SECRET=...
NEXT_PUBLIC_LINE_CHANNEL_ACCESS_TOKEN=...
```

---

## Common Debugging Checklist

When LIFF does not work in Next.js, check:

1. Is the component marked `"use client"`?
2. Is LIFF imported only in client-side code?
3. Is `NEXT_PUBLIC_LIFF_ID` defined?
4. Did you rebuild after changing env vars?
5. Is `liff.init()` called before other LIFF methods?
6. Is the LIFF ID from the correct LINE channel?
7. For LINE MINI App, is it the correct internal channel?
8. Is the Endpoint URL correct in LINE Developers Console?
9. Is the Endpoint URL HTTPS?
10. Is the app opened through the LIFF URL?
11. Is the app opened inside LINE when testing LINE-only behavior?
12. Are you accidentally using a Vercel preview URL that LINE does not know?
13. Are browser console errors showing SSR/window/document issues?
14. Are you trying to access profile before login?
15. Are you confusing Channel ID with LIFF ID?

---

## Common Errors

### `window is not defined`

Cause:

* LIFF code ran during SSR.

Fix:

* Use `"use client"`.
* Move LIFF code into `useEffect`.
* Use dynamic import.

### `Missing NEXT_PUBLIC_LIFF_ID`

Cause:

* Env var not set or not exposed to browser.

Fix:

* Add `NEXT_PUBLIC_LIFF_ID`.
* Restart dev server.
* Rebuild deployment.

### `liff.init failed`

Possible causes:

* Wrong LIFF ID.
* Wrong endpoint URL.
* App not opened through correct LIFF URL.
* LINE channel mismatch.
* Endpoint URL mismatch.
* LINE MINI App internal channel mismatch.

### `getProfile failed`

Possible causes:

* User is not logged in.
* `liff.init()` not completed.
* Permission/scope issue.
* Calling from the wrong environment.

---

## Installation

Use:

```bash
npm install @line/liff
```

or:

```bash
pnpm add @line/liff
```

or:

```bash
bun add @line/liff
```

For the user’s common stack, prefer `bun add @line/liff` when the project uses Bun.

---

## Create LIFF App

LINE provides `create-liff-app`, and its templates include Next.js.

Use this only for new projects:

```bash
npx @line/create-liff-app
```

If the user already has a Next.js app, do not recreate the project. Just install `@line/liff` and add LIFF client components.

---

## Security Warnings

Warn the user if they try to:

* Put Channel Secret in frontend code
* Put Channel Access Token in frontend code
* Commit `.env.local`
* Log access tokens
* Trust frontend-submitted LINE user IDs without verification
* Disable webhook signature verification in production
* Use production LINE channels for experiments
* Give an AI agent unrestricted access to LINE tokens
* Modify production LIFF endpoint URLs without confirmation

Safe alternative:

* Keep LIFF ID public.
* Keep secrets server-side.
* Use API routes for backend logic.
* Verify identity on the server.
* Use separate LINE channels for development, review, and production.

---

## Response Style

Be practical and Next.js-specific.

Prefer:

“The LIFF SDK must run in a client component. Put `liff.init()` inside `useEffect`, and expose only the LIFF ID using `NEXT_PUBLIC_LIFF_ID`.”

Avoid:

“Just import LIFF in `page.tsx` and initialize it at the top level.”

---

## Minimal Working Next.js Example

```tsx
// src/app/line/page.tsx

"use client";

import { useEffect, useState } from "react";

export default function LinePage() {
  const [status, setStatus] = useState("Initializing...");

  useEffect(() => {
    async function main() {
      const liff = (await import("@line/liff")).default;

      const liffId = process.env.NEXT_PUBLIC_LIFF_ID;

      if (!liffId) {
        setStatus("Missing NEXT_PUBLIC_LIFF_ID");
        return;
      }

      await liff.init({ liffId });

      setStatus(
        `Ready. In LINE: ${liff.isInClient() ? "yes" : "no"}. Logged in: ${
          liff.isLoggedIn() ? "yes" : "no"
        }`,
      );
    }

    main().catch((error) => {
      setStatus(error instanceof Error ? error.message : "Unknown error");
    });
  }, []);

  return <main>{status}</main>;
}
```

This is the default starting point when the user asks for the simplest possible Next.js LIFF setup.