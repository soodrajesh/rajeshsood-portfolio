# irajeshsood.com — Technical Architecture

Static HTML. No framework, no bundler, no `package.json`, no build step — what's in
the repo is byte-for-byte what Vercel serves. One Vercel project hosts **two
independent hand-written pages** plus **three reverse-proxy routes** into other
Vercel projects, all under one domain and one `Content-Security-Policy`.

- **`index.html`** (root, `/`) — a minimal landing/hub page: hero + two link grids
  ("things i've built" / "mac apps i've built") pointing out to the maintainer's other
  sites and repos.
- **`portfolio/index.html`** (`/portfolio/`) — the actual CV-style portfolio: a
  4-tab About / Experience / Projects / Contact page with full work history and a
  contact form.

These are **not** two views of shared data — they're two separately-authored HTML
files with their own `<style>` blocks, their own inline scripts, and (mostly)
duplicated boilerplate (same font stack, same color tokens, same header markup).
A change to one's copy or layout does not touch the other.

## Why two pages: a real restructure, not the original design

The repo did not start this way. Through commit `a8475ac` (2026-08-15), `/portfolio/`
was a `vercel.json` **rewrite** to a *separate* Vercel deployment
(`rajeshsood-portfolio.vercel.app`) — the 4-tab content lived only there, and `/`
served nothing but a redirect target for that proxy. Commit `f308672`
("Add a philosophy/portfolio-hub landing page at /", 2026-08-16) restructured this:

- The 4-tab content was copied into this repo as a real static file at
  `portfolio/index.html`, and the now-redundant `/portfolio/*` rewrite rules were
  deleted from `vercel.json` — Vercel serves it directly (`cleanUrls` +
  `trailingSlash` in `vercel.json` normalize `/portfolio` → `/portfolio/`).
- A brand-new minimal landing page was written for `/`, introducing the maintainer's
  projects rather than duplicating the CV content.
- The commit message explains the rationale directly: the old self-rewrite of `/`
  "would have broken once `/` changed" — i.e. two logical pages could not safely
  share one physical route via proxy once they diverged in content.

Net effect: **root and `/portfolio/` have been forked, hand-maintained pages since
2026-08-16.** Anyone reading only the `README.md`'s older "four tab sections" table
should treat it as describing `/portfolio/`, not root — the README predates the
split and was not fully updated after it.

## System Overview

```text
                              User Browser
  ┌──────────────────────────────────────────────────────────────────────┐
  │  GET /                       GET /portfolio/                          │
  └───────────┬──────────────────────────┬────────────────────────────────┘
              │                          │
              ▼                          ▼
  ┌────────────────────────────────────────────────────────────────────┐
  │                      Vercel Edge (irajeshsood.com)                  │
  │                     project: rajeshsood-portfolio                   │
  │                                                                      │
  │  Static files (no build):        vercel.json:                       │
  │   ├─ index.html      (landing)    ├─ cleanUrls: true                │
  │   ├─ portfolio/                   ├─ trailingSlash: true            │
  │   │   └─ index.html  (4-tab CV)   ├─ security headers (CSP, HSTS,   │
  │   ├─ faro-init.js                 │   X-Frame-Options, ...) scoped  │
  │   ├─ faro-web-sdk.iife.js         │   to "/((?!checkmyurl|subnet-   │
  │   ├─ faro-web-tracing.iife.js     │   calculator|notesmith).*)"     │
  │   ├─ og-image.png                 └─ rewrites (below)               │
  │   ├─ Rajesh_Sood_Resume_2026.pdf                                    │
  │   ├─ robots.txt, sitemap.xml                                        │
  │   └─ .vercel/project.json (prj_XryBb9Zs…, team_rtmrW7Cb…)           │
  └───────┬───────────────────────────────────────────────┬─────────────┘
          │ rewrite (server-side, no CSP applied)          │
          │                                                │
    ┌─────▼──────────────┬──────────────────┬──────────────▼───────────┐
    │ /subnet-calculator/ │ /checkmyurl/     │ /notesmith/               │
    │ *  → subnet-        │ *  → checkmyurl  │ *  → mynotesmith          │
    │    calculator-react │    .vercel.app   │    .vercel.app            │
    │    .vercel.app      │  (repo: my-      │  (repo: notesmith)        │
    │  (repo: subnet-     │   networking-    │                           │
    │   calculator-react) │   toolkit)       │                           │
    └──────────────────────────────────────────────────────────────────┘
          These are separate repos/deployments — this repo only owns the
          rewrite rule and the uptime check pointed at the public path.
          Their internals are out of scope here.

  Browser also calls out to, directly from the page (not proxied):
    ├─ googletagmanager.com/gtag/js         GA4 (both pages)
    ├─ fonts.googleapis.com / .gstatic.com  Google Fonts
    ├─ faro-collector-prod-eu-west-6.grafana.net   RUM (root page only)
    ├─ va.vercel-scripts.com / _vercel/insights/script.js  Web Analytics (root only)
    └─ gogenops.com/api/contact             contact form POST (portfolio only,
                                             cross-origin, shared backend)
```

