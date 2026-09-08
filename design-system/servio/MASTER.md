# Servio — Master Design System

Generated with the `ui-ux-pro-max` skill (verified domain match: **Home Services (Plumber/Electrician)**).

## Product
Home-services on-demand marketplace (request → smart match → schedule → track).

## Style
Flat Design + Minimalism & Swiss Style, Accessible & Ethical. No emoji icons (Lucide SVGs only).

## Colors (verbatim from skill `color` domain match)
| Token | Hex | Role |
|---|---|---|
| `--color-primary` | #1E40AF | Trust blue (deep) |
| `--color-primary-hover` | #1D4ED8 | |
| `--color-secondary` | #3B82F6 | |
| `--color-accent` | #EA580C | Safety orange — **CTA only** |
| `--color-background` | #EFF6FF | Soft blue page bg |
| `--color-foreground` | #1E3A8A | |
| `--color-card` | #FFFFFF | |
| `--color-muted` | #E9EEF6 | |
| `--color-muted-foreground` | #475569 | |
| `--color-border` | #BFDBFE | |
| `--color-destructive` | #DC2626 | |

Accent = #EA580C ("Professional blue + urgent orange"). Use orange sparingly — for primary CTAs only.

## Typography
- Heading: **Poppins** (600–700)
- Body: **Open Sans** (400–600)
- Base 16px, line-height 1.5, body text ≥ 13px.

## Landing pattern: Trust & Authority + Conversion
Hero (mission/credibility) → Proof (stats, trust signals) → Solution overview → Clear CTA path.
Primary CTA: accent orange. Reassurance: verified/rated providers.

## UX rules (from skill)
- Progress indicator for multi-step wizard.
- Inline field validation w/ `aria-describedby`; focusable error summary on failed submit.
- Touch targets ≥ 44px (web min 24px); no tiny w-6 h-6 buttons.
- Visible focus rings; `cursor-pointer` on all clickables.
- Hover transitions 150–300ms.
- `prefers-reduced-motion` respected (disable pulse/fade).
- Contrast ≥ 4.5:1; no gray-on-gray.
