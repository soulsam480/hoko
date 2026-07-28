# AGENTS.md

## Project

Hōkō — P2P BMTC bus tracking app. Users share GPS via WebRTC (GenosDB) and see
live buses on a Leaflet map.

## Commands

```bash
bun install          # install deps
bun run dev          # dev server (Caddy HTTPS + Vite at https://hoko.test)
bun run build:app    # production build → dist/
npx tsc --noEmit     # type check (no script in package.json)
npx biome check .    # format check (linter is disabled)
npx biome format .   # auto-format
```

## Stack & Quirks

- **Preact, not React** — `react` aliases to `preact/compat` in
  `vite.config.ts`. Never import from `react` directly.
- **Tailwind CSS v4** — config lives in `src/index.css`, no
  `tailwind.config.js`. Uses `@plugin "daisyui"` and `@source` directives.
- **DaisyUI v5** — themes: `acid` (default), `dracula` (prefersdark). Use
  DaisyUI classes, not custom CSS.
- **GenosDB** — P2P via WebRTC + Nostr signaling. Excluded from Vite
  optimizeDeps. Dynamic import in `connection.ts`.
- **sqlocal** — SQLite in browser via OPFS. Also excluded from optimizeDeps.
- **Biome** — formatter only, linter disabled. Single quotes, no trailing
  commas, spaces (2).
- **Caddy** — local dev uses HTTPS via `hoko.test` (Caddyfile). Required for
  WebRTC/geolocation.
- **COOP/COEP headers** — required for SharedArrayBuffer (set in netlify.toml).
  Breaking change if missing.

## Architecture

```
src/
  main.tsx          → entry: renders map + app, starts GPS, registers SW
  App.tsx           → root component (Loading + Controls)
  db/
    client.ts       → sqlocal wrapper, auto-fetches hoko_index.db on first load
    schema.ts       → Stop, Route, RouteToStop types
    queries.ts      → SQL queries (closest stops, route search, stops for route)
  lib/
    coordinates.ts  → haversine distance + feeder clustering (50m threshold)
    location.ts     → getCoordRange for bounding-box queries
  ui/
    stores.ts       → all Preact signals (gpsSignal, feeders, chosenStop, etc.)
    connection.ts   → GenosDB room join/leave, GPS broadcast (5s interval)
    persisted-signal.ts → signal + localStorage persistence
    suspense-utils.ts → suspendFn for async data with Suspense
    userId.ts       → persistent UUID in localStorage
    geo/
      map.ts        → Leaflet map, markers, effects, theme switching
      pos.ts        → navigator.geolocation.watchPosition wrapper
    components/     → UI cards (StopList, RouteList, TrackingControls, etc.)
scripts/
  make_db.ts        → Bun script to build hoko_index.db from public/*.db
```

## Conventions

- **Signals for state** — all reactive state in `stores.ts` via
  `@preact/signals`. Use `.value` to read/write.
- **Persisted signals** — `persistedSignal(value, key)` for localStorage-backed
  state.
- **Effects over callbacks** — map reactivity uses `effect()` from
  `@preact/signals`, not event handlers.
- **Icon imports** — `~icons/<collection>/<name>` via `unplugin-icons`.
  Auto-installed.
- **No comments** — codebase style avoids comments.
- **Preact components** — functional only, no class components.

## Gotchas

1. **No tests** — no test framework exists. Verify changes manually or add tests
   before claiming correctness.
2. **No typecheck script** — run `npx tsc --noEmit` explicitly. CI won't catch
   type errors.
3. **Biome linter off** — `biome check` only formats, doesn't lint. Don't rely
   on it for code quality.
4. **sqlocal + genosdb are browser-only** — they use OPFS/WebRTC and will fail
   in Node. Don't try to import them in scripts.
5. **First-load DB init** — `db/client.ts` fetches `hoko_index.db` on first
   visit (20MB). Subsequent loads use OPFS cache. `localStorage.init_db` flag
   controls this.
6. **Theme tiles** — map tiles change with theme. `dracula` = dark CartoDB,
   `lemonade` = light CartoDB. Config in `map.ts:22-25`.
7. **P2P channel naming** — channels are `gps-{routeId}`. Mismatched route IDs =
   silent failure.
8. **Stale feeders** — feeders expire after 2 min of inactivity (sweep in
   `connection.ts:27-37`). Don't hardcode feeder cleanup elsewhere.
9. **GPS polling** — single `watchPosition` in `pos.ts`, updates `gpsSignal`.
   Don't add duplicate watchers.
10. **Netlify headers** — COOP/COEP are required. If deploying elsewhere,
    replicate them.

## Previous Plans

`.opencode/plans/` contains implementation plans from prior sessions. Check
before starting new work — some may still be pending.
