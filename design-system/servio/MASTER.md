# Servio — Master Design System

Generated with the `ui-ux-pro-max` skill (verified domain match: **Home Services marketplace / booking & appointment**).
Style: **Soft UI Evolution** — clean surfaces, restrained shadows, crisp focus, subtle motion. Light + Dark.
Single source of truth for tokens. If a component deviates here, the component file is wrong.

## Product
Home-services on-demand marketplace (request → smart match → schedule → track). Roles: customer, provider, admin.
Consumer-grade marketing + role dashboards. Bangla + English copy → font stacks carry Bangla-capable fallbacks.

## Style (from skill)
- Soft UI Evolution: better contrast than soft-UI, accessibility-first, modern enterprise, low visual noise.
- Do NOT: heavy gradients, glassmorphism everywhere, neon, huge rounded cards, excessive shadows, emoji-as-icons.

## Color tokens (CSS variables — `client/src/index.css`)
Theme-adaptive tokens. Every color is `rgb/hex` var defined for `:root` (light) and `.dark`.

| Token | Light | Dark | Role |
|---|---|---|---|
| `--canvas` | `#f4f7fb` | `#0a0f1a` | Page background |
| `--surface` | `#ffffff` | `#101827` | Cards / panels |
| `--elevated` | `#ffffff` | `#17202f` | Popovers / menus / dropdowns |
| `--inset` | `#eef2f7` | `#0d1524` | Input wells / subtle fills |
| `--line` | `#e3e9f2` | `#223045` | Hairline borders |
| `--line-strong` | `#c7d2e0` | `#35455f` | Stronger borders / hover |
| `--fg` | `#0f172a` | `#e7edf6` | Primary text |
| `--muted` | `#475569` | `#aab6c9` | Secondary text (≥4.5 on surface) |
| `--faint` | `#64748b` | `#8494a9` | Tertiary text / captions |
| `--brand` | `#2563eb` | `#3b82f6` | Primary action bg / links |
| `--brand-hover` | `#1d4ed8` | `#2f6fe0` | Primary action hover |
| `--brand-soft` | `#eaf1fd` | `#182641` | Brand tint surface |
| `--brand-text` | `#1e40af` | `#a5c8ff` | Accent text on surface |
| `--brand-border` | `#c5dbfa` | `#2c4370` | Brand border |
| `--success` soft/text/border | `#e6f5ef / #047857 / #bfe3d5` | `#13291f / #6fd6ac / #1e4234` | Positive |
| `--warning` soft/text/border | `#fdf2e2 / #b45309 / #f3d9ae` | `#352713 / #f2bd6e / #4a3a1e` | Caution |
| `--danger` soft/text/border | `#fdecec / #b91c1c / #f3c7c7` | `#361a1c / #f6a5a5 / #54272a` | Destructive |
| `--info` soft/text/border | `#e0f2fe / #0369a1 / #b6e0f7` | `#102b3d / #7fc6ef / #1e4057` | Informational |

Status pills never rely on color alone — always pair with an icon or label text (WCAG).

## Typography
- Headings/display: **Poppins** (600–800). Body/UI: **Open Sans** (400–700). Loaded in `index.html`.
- Fallback stacks append Bangla-capable fonts: `"Noto Sans Bengali", "SolaimanLipi", "Vrinda"` (Bangla text must not fall to tofu).
- Type scale utilities come from Tailwind defaults; hierarchy: page `h1` = `text-2xl md:text-3xl font-extrabold tracking-tight`, section `h2` = `text-lg md:text-xl font-bold`.

## Spacing
Use the Tailwind spacing scale only (4px base). Common rhythm: page `py-8 md:py-12`, section gap `space-y-6`/`grid gap-4 md:gap-5`, card padding `p-5`, dialog `p-5`.

## Radius / elevation / motion
- Radius: inputs/buttons/segments `rounded-lg`–`xl`, cards `rounded-2xl`, pills `rounded-full`.
- Shadows (`boxShadow`): `soft` = cards, `pop` = floating surfaces/menus. Dark mode shadows are black-tinted & tight.
- Motion: 150–250ms, ease-out; `fade`, `pop`, `slide-up` utilities. `prefers-reduced-motion` collapses all to ~0.

## Component rules
- Buttons: solid primary (brand), secondary (surface+border), ghost, danger, brand-soft outline. `cursor-pointer`, `min-h-[44px]` touch target on md.
- Inputs: label above, placeholder not a label, focus = brand ring; `aria-invalid` + inline error text.
- Modal: `role="dialog"`, `aria-modal`, ESC closes, click-scrim closes, scroll lock, `pop` entrance.
- Empty/loading/error states: consistent primitives (EmptyState w/ icon, Skeleton) — never blank flashes.
- Icons: **lucide-react only**, `aria-hidden`, consistent 18–20px; no emoji as UI icons (chat *content* exempt).

## Responsive
Breakpoints 375 / 768 / 1024 / 1440. Nav collapses to drawer < md. Tables scroll horizontally. Two-col grids stack under `md`. Chat panel width `min(100vw - 2rem, 26rem)`.
