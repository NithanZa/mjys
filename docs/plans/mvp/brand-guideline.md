# Brand Guideline — MiTR Journey Yoga Studio (LINE Mini App)

A warm, grounded, and modern visual language for a yoga studio LINE Mini App. The system favors soft, sun-baked tones over clinical white/grey, evoking calm, breath, and movement.

---

## 1. Typography

### 1.1 Marketing / Display — **Mitr**
Use for hero headlines, promotion banners, campaign graphics, level badges, large numerals, and any "voice of the brand" surface.

- Weights to ship: `300 Light`, `400 Regular`, `500 Medium`, `600 SemiBold`, `700 Bold`
- Default display weight: `600`
- Tracking: tight for large sizes (`-0.01em` at 32px+), normal below 24px
- Supports Thai + Latin — keep both in sync

```css
font-family: "Mitr", "Noto Sans Thai", system-ui, sans-serif;
```

### 1.2 Body / UI — **Noto Sans Thai**
Use for paragraphs, form labels, buttons, navigation, class cards, table data — everything that is not "marketing".

- Weights to ship: `400 Regular`, `500 Medium`, `600 SemiBold`, `700 Bold`
- Default body weight: `400`
- Line-height: `1.5` for body, `1.3` for UI labels
- Pair with **Inter** or system fallback for pure-Latin numerals if desired

```css
font-family: "Noto Sans Thai", "Inter", system-ui, sans-serif;
```

### 1.3 Type scale (mobile-first, LIFF viewport)

| Token        | Size / Line | Font   | Weight | Use                         |
|--------------|-------------|--------|--------|-----------------------------|
| `display-lg` | 40 / 48     | Mitr   | 600    | Hero / launch screen        |
| `display`    | 32 / 40     | Mitr   | 600    | Page hero                   |
| `h1`         | 24 / 32     | Mitr   | 600    | Section title               |
| `h2`         | 20 / 28     | Mitr   | 500    | Card title / sub-section    |
| `h3`         | 18 / 26     | Noto   | 600    | List heading                |
| `body-lg`    | 16 / 24     | Noto   | 400    | Primary body                |
| `body`       | 14 / 22     | Noto   | 400    | Default UI                  |
| `caption`    | 12 / 18     | Noto   | 500    | Meta / timestamps           |
| `overline`   | 11 / 16     | Mitr   | 500    | Eyebrows, ALL CAPS labels   |

---

## 2. Color

### 2.1 Primary — Orange (derived from mockup)

Anchor swatches from the original mockup:
- `#FCF6EA` → tint baseline (becomes `50`)
- `#F6AE7E` → mid (becomes `300`)
- `#F29252` → **primary / brand** (becomes `500`)

Full 50–900 ramp:

| Token            | Hex       | Notes                              |
|------------------|-----------|------------------------------------|
| `primary/50`     | `#FCF6EA` | Page tint, hover surface           |
| `primary/100`    | `#FBE8D0` | Subtle background, chips           |
| `primary/200`    | `#F9D3AE` | Pressed surface, borders           |
| `primary/300`    | `#F6AE7E` | Soft accent, illustration fill     |
| `primary/400`    | `#F4A068` | Hover state for primary            |
| `primary/500`    | `#F29252` | **Brand primary** — CTAs, links    |
| `primary/600`    | `#DC7A3D` | Pressed CTA, focused state         |
| `primary/700`    | `#B25F2D` | High-emphasis text on light bg     |
| `primary/800`    | `#874621` | Dark accent / outlined heading     |
| `primary/900`    | `#5C2F15` | Deepest brand tone                 |

**Contrast notes**
- `primary/500` on `#FFF8EC` ≈ 3.0:1 → OK for large text and UI, **not** for body text. Use `primary/700`+ for body-sized text on cream.
- White text on `primary/500` ≈ 3.2:1 → acceptable for `500+` weight buttons ≥16px; otherwise switch button text to `primary/900`.

### 2.2 Neutrals (locked)

| Role               | Token            | Hex       |
|--------------------|------------------|-----------|
| Main background    | `neutral/bg`     | `#FFF8EC` |
| Card background    | `neutral/card`   | `#FDF2E2` |
| Divider / line     | `neutral/line`   | `#F7C9A3` |
| Main text          | `neutral/text`   | `#181411` |
| Secondary text     | `neutral/text-2` | `#5F5148` |
| Disabled text      | `neutral/text-3` | `#A8998D` |
| Deep contrast      | `neutral/ink`    | `#2A1C14` |

---

## 3. Choices for you to pick — the rest of the system

Pick one option per group. Everything below is designed to harmonize with the warm cream + orange base.

### 3.1 Secondary / Accent color — **Sage Green** (locked)

Pairs with primary orange for highlights, level badges ("Cat / Tiger / Leopard"), rewards, "Tiger Toys" gamification, and decorative graphics. Calming, botanical, balances the warmth of the orange base.

Full 50–900 ramp:

