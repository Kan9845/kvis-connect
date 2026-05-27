# KVIS Connect — Design System

> Source of truth for visual consistency across all pages.
> Cross-reference with `.impeccable.md` for the design context and brand brief.

---

## Brand Colors

All colors use OKLCH. **Never use hex or HSL for brand values.**

```ts
const P = {
  purple:     "oklch(44% 0.26 294)",   // "VIS" in logo — primary accent
  purpleSoft: "oklch(95% 0.035 294)",  // purple tint backgrounds
  green:      "oklch(40% 0.16 148)",   // "K" in logo — secondary accent / verified
  text3:      "oklch(62% 0.005 294)",  // muted labels, metadata, captions
  rule:       "oklch(90% 0.007 294)",  // dividers, subtle borders
};
```

**When to use each:**
- `purple` — active states, brand kickers, section numerals (alternate with green), CTAs
- `green` — KVIS cohort numerals in section heads, verified badges, positive status
- `text3` — all caps labels, metadata strips, rank numerals
- `rule` — horizontal dividers, field row borders; never use `border-foreground/10` for these

---

## Typography Scale

**Tailwind classes only. No `text-[Npx]` arbitrary sizes. No `fontSize` inline styles.**

| Class        | px  | Use case |
|--------------|-----|----------|
| `text-xs`    | 12  | Captions, footnotes, kicker labels, metadata |
| `text-sm`    | 14  | Body copy, card content, field hints |
| `text-base`  | 16  | Emphasized body, card subtitles |
| `text-lg`    | 18  | Card headings, section labels |
| `text-xl`    | 20  | Sub-section titles |
| `text-2xl`+  | 24+ | Section headings (SectionHead `h2`) |
| `text-5xl`+  | 48+ | Page masthead `h1` only |
| `text-4xl`+  |     | Hero stat numbers, count-up values |

**Weights:**
- `font-medium` — body text, nav links, country names
- `font-semibold` — emphasized labels, secondary headings
- `font-bold` — numbers, percentages, kicker labels
- `font-black` — page `h1`, section `h2`, hero numbers

**Letter spacing:**
- `tracking-[-0.03em]` — masthead h1
- `tracking-[-0.025em]` — section h2
- `tracking-[0.28em]` — ALL CAPS kickers and tab triggers
- `tracking-[0.22em]` — ALL CAPS metadata strips

**Always use `tabular-nums` on any numeric or percentage value.**

---

## Masthead Pattern

Every page uses the same masthead structure above the first tab/section:

```tsx
<header className="pb-7 border-b border-foreground/60">
  {/* Purple kicker */}
  <p className="text-xs font-bold uppercase tracking-[0.3em] mb-3" style={{ color: P.purple }}>
    KVIS Connect · [Page Name]
  </p>
  {/* Giant h1 */}
  <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-[-0.03em] leading-[0.95] text-foreground">
    [Title]
  </h1>
  {/* Subtitle */}
  <p className="mt-4 text-sm md:text-base text-muted-foreground max-w-[60ch] leading-relaxed">
    [Subtitle]
  </p>
  {/* Metadata strip */}
  <div className="flex items-center gap-3 md:gap-4 mt-6 text-xs tabular-nums uppercase tracking-[0.22em] flex-wrap"
       style={{ color: P.text3 }}>
    <span>[Meta A]</span>
    <span aria-hidden>·</span>
    <span>[Meta B]</span>
  </div>
</header>
```

---

## Tab Triggers

Exact class string — copy verbatim. Do not abbreviate or vary.

```tsx
<TabsList className="h-auto w-full justify-start gap-7 rounded-none border-b bg-transparent p-0 pt-5 pb-1"
          style={{ borderColor: P.rule }}>
  <TabsTrigger
    value="..."
    className="rounded-none bg-transparent px-0 py-1 text-xs font-bold uppercase tracking-[0.28em] text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-[oklch(44%_0.26_294)] data-[state=active]:shadow-none data-[state=active]:underline data-[state=active]:underline-offset-8 data-[state=active]:decoration-2"
  >
    [Label]
  </TabsTrigger>
</TabsList>
```

For non-Radix mode switches (e.g., upload vs goose), use inline underline buttons:

```tsx
<div className="flex items-center gap-6 border-b pb-4" style={{ borderColor: P.rule }}>
  <button
    type="button"
    className="text-xs font-bold uppercase tracking-[0.28em] pb-1 transition-colors"
    style={active ? { color: P.purple, borderBottom: `2px solid ${P.purple}` } : { color: P.text3 }}
  >
    [Label]
  </button>
</div>
```

---

## Section Heads

```tsx
<header className="pt-14 pb-6">   // stats variant — more vertical space
  <div className="flex items-baseline gap-4 mb-3">
    <span className="font-mono font-black text-2xl tabular-nums" style={{ color: P.green }}>
      {numeral}  // "I.", "II.", "III." — use green for numerals
    </span>
    <span className="text-xs uppercase tracking-[0.28em] font-bold" style={{ color: P.text3 }}>
      {kicker}
    </span>
  </div>
  <h2 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-[-0.025em] leading-[1.02] text-foreground">
    {title}
  </h2>
</header>
```

