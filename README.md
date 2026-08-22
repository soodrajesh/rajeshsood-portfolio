# Rajesh Sood — Portfolio

Personal portfolio website for Rajesh Sood — Staff Cloud & DevOps Engineer · DevSecOps · AI/ML Platform Engineering.

Live at: **[rajeshsood-portfolio.vercel.app](https://rajeshsood-portfolio.vercel.app)**

## Structure

Single `index.html` with four tab sections:

| Tab | Content |
|-----|---------|
| About | Hero, bio, skills, education, resume download |
| Experience | Vertical timeline of 7 roles (2011–present) |
| Projects | 6 GitHub project cards with tech tags |
| Contact | Email, GitHub, LinkedIn, Medium, availability |

## Sub-pages

This repo also serves `/portfolio/` (`portfolio/index.html`) — a separate, more detailed portfolio page with its own content and fonts, not generated from the root page. Its Contact tab has a collapsible "Contact me" form in addition to the existing contact-card links; the form posts cross-origin to `gogenops.com/api/contact`, a shared backend used by several of the maintainer's other sites.

It also proxies (via `vercel.json` rewrites) three separately-deployed apps under this domain: `/subnet-calculator/`, `/checkmyurl/`, `/notesmith/` — each its own repo, own README.

## Tech Stack

- Pure HTML + CSS + vanilla JS (no build step, no frameworks)
- Fonts: Syne + DM Sans + IBM Plex Mono via Google Fonts
- Deployed on Vercel

## Deployment

1. Push this folder to a GitHub repository
2. Import the repo in [Vercel](https://vercel.com)
3. Vercel auto-detects the static site — no build command needed
4. Set the custom domain or use the generated `*.vercel.app` URL

## Files

```
my-portfolio/
├── index.html                    # Full portfolio (single file)
├── Rajesh_Sood_Resume_2026.pdf   # Resume (linked for download)
├── og-image.png                  # Social share preview image (1200x630)
├── vercel.json                   # Vercel config
├── .gitignore
└── README.md
```

## Links

- GitHub: [github.com/soodrajesh](https://github.com/soodrajesh)
- LinkedIn: [linkedin.com/in/irajeshsood](https://www.linkedin.com/in/irajeshsood/)
- Email: soodrajesh87@gmail.com