## Page Inventory

### `index.html` — landing / hub (`/`)

- Dark hero panel (fake terminal: `whoami`, `cat stats.json`) + two link grids:
  **"things i've built"** (Portfolio, NiveshKaro, India/Irish tax calculators,
  Subnet Calculator, Notesmith, CheckMyURL) and **"mac apps i've built"**
  (PasteGuard, MacTools, DiskSweeper, DupeFinder, SnapText, Toolbox, Claude Usage
  Menubar) — all external links to other repos/domains, none of it served from
  this repo beyond the three proxied paths.
- Fonts: Syne 800, DM Sans 400/600, IBM Plex Mono 500 — trimmed in `0e51fca`/audit
  commits to exactly the weights the page renders (see Known Gotchas).
- Loads Faro RUM (3 `<script src>` tags, first thing in `<head>`) and Vercel Web
  Analytics (`window.va` stub + `/_vercel/insights/script.js`) — **neither is
  present on `/portfolio/`** (verified: no `faro`/`window.va`/`_vercel/insights`
  string anywhere in `portfolio/index.html`). See "Analytics & RUM coverage gap"
  below.
- IntersectionObserver scroll-reveal for project cards past the first two
  (`idx > 1`), inline `<script>` — this is the script pinned by the
  `sha256-ezW172+...` CSP hash below.

### `portfolio/index.html` — CV portfolio (`/portfolio/`)

Sticky tab nav (`role="tablist"`, arrow-key navigation, `aria-selected` state) over
four `<section role="tabpanel">` blocks, each with a visually-hidden `<h1>` (`.sr-only`)
so every tab has an accessible level-one heading regardless of which is active
(fixed in `1953db9`):

