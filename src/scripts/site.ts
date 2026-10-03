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
// a finger. A drag that ends in a fast flick throws the row: it keeps the
// speed of the gesture and slows back to its own pace over a few seconds.
// Without JavaScript, or with reduced motion, the CSS takes over instead.
document.querySelectorAll<HTMLElement>(".marquee").forEach((marquee) => {
  const track = marquee.querySelector<HTMLElement>(".marquee-track");
  if (!track || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  marquee.classList.add("draggable");
  const dir = marquee.classList.contains("reverse") ? 1 : -1;
  const speed = 40; // px per second, the row's own pace
  const settle = 1.4; // seconds for a throw to lose about two thirds of its speed
  const maxThrow = 5000; // px per second
  let offset = 0;
  let width = track.offsetWidth;
  let dragging = false;
  let hovering = false;
  let startX = 0;
  let startOffset = 0;
  let thrown = 0; // extra speed from the last flick, px per second
  let samples: { t: number; x: number }[] = [];
  let last = performance.now();
  const wrap = () => {
    width = track.offsetWidth || width;
    offset = ((offset % width) - width) % width; // keep it in (-width, 0]
  };
  const paint = () => marquee.style.setProperty("--x", `${offset}px`);
  const tick = (now: number) => {
    const dt = Math.min(now - last, 100) / 1000;
    last = now;
    if (!dragging) {
      // Hovering with a mouse holds the row still, but a throw still plays out.
      offset += ((hovering ? 0 : dir * speed) + thrown) * dt;
      thrown *= Math.exp(-dt / settle);
      if (Math.abs(thrown) < 1) thrown = 0;
    }
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
    thrown = 0;
    startX = e.clientX;
    startOffset = offset;
    samples = [{ t: e.timeStamp, x: e.clientX }];
    marquee.setPointerCapture(e.pointerId);
    marquee.classList.add("dragging");
  });
  marquee.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    offset = startOffset + (e.clientX - startX);
    samples.push({ t: e.timeStamp, x: e.clientX });
    while (samples.length > 2 && e.timeStamp - samples[0].t > 100) samples.shift();
  });
  const end = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    marquee.classList.remove("dragging");
    // The speed of the last tenth of a second of the drag; a drag that stopped
    // before letting go throws nothing.
    const first = samples[0];
    const age = e.timeStamp - samples[samples.length - 1].t;
    const span = e.timeStamp - first.t;
    if (samples.length > 1 && age < 50 && span > 0) {
      const v = ((e.clientX - first.x) / span) * 1000;
      thrown = Math.max(-maxThrow, Math.min(maxThrow, v));
    }
  };
  marquee.addEventListener("pointerup", end);
  marquee.addEventListener("pointercancel", end);
  window.addEventListener("resize", wrap);
  requestAnimationFrame(tick);
});

// Phone menu: the links fold behind a button below 820px. Without JavaScript
// they stay visible and wrap instead.
const toggle = document.querySelector<HTMLButtonElement>(".nav-toggle");
const menu = document.getElementById("nav-links");
if (toggle && menu && nav) {
  toggle.hidden = false;
  const setOpen = (open: boolean) => {
    toggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("open", open);
  };
  toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
  menu.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("open")) {
      setOpen(false);
      toggle.focus();
    }
  });
}

// Project rows on phones: the dots follow the card in view, and tapping one
// scrolls to its card. The dots are decorative for assistive technology, which
// reads the cards as a plain list.
document.querySelectorAll<HTMLElement>(".work-group").forEach((group) => {
  const list = group.querySelector<HTMLElement>(".apps-grid");
  const dots = [...group.querySelectorAll<HTMLButtonElement>(".swipe-dots button")];
  if (!list || !dots.length) return;
  const cards = [...list.children] as HTMLElement[];
  const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const current = () => {
    const left = list.scrollLeft;
    let best = 0;
    cards.forEach((c, i) => {
      if (Math.abs(c.offsetLeft - cards[0].offsetLeft - left) < Math.abs(cards[best].offsetLeft - cards[0].offsetLeft - left)) best = i;
    });
    // At the end of the row the last card may not reach the left edge.
    return left + list.clientWidth >= list.scrollWidth - 2 ? cards.length - 1 : best;
  };
  let frame = 0;
  const update = () => {
    frame = 0;
    const i = current();
    dots.forEach((d, j) => d.classList.toggle("on", i === j));
  };
  list.addEventListener("scroll", () => {
    if (!frame) frame = requestAnimationFrame(update);
  }, { passive: true });
  dots.forEach((d, i) =>
    d.addEventListener("click", () =>
      list.scrollTo({ left: cards[i].offsetLeft - cards[0].offsetLeft, behavior: smooth ? "smooth" : "auto" }),
    ),
  );
  update();
});
