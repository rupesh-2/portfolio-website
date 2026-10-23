import barba from "@barba/core";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { initMenu, markCurrent } from "./menu";
import { enterHome, leaveHome } from "./home";
import { enterPager, leavePager } from "./pager";
import { enterSingle, leaveSingle } from "./single";

gsap.registerPlugin(ScrollTrigger);

/* Orange curtain wipes up over the old page, then lifts off the new one. */
const WIPE = 0.6;
const cover = () =>
  gsap.timeline()
    .set("[data-transition]", { transformOrigin: "bottom", scaleY: 0, pointerEvents: "auto" })
    .to("[data-transition]", { scaleY: 1, duration: WIPE, ease: "power3.inOut" });
const reveal = () =>
  gsap.timeline()
    .set("[data-transition]", { transformOrigin: "top", scaleY: 1 })
    .to("[data-transition]", { scaleY: 0, duration: WIPE, ease: "power3.inOut" })
    .set("[data-transition]", { pointerEvents: "none" });

const views: Record<string, { enter: (c: HTMLElement) => void; leave: () => void }> = {
  home: { enter: enterHome, leave: leaveHome },
  work: { enter: enterPager, leave: leavePager },
  single: { enter: enterSingle, leave: leaveSingle },
};

const HEAD_TAGS = "meta[name='description'],meta[property^='og'],meta[property^='profile'],meta[name^='twitter'],link[rel='canonical'],script[type='application/ld+json']";
function swapHead(html: string) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  document.title = doc.title;
  document.head.querySelectorAll(HEAD_TAGS).forEach((n) => n.remove());
  doc.head.querySelectorAll(HEAD_TAGS).forEach((n) => document.head.appendChild(n));
}

function announce(container: HTMLElement) {
  const el = document.querySelector("[data-route-announcer]");
  if (el) el.textContent = `Navigated to ${document.title}`;
  container.querySelector<HTMLElement>("main")?.focus({ preventScroll: true });
}

/* Copy-to-clipboard buttons with a small toast. */
function initCopy() {
  const toast = document.querySelector<HTMLElement>("[data-toast]");
  let t = 0;
  const say = (msg: string) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("is-on");
    clearTimeout(t);
    t = window.setTimeout(() => toast.classList.remove("is-on"), 1800);
  };
  document.addEventListener("click", (e) => {
    const b = (e.target as Element).closest<HTMLElement>("[data-copy]");
    if (!b) return;
    const v = b.dataset.copy!;
    navigator.clipboard?.writeText(v).then(() => say(`Copied ${v}`), () => say(v));
  });
}

barba.init({
  preventRunning: true,
  prevent: ({ el }) => el.hasAttribute("data-barba-prevent") || (el as HTMLAnchorElement).protocol === "mailto:",
  transitions: [
    {
      sync: false,
      once() {
        initMenu();
        initCopy();
        markCurrent(location.pathname, location.search);
      },
      async leave() {
        await cover();
      },
      beforeEnter({ next }) {
        swapHead(next.html);
        markCurrent(next.url.path ?? location.pathname);
        window.scrollTo(0, 0);
      },
      afterEnter({ next }) {
        reveal();
        announce(next.container);
        ScrollTrigger.refresh();
      },
    },
  ],
  views: Object.entries(views).map(([namespace, v]) => ({
    namespace,
    afterOnce: ({ next }: { next: { container: HTMLElement } }) => v.enter(next.container),
    afterEnter: ({ next }: { next: { container: HTMLElement } }) => v.enter(next.container),
    afterLeave: () => v.leave(),
  })),
});