| Tab | Content |
|---|---|
| **about** | Hero (name, role, bio), `impact_at_a_glance` metrics strip (5 stats), skills pills grouped by category (cloud / ai-genai / iac / ci-cd / observability / security / languages), certifications grid, education grid |
| **experience** | Vertical timeline, 7 roles, 2010–present (Dell/HCL → Optum → Softenger → DXC → Maxis → HAITS → Protego → Workday) |
| **projects** | Three project grids: `github_projects` (6 repo cards), `live_apps` (6 cards linking to the maintainer's other live sites), `mac_apps` (7 cards) |
| **contact** | Availability box, 4 contact cards (email/GitHub/LinkedIn/Medium), plus the collapsible **contact form** (see below) |

Fonts: Syne 700/800, DM Sans 400/500/600/700, IBM Plex Mono 400/500/600/700 —
a *different* weight set from root, fixed independently in `f94071c` (DM Sans 600/700
were being browser-faux-bolded from 400 because they weren't requested; 300/300-italic
were requested but unused). The two pages' font-weight sets are not kept in sync on
purpose — each was audited against what its own CSS actually renders.

Single inline `<script>` at the end of `<body>` does three unrelated things in one
block (tab switching + scroll-reveal + contact form submit) — this is the script
pinned by the `sha256-mlCamDVa...` CSP hash below, and the reason that hash needed
recomputing when the contact form was added (see Content-Security-Policy).

## The Contact Form (added this session)

`portfolio/index.html`, contact tab: a collapsible form (toggled by a `<button>`,
not a link, so it works with JS disabled as "hidden" rather than a broken anchor)
with name/email/message fields, a maxlength on each, and an off-screen honeypot
field (`.contact-honeypot`, `tabindex="-1"`, `autocomplete="off"`) that a real user
never sees or fills.

```text
1. User clicks "contact me →"
   └─ toggles aria-expanded, un-hides the <form>, flips button text

2. User submits the form
   └─ preventDefault(); disable submit button, show "Sending…"

3. fetch('https://gogenops.com/api/contact', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ name, email, message, company })  // company = honeypot
   })
   └─ CROSS-ORIGIN request — irajeshsood.com has no backend of its own.
      gogenops.com/api/contact is the shared contact-form endpoint used by
      several of the maintainer's other sites (see gogenops's
      api/_lib/allowedOrigins.ts for the CORS allowlist that authorizes this
      origin — that allowlist lives in the gogenops repo, not here).

4. On success (res.ok && result.ok):
   └─ status message, form reset, gtag('event', 'contact_submit', { source: 'portfolio' })
      fired IF window.gtag exists (it does — GA4 loads unconditionally above this
      script in the same page)

5. On failure (backend error or network failure):
   └─ status message from result.error, or a generic "could not reach the server"
      on fetch rejection; submit button re-enabled either way (finally block)
```

No env vars, no server code, and no honeypot check in this repo — spam filtering,
rate limiting, and the honeypot's actual handling all happen on the gogenops.com
side. This repo only needs `gogenops.com` in the CSP's `connect-src` (see below).

## Content-Security-Policy

Defined once in `vercel.json`, applied via the `headers` rule scoped to
`"/((?!checkmyurl|subnet-calculator|notesmith).*)"` — i.e. every path *except* the
three proxied sub-apps, so this CSP never fights with whatever headers those
separate deployments send for their own paths (a real bug fixed in `e2a6985`,
"Fix CSP leaking onto proxied sub-apps").

`script-src` is `'self'` plus five pinned sha256 hashes — **no `'unsafe-inline'`,
no auto-hash-injection build step**. This is the same hand-computed-hash approach
as gogenops.com (its repo has only a `scripts/build.sh`, no hash-injection step
either — all 7 of its `script-src` hashes are pasted in by hand too). The outlier
is niveshkaro.co.in's React app (`investment-calculator-india-react`), which has
an actual `scripts/inject-csp-hash.mjs` that computes hashes at build time — that
automation does not exist here or on gogenops. Every hash in this repo's
`vercel.json` was computed by hand from the exact inline script text and must be
recomputed by hand whenever that text changes.

Verified by re-extracting and re-hashing every inline `<script>` in both files
against the current CSP (2026-08-22):

| Hash (`sha256-…`) | Matches | Purpose |
|---|---|---|
| `ezW172+MsPqZ/GwXsxPioleuZ9z1wmiY+JN+39vjJ4Y=` | `index.html` only | root's scroll-reveal `IntersectionObserver` |
| `mlCamDVaRZJm/eQlSJUTVvJUgNdjUVzVbBuyjj4WnKg=` | `portfolio/index.html` only | tab switching + scroll-reveal + contact-form submit (current version, post contact-form) |
| `7qoUlPIIfxW6GQwV7QncZvEgFeYWKTJe4crSDNbf1eQ=` | both files, byte-identical | GA4 `gtag()` bootstrap — same literal script text in both pages, so one hash covers both |
| `1FlSGJ9euyPOV+BXON1vhln2VmwTVC4lKnUNC4sxWMo=` | **nothing currently on either page** | dead hash, see Known Gotchas #1 |
| `tLU5RBMHCDhVW/t+CL2XiCiC1j2P1M2vs2Jbo304tH8=` | `index.html` only | Vercel Web Analytics `window.va` queue stub |

`connect-src` additionally allowlists (each added in the commit that introduced the
need for it): `www.google-analytics.com`/`*.google-analytics.com`/
`www.googletagmanager.com` (GA4), `va.vercel-scripts.com`/`*.vercel-analytics.com`
(Web Analytics), `faro-collector-prod-eu-west-6.grafana.net` (Faro RUM), and
`gogenops.com` (contact form, added in the same commit as the form itself,
`b620b6b`).

`img-src` allowlists `www.googletagmanager.com` in addition to
`www.google-analytics.com` — GTM's `gtag.js` falls back to an `<img>` pixel beacon
(`googletagmanager.com/a?...`) for some event types, which needs `img-src`
specifically, not `script-src`/`connect-src` (fixed in `d589178`).

`style-src` uses `'unsafe-inline'` (both pages' CSS is a `<style>` block, not
hashed) plus `fonts.googleapis.com`. `frame-ancestors 'none'`, `base-uri 'self'`,
`form-action 'self'` — the contact form's own `action` isn't `'self'` in effect
(it's JS `fetch`, not a native form POST), so `form-action` doesn't need to widen
for it.

## Proxied Sub-Apps

```json
{
  "rewrites": [
    { "source": "/checkmyurl/", "destination": "https://checkmyurl.vercel.app/" },
    { "source": "/checkmyurl/:path*", "destination": "https://checkmyurl.vercel.app/:path*" },
    { "source": "/subnet-calculator/", "destination": "https://subnet-calculator-react.vercel.app/subnet-calculator/" },
    { "source": "/subnet-calculator/:path*", "destination": "https://subnet-calculator-react.vercel.app/subnet-calculator/:path*" },
    { "source": "/notesmith/", "destination": "https://mynotesmith.vercel.app/" },
    { "source": "/notesmith/:path*", "destination": "https://mynotesmith.vercel.app/:path*" }
  ]
}
```

These are server-side Vercel rewrites — the client only ever sees
`irajeshsood.com/...`; the target's response is proxied through, not
redirected to. Each is a fully independent app/repo/deployment:

| Path | Destination | Repo |
|---|---|---|
| `/subnet-calculator/` | `subnet-calculator-react.vercel.app` | `subnet-calculator-react` |
| `/checkmyurl/` | `checkmyurl.vercel.app` | `my-networking-toolkit` |
| `/notesmith/` | `mynotesmith.vercel.app` | `notesmith` |

Note the asymmetric destination path on subnet-calculator: it rewrites into
`/subnet-calculator/` on the *target* too (that app is deployed with its own
`/subnet-calculator/` base path), while checkmyurl and notesmith rewrite to their
targets' root. Get this wrong and the proxied app 404s or double-prefixes its
own asset paths — check the target app's own base-path config before changing
either side of one of these rules.

This repo does not own or vendor any of their code; `git log` here will never show
their internals. `RUNBOOK.md` has the operational contact for each (uptime checks,
alerts) but their architecture docs live in their own repos.

## Analytics & RUM

Three separate systems, with genuinely different coverage per page — this is not
a single unified "analytics" concept:

| System | Where it loads | Fires on |
|---|---|---|
| **GA4** (`G-LSL40CXDZK`) | Both `index.html` and `portfolio/index.html`, byte-identical inline config | Every visit to either page. **No hostname gate** — `gtag('config', ...)` fires unconditionally (only strips the URL's query string via `page_location`). This repo does *not* follow the hostname-gating pattern used on gogenops.com/niveshkaro.co.in; the comment added alongside `portfolio/index.html`'s GA4 script (`a336b56`) explains why: both pages are "the same repo/deployment, not a separate one, so there's no cross-deployment traffic to hostname-gate against" — a gate would only matter if this project were also reachable at a `*.vercel.app` preview URL people actually visit. |
| **Vercel Web Analytics** | `index.html` only (`window.va` stub + `/_vercel/insights/script.js`) | Root page visits only. **Not present on `/portfolio/`** — no Web Analytics data for the CV/tab page at all. |
| **Grafana Faro (RUM)** | `index.html` only (`faro-web-sdk.iife.js` + `faro-web-tracing.iife.js` + `faro-init.js`, loaded first in `<head>`, self-hosted not CDN) | Root page visits only, same gap as Web Analytics. App name in Faro is `irajeshsood.com` (see `faro-init.js` / `RUNBOOK.md`) — it does not distinguish root from `/portfolio/` traffic even if it were loaded there, since both would report under the same app name. |

**Practical effect:** page-load timing, Core Web Vitals, and JS errors are only
observed for the landing page. If the 4-tab portfolio page has a client-side bug
or a slow load, Faro will not see it. See Future Enhancements.

Cross-reference `RUNBOOK.md` for the operational side of all three (dashboards,
alert rules, the Faro CORS-allowlist gotcha already hit on gogenops.com) — not
duplicated here.

## Deployment

```text
git push origin main
        │
        ▼
GitHub → Vercel Git integration (auto-deploy, no vercel.json "builds" section,
         no framework preset — pure static)
        │
        ▼
irajeshsood.com   (project: rajeshsood-portfolio,
                    prj_XryBb9ZsggYYcLYQQbYnZ5yf1mTJ,
                    team_rtmrW7Cbu9zcJS1ILzhSudX0)
```

- **No `vercel deploy` CLI** — same convention as the maintainer's other Vercel
  sites (see the user's global `deploy-via-github` preference): push to `main`,
  Vercel's Git integration builds and deploys automatically.
- **No build command**: every file Vercel serves is checked into git as-is,
  including the two vendored Faro SDK bundles (`faro-web-sdk.iife.js` 90.5KB,
  `faro-web-tracing.iife.js` 80.4KB) and the resume PDF.
- **Rollback**: `git revert <bad-commit>` + push, or promote a previous deployment
  from the Vercel dashboard — there's no build artifact to rebuild, so either path
  is equally fast.
- `.vercel/project.json` (holding `projectId`/`orgId`) is present locally from
  running the Vercel CLI at some point, but is correctly gitignored (`.vercel` is
  in `.gitignore`) and not tracked — `git ls-files` confirms only `vercel.json`
  (the actual config) is committed, not the `.vercel/` CLI-link directory.

## Known Gotchas

1. **A dead CSP hash has been sitting in `script-src` since 2026-08-20.**
   `sha256-1FlSGJ9euyPOV+BXON1vhln2VmwTVC4lKnUNC4sxWMo=` was added by the
   "Install Vercel Web Analytics integration" PR (`19d6a5b`, opened by the
   `vercel[bot]` GitHub App) alongside the `window.va` stub script — but it does
   not match that script's actual hash. Re-hashing the exact script text
   committed in that same commit produces
   `sha256-tLU5RBMHCDhVW/t+CL2XiCiC1j2P1M2vs2Jbo304tH8=` instead (confirmed by
   recomputing against `git show 19d6a5b:index.html`). The mismatch silently
   blocked Vercel Web Analytics in production until `84cbfed` ("fix: unblock
   Vercel Web Analytics — missing CSP script hash") added the *correct* hash
   two days later. **The original wrong hash was never removed** — it's still
   in `vercel.json` today, matching no script on either page. Harmless (an
   extra allowed hash isn't a vulnerability by itself) but it's dead weight
   and a trap for anyone assuming every hash in the CSP corresponds to a real,
   current inline script.

2. **Missing CSP `img-src` entry silently ate GTM's pixel-beacon fallback.**
   `www.googletagmanager.com` wasn't in `img-src` even though it was already in
   `script-src`/`connect-src` — GTM's `gtag.js` uses an `<img>` beacon
   (`googletagmanager.com/a?...`) for some event types, which CSP evaluates
   under `img-src`, not `script-src`. Fixed in `d589178`. If a future analytics
   event silently stops appearing in GA4/GTM, check the browser console for a
   CSP `img-src` violation before assuming the event itself is broken.

3. **CSP hashes for existing inline scripts must be recomputed whenever the
   script is *appended to*, not just when a new script is added.** The contact
   form's submit logic was appended into `portfolio/index.html`'s existing
   tab-switching `<script>` block rather than given its own tag — so the hash
   that needed changing was the one already pinning that block
   (`sha256-FodjHIJ4...` → `sha256-mlCamDVa...`), not a brand-new hash. Easy to
   miss if you're only scanning the diff for new `<script>` tags. There is no
   build step here that recomputes these automatically — same as gogenops.com,
   which also pastes its hashes in by hand (niveshkaro.co.in's React app is the
   one with actual build-time hash injection, not this repo or gogenops) —
   every hash change here is a manual compute-and-paste into `vercel.json`.

4. **CSP header used to leak onto the proxied sub-app paths.** Before `e2a6985`
   ("Fix CSP leaking onto proxied sub-apps"), the `headers` rule in
   `vercel.json` applied to all paths, including `/checkmyurl/`,
   `/subnet-calculator/`, `/notesmith/` — so this repo's strict CSP was being
   applied on top of whatever headers those separately-deployed apps sent for
   themselves. Fixed by scoping the `headers.source` regex to exclude those
   three prefixes. If you add a fourth proxied path, it must be added to that
   negative-lookahead regex too, or its headers get silently double-applied.

5. **RUM and Web Analytics coverage is asymmetric across the two pages.**
   Neither Faro nor Vercel Web Analytics is loaded on `portfolio/index.html` —
   only on the root landing page (confirmed: no `faro`/`window.va`/
   `_vercel/insights` string anywhere in `portfolio/index.html`). This wasn't
   an oversight fixed later like the CSP gaps above — it's simply never been
   added. GA4 is the only telemetry that actually observes `/portfolio/`
   traffic today.

6. **GA4 has no hostname gate**, unlike the sibling gogenops.com/niveshkaro.co.in
   sites. If this project ever becomes reachable at a `*.vercel.app` preview URL
   that gets real traffic (e.g. a shared preview deployment), that traffic
   would count in the same GA4 property with no way to filter it out after the
   fact — worth adding the gate proactively if preview links start getting
   shared, rather than waiting to hit it as an incident like gogenops.com did
   with a different gating bug (its bare-apex-origin Faro CORS issue,
   documented in gogenops's own `RUNBOOK.md`).

## Future Enhancements

- [ ] Add Faro RUM + Vercel Web Analytics to `portfolio/index.html` (currently
      GA4-only — see Known Gotchas #5)
- [ ] Remove the dead `sha256-1FlSGJ9euyPOV+...` CSP hash (Known Gotchas #1) —
      safe no-op cleanup, confirmed to match no current script on either page
- [ ] Hostname-gate GA4 to `location.hostname === 'irajeshsood.com'`, matching
      the gogenops.com/niveshkaro.co.in pattern, before any `*.vercel.app`
      preview link is shared publicly (Known Gotchas #6)
- [ ] A small build-time hash-injection step (even a 10-line Node script run
      manually, not necessarily CI) would remove the "recompute every hash by
      hand" failure mode entirely — every hash mismatch documented above traces
      back to this being manual
- [ ] `README.md`'s "Structure" section still describes root as the 4-tab page;
      it predates the `f308672` split and should be corrected to describe
      `portfolio/index.html` instead
