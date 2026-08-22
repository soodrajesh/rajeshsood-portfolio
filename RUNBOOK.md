# RUNBOOK — irajeshsood.com

Operational runbook for this site: deploy, monitoring, alerting, and troubleshooting.

## Deploy

- Push to `main` on GitHub — Vercel is connected via Git integration and deploys
  automatically. Never `vercel deploy` from the CLI (see project conventions).
- No build step: this is a static `index.html`, deployed as-is.
- Rollback: `git revert <bad-commit>` and push, or use Vercel's dashboard to
  promote a previous deployment.

## Monitoring stack (Grafana Cloud, stack `olivecookie379`)

All three of soodrajesh87's personal sites (irajeshsood.com, gogenops.com,
niveshkaro.co.in) share one Grafana Cloud free-tier stack.

### Synthetic uptime monitoring
- 3 global probes (Mumbai, London, N. Virginia) hit `https://irajeshsood.com/`
  every 60s and record success, latency, DNS time, HTTP status, SSL expiry.
- Job label: `irajeshsood-portfolio`.
- Dashboard: `https://olivecookie379.grafana.net/d/website-apm-overview`
  ("Website APM — irajeshsood / gogenops / niveshkaro") — its top toolbar has
  a links bar (Alerting, Contact Points, RUM full detail, Synthetic Monitoring
  config) so this one dashboard is the entry point into all 3 interfaces.
- Public status page (no login): see the dashboard's Share > Public dashboard
  link, or ask for the current URL — it's the same dashboard, read-only.

### Downtime alerting
- Alert rule `irajeshsood.com is DOWN` fires if `probe_success` drops below 1
  for 2+ minutes (i.e. any of the 3 probes fails for that long).
- Notifies: soodrajesh87@gmail.com (contact point `raj-email`).
- Manage rules: **Alerts & IRM → Alert rules** in the Grafana UI, or via
  `/api/v1/provisioning/alert-rules` (service account token in `api.env`,
  not committed to this repo).
- Delivery confirmed end-to-end 2026-08-22 via the contact point's **Test**
  button (Alerting → Notification configuration → raj-email → Test) — email
  arrived. The Grafana API's test-notification endpoint is
  broken/undocumented for this stack (`unknown integration type: ''`
  regardless of request body, not in the OpenAPI spec) — always verify via
  the UI Test button, not the API.

### Real User Monitoring (Grafana Faro)
- App name in Faro: `irajeshsood.com`.
- Loaded via `faro-web-sdk.iife.js` + `faro-web-tracing.iife.js` +
  `faro-init.js`, all self-hosted at repo root (not a third-party CDN), so it
  stays inside the existing CSP's `script-src 'self'` without new hashes.
- Captures: page load timing, Core Web Vitals, JS errors, HTTP trace timing.
- View data: **Observability → Frontend → personal-sites-rum** in Grafana.
- Filter to this site specifically by `app.name = "irajeshsood.com"`.
- **CORS note:** Faro's app settings have an "Allowed origins" allowlist
  (Frontend → personal-sites-rum → Settings → Application). gogenops.com hit
  a real production bug here (bare-apex origin wasn't allowlisted, silently
  CORS-blocking all real telemetry — see gogenops's RUNBOOK for the full
  story). This site's origin (`https://irajeshsood.com`) is allowlisted and
  confirmed working, but if it's ever pointed at a `www` variant or a new
  domain, check this list first.

## Content-Security-Policy

Defined in `vercel.json`. It's intentionally strict (`script-src 'self'` plus
pinned sha256 hashes for the couple of literal inline `<script>` tags, no
wildcard domains). **If you add any new third-party script or fetch/XHR
target, you must add it to `script-src` / `connect-src` in `vercel.json` or
the browser will silently block it** — this bit us once already with Faro's
telemetry endpoint (`connect-src` needed
`https://faro-collector-prod-eu-west-6.grafana.net` added explicitly).
`img-src` also allowlists `https://www.googletagmanager.com` — GTM's
`gtag.js` falls back to an `<img>` pixel beacon at `googletagmanager.com/a?...`
for some event types, which needs `img-src`, not just `script-src`/`connect-src`.

Prefer self-hosting third-party scripts (as done for Faro) over widening
`script-src` to a new external host, to keep the CSP's blast radius small.

## Troubleshooting

**Alert fired / dashboard shows DOWN:**
1. Check the dashboard's "Latest HTTP Status Codes" table — is it a real 5xx,
   a timeout, or a DNS failure?
2. Check Vercel's deployment dashboard for this project — did the last deploy
   fail, or is there an active incident?
3. `curl -I https://irajeshsood.com/` from your own machine to see if it's a
   probe-network issue vs. genuinely down for everyone.
4. If it's a bad deploy: revert on Vercel or `git revert` + push.

**No RUM data showing in Faro:**
1. Open the live site and check the browser console for CSP violation errors
   (`Refused to connect to ...`) — means `connect-src` needs updating.
2. Confirm `faro-web-sdk.iife.js` / `faro-web-tracing.iife.js` /
   `faro-init.js` actually shipped in the deploy (view page source).
3. Faro only reports on real visits — an idle site with no traffic will show
   "no data" even when everything's wired correctly.

**Uptime checks look wrong / want to change frequency or probes:**
- Edit via `/api/v1/check` on the Synthetic Monitoring API
  (`https://synthetic-monitoring-api-eu-west-6.grafana.net`), authenticated
  with the SM access token (also in `api.env`, not this repo). Check ID and
  current config are visible in Grafana's **Testing & synthetics → Checks**.
