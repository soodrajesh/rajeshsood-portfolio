# Rajesh Sood — Portfolio

Source for [irajeshsood.com](https://irajeshsood.com): home page, `/portfolio/`, and `/blog/`.

## Structure

- `index.html`: home page
- `portfolio/index.html`: tabbed portfolio (about, experience, projects, blog, contact). Project cards open an architecture-diagram preview and link to each GitHub repo.
- `blog/`: one folder per post, plus `index.html`, `feed.xml`; `sitemap.xml` at the root
- `ARCHITECTURE.md`, `RUNBOOK.md`: how the site is built and operated (excluded from the deployment via `.vercelignore`)

## Sub-pages

This repo also serves `/portfolio/` (`portfolio/index.html`) — a separate, more detailed portfolio page with its own content and fonts, not generated from the root page. Its Contact tab has a collapsible "Contact me" form in addition to the existing contact-card links; the form posts cross-origin to `gogenops.com/api/contact`, a shared backend used by several of the maintainer's other sites.

It also proxies (via `vercel.json` rewrites) four separately-deployed apps under this domain: `/subnet-calculator/`, `/checkmyurl/`, `/notesmith/`, `/invoice-generator/` — each its own repo, own README.

## Tech Stack

- Pure HTML + CSS + vanilla JS (no build step, no frameworks)
- Fonts: Syne + DM Sans + IBM Plex Mono via Google Fonts
- Deployed on Vercel

## Deployment

1. Push this folder to a GitHub repository
2. Import the repo in [Vercel](https://vercel.com)
3. Vercel auto-detects the static site — no build command needed
4. Pushing to `main` deploys to production

## Links

- GitHub: [github.com/soodrajesh](https://github.com/soodrajesh)
- LinkedIn: [linkedin.com/in/irajeshsood](https://www.linkedin.com/in/irajeshsood/)
- Email: soodrajesh87@gmail.com
