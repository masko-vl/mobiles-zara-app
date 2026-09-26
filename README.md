# Zara Challenge — Smartphone Catalog

A responsive, accessible smartphone catalog built with React + TypeScript: browse the
first 20 phones from a REST API, search in real time (API-backed, debounced), inspect
detailed specs with color/storage selectors that update the image and price live, and
manage a persistent shopping cart.

## Tech stack

- **React 19** + **TypeScript** (strict) — built with **Vite 7**
- **React Router 7** — three routes: catalog (`/`), phone detail (`/product/:id`), cart (`/cart`)
- **Context API** — cart state only (the one piece of state that is genuinely global)
- **CSS Modules** + **CSS custom properties** — no CSS framework
- **Vitest 5** + **React Testing Library** — behavior-focused tests
- **ESLint 9** (flat config) + **Prettier**
- Native `fetch` — no HTTP library

## Getting started

### Prerequisites

- **Node.js >= 20.19** (see [Node version note](#node-version-note))
- npm (bundled with Node)

### Setup

```bash
git clone <repo-url>
cd mobiles-zara-app
npm install

# Create your environment file and fill in the real values
cp .env.example .env

npm run dev
```

Open http://localhost:5173. The `.env` file is git-ignored; `.env.example` documents the
required variables. **Restart the dev server after creating or editing `.env`.**

### Scripts

| Script                            | What it does                                                                     |
| --------------------------------- | -------------------------------------------------------------------------------- |
| `npm run dev`                     | Dev server: assets served unminified (challenge requirement)                     |
| `npm run build`                   | Type-check (`tsc --noEmit`) + production build: bundled, minified, hashed assets |
| `npm run preview`                 | Serve the production build locally to smoke-test it                              |
| `npm run verify`                  | Lint + type-check + tests + build in one command (CI-style gate)                 |
| `npm test` / `test:watch`         | Run the test suite once / in watch mode                                          |
| `npm run lint` / `lint:fix`       | ESLint over the whole project                                                    |
| `npm run format` / `format:check` | Prettier over the whole project                                                  |
| `npm run typecheck`               | `tsc --noEmit`                                                                   |

## Environment variables

| Variable       | Purpose                                                                            |
| -------------- | ---------------------------------------------------------------------------------- |
| `VITE_API_URL` | Base URL of the phones REST API (never hardcoded in the source)                    |
| `VITE_API_KEY` | Value sent as the `x-api-key` header on every request (challenge auth requirement) |

The key travels in the client bundle by design of the challenge (client-side
authentication against a public test API). It is kept out of git via `.gitignore`.

## Architecture

```
src/
├── components/          # Reusable UI, one folder per component (.tsx + .module.css + test)
│   ├── Navbar/          # Home link + cart icon with live counter
│   ├── PhoneCard/       # Grid card: whole card is one router <Link>
│   ├── SearchBar/       # Labelled input, clear button returns focus to the input
│   ├── StorageSelector/ # <fieldset> + native radios styled as bordered boxes
│   ├── ColorSelector/   # Native radios as color swatches + selected color name
│   ├── SpecsList/       # Definition list of technical specs
│   └── BagIcon/         # Decorative inline SVG
├── context/             # Global cart state
│   ├── cart-context.ts  # Context object, storage key, public types
│   ├── CartProvider.tsx # useReducer + localStorage persistence
│   ├── cartReducer.ts   # Pure reducer (testable without React)
│   └── useCart.ts       # Consumer hook
├── hooks/               # Reusable stateful logic
│   ├── usePhones.ts     # Catalog list: loading/error, first-20 slice, in-memory cache
│   ├── usePhone.ts      # Detail by id: refetch on id change, abort on unmount
│   ├── usePhoneSearch.ts# API-backed search: min length, abort, latest-wins
│   └── useDebouncedValue.ts
├── models/              # TypeScript shapes mirroring the API contract
├── services/
│   ├── apiClient.ts     # fetch wrapper: x-api-key, AbortSignal, ApiError normalization
│   └── phoneService.ts  # Domain calls + response normalization (image URLs, defaults)
├── styles/              # Design tokens (CSS custom properties) + global styles
├── utils/               # Price formatting
├── views/               # One folder per route-level screen
├── App.tsx              # Router + CartProvider + layout
└── main.tsx             # Entry point (StrictMode + BrowserRouter)
```

### Layering rules

- **Views** own screen state and layout; they never call `fetch`.
- **Hooks** own server/async state (`loading`, `error`, data) and hide it from views.
- **Services** own the network and normalize API responses so the UI never sees raw
  payloads (e.g. missing fields, insecure image URLs).
- **Context** is used only for the cart, because it is the only state shared across
  unrelated components (navbar, detail, cart view). Server state deliberately lives in
  hooks, not in Context, to avoid global re-renders on every fetch.

### Key decisions

- **`fetch` over Axios** — the client is ~80 lines and covers auth header, query
  strings, abort signals and error normalization; Axios would add a dependency without
  solving anything extra.
- **Cart item identity = `phoneId | colorName | storageCapacity`** — adding the same
  combination twice merges into one line with a higher quantity; a different color or
  storage is a separate line. The reducer is a pure function, so identity and merging
  are tested without rendering React.
- **Derived values are never stored** — total quantity and total price are computed
  from items (`useMemo` in the provider); localStorage only holds the item list.
- **Search strategy** — controlled input → 400 ms debounce → queries of 2+ characters
  hit `GET /products?search=` (the API filters, never the client array). Every request
  carries an `AbortController`; when the query changes, the previous request is aborted
  and its late response is ignored (latest-wins), so race conditions and duplicate
  requests are structurally impossible. Clearing the query returns to the cached base
  list without a new request.
- **CSS Modules for layout, custom properties for theming** — scoped styles with zero
  runtime; tokens (colors, spacing, type scale, breakpoints context) live in
  `tokens.css`.

## API notes (verified against the live API)

- Base URL and auth are configured via env vars; every call sends `x-api-key`.
- `GET /products` returns 24 items with **one duplicated id** — the grid uses
  `id-index` keys to keep React keys unique.
- `GET /products/:id` has **no top-level `imageUrl`**; the default image is derived
  from the first `colorOptions` entry in `phoneService` (the UI can always rely on
  `detail.imageUrl`).
- `storageOptions[].price` is the **total price for that capacity**, not a delta on
  top of `basePrice`.
- The API serves images over plain `http://`; the service rewrites them to `https://`
  (same host) to avoid mixed-content blocking on HTTPS deployments.
- The list endpoint has no pagination; the "first 20 phones" requirement is a
  client-side slice.
- The free-tier host can take 30–60 s to answer the first request (cold start); all
  views show loading states and a retry action on failure.

## Node version note

The challenge brief lists Node 18 in the stack, but this project requires **Node

> = 20.19**. Rationale: Vite 7, Vitest 5 and React Router 7 (which keep `npm audit`
> at zero vulnerabilities) no longer support Node 18. The 4 moderate advisories found on
> the Node 18-compatible versions were either dev-only tooling (test runner) or
> unreachable from this app's usage (no external redirects, no SSR). Trading brief
> literalism for current, dependency-audit-clean tooling was a deliberate decision.

## Testing

73 tests, all behavior-focused (no implementation-detail assertions):

- **Pure logic**: cart reducer (merge by identity, separate lines, removal, restore),
  price formatting, debounce timing (fake timers).
- **HTTP layer**: auth header, query encoding (`%20`), error normalization (401, 404,
  network, invalid JSON), aborted requests re-thrown untouched.
- **Hooks**: loading/error/retry flows, first-20 cap, cache without refetch, search
  race conditions (late responses ignored), minimum query length.
- **Views**: rendered through Testing Library with accessible queries — disabled ADD
  until both options are picked, live price/image updates, remove-line syncing with
  localStorage, empty cart without totals, router redirects.

## Accessibility

Semantic HTML throughout (`nav`, `main`, `header`, lists, definition lists), a
keyboard skip-link to `main`, real `button`/`a` elements (no div-as-button), labelled
search input, `fieldset`/`legend` radio groups with native arrow-key navigation,
`aria-live` regions for price and results count, descriptive `aria-label`s where text
is absent, decorative images with `alt=""`, visible `:focus-visible` styles and AA
color contrast.

## Responsive design

Breakpoints derived from the Figma canvases (Desktop 1920, Tablet 834, Mobile 393):

| Range      | List grid | Detail                   | Cart                          |
| ---------- | --------- | ------------------------ | ----------------------------- |
| ≥ 1024px   | 5 columns | 2 columns                | Row footer                    |
| 768–1023px | 2 columns | 2 columns, tighter image | 120px thumbnails              |
| < 768px    | 1 column  | Stacked, full-width ADD  | TOTAL row + shared button row |

## Known trade-offs

- The **Pay** button is rendered for design fidelity but is inert: payment is out of
  the challenge scope.
- The navbar logo is a typographic placeholder approximating the Figma brand mark
  (the real asset requires Figma edit access).
- The API key is visible in the client bundle — inherent to the challenge's
  client-side authentication model; in production this would sit behind a BFF.
