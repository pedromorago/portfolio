# Pedro Morago's portfolio

The personal site of Pedro Morago, Senior QA Engineer, at [pedromorago.com](https://pedromorago.com/). Built with [Astro](https://astro.build/): static pages, self-hosted fonts and no requests to other servers.

- `/`: home page (hero, why this intersection, work, what I'm building toward, hard problems, how I work, poker, career, clients, contact)
- `/work/<slug>/`: one case study per page
- `/pedro-morago-cv.pdf`: the CV, printed from `/cv/`
- `/en/` and `/work/` are `noindex` redirects to the home page (`/` and `/#work`)

## Structure

```
src/data/site.json            ← copy for the home page and shared parts
src/data/work/<slug>.json     ← one JSON file per case study
src/data/cv.json              ← copy for the CV PDF
src/pages/                    ← routes: home, case studies, CV, 404, redirects, sitemap
src/components/               ← one component per home page section, plus case-study blocks
src/styles/global.css         ← the one dark theme
src/assets/                   ← portraits and screenshots (Astro resizes them at build time)
public/                       ← files served as they are: CV PDF, share images, CNAME, robots.txt
scripts/og-image.js           ← regenerates the share images from the built pages
scripts/cv-pdf.js             ← prints /cv/ to public/pedro-morago-cv.pdf
.github/workflows/deploy.yml  ← build and deploy to GitHub Pages
```

Portfolio projects are data in `site.json` (`work.featured` and `work.projects`), so a new project needs no new markup. A project can carry `"status": "in-progress"` to show a badge; only add one once it has real content (a repo, a demo or a write-up). Case studies live in `src/data/work/<slug>.json` and get a page at `/work/<slug>/`.

The copy lives in JSON and the markup in the components, so a copy change never touches the markup. Text fields support `[label](href)` for a link and `` `code` `` for inline code. External link labels end in ` ↗`; they open in a new tab with `rel="noopener"`. The build stops if a text field is empty or missing.

## Workflow

```bash
npm install
npm run dev            # http://localhost:4321
npm run build          # writes _site/
```

After changing the hero, a case study title or the career copy, rebuild and regenerate the share images and the CV, then commit them:

```bash
npm run build && npm run og && npm run cv
```

Both scripts use Playwright's Chromium (`npx playwright install chromium`, or `CHROMIUM_PATH=/path/to/chromium`).

## Deploy

Every push and pull request builds the site. On `main`, the `deploy` job publishes `_site` to GitHub Pages.
