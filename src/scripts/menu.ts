import { gsap } from "gsap";

/* Orange dot button morphs into an X while the panel springs open (elastic), items stagger in. */
const OPEN_DUR = 0.9;
const OPEN_EASE = "elastic.out(1, 0.62)";
const CLOSE_DUR = 0.45;
const CLOSE_EASE = "power3.inOut";
const ITEMS_DELAY = 0.22;
const ITEMS_OUT = 0.2;

const cssNum = (el: Element, name: string) => parseFloat(getComputedStyle(el).getPropertyValue(name));

export function initMenu() {
  const button = document.querySelector<HTMLButtonElement>(".l-header__menu-button");
  const panel = document.querySelector<HTMLElement>(".l-header__menu");
  const nav = panel?.querySelector<HTMLElement>(".l-header__menu-nav");
  if (!button || !panel || !nav) return;
  const items = [...panel.querySelectorAll<HTMLElement>(".l-header__li, .l-header__li-title")];
  const dots = [...button.querySelectorAll<HTMLElement>(".dot")];
  let open = false;
  let tl: gsap.core.Timeline | null = null;

  const openSize = () => ({
    width: Math.max(cssNum(panel, "--menu-width"), nav.scrollWidth + 80),
    height: nav.scrollHeight + 80,
  });

  const show = () => {
    if (open) return;
    open = true;
    button.setAttribute("aria-expanded", "true");
    button.setAttribute("aria-label", "Close menu");
    panel.removeAttribute("inert");
    gsap.set(panel, { pointerEvents: "auto" });
    tl?.kill();
    tl = gsap.timeline();
    const { width, height } = openSize();
    const off = cssNum(button, "--dot-offset");
    const cw = cssNum(button, "--dot-cross-width");
    const ch = cssNum(button, "--dot-cross-height");
    tl.to(panel, { width, height, duration: OPEN_DUR, ease: OPEN_EASE }, 0)
      .to(dots[0], { y: off, rotate: 45, width: cw, height: ch, duration: OPEN_DUR, ease: OPEN_EASE }, 0)
      .to(dots[2], { y: -off, rotate: -45, width: cw, height: ch, duration: OPEN_DUR, ease: OPEN_EASE }, 0)
      .to(dots[1], { autoAlpha: 0, scale: 0, duration: 0.2, ease: "power2.in" }, 0)
      .fromTo(items, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out", stagger: 0.05 }, ITEMS_DELAY);
  };

  const hide = () => {
    if (!open) return;
    open = false;
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "Open menu");
    if (panel.contains(document.activeElement)) button.focus();
    panel.setAttribute("inert", "");
    gsap.set(panel, { pointerEvents: "none" });
    tl?.kill();
    tl = gsap.timeline();
    const closed = cssNum(panel, "--menu-closed-size");
    const size = cssNum(button, "--dot-size");
    tl.to(items, { autoAlpha: 0, y: 8, duration: ITEMS_OUT, ease: "power2.in" }, 0)
      .to(panel, { width: closed, height: closed, duration: CLOSE_DUR, ease: CLOSE_EASE }, ITEMS_OUT)
      .to([dots[0], dots[2]], { y: 0, rotate: 0, width: size, height: size, duration: CLOSE_DUR, ease: CLOSE_EASE }, ITEMS_OUT)
      .to(dots[1], { autoAlpha: 1, scale: 1, duration: 0.25, ease: "power2.out" }, ITEMS_OUT + 0.2);
  };

  button.addEventListener("click", () => (open ? hide() : show()));
  document.addEventListener("click", (e) => {
    if (open && !panel.contains(e.target as Node) && !button.contains(e.target as Node)) hide();
  });
  document.addEventListener("keydown", (e) => e.key === "Escape" && hide());
  panel.addEventListener("click", (e) => (e.target as Element).closest("a") && hide());
  window.addEventListener("resize", () => open && gsap.set(panel, openSize()));
}

const norm = (p: string) => p.replace(/\/?$/, "/");
export function markCurrent(path: string, search = "") {
  document.querySelectorAll<HTMLAnchorElement>(".l-header__menu a").forEach((a) => {
    const same = norm(a.pathname) === norm(path) && a.search === search;
    if (same) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
}
