/**
 * The copy and the list of pages. Everything the templates show comes from
 * src/data: site.json for the home page and shared parts, and one JSON file
 * per case study in src/data/work/.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import site from "../data/site.json";
import { assertContent } from "./render";

export const SITE_URL = "https://pedromorago.com/";
export { site };

assertContent(site, "$", "src/data/site.json");

export type Block =
  | { type: "p" | "h3" | "tech"; text: string }
  | { type: "list" | "steps" | "checks"; items: string[] }
  | { type: "problem"; rows: { label: string; text: string }[] }
  | { type: "buttons"; links: { href: string; label: string; sr?: string }[] }
  | { type: "figure"; image: string; alt: string; caption: string };

export type CaseStudy = {
  slug: string;
  meta: { title: string; description: string; shareDescription: string; about: string[] };
  crumb: string;
  kicker: string;
  title: string;
  lede: string;
  cover?: { image: string; alt: string };
  facts: { label: string; text: string; check?: boolean }[];
  actions?: { href: string; label: string }[];
  sections: { id: string; title: string; blocks: Block[] }[];
  contactTopic: string;
};

const files = import.meta.glob<{ default: CaseStudy }>("../data/work/*.json", { eager: true });

/** Case studies in alphabetical order of slug; "next case" loops through them. */
export const cases: CaseStudy[] = Object.entries(files)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([file, mod]) => {
    const c = mod.default;
    const name = path.basename(file);
    assertContent(c, "$", `src/data/work/${name}`);
    for (const k of ["slug", "meta", "crumb", "kicker", "title", "lede", "facts", "sections", "contactTopic"] as const)
      if (c[k] === undefined) throw new Error(`src/data/work/${name}: missing "${k}"`);
    if (`${c.slug}.json` !== name) throw new Error(`src/data/work/${name}: slug "${c.slug}" does not match the file name`);
    return c;
  });

export const nextCase = (slug: string) => cases[(cases.findIndex((c) => c.slug === slug) + 1) % cases.length];

/**
 * The share image URL carries a hash of the file, so LinkedIn and other sites
 * that cache previews by URL fetch the new one after a change.
 */
export function ogImageUrl(file: string): string {
  const abs = path.join(process.cwd(), "public", file);
  const hash = crypto.createHash("sha256").update(fs.readFileSync(abs)).digest("hex").slice(0, 8);
  return `${SITE_URL}${file}?v=${hash}`;
}
