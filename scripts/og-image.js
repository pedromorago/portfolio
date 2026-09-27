#!/usr/bin/env node
/**
 * Regenerates the share images (1200x630) from the built pages, so a share
 * card always looks like the site:
 *   public/og-image.png            home page hero (photo, name and the one idea)
 *   public/work/<slug>/og.png      header of each case study (kicker and headline)
 *
 * Run `npm run build` first, then `npm run og`, and commit the PNG files.
 */
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { serve } = require("./serve");

const ROOT = path.join(__dirname, "..");
const SITE = path.join(ROOT, "_site");
const launchOptions = process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {};

const COMMON = `
  .nav, .skip-link, .footer, .hero-scroll, .hero-badge, body::after { display: none !important; }
  html { scroll-behavior: auto; }
  .reveal { opacity: 1 !important; transform: none !important; }
`;

const HOME = `${COMMON}
  main > section, .hero-text, .hero-actions { display: none !important; }
  .hero { min-height: 630px !important; height: 630px; padding: 0 !important; overflow: hidden; }
  .hero-inner { grid-template-columns: 1.25fr 0.75fr !important; height: 630px; align-items: center !important; }
  .hero-copy { padding: 0 !important; }
  .hero-name { font-size: 132px !important; }
  .hero-lede { font-size: 34px !important; }
  .hero-photo { align-self: end !important; max-width: 430px !important; margin: 0 !important; }
`;

const CASE = `${COMMON}
  .breadcrumb, .case-lede, .case-facts, .case-actions, .case-cover, main > article > div, .case-next { display: none !important; }
  .case-hero { height: 630px; padding: 0 !important; display: flex; align-items: center; }
  .case-kicker { margin-top: 0 !important; font-size: 18px !important; }
  .case-title { font-size: 92px !important; max-width: 11em !important; }
  .case-hero .container::after { content: "Pedro Morago, Senior QA Engineer"; display: block; margin-top: 36px; font-size: 22px; color: #b4b0a8; }
`;

(async () => {
  if (!fs.existsSync(path.join(SITE, "index.html"))) throw new Error("No _site/index.html: run npm run build first");
  const server = await serve(SITE);
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch(launchOptions);
  const shots = [{ url: "/", out: "og-image.png", css: HOME }];
  for (const d of fs.readdirSync(path.join(SITE, "work"), { withFileTypes: true }))
    if (d.isDirectory()) shots.push({ url: `/work/${d.name}/`, out: `work/${d.name}/og.png`, css: CASE });

  for (const s of shots) {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, reducedMotion: "reduce" });
    await page.goto(base + s.url, { waitUntil: "networkidle" });
    await page.addStyleTag({ content: s.css });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    const out = path.join(ROOT, "public", s.out);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1200, height: 630 } });
    await page.close();
    console.log(`✓ public/${s.out}`);
  }
  await browser.close();
  server.close();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
