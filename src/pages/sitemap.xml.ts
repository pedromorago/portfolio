// The indexable pages: the home page and one per case study.
import { SITE_URL, cases } from "../lib/site";

export function GET() {
  const urls = [SITE_URL, ...cases.map((c) => `${SITE_URL}work/${c.slug}/`)];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>\n    <loc>${u}</loc>\n  </url>`).join("\n")}
</urlset>
`;
  return new Response(body, { headers: { "Content-Type": "application/xml" } });
}
