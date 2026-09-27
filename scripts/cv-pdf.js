#!/usr/bin/env node
/**
 * Prints the /cv/ page of the built site to public/pedro-morago-cv.pdf.
 * Run `npm run build` first, then `npm run cv`, and commit the PDF.
 */
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { serve } = require("./serve");

const ROOT = path.join(__dirname, "..");
const SITE = path.join(ROOT, "_site");
const OUT = path.join(ROOT, "public", "pedro-morago-cv.pdf");
const launchOptions = process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {};

(async () => {
  if (!fs.existsSync(path.join(SITE, "cv", "index.html"))) throw new Error("No _site/cv/: run npm run build first");
  const server = await serve(SITE);
  const browser = await chromium.launch(launchOptions);
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}/cv/`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: OUT, format: "A4", printBackground: true, preferCSSPageSize: true });
  await browser.close();
  server.close();
  console.log(`✓ ${path.relative(ROOT, OUT)}`);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