| Token            | Hex       | Notes                              |
|------------------|-----------|------------------------------------|
| `accent/50`      | `#F1F5EE` | Tint background, chips             |
| `accent/100`     | `#E3ECDD` | Subtle surface                     |
| `accent/200`     | `#CDDBC2` | Borders, pressed surface           |
| `accent/300`     | `#B7C9A8` | Soft accent, illustration fill     |
| `accent/400`     | `#9AB28A` | Hover state                        |
| `accent/500`     | `#7C9A6B` | **Accent primary** — badges, tags  |
| `accent/600`     | `#637E55` | Pressed state                      |
| `accent/700`     | `#4F6B41` | High-emphasis text on light bg     |
| `accent/800`     | `#3A5030` | Dark accent                        |
| `accent/900`     | `#2C3D24` | Deepest accent tone                |

### 3.2 Semantic colors (success / warning / error / info)

All three palettes are kept in the system as **hot-swappable themes** for testing. Implement as named theme tokens (e.g. `semantic-warm`, `semantic-earthy`, `semantic-bright`) so the active set can be switched at runtime via a single theme variable.

**Default at launch:** `semantic-warm` (best harmony with orange + cream base).

#### Theme A — `semantic-warm` (default)
| Role    | Foreground | Background |
|---------|------------|------------|
| Success | `#4F8A5B`  | `#E8F2EA`  |
| Warning | `#C98A1F`  | `#FBEDD0`  |
| Error   | `#B33A2A`  | `#F8DDD7`  |
| Info    | `#3D6D8F`  | `#E1EDF4`  |

#### Theme B — `semantic-earthy`
| Role    | Foreground | Background |
|---------|------------|------------|
| Success | `#6B8F5A`  | `#EEF2E6`  |
| Warning | `#B07A2A`  | `#F6E6CC`  |
| Error   | `#9A4636`  | `#F2D9D2`  |
| Info    | `#4F7384`  | `#E3ECF1`  |

#### Theme C — `semantic-bright` (highest accessibility)
| Role    | Foreground | Background |
|---------|------------|------------|
| Success | `#2E7D44`  | `#E3F1E7`  |
| Warning | `#D98E00`  | `#FDEFCC`  |
| Error   | `#C0392B`  | `#FADBD6`  |
| Info    | `#1F6FA5`  | `#DCEBF5`  |

> Implementation note: expose a `data-semantic-theme="warm|earthy|bright"` attribute on `<html>` (or equivalent CSS variable scope) so QA can hot-swap without rebuilding.

### 3.3 Hero gradient — **"Breath"** (locked)

Used for hero sections, launch screen, level cards, and seasonal graphics. Moves from warm cream into sage — embodies the inhale/exhale of yoga practice.

- Stops: `#FFF8EC` → `#F1F5EE` → `#B7C9A8`
- Default angle: `160deg` (top-left to bottom-right, slightly tilted)
- Token: `gradient/breath`

```css
background: linear-gradient(160deg, #FFF8EC 0%, #F1F5EE 55%, #B7C9A8 100%);
```

### 3.4 Elevation / Shadow — **"Soft warm"** (locked)

Warm-tinted shadows that recede into the cream background instead of punching holes in it.

| Token       | Value                                       | Use                          |
|-------------|---------------------------------------------|------------------------------|
| `shadow/sm` | `0 1px 2px rgba(92, 47, 21, 0.06)`          | Inputs, chips                |
| `shadow/md` | `0 4px 12px rgba(92, 47, 21, 0.08)`         | Cards, class tiles           |
| `shadow/lg` | `0 12px 32px rgba(92, 47, 21, 0.12)`        | Modals, bottom sheets        |

### 3.5 Corner radius — **"Pillow"** (locked)

Generous, soft radii — never sharp. Reinforces the calm, body-positive feel.

| Token         | Value (px) | Use                          |
|---------------|------------|------------------------------|
| `radius/xs`   | `6`        | Tags, small chips            |
| `radius/sm`   | `10`       | Inputs, buttons              |
| `radius/md`   | `14`       | Cards                        |
| `radius/lg`   | `20`       | Hero / level cards           |
| `radius/xl`   | `28`       | Bottom sheets, modals        |
| `radius/full` | `9999`     | Avatars, pill buttons, QR    |

### 3.6 Iconography — **Lucide** (locked)

Thin, minimal, modern. Keeps UI light so the warm palette and Mitr typography carry the personality.

