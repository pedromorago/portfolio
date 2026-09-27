// Behaviour shared by every page. Everything here is an enhancement: the pages
// read and work the same with JavaScript off.

// The nav gets a background once the page scrolls past the hero's top.
const nav = document.querySelector<HTMLElement>(".nav");
const onScroll = () => nav?.classList.toggle("scrolled", window.scrollY > 24);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Old section addresses (shared before the redesigns) land on the matching
// new place instead of the top of the page.
const OLD_FRAGMENTS: Record<string, string> = {
  about: "method",
  "how-i-test": "method",
  experience: "career",
  projects: "work",
  skills: "career",
  "at-a-glance": "career",
};
const hash = location.hash.slice(1);
if (Object.hasOwn(OLD_FRAGMENTS, hash) && !document.getElementById(hash)) {
  const target = document.getElementById(OLD_FRAGMENTS[hash]);
  if (target) {
    history.replaceState(null, "", `#${OLD_FRAGMENTS[hash]}`);
    target.scrollIntoView();
  }
}

/**
 * Marks the link of the section being read. Used for the main nav on the home
 * page and for the table of contents on case pages.
 */
function trackSections(links: HTMLAnchorElement[], lastAtBottom: boolean) {
  const pairs = links
    .map((a) => [a, document.getElementById(a.getAttribute("href")!.slice(1))] as const)
    .filter(([, el]) => el);
  if (!pairs.length) return;
  let lockedUntil = 0;
  let queued = false;
  const setActive = (current: HTMLAnchorElement | null) =>
    links.forEach((a) => a.classList.toggle("active", a === current));
  const atBottom = () => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
  const update = () => {
    queued = false;
    if (Date.now() < lockedUntil) return;
    let current: HTMLAnchorElement | null = null;
    // On tall screens the last section never reaches the reading line.
    if (lastAtBottom && atBottom() && window.scrollY > 0) current = links[links.length - 1];
    else for (const [a, el] of pairs) if (el!.getBoundingClientRect().top <= window.innerHeight * 0.4) current = a;
    setActive(current);
  };
  window.addEventListener(
    "scroll",
    () => {
      if (!queued) {
        queued = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  // A clicked link is marked at once and kept while the page scrolls to it.
  links.forEach((a) =>
    a.addEventListener("click", () => {
      setActive(a);
      lockedUntil = Date.now() + 900;
    }),
  );
  update();
}

if (document.body.dataset.kind === "home") {
  const links = [...document.querySelectorAll<HTMLAnchorElement>(".nav-links a[href^='#']")];
  trackSections(links, true);
} else {
  trackSections([...document.querySelectorAll<HTMLAnchorElement>(".toc a")], true);
}

// Sections fade in as they reach the screen.
const reveals = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }),
    { rootMargin: "0px 0px -8% 0px" },
  );
  reveals.forEach((el) => io.observe(el));
} else reveals.forEach((el) => el.classList.add("in"));

// Copy button next to the email address. Hidden without JavaScript. If the
// clipboard is unavailable or refused, the address is selected instead.
const copyBtn = document.querySelector<HTMLButtonElement>(".copy-btn");
if (copyBtn) {
  const row = copyBtn.parentElement!;
  const status = row.querySelector(".copy-status")!;
  const address = row.querySelector(".contact-email")!;
  let timer: ReturnType<typeof setTimeout>;
  // Cleared first and set a moment later, so a screen reader announces the
  // message again on a second click.
  const say = (text: string, ms?: number) => {
    clearTimeout(timer);
    status.textContent = "";
    timer = setTimeout(() => {
      status.textContent = text;
      if (ms) timer = setTimeout(() => (status.textContent = ""), ms);
    }, 100);
  };
  copyBtn.hidden = false;
  copyBtn.addEventListener("click", async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("no clipboard");
      await navigator.clipboard.writeText(copyBtn.dataset.copy!);
      say(copyBtn.dataset.done!, 3000);
    } catch {
      const range = document.createRange();
      range.selectNodeContents(address);
      const selection = window.getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
      say(copyBtn.dataset.fallback!);
    }
  });
}

// Logo carousels: they scroll on their own and can be dragged with a mouse or
// a finger. Without JavaScript the CSS animation runs instead.
document.querySelectorAll<HTMLElement>(".marquee").forEach((marquee) => {
  const track = marquee.querySelector<HTMLElement>(".marquee-track");
  if (!track || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  marquee.classList.add("draggable");
  const dir = marquee.classList.contains("reverse") ? 1 : -1;
  const speed = 40; // px per second
  let offset = 0;
  let width = track.offsetWidth;
  let dragging = false;
  let hovering = false;
  let startX = 0;
  let startOffset = 0;
  let last = performance.now();
  const wrap = () => {
    width = track.offsetWidth || width;
    offset = ((offset % width) - width) % width; // keep it in (-width, 0]
  };
  const paint = () => marquee.style.setProperty("--x", `${offset}px`);
  const tick = (now: number) => {
    const dt = Math.min(now - last, 100) / 1000;
    last = now;
    if (!dragging && !hovering) offset += dir * speed * dt;
    wrap();
    paint();
    requestAnimationFrame(tick);
  };
  marquee.addEventListener("pointerenter", (e) => {
    if (e.pointerType === "mouse") hovering = true;
  });
  marquee.addEventListener("pointerleave", () => (hovering = false));
  marquee.addEventListener("pointerdown", (e) => {
    dragging = true;
    startX = e.clientX;
    startOffset = offset;
    marquee.setPointerCapture(e.pointerId);
    marquee.classList.add("dragging");
  });
  marquee.addEventListener("pointermove", (e) => {
    if (dragging) offset = startOffset + (e.clientX - startX);
  });
  const end = () => {
    dragging = false;
    marquee.classList.remove("dragging");
  };
  marquee.addEventListener("pointerup", end);
  marquee.addEventListener("pointercancel", end);
  window.addEventListener("resize", wrap);
  requestAnimationFrame(tick);
});
