/**
 * Inline markup for the copy in src/data.
 *
 * Text fields support two bits of markup: [label](href) for a link and
 * `code` for inline code. Every link goes through renderLink(), the one place
 * that decides how a link is rendered:
 * - External links open in a new tab with rel="noopener". Their label ends in
 *   " ↗" in the JSON; the arrow is hidden from screen readers, which hear
 *   "(opens in a new tab)" instead.
 * - An internal " →" is hidden from screen readers too.
 * - Internal paths are written without a leading slash in the JSON
 *   ("work/screen-recorder/") and rendered root-absolute.
 * - l.sr adds visually hidden text, to tell apart links with the same label.
 */
export type Link = { href: string; label: string; sr?: string; style?: string };

// A missing field is an error: it would otherwise print "undefined" on the page.
export function esc(s: unknown): string {
  if (s === undefined || s === null) throw new Error("A text field is missing from the JSON");
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export const isExternal = (href: string) => /^https?:\/\//.test(href);

export function hrefOf(href: string): string {
  if (isExternal(href) || /^(mailto:|#|\/)/.test(href)) return href;
  return "/" + href;
}

/** Splits a label into its text and the arrow it ends with, if any. */
export function parseLabel(l: Link): { text: string; arrow: string; external: boolean } {
  const external = isExternal(l.href);
  if (external) {
    if (!l.label.endsWith(" ↗")) throw new Error(`External link label must end with " ↗": ${l.label} (${l.href})`);
    return { text: l.label.slice(0, -2), arrow: "↗", external };
  }
  if (l.label.endsWith(" →")) return { text: l.label.slice(0, -2), arrow: "→", external };
  return { text: l.label, arrow: "", external };
}

export function renderLink(l: Link, cls = ""): string {
  const { text, arrow, external } = parseLabel(l);
  const attrs = [`href="${esc(hrefOf(l.href))}"`];
  if (cls) attrs.push(`class="${cls}"`);
  if (external) attrs.push('target="_blank" rel="noopener"');
  const sr = l.sr ? `<span class="sr-only">${esc(l.sr)}</span>` : "";
  const arr = arrow ? ` <span class="arrow" aria-hidden="true">${arrow}</span>` : "";
  const newTab = external ? '<span class="sr-only"> (opens in a new tab)</span>' : "";
  return `<a ${attrs.join(" ")}>${esc(text)}${sr}${arr}${newTab}</a>`;
}

/** Escapes a text field and renders its inline markup. */
export function inline(text: string): string {
  const re = /\[([^\]]+)\]\(([^)\s]+)\)|`([^`]+)`/g;
  let out = "";
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    out += esc(text.slice(last, m.index));
    out += m[3] !== undefined ? `<code>${esc(m[3])}</code>` : renderLink({ label: m[1], href: m[2] });
    last = re.lastIndex;
  }
  return out + esc(text.slice(last));
}

/**
 * No empty strings anywhere in the copy: a forgotten field stops the build and
 * names its path (for example $.work.items[2].text) instead of publishing a gap.
 */
export function assertContent(v: unknown, at = "$", file = ""): void {
  if (Array.isArray(v)) v.forEach((x, i) => assertContent(x, `${at}[${i}]`, file));
  else if (v && typeof v === "object")
    Object.entries(v as Record<string, unknown>).forEach(([k, x]) => assertContent(x, `${at}.${k}`, file));
  else if (typeof v === "string" && !v.trim()) throw new Error(`Empty value at ${at} in ${file}`);
}

/** Typographic apostrophes and quotes, for the large serif headings where straight ones stand out. */
export const smart = (s: string) =>
  s.replace(/(\w)'(\w)/g, "$1’$2").replace(/"([^"]*)"/g, "“$1”").replace(/'/g, "’");