- Library: [`lucide-react`](https://lucide.dev/)
- Default stroke: `1.75`
- Default size: `20px` in UI, `24px` in nav, `16px` in dense lists
- Color: inherit `currentColor` from text — never hard-coded
- Filled / decorative graphics (level badges, Tiger Toys) are illustrations, not icons — see §3.7

### 3.7 Imagery / illustration — **Hand-drawn warm line art** (locked)

Organic, imperfect line work in primary/accent tones. Used for yoga poses, the Cat / Tiger / Leopard level system, Tiger Toys collectibles, and seasonal hero graphics.

**Rules**
- Stroke color: `primary/800` (`#874621`) or `accent/800` (`#3A5030`) — never pure black
- Fill color: any `primary/100–300` or `accent/100–300` tint
- Background: transparent — drops onto `neutral/bg` or `neutral/card`
- Line weight: variable, hand-drawn feel — avoid uniform vector strokes
- Optional accent: a single watercolor wash behind the subject for hero use

---

## 4. Usage rules

- Backgrounds: default to `neutral/bg`. Cards always one step warmer (`neutral/card`), never pure white.
- Primary CTA: `primary/500` fill, text in `neutral/ink` or `white` (verify per button size).
- Secondary CTA: `neutral/card` fill with `primary/700` text and `1px` `neutral/line` border.
- Destructive: semantic `error` only — never red-shifted orange (would clash with brand).
- Text on orange surfaces: prefer `neutral/ink` (`#2A1C14`) over pure black.
- Never use pure `#FFFFFF` as a background — always `neutral/bg` or `neutral/card`.
- Never use pure `#000000` — always `neutral/text` or `neutral/ink`.

---

## 5. Design tokens (proposed naming)

```
color.primary.{50..900}
color.neutral.{bg, card, line, text, text-2, text-3, ink}
color.accent.{50..900}          // Sage Green — see §3.1
color.semantic.{success,warning,error,info}.{fg,bg}   // theme-swappable: warm | earthy | bright — see §3.2
gradient.breath                 // hero gradient — see §3.3
font.family.{display, body}
font.size.{display-lg, display, h1, h2, h3, body-lg, body, caption, overline}
radius.{xs, sm, md, lg, xl, full}
shadow.{sm, md, lg}
```

---

## 6. LIFF / in-app browser CSS constraints

The app runs inside the **LINE in-app browser** (iOS WKWebView + Android Chrome WebView). These constraints shape the CSS setup:

### Layout & viewport
- **Use `100dvh` / `100svh`, never `100vh`.** The LINE address bar collapses on scroll, breaking `vh`. Tailwind v4 ships `h-dvh` / `min-h-dvh`.
- **Honor safe areas.** iPhone notch + home indicator require `env(safe-area-inset-*)` padding. Set `viewport-fit=cover` on the viewport meta.
- **Disable iOS rubber-band bounce** at the root with `overscroll-behavior-y: none` to feel app-native. Allow it on bottom sheets / scrollable panels intentionally.
- **Prevent iOS form-input zoom-on-focus.** Inputs must have `font-size ≥ 16px`. Smaller labels are fine; the `<input>` itself is not.

### Touch & interaction
- **Kill the blue/grey tap flash** with `-webkit-tap-highlight-color: transparent` globally, then style real `:active` / `:focus-visible` states.
- **Gate hover styles** behind `@media (hover: hover)` — `:hover` sticks on touch devices and looks broken.
- **Disable text auto-sizing** with `-webkit-text-size-adjust: 100%` (iOS resizes text on rotation otherwise).
- **Avoid `position: fixed` overlapping soft keyboards.** Prefer `position: sticky` or anchor to `visualViewport` for inputs.

### Colors & modern CSS
- **OKLCH colors** (Tailwind v4 default) work on iOS 15.4+ / Chrome 111+ — fine for LINE in 2026, but our tokens are written in **hex** for predictability and to render identically in Figma + email.
- **`:has()` selector** works on iOS 15.4+ / Chrome 105+ — safe to use.
- **`backdrop-filter`** needs `-webkit-backdrop-filter` fallback for older iOS LINE installs. Avoid relying on it for legibility.
- **No `dark` mode** for v1 — LINE LIFF respects system theme, but our warm cream palette is intentionally light-only. Force `color-scheme: light`.

### Fonts
- **Use `next/font/google`** to self-host Mitr + Noto Sans Thai. Google Fonts CDN adds latency inside the LINE webview and can be blocked on some carriers.
- **Always include `subsets: ['thai', 'latin']`** — otherwise Thai glyphs fall back to system fonts inconsistently across iOS/Android.
- **`font-display: swap`** to avoid invisible-text flash inside LINE.

### Scrollbars & misc
- WebKit ignores `scrollbar-width` / `scrollbar-color`. Use `::-webkit-scrollbar` if needed, or hide entirely.
- `:focus` outlines must be replaced with custom `:focus-visible` rings — default iOS rings are inconsistent.

---

## 7. Decisions log

- [x] §3.1 Accent color — **Sage Green**
- [x] §3.2 Semantic palette — **All 3 kept as hot-swappable themes**, default `semantic-warm`
- [x] §3.3 Hero gradient — **Breath**
- [x] §3.4 Shadow style — **Soft warm (S1)**
- [x] §3.5 Radius scale — **Pillow (R1)**
- [x] §3.6 Icon set — **Lucide (I3)**
- [x] §3.7 Imagery direction — **Hand-drawn warm line art (V1)**
