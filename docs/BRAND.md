# Digital Legacy — Brand & Design Guidelines

> For coding agents and developers building on this codebase.
> Read this before writing any UI code.

---

## 1. Product context

Digital Legacy is a **private, family-only** web application for preserving a
person's personality, voice, memories, and values — and making them accessible
to future generations through natural conversation with an AI persona.

### Two surfaces, two emotional registers

| Surface | Who uses it | Tone |
|---|---|---|
| **Capture mode** | Living subject | Reflective, purposeful, journal-like. A workspace for recording one's life. |
| **Conversation mode** | Authorised family members | Warm, unhurried, photo-forward. The product's most emotionally sensitive surface — treat it gently. |

The overarching principle is **emotionally considered design** and
**privacy above all**: no AI-company branding, no algorithmic noise, complete
data sovereignty. The interface should feel like it belongs to the *family* —
closer to a well-designed book or a family archive than a SaaS product.

---

## 2. Design tokens

All tokens live in `src/app/globals.css` as CSS custom properties and are
registered with Tailwind v4 via `@theme inline`.

### Colour palette

```
Background canvas:  --bg            #f9f8f6  (light)  /  #18130f  (dark)
Card surface:       --surface       #ffffff  (light)  /  #211b16  (dark)
Hover fill:         --surface-2     #f4f2ef  (light)  /  #2b2219  (dark)
Divider fill:       --surface-3     #e8e4de  (light)  /  #392d20  (dark)

Primary text:       --fg1           #1e1a17  (light)  /  #f3ece0  (dark)
Body text:          --fg2           #4f463d  (light)  /  #d8cdbd  (dark)
Secondary text:     --fg3           #6b6056  (light)  /  #b3a796  (dark)
Meta / muted:       --fg4           #8a7f72  (light)  /  #8f8373  (dark)
Placeholder:        --fg-faint      #c8bcac  (light)  /  #5b5040  (dark)

Default hairline:   --border        #e8e4de  (light)  /  #322820  (dark)
Input border:       --border-strong #d9d4cd  (light)  /  #463829  (dark)
Hover border:       --border-hover  #8a7f72  (light)  /  #6a5a45  (dark)

Primary action:     --primary       #1e1a17  (light)  /  #f3ece0  (dark)
Primary text:       --primary-fg    #faf7f1

Brand accent (seal):--accent        #8a2f29  (light)  /  #d98d6a  (dark)  ← oxblood / sealing wax
Memory accent:      --memory        #c0822a  (light)  /  #d9a441  (dark)  ← amber, memories ONLY
```

**Rule: the accent (`--accent`) is reserved for brand moments — the logo mark,
links, and focus rings. The memory (`--memory`) token is reserved exclusively
for memory-linked elements (tags, linked-memory marks). Do not use either for
general UI decoration.**

### Typography

| Token | Value | Use |
|---|---|---|
| `--font-sans` | Manrope, system-ui | Everything: headings, body, UI labels |
| `--font-mono` | IBM Plex Mono | Timestamps, audio durations, technical meta only |

**Manrope is the single typeface.** No serif. No switching.

Weight conventions:

| Context | Weight | Size token |
|---|---|---|
| Hero / display name | 300 (light) | `--text-display` 3.25rem |
| H1 headings | 500 | `--text-h1` 2.25rem |
| H2 headings | 500 | `--text-h2` 1.625rem |
| H3 / section labels | 600 | `--text-h3` 1.1875rem |
| Body / reading text | 400 | `--text-lg` 1.125rem |
| UI default / labels | 500 | `--text-sm` 0.875rem |
| Eyebrow / meta | 400 | `--text-xs` 0.75rem |
| Buttons | 600 | `--text-sm` |

Eyebrow labels are the **only uppercase moment**: `text-xs`, tracked `0.12em`,
in `--fg4`. Use them sparingly for section identifiers.

### Shape

```
--radius-sm:    5px   (buttons, inputs, chips, tags)
--radius:       8px   (cards, bubbles, panels)
--radius-lg:    12px  (modals, large surfaces)
--radius-full:  9999px (progress tracks, small badges, pills)
```

**Never use large pill radii on containers.** Pill shapes are for tags and
progress bars only.

### Elevation

Cards = `background: var(--surface)` + `1px solid var(--border)` + `var(--shadow-sm)`.

```
--shadow-sm:  0 1px 2px rgba(30,26,23,0.05)   — resting card
--shadow:     0 2px 8px -2px rgba(30,26,23,0.09)
--shadow-md:  0 10px 30px -8px rgba(30,26,23,0.14)  — modals
```

Hover lifts the **border** (`--border` → `--border-hover`), not the shadow.
Shadows are warm-tinted — never cool blue.

### Spacing rhythm

