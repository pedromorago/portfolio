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
  about: "work",
  "how-i-test": "work",
  method: "work",
  projects: "work",
  experience: "contact",
  skills: "contact",
  "at-a-glance": "contact",
  career: "contact",
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

// Logo carousels: they stay still until someone drags them. A drag that ends
// in a fast flick throws the row, which glides and slows to a stop. Without
// JavaScript, or with reduced motion, the rows simply stay still.
// Tapping a logo, or pressing Enter on it, opens a card about the company and
// holds its row still until the card closes.
const card = document.getElementById("client-card");
let openLogo: HTMLButtonElement | null = null;
const placeCard = () => {
  if (!card || !openLogo) return;
  const r = openLogo.getBoundingClientRect();
  const w = card.offsetWidth;
  const h = card.offsetHeight;
  const left = Math.min(Math.max(16, r.left + r.width / 2 - w / 2), innerWidth - w - 16);
  const top = r.top - h - 14 > 12 ? r.top - h - 14 : r.bottom + 14;
  card.style.left = `${left}px`;
  card.style.top = `${top}px`;
};
const closeCard = (refocus = false) => {
  if (!card || !openLogo) return;
  const logo = openLogo;
  logo.setAttribute("aria-expanded", "false");
  logo.closest<HTMLElement>(".marquee")?.removeAttribute("data-held");
  card.hidden = true;
  openLogo = null;
  if (refocus) logo.focus();
};
const openCard = (logo: HTMLButtonElement, byKeyboard: boolean) => {
  if (!card) return;
  if (openLogo === logo) return closeCard(byKeyboard);
  closeCard();
  openLogo = logo;
  card.querySelector(".client-card-name")!.textContent = logo.dataset.name ?? "";
  card.querySelector(".client-card-sector")!.textContent = logo.dataset.sector ?? "";
  card.querySelector(".client-card-about")!.textContent = logo.dataset.about ?? "";
  logo.setAttribute("aria-expanded", "true");
  logo.closest<HTMLElement>(".marquee")?.setAttribute("data-held", "");
  card.hidden = false;
  placeCard();
  if (byKeyboard) card.querySelector<HTMLButtonElement>(".client-card-close")?.focus();
};
if (card) {
  card.querySelector(".client-card-close")?.addEventListener("click", () => closeCard(true));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && openLogo) closeCard(true);
  });
  document.addEventListener("pointerdown", (e) => {
    const t = e.target as HTMLElement;
    if (openLogo && !card.contains(t) && !t.closest(".marquee")) closeCard();
  });
  window.addEventListener("scroll", placeCard, { passive: true });
  window.addEventListener("resize", () => closeCard());
  // Keyboard activation. Taps are handled by the drag code, which owns the
  // pointer, except with reduced motion, where the rows don't take it.
  document.querySelectorAll<HTMLButtonElement>(".marquee-track .logo").forEach((logo) =>
    logo.addEventListener("click", (e) => {
      if (e.detail === 0) openCard(logo, true);
      else if (!logo.closest(".marquee")?.classList.contains("draggable")) openCard(logo, false);
    }),
  );
}
document.querySelectorAll<HTMLElement>(".marquee").forEach((marquee) => {
  const track = marquee.querySelector<HTMLElement>(".marquee-track");
  if (!track || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  marquee.classList.add("draggable");
  const settle = 0.9; // seconds for a throw to lose about two thirds of its speed
  const maxThrow = 5000; // px per second
  let offset = 0;
  let width = track.offsetWidth;
  let dragging = false;
  let startX = 0;
  let startOffset = 0;
  let thrown = 0; // current speed from the last flick, px per second
  let samples: { t: number; x: number }[] = [];
  let moved = 0;
  let last = performance.now();
  const wrap = () => {
    width = track.offsetWidth || width;
    offset = ((offset % width) - width) % width; // keep it in (-width, 0]
  };
  const paint = () => marquee.style.setProperty("--x", `${offset}px`);
  const tick = (now: number) => {
    const dt = Math.min(now - last, 100) / 1000;
    last = now;
    if (marquee.hasAttribute("data-held")) {
      thrown = 0;
    } else if (!dragging) {
      offset += thrown * dt;
      thrown *= Math.exp(-dt / settle);
      if (Math.abs(thrown) < 1) thrown = 0;
    }
    wrap();
    paint();
    requestAnimationFrame(tick);
  };
  marquee.addEventListener("pointerdown", (e) => {
    dragging = true;
    moved = 0;
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
    moved = Math.max(moved, Math.abs(e.clientX - startX));
    if (moved > 6 && openLogo) closeCard();
    samples.push({ t: e.timeStamp, x: e.clientX });
    while (samples.length > 2 && e.timeStamp - samples[0].t > 100) samples.shift();
  });
  const end = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    marquee.classList.remove("dragging");
    // A press that barely moved is a tap on a logo.
    if (moved <= 6 && e.type === "pointerup") {
      const logo = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLButtonElement>(".logo");
      if (logo && marquee.contains(logo)) openCard(logo, false);
      else closeCard();
      return;
    }
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

// Project rows: each group scrolls sideways. The arrows move one card at a
// time, the count says which cards are in view, and the dots (decorative for
// assistive technology, which reads the cards as a plain list) mark the
// position and jump to it.
document.querySelectorAll<HTMLElement>(".work-group").forEach((group) => {
  const list = group.querySelector<HTMLElement>(".apps-grid");
  const nav = group.querySelector<HTMLElement>(".row-nav");
  const dotsBox = group.querySelector<HTMLElement>(".swipe-dots");
  if (!list || !nav || !dotsBox) return;
  const cards = [...list.children] as HTMLElement[];
  const count = nav.querySelector<HTMLElement>(".row-count")!;
  const [prev, next] = [...nav.querySelectorAll<HTMLButtonElement>(".row-btn")];
  const smooth = !matchMedia("(prefers-reduced-motion: reduce)").matches;
  let stops: number[] = [];
  let dots: HTMLButtonElement[] = [];

  const offsetOf = (c: HTMLElement) => c.offsetLeft - cards[0].offsetLeft;
  const maxScroll = () => list.scrollWidth - list.clientWidth;
  const go = (left: number) => list.scrollTo({ left, behavior: smooth ? "smooth" : "auto" });
  const current = () => {
    let best = 0;
    stops.forEach((x, i) => {
      if (Math.abs(x - list.scrollLeft) < Math.abs(stops[best] - list.scrollLeft)) best = i;
    });
    return best;
  };

  const update = () => {
    const left = list.scrollLeft;
    const i = current();
    dots.forEach((d, j) => d.classList.toggle("on", i === j));
    prev.disabled = left <= 2;
    next.disabled = left >= maxScroll() - 2;
    list.classList.toggle("more-left", left > 2);
    list.classList.toggle("more-right", left < maxScroll() - 2);
    const inView = cards
      .map((c, k) => ({ k, a: offsetOf(c) - left, b: offsetOf(c) + c.offsetWidth - left }))
      .filter((c) => c.a >= -2 && c.b <= list.clientWidth + 2)
      .map((c) => c.k + 1);
    const a = inView[0] ?? 1;
    const b = inView[inView.length - 1] ?? a;
    count.textContent = `${a === b ? a : `${a}–${b}`} of ${cards.length}`;
  };

  // One stop per card, until the row can't scroll any further.
  const build = () => {
    const max = maxScroll();
    stops = [...new Set(cards.map((c) => Math.min(offsetOf(c), max)))];
    nav.hidden = stops.length < 2;
    dotsBox.replaceChildren(
      ...stops.map((x) => {
        const d = document.createElement("button");
        d.type = "button";
        d.tabIndex = -1;
        d.addEventListener("click", () => go(x));
        return d;
      }),
    );
    dots = [...dotsBox.querySelectorAll("button")];
    if (stops.length < 2) dotsBox.replaceChildren();
    update();
  };

  // A mouse can drag the row too (touch already scrolls it natively). On release
  // it moves on to the next card in the direction of the drag, as soon as the
  // drag is more than a nudge; it never springs back to where it started.
  let dragging = false;
  let startX = 0;
  let startLeft = 0;
  let moved = 0;
  list.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || stops.length < 2) return;
    dragging = true;
    moved = 0;
    startX = e.clientX;
    startLeft = list.scrollLeft;
  });
  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (!moved && Math.abs(dx) < 6) return;
    if (!moved) {
      list.classList.add("dragging");
      list.setPointerCapture(e.pointerId);
    }
    moved = Math.max(moved, Math.abs(dx));
    list.scrollLeft = startLeft - dx;
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    if (!moved) return;
    const dx = startLeft - list.scrollLeft; // positive when dragged towards earlier cards
    const from = stops.reduce((best, x, i) => (Math.abs(x - startLeft) < Math.abs(stops[best] - startLeft) ? i : best), 0);
    let to = from;
    if (Math.abs(dx) > 40) {
      // How many cards the drag covered, rounded up, so any real drag moves on.
      const step = stops.length > 1 ? Math.abs(stops[1] - stops[0]) : 1;
      const cards = Math.max(1, Math.ceil((Math.abs(dx) - 40) / step));
      to = from + (dx > 0 ? -cards : cards);
    }
    to = Math.max(0, Math.min(stops.length - 1, to));
    list.classList.remove("dragging");
    go(stops[to]);
  };
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);
  // A drag that ends over a link must not follow it, and images must not be dragged out.
  list.addEventListener("click", (e) => {
    if (moved > 6) {
      e.preventDefault();
      e.stopPropagation();
      moved = 0;
    }
  }, true);
  list.addEventListener("dragstart", (e) => e.preventDefault());

  prev.addEventListener("click", () => go(stops[Math.max(0, current() - 1)]));
  next.addEventListener("click", () => go(stops[Math.min(stops.length - 1, current() + 1)]));
  let frame = 0;
  list.addEventListener("scroll", () => {
    if (!frame) frame = requestAnimationFrame(() => ((frame = 0), update()));
  }, { passive: true });
  window.addEventListener("resize", build);
  build();
});
