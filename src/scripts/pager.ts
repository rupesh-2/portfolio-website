import { gsap } from "gsap";
import { createStalker } from "./stalker";
import { initContact } from "./contact";
import { refs, rebuildLoop, reset, hide, animateIn, animateOut, fontsReady, type SlideRefs } from "./slides";
import type { IconStage } from "./three/icons";

/* Full-screen work pager: wheel, swipe, dots and ?case=<id> links move one slide at a time. */
const WHEEL_MIN = 30;
const SWIPE_MIN = 30;
const COOLDOWN_MS = 700;

let cleanup: (() => void) | null = null;

export function enterPager(container: HTMLElement) {
  leavePager();
  const root = container.querySelector<HTMLElement>("[data-pager]");
  if (!root) return;

  const bgs = new Map<string, HTMLElement>();
  root.querySelectorAll<HTMLElement>("[data-background]").forEach((b) => bgs.set(b.dataset.background!, b));
  const slides: SlideRefs[] = [...root.querySelectorAll<HTMLElement>("[data-list]")].map((m) => refs(m, bgs.get(m.dataset.list!) || null));
  if (slides.length < 2) return;

  const navs = [...root.querySelectorAll<HTMLButtonElement>("[data-nav]")]
    .map((button) => ({ button, target: slides.findIndex((s) => s.main.dataset.list === button.dataset.nav) }))
    .filter((n) => n.target >= 0);
  const stalker = createStalker(root.querySelector("[data-stalker]"), [...root.querySelectorAll("a.p-work__item")]);

  const indexOf = (search: string) => slides.findIndex((s) => s.main.dataset.list === new URLSearchParams(search).get("case"));
  let current = Math.max(indexOf(location.search), 0);
  let tl: gsap.core.Timeline | null = null;
  let last = 0;
  let destroyed = false;
  let icons: IconStage | null = null;
  let width = window.innerWidth;
  let resizeT = 0;

  const syncNav = () => {
    navs.forEach((n) => {
      const on = n.target === current;
      n.button.classList.toggle("is-current", on);
      n.button.setAttribute("aria-current", on ? "true" : "false");
    });
    icons?.setActive(slides[current].image);
  };
  const rebuildAll = () => slides.forEach((s, i) => rebuildLoop(s, i === current));

  const go = (to: number) => {
    if (to < 0 || to >= slides.length || to === current) return false;
    tl?.kill();
    slides.forEach((s, i) => { if (i !== current && i !== to) { hide(s); gsap.set(s.bgInners, { yPercent: 100 }); } });
    stalker?.hide();
    tl = gsap.timeline();
    tl.add(animateOut(slides[current]), 0);
    tl.add(animateIn(slides[to]), 0);
    current = to;
    const id = slides[to].main.dataset.list;
    history.replaceState(history.state, "", to === 0 ? location.pathname : `?case=${id}`);
    requestAnimationFrame(syncNav);
    return true;
  };
  const tryGo = (to: number) => {
    if (performance.now() - last < COOLDOWN_MS) return;
    if (go(to)) last = performance.now();
  };

  // let people type and scroll inside the contact form without flipping slides
  const inForm = (e: Event) => !!(e.target as Element).closest?.("input, textarea, select");
  const onWheel = (e: WheelEvent) => {
    if (inForm(e)) return;
    e.preventDefault();
    if (Math.abs(e.deltaY) < WHEEL_MIN) return;
    tryGo(current + (e.deltaY > 0 ? 1 : -1));
  };
  let sx = 0, sy = 0;
  const onTouchStart = (e: TouchEvent) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; };
  const onTouchMove = (e: TouchEvent) => {
    if (inForm(e)) return;
    const { clientX, clientY } = e.touches[0];
    const dy = sy - clientY;
    if (Math.abs(dy) < Math.abs(sx - clientX) || Math.abs(dy) < SWIPE_MIN) return;
    e.preventDefault();
    if (performance.now() - last < COOLDOWN_MS) return;
    sx = clientX; sy = clientY;
    tryGo(current + (dy > 0 ? 1 : -1));
  };
  const onKey = (e: KeyboardEvent) => {
    if (inForm(e)) return;
    if (["ArrowDown", "PageDown"].includes(e.key)) { e.preventDefault(); tryGo(current + 1); }
    if (["ArrowUp", "PageUp"].includes(e.key)) { e.preventDefault(); tryGo(current - 1); }
  };
  const onNav = (e: Event) => {
    const n = navs.find((x) => x.button === e.currentTarget);
    if (n) tryGo(n.target);
  };
  // menu links like /work/?case=contact switch slides in place instead of reloading the page
  const onDocClick = (e: MouseEvent) => {
    const a = (e.target as Element).closest?.("a[href]") as HTMLAnchorElement | null;
    if (!a) return;
    const url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname) return;
    const i = indexOf(url.search);
    if (i < 0) return;
    e.preventDefault();
    e.stopPropagation();
    tryGo(i);
  };
  const onResize = () => {
    if (window.innerWidth === width) return;
    width = window.innerWidth;
    clearTimeout(resizeT);
    resizeT = window.setTimeout(rebuildAll, 200);
  };

  root.addEventListener("wheel", onWheel, { passive: false });
  root.addEventListener("touchstart", onTouchStart, { passive: true });
  root.addEventListener("touchmove", onTouchMove, { passive: false });
  window.addEventListener("keydown", onKey);
  window.addEventListener("resize", onResize);
  document.addEventListener("click", onDocClick, true);
  navs.forEach((n) => n.button.addEventListener("click", onNav));

  const leaveContact = initContact(container);

  slides.forEach(reset);
  syncNav();
  fontsReady().then(() => {
    if (destroyed) return;
    rebuildAll();
    gsap.to(root, { autoAlpha: 1, duration: 0.5, ease: "power2.out" });
    tl = animateIn(slides[current]);
  });
  import("./three/icons")
    .then(({ createIconStage }) => createIconStage(slides.map((s) => s.image).filter(Boolean) as HTMLElement[]))
    .then((stage) => {
      if (destroyed) return stage.destroy();
      icons = stage;
      icons.setActive(slides[current].image);
    })
    .catch((err) => console.warn("icons unavailable", err));

  cleanup = () => {
    destroyed = true;
    leaveContact();
    clearTimeout(resizeT);
    tl?.kill();
    stalker?.destroy();
    icons?.destroy();
    slides.forEach((s) => s.loop?.kill());
    root.removeEventListener("wheel", onWheel);
    root.removeEventListener("touchstart", onTouchStart);
    root.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("resize", onResize);
    document.removeEventListener("click", onDocClick, true);
    navs.forEach((n) => n.button.removeEventListener("click", onNav));
  };
}

export function leavePager() {
  cleanup?.();
  cleanup = null;
}