Base unit: 4px. Common steps: `12 / 16 / 20 / 24 / 32 / 40px`.
Content columns are narrow and centred: `max-w-4xl` to `max-w-5xl`.
Reading measure matters — don't go full-width for text content.

### Motion

```
--dur:       180ms   (default transitions)
--dur-slow:  320ms   (photo surfacing, reply fade)
--ease:      cubic-bezier(0.22, 0.61, 0.36, 1)
```

**Calm and minimal.** No bounce, no spring, no parallax.
Always respect `prefers-reduced-motion` — `globals.css` disables transitions
for users who prefer it.

---

## 3. Dark mode

The app uses a `data-theme="dark"` attribute on `<html>` for manual overrides
and `@media (prefers-color-scheme: dark)` as the OS fallback.

To force light mode: `<html data-theme="light">`.
All tokens switch automatically — never hard-code colours; always use CSS
custom properties or their Tailwind aliases.

---

## 4. Component patterns

### Cards
```html
<div class="rounded-lg border border-[var(--border)] bg-[var(--surface)]
            p-5 shadow-sm transition hover:border-[var(--border-hover)]">
```

### Primary buttons
```html
<button class="rounded-[var(--radius-sm)] bg-[var(--primary)] px-4 py-2
               text-sm font-semibold text-[var(--primary-fg)]
               transition hover:bg-[var(--primary-hover)]
               focus:outline-none focus:ring-2 focus:ring-[var(--ring)]
               disabled:cursor-not-allowed disabled:opacity-40">
```

### Text inputs
```html
<input class="w-full rounded-[var(--radius-sm)] border border-[var(--border-strong)]
              bg-[var(--surface)] px-3 py-2 text-sm
              placeholder:text-[var(--fg-faint)]
              focus:border-[var(--primary)] focus:outline-none
              focus:ring-2 focus:ring-[var(--ring)]">
```

### Eyebrow labels
```html
<span class="text-xs font-medium uppercase tracking-[0.12em] text-[var(--fg4)]">
  Section title
</span>
```

### Memory tags (amber — use sparingly)
```html
<span class="rounded-full bg-[var(--memory-soft)] px-2 py-0.5
             text-xs font-medium text-[var(--memory-fg)]">
  Linked memory
</span>
```

---

## 5. Iconography

**The product is text-first.** Prefer a clear text label over an icon wherever
space allows.

- **Recommended set:** [Lucide](https://lucide.dev) — 1.5px stroke, round caps,
  `currentColor`. Use `20px` boxes (16px in dense rows).
- **Never** filled, duotone, or multicolour.
- **Colour:** muted (`--fg4`) at rest; `--fg1` on hover/active.
  On ink (`--primary`) buttons, icons go white.
- **Amber / memory colour only** for memory-linked affordances.
- Earned glyphs: `mic`, `square`, `play`, `pause`, `upload`, `image`, `search`,
  `chevron-left`, `arrow-left`, `x`, `volume-2`, `lock`.

---

## 6. Writing style

- **British English.** `labelled`, `authorised`, `recognise`. Dates: `2 Jun 2026`.
- **Sentence case everywhere.** Headings, buttons, nav. No Title Case.
- **Short verb buttons:** *Save entry*, *Send*, *Sign in*. Not *Submit Form*.
- **No exclamation marks.** No ALL-CAPS (except eyebrow labels).
- **Em-dashes for asides** — like this. Use `&mdash;` or `—`.
- **Errors are gentle and non-blaming:** "The message could not be sent."
- **Emoji are functional only:** single emoji on emotion labels and `🔊` on
  voice replies. Never decorative, never in headings.
- **The vibe:** a hand on the shoulder. Reverent without being mournful;
  warm without being saccharine.

---

## 7. Imagery

- Family photographs are the heroes, especially in Conversation mode.
- Present photos full-bleed or in soft-cornered frames (`--radius-lg`).
- Warm, slightly faded register — think album, not gallery.
- Chrome stays neutral so photographs sing.
- Photo overlays: a bottom-up `var(--ink)` gradient scrim at low opacity only.

---

## 8. Logo

Logo files live in `/public/`:
- `logo-light.svg` — for use on dark backgrounds
- `logo-dark.svg` — for use on light backgrounds

Use the `<Logo>` component at `src/components/ui/Logo.tsx`, which handles
automatic variant switching in dark mode.

---

## 9. What NOT to do

- Do not use blue, purple, or any cool accent. The palette is warm-neutral.
- Do not add decorative illustrations or generated icons.
- Do not use large pill-shaped containers.
- Do not add bounce or spring animations.
- Do not use the memory amber token outside of memory-linked elements.
- Do not hard-code hex colours in components — use CSS custom properties.
- Do not go full-width for reading text — respect `max-w-4xl`/`max-w-5xl`.
- Do not use AI-company branding or language anywhere in the UI.
