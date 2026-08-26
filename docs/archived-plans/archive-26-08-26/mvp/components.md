# Component index — Phase 1 foundation

Quick storybook-style reference. Every primitive consumes only tokens from `app/globals.css` and matches §3 of `brand-guideline.md`. Until we ship a real Storybook, this doc is the source of truth.

Imports:
```ts
import { Button, Card, TextField, Badge, Chip, Avatar, Sheet, Modal, Skeleton, EmptyState, IconButton } from "@/components/ui";
import { TopBar, BottomNav, Container, SafeArea, Section } from "@/components/layout";
import { Display, H1, H2, H3, Body, BodySmall, Caption, Overline } from "@/components/typography";
import { useLiff, LiffProvider } from "@/lib/liff";
import { cn } from "@/lib/cn";
```

---

## Typography

| Component       | Font       | Size / LH | Weight | Use                          |
|-----------------|------------|-----------|--------|------------------------------|
| `DisplayLarge`  | Mitr       | 40 / 48   | 600    | Launch hero                  |
| `Display`       | Mitr       | 32 / 40   | 600    | Page hero                    |
| `H1`            | Mitr       | 24 / 32   | 600    | Section title                |
| `H2`            | Mitr       | 20 / 28   | 500    | Card / sub-section           |
| `H3`            | Noto Thai  | 18 / 26   | 600    | List heading                 |
| `Body`          | Noto Thai  | 16 / 24   | 400    | Primary body                 |
| `BodySmall`     | Noto Thai  | 14 / 22   | 400    | Default UI                   |
| `Caption`       | Noto Thai  | 12 / 18   | 500    | Meta / timestamps            |
| `Overline`      | Mitr       | 11 / 16   | 500    | Eyebrows, ALL CAPS labels    |

All accept `as` to swap the rendered element and any standard HTML props.

```tsx
<Display as="h1">Yoga Studio</Display>
<Overline>MiTR Journey</Overline>
```

---

## UI primitives

### Button — `Button`
Variants: `primary` (default) · `secondary` · `ghost` · `destructive`
Sizes: `sm` · `md` (default) · `lg`
Extras: `loading`, `leftIcon`, `rightIcon`, `fullWidth`

```tsx
<Button>Book now</Button>
<Button variant="secondary" leftIcon={<Calendar className="h-4 w-4" />}>Pick date</Button>
<Button loading fullWidth>Saving…</Button>
```

### IconButton — `IconButton`
Variants: `ghost` (default) · `filled` · `outline`
Sizes: `sm` · `md` · `lg`. Always requires `aria-label`.

```tsx
<IconButton aria-label="Close" onClick={onClose}>
  <X className="h-5 w-5" />
</IconButton>
```

### Card — `Card`, `CardHeader`, `CardBody`, `CardFooter`
`elevation`: `flat` · `sm` · `md` (default) · `lg`. `interactive` adds press feedback.

```tsx
<Card>
  <CardHeader><H2>Vinyasa</H2><Badge tone="primary">9:00</Badge></CardHeader>
  <CardBody><Body>Master Anup · 6 / 12 slots</Body></CardBody>
  <CardFooter><Button size="sm">Book</Button></CardFooter>
</Card>
```

### Input / TextField — `Input`, `TextField`
`TextField` wraps `Input` with label + hint/error. iOS-zoom-safe (16px).

```tsx
<TextField label="Phone" hint="We use this for class reminders" inputMode="tel" />
<TextField label="Name" errorText="Name is required" invalid />
```

### Badge — `Badge`
Tones: `neutral` · `primary` · `accent` · `success` · `warning` · `error` · `info`.

```tsx
<Badge tone="success">Booked</Badge>
<Badge tone="accent">Tiger</Badge>
```

### Chip — `Chip`
Selectable pill. Use for filters and the date strip. `aria-pressed` is wired.

```tsx
<Chip selected={day === selected} onClick={() => setSelected(day)}>Mon 24</Chip>
```