Edit page variant uses `pt-9 pb-4` and `text-xl` numeral — tighter because sections are form-dense.

---

## Buttons

**Primary (save, submit):**
```tsx
className="h-auto rounded-none bg-foreground px-6 py-3 text-xs font-bold uppercase tracking-[0.28em] text-background hover:bg-foreground/90 disabled:opacity-40 gap-2"
```

**Secondary (add entry, cancel, outline):**
```tsx
className="h-auto rounded-none border-foreground bg-transparent px-6 py-3 text-xs font-bold uppercase tracking-[0.28em] text-foreground hover:bg-foreground hover:text-background gap-2"
```

**Ghost text link (see all, expand):**
```tsx
className="h-auto p-0 text-xs font-bold uppercase tracking-[0.22em] no-underline hover:underline"
style={{ color: P.purple }}
```

**Rules:**
- Never `rounded-2xl` or `rounded-3xl` on buttons. Always `rounded-none`.
- Never `h-12` with `px-8`. Use the `h-auto py-3 px-6` pattern.
- Icon inside button: `h-3.5 w-3.5`.

---

## Form Fields

**FieldRow wrapper** (label left, input right, divider bottom):
```tsx
<div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-x-6 gap-y-2 py-4 border-b"
     style={{ borderColor: P.rule }}>
  <div className="md:pt-2.5">
    <span className="text-xs uppercase tracking-[0.24em] font-bold" style={{ color: P.text3 }}>
      {label}{required && <span style={{ color: P.purple }}> *</span>}
    </span>
    {hint && <p className="text-xs text-muted-foreground mt-1 normal-case tracking-normal">{hint}</p>}
  </div>
  <div className="min-w-0">{children}</div>
</div>
```

**Input class** (underline-only, no box):
```ts
const inputCls = "w-full bg-transparent border-0 border-b border-foreground/20 rounded-none px-0 py-2 text-sm md:text-base text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-foreground transition-colors";
```

**Select trigger class:**
```ts
const selectTriggerCls = "w-full bg-transparent border-0 border-b border-foreground/20 rounded-none px-0 py-2 text-sm md:text-base text-foreground focus:ring-0 focus:ring-offset-0";
```

---

## Filter Pills

Used in stats cohort selector and kvisian filter rail. See `FilterPill` component.

**FilterRow wrapper:**
```tsx
<div className="grid grid-cols-[72px_1fr] md:grid-cols-[100px_1fr] items-baseline gap-x-5 gap-y-2 py-3.5 border-t"
     style={{ borderColor: P.rule }}>
  <span className="text-xs uppercase tracking-[0.26em] font-bold" style={{ color: P.text3 }}>
    {label}
  </span>
  <div className="flex items-center flex-wrap gap-x-4 gap-y-2.5">
    {children}
  </div>
</div>
```

---

## Portraits / Profile Pictures

Portraits in the kvisian grid and profile previews are **sharp-cornered squares** — no rounding.

```tsx
<div className="relative aspect-square overflow-hidden bg-muted">
  <Image src={url} alt={name} fill className="object-cover" />
</div>
```

Country badge overlay (kvisian):
```tsx
<span className="absolute bottom-1.5 right-1.5 text-[9px] font-bold uppercase tracking-[0.18em] px-1.5 py-0.5 bg-background/90 text-foreground">
  {country.slice(0, 3)}
</span>
```

---

## Upload Zones

No rounded corners. Plain dashed border:

```tsx
<label className="flex h-40 w-full max-w-md cursor-pointer items-center justify-center border border-dashed border-foreground/20 transition-colors hover:border-foreground/50">
  ...
</label>
```

---

## Dividers

```tsx
// Heavy — masthead bottom, page footer top
border-b border-foreground/60

// Light — section separators, field rows
style={{ borderColor: P.rule }}   // oklch(90% 0.007 294)
```

---

## Page Layout

```tsx
// Content pages (edit, stats, profile)
<div className="mx-auto max-w-5xl px-6 lg:px-10 py-10 lg:py-14">

// Wide pages (kvisian portrait grid)
<div className="mx-auto max-w-6xl px-6 lg:px-10 py-10 lg:py-14">
```

---

## Page Footer

```tsx
<footer className="mt-20 pt-6 border-t border-foreground/60 text-muted-foreground text-xs uppercase tracking-[0.22em] flex items-center justify-between flex-wrap gap-2">
  <span>- [summary] -</span>
  <span className="tabular-nums">[secondary info]</span>
</footer>
```

---

## What to Never Do

- `text-[Npx]` arbitrary font sizes — use the Tailwind scale
- `fontSize` in inline styles
- `rounded-2xl` / `rounded-3xl` on buttons or input zones
- `border-left: Npx solid [color]` accent stripes on cards (banned pattern)
- `background-clip: text` gradient text (banned pattern)
- Generic SaaS `variant="default"` rounded buttons in editorial contexts
- HSL or hex for brand colors — use OKLCH
- Gray text on colored backgrounds — tint to the surface hue instead
