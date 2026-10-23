import { gsap } from "gsap";

/* Shared enter/leave animations for one pager slide and its marquee background. */
const DUR = 0.8;
const EASE = "power3.inOut";
const IMG_AT = 0.4;
const MARQUEE_PX_PER_S = 90;

export type SlideRefs = {
  main: HTMLElement;
  background: HTMLElement | null;
  track: HTMLElement | null;
  title: HTMLElement | null;
  image: HTMLElement | null;
  fades: HTMLElement[];
  bgInners: HTMLElement[];
  loop: gsap.core.Tween | null;
};

const any = (x: unknown) => (Array.isArray(x) ? x.length > 0 : !!x);
const set = (t: gsap.TweenTarget, v: gsap.TweenVars) => any(t) && gsap.set(t, v);

export function refs(main: HTMLElement, background: HTMLElement | null): SlideRefs {
  return {
    main,
    background,
    track: background?.firstElementChild as HTMLElement | null,
    title: main.querySelector(".p-work__title > span, .p-work__title .inner"),
    image: main.querySelector(".p-work__image"),
    fades: [...main.querySelectorAll<HTMLElement>(".p-work__text, .p-work__tags, .p-work__sub, .p-work__contacts, .c-contact")],
    bgInners: background ? [...background.querySelectorAll<HTMLElement>("p span")] : [],
    loop: null,
  };
}

/* Clone the marquee line until it overfills the viewport, then loop it at a constant speed. */
function buildLoop(track: HTMLElement) {
  const first = track.querySelector("p");
  if (!first) return null;
  const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
  const w = first.getBoundingClientRect().width;
  if (!w) return null;
  let total = track.getBoundingClientRect().width;
  while (total - (w + gap) < window.innerWidth) {
    track.appendChild(first.cloneNode(true));
    total += w + gap;
  }
  const dist = w + gap;
  return gsap.fromTo(track, { x: 0 }, { x: -dist, duration: dist / MARQUEE_PX_PER_S, ease: "none", repeat: -1, paused: true });
}

export function rebuildLoop(s: SlideRefs, playing: boolean) {
  s.loop?.kill();
  s.loop = null;
  if (!s.track) return;
  const before = new Set(s.bgInners);
  gsap.set(s.track, { x: 0 });
  s.loop = buildLoop(s.track);
  s.bgInners = s.background ? [...s.background.querySelectorAll<HTMLElement>("p span")] : [];
  set(s.bgInners.filter((el) => !before.has(el)), { yPercent: playing ? 0 : 100 });
  if (playing) s.loop?.play();
}

export function hide(s: SlideRefs) {
  set(s.main, { autoAlpha: 0 });
  s.loop?.pause();
}

export function reset(s: SlideRefs) {
  hide(s);
  set(s.title, { yPercent: 100 });
  set(s.bgInners, { yPercent: 100 });
}

export function animateOut(s: SlideRefs) {
  const tl = gsap.timeline();
  if (any(s.title)) tl.to(s.title, { yPercent: -100, duration: DUR, ease: EASE }, 0);
  if (any(s.bgInners)) tl.to(s.bgInners, { yPercent: -100, duration: DUR, ease: EASE }, 0);
  if (any(s.image)) tl.to(s.image, { autoAlpha: 0, scale: 0.85, duration: 0.35, ease: "power2.in" }, 0);
  if (any(s.fades)) tl.to(s.fades, { autoAlpha: 0, y: -10, duration: 0.35, ease: "power2.in" }, 0);
  tl.add(() => hide(s));
  return tl;
}

export function animateIn(s: SlideRefs) {
  const tl = gsap.timeline();
  tl.set(s.main, { autoAlpha: 1 }, 0);
  if (any(s.title)) tl.fromTo(s.title, { yPercent: 100 }, { yPercent: 0, duration: DUR, ease: EASE }, 0);
  if (any(s.bgInners)) tl.fromTo(s.bgInners, { yPercent: 100 }, { yPercent: 0, duration: DUR, ease: EASE }, 0);
  if (any(s.image)) {
    tl.fromTo(s.image, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, ease: "none" }, IMG_AT);
    tl.fromTo(s.image, { scale: 0.4 }, { scale: 1, duration: 1.1, ease: "elastic.out(1, 0.6)" }, IMG_AT);
  }
  if (any(s.fades)) tl.fromTo(s.fades, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power2.out", stagger: 0.08 }, IMG_AT + 0.12);
  tl.add(() => s.loop?.play(), 0);
  return tl;
}

export const fontsReady = () =>
  document.fonts ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1000))]) : Promise.resolve();