### Avatar — `Avatar`
Sizes: `sm` · `md` · `lg` · `xl`. Falls back to initials when `src` is empty.

```tsx
<Avatar src={user.picture} alt={user.name} fallback={user.name} size="lg" />
```

### Sheet — `Sheet`
Bottom sheet, height in `dvh`. Respects safe-area bottom, traps scroll, ESC to close.

```tsx
<Sheet open={open} onClose={() => setOpen(false)} title="Pick a date">
  <CalendarBody />
</Sheet>
```

### Modal — `Modal`
Centered, short confirmations. Prefer `Sheet` on mobile.

```tsx
<Modal open={open} onClose={close} title="Cancel booking?">
  <Body>You can re-book later from the schedule.</Body>
  <div className="mt-4 flex justify-end gap-2">
    <Button variant="ghost" onClick={close}>Keep</Button>
    <Button variant="destructive" onClick={confirm}>Cancel</Button>
  </div>
</Modal>
```

### Skeleton — `Skeleton`
Pulse placeholder. Use any shape via Tailwind classes.

```tsx
<Skeleton className="h-6 w-32" />
<Skeleton className="h-24 w-full rounded-md" />
```

### EmptyState — `EmptyState`
```tsx
<EmptyState
  icon={<CalendarCheck className="h-6 w-6" />}
  title="No classes today"
  description="Check tomorrow or open the calendar."
  action={<Button size="sm">Open calendar</Button>}
/>
```

---

## Layout

### Container
Page horizontal gutter, `max-w-screen-sm`, `px-4`.

### SafeArea
Adds `env(safe-area-inset-*)` padding on chosen edges.
```tsx
<SafeArea edges={["top"]}>…</SafeArea>
```

### Section
Titled section with optional right-side action.
```tsx
<Section title="Recent activities" action={<Button variant="ghost" size="sm">See all</Button>}>
  <ActivityList />
</Section>
```

### TopBar
Sticky header. `back` (boolean or href), `title`, `right`, `hero` (paints `bg-breath`).

```tsx
<TopBar title="Class detail" back />
<TopBar title="Home" hero right={<IconButton aria-label="Notifications"><Bell /></IconButton>} />
```

### BottomNav + BottomNavSpacer
The 5-tab nav from §1 of `user-flow.md`. Drives active state via `usePathname()`.
`BottomNavSpacer` reserves space at the bottom of any page so content is never covered.

---

## LIFF

### `LiffProvider` (already mounted in `app/layout.tsx`)
### `useLiff()`
```ts
const { liff, status, error, isInClient, isLoggedIn } = useLiff();
```
- `status`: `"loading" | "ready" | "error"`
- Treat `liff` as `null` until `status === "ready"`.

---

## Utilities

### `cn(...inputs)`
`clsx` + `tailwind-merge`. Use for every conditional class.

### `@/lib/icons`
Re-exports the Lucide icons used across the app. Add to the barrel rather than importing Lucide directly so swaps stay centralized. Default props: `strokeWidth={1.75}`, `currentColor`.

---

## Token cheatsheet

- Surfaces: `bg-neutral-bg` (page), `bg-neutral-card` (cards), `bg-breath` (hero gradient)
- Text: `text-neutral-text`, `text-neutral-text-2`, `text-neutral-text-3`, `text-neutral-ink`
- Primary: `bg-primary-500`, `text-primary-700`, `border-primary-200`
- Accent (sage): `bg-accent-100`, `text-accent-700`
- Semantic: `bg-success-bg text-success-fg` (also `warning`, `error`, `info`) — hot-swap via `<html data-semantic-theme="warm|earthy|bright">`
- Radius: `rounded-xs` (6) · `rounded-sm` (10) · `rounded-md` (14) · `rounded-lg` (20) · `rounded-xl` (28) · `rounded-full`
- Shadow: `shadow-sm` · `shadow-md` · `shadow-lg`
- Safe-area helpers: `.safe-pt`, `.safe-pb`, `.safe-px` (defined in `globals.css`)
