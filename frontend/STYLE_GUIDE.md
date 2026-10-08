# Cloud White Design System — Style Guide

Reference: `src/index.css`, `tailwind.config.js`, and the already-migrated pages
(`Home/*`, `ProductDetails`, `Store/Checkout`, `Store/TrackOrder`, `Policy`, `Layouts/MenuDrawer`).

**Goal:** every customer-facing page must look like the Home page. No more old
Flipkart style (`rounded-sm`, `shadow bg-white`, `bg-primary-orange`, default
gray borders).

## 1. Page container

Every page main wrapper:

```jsx
<main className="w-full sm:w-11/12 mx-auto flex flex-col gap-4 px-3 sm:px-4 pb-10 mt-3 sm:mt-6">
```

(Narrower forms may use `max-w-md mx-auto` / `max-w-3xl mx-auto` inside that
container instead of full width.)

## 2. Tokens

| Token | Value | Use |
|---|---|---|
| background | `bg-cloud` (#fafbfc) | page bg (body already sets it) |
| card | `.surface` = `bg-white border border-line rounded-xl` | all cards/panels |
| line | `border-line` (#e8ecf1) | EVERY border (never bare `border` for outlines) |
| accent | `primary-accent` (#3b82f6) | links, active states, primary CTA |
| success | `primary-green` (#10b981) | in-stock, success, ratings badge |
| warn | `primary-yellow` (#f59e0b) | COD / trust badges |
| muted text | `text-slate-500` / `text-slate-400` | secondary copy |
| heading text | `text-slate-900` | headings |

## 3. Typography

- Headings: `font-display font-bold text-slate-900` (Sora). Page title:
  `font-display font-extrabold text-xl sm:text-2xl text-slate-900`.
- Section heading helper: `.section-title`, tagline: `.section-tagline`.
- Body: default Manrope, `text-sm text-slate-600`.
- Small labels/uppercase tags: `text-xs font-semibold uppercase tracking-wider text-slate-400`.

## 4. Buttons (use the utility classes, NOT raw colors)

```jsx
.btn-accent   // primary blue button (replaces bg-primary-orange / bg-primary-blue)
.btn-ghost    // white outlined button (replaces "shadow border" secondary buttons)
```

- Sizes: keep `px-5 py-2.5` default; add `text-sm` / `text-xs` as needed.
- Disabled: `bg-slate-100 text-slate-400 cursor-not-allowed` (accent) or
  `border-line text-slate-400 cursor-not-allowed` (ghost).
- Icon + label: `inline-flex items-center gap-2`.
- Rounded corners are `rounded-lg` on buttons, `rounded-xl/2xl` on cards.

## 5. Forms / inputs

```jsx
<input className="input-field w-full" />   // = border-line rounded-lg px-3 py-2.5 text-sm
```

- Labels: `text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5`
  (or normal-case `text-sm font-medium text-slate-700` for form fields).
- Fieldsets/group boxes: `surface p-4 sm:p-5` with `font-display font-bold` heading.
- Read-only/disabled field: `bg-cloud cursor-not-allowed border-line`.

## 6. Common mappings (old → new)

| Old (Flipkart) | New (Cloud White) |
|---|---|
| `shadow bg-white rounded-sm` | `surface` |
| `bg-white shadow rounded-sm` | `surface` |
| `bg-primary-orange ... rounded-sm` | `btn-accent` |
| `bg-primary-blue ... rounded-sm uppercase shadow` | `btn-accent` |
| `bg-primary-grey cursor-not-allowed` | `bg-slate-200 text-slate-500 cursor-not-allowed` |
| `border-b` (bare) | `border-b border-line` |
| `border` (bare, as divider) | `border border-line` |
| `text-primary-blue` (links) | `text-primary-accent` |
| `bg-gray-50` | `bg-cloud` |
| `font-medium text-lg` (card title) | `font-display font-bold text-base sm:text-lg text-slate-900` |
| `hover:shadow-lg` on cards | `hover:shadow-md hover:-translate-y-0.5 transition duration-200` |
| `rounded-sm` anywhere | `rounded-lg` (controls) / `rounded-xl` (cards) |
| MUI `color="primary"` pagination | keep, but wrap in `surface p-3` |

## 7. Card list pattern

```jsx
<section className="surface flex flex-col overflow-hidden">
  <div className="flex items-center justify-between border-b border-line px-4 sm:px-5 py-4">
    <h2 className="section-title text-base sm:text-lg">Title</h2>
    <span className="section-tagline">optional</span>
  </div>
  {/* body: divide-y divide-line */}
</section>
```

## 8. Empty states

```jsx
<div className="surface flex flex-col items-center justify-center gap-3 p-8 sm:p-14 text-center">
  <img className="w-40 sm:w-52 object-contain" ... />
  <h3 className="font-display font-bold text-lg text-slate-900">...</h3>
  <p className="text-sm text-slate-500">...</p>
  <Link className="btn-accent">Shop Now</Link>
</div>
```

## 9. Hard rules

1. **Never** delete/rename logic, state, handlers, redux dispatch, or props —
   only JSX classNames/structure may change.
2. Keep all Bengali strings exactly as they are.
3. Keep every existing `id`, `htmlFor`, `name`, `type`, `value`, `onChange`,
   form/aria attributes.
4. MUI components (`Slider`, `Radio`, `Pagination`, `Dialog`, `Rating`) stay —
   only restyle their wrappers.
5. No new dependencies. No CSS files (use Tailwind classes only).
6. No `bg-red-*`/random colors for accents — use tokens above.
7. Mobile-first: verify `sm:` / `md:` / `lg:` breakpoints still work; the site
   has a fixed bottom bar on mobile (`pb` needed on pages).
