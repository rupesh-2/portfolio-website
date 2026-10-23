import { gsap } from "gsap";

export type Stalker = { show: (e: MouseEvent) => void; hide: () => void; destroy: () => void };

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Big orange bubble that trails the cursor while it is over something clickable. */
export function createStalker(el: HTMLElement | null, triggers: Element[] = []): Stalker | null {
  if (!el || !window.matchMedia("(hover: hover) and (pointer: fine)").matches || reduced()) return null;
  gsap.set(el, { xPercent: -50, yPercent: -50, scale: 0.6 });
  const toX = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" });
  const toY = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });
  let on = false;

  const move = (e: MouseEvent) => { toX(e.clientX); toY(e.clientY); };
  const show = (e: MouseEvent) => {
    if (on) return;
    on = true;
    toX(e.clientX, e.clientX);
    toY(e.clientY, e.clientY);
    window.addEventListener("mousemove", move);
    gsap.to(el, { autoAlpha: 1, scale: 1, duration: 0.3, ease: "power2.out", overwrite: "auto" });
  };
  const hide = () => {
    if (!on) return;
    on = false;
    window.removeEventListener("mousemove", move);
    gsap.to(el, { autoAlpha: 0, scale: 0.6, duration: 0.2, ease: "power2.in", overwrite: "auto" });
  };
  const enter = (e: Event) => show(e as MouseEvent);
  triggers.forEach((t) => { t.addEventListener("mouseenter", enter); t.addEventListener("mouseleave", hide); });

  return {
    show,
    hide,
    destroy() {
      hide();
      gsap.killTweensOf(el);
      triggers.forEach((t) => { t.removeEventListener("mouseenter", enter); t.removeEventListener("mouseleave", hide); });
    },
  };
}
