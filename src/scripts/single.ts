import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createStalker, type Stalker } from "./stalker";
import { refs, rebuildLoop, reset, animateIn, fontsReady } from "./slides";
import type { IconStage } from "./three/icons";

gsap.registerPlugin(ScrollTrigger);

const START = "top 95%";
const DELAY_MS = 200;

let timer = 0;
let tweens: gsap.core.Tween[] = [];
let nextTrigger: ScrollTrigger | null = null;
let nextTl: gsap.core.Timeline | null = null;
let stalker: Stalker | null = null;
let icons: IconStage | null = null;
let alive = false;

function titleChars(root: HTMLElement) {
  const chars = [...root.querySelectorAll(".p-single-head__title .char__inner")];
  if (!chars.length) return;
  gsap.to(chars, { opacity: 1, duration: 0.1 });
  gsap.fromTo(chars, { yPercent: 100 }, { yPercent: 0, duration: 1, ease: "power4.out", stagger: 0.012 });
}

function scrollReveals(root: HTMLElement) {
  const heads = [...root.querySelectorAll(".body-group__title span")];
  return heads.map((el) => gsap.to(el, { y: "0%", duration: 1, ease: "power4.out", scrollTrigger: { trigger: el, start: START } }));
}

function nextTeaser(root: HTMLElement) {
  const section = root.querySelector<HTMLElement>(".p-single-next");
  const main = section?.querySelector<HTMLElement>(".p-work__slide");
  if (!section || !main) return;
  const s = refs(main, section.querySelector(".p-work__bg"));
  stalker = createStalker(section.querySelector("[data-stalker]"), [...section.querySelectorAll("a.p-work__item")]);
  reset(s);
  fontsReady().then(() => {
    if (!alive) return;
    rebuildLoop(s, false);
    nextTrigger = ScrollTrigger.create({
      trigger: section,
      start: START,
      once: true,
      onEnter: () => {
        nextTl = animateIn(s);
        import("./three/icons").then(async ({ createIconStage }) => {
          if (!alive || !s.image) return;
          const stage = await createIconStage([s.image]);
          if (!alive) return stage.destroy();
          icons = stage;
          icons.setActive(s.image);
        });
      },
    });
  });
}

export function enterSingle(container: HTMLElement) {
  leaveSingle();
  alive = true;
  timer = window.setTimeout(() => {
    timer = 0;
    nextTeaser(container);
    titleChars(container);
    tweens = scrollReveals(container);
  }, DELAY_MS);
}

export function leaveSingle() {
  alive = false;
  clearTimeout(timer);
  tweens.forEach((t) => { t.scrollTrigger?.kill(); t.kill(); });
  tweens = [];
  nextTrigger?.kill();
  nextTl?.kill();
  stalker?.destroy();
  icons?.destroy();
  nextTrigger = null;
  nextTl = null;
  stalker = null;
  icons = null;
}
