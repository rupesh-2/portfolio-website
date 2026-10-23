import { gsap } from "gsap";
import { createStalker } from "./stalker";
import type { Room } from "./three/room";

const LOCK = "is-scroll-locked";
const NIGHT_FROM = 21;
const NIGHT_UNTIL = 4;
let loaderShown = false; // the loader plays once per visit, like the reference

const isNight = () => {
  const q = new URLSearchParams(location.search).get("mode");
  if (q === "night") return true;
  if (q === "day") return false;
  const h = new Date().getHours();
  return h >= NIGHT_FROM || h < NIGHT_UNTIL;
};
const isMobile = () => window.matchMedia("(max-width: 767px)").matches;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const pageLoaded = () =>
  document.readyState === "complete" ? Promise.resolve() : new Promise((r) => window.addEventListener("load", r, { once: true }));

/* Spread the ring text so it closes the circle exactly, whatever the font metrics. */
function fitRing(loader: HTMLElement) {
  const text = loader.querySelector<SVGTextElement>("[data-ring]");
  const path = loader.querySelector<SVGPathElement>("#ring");
  if (!text || !path) return;
  const chars = text.textContent?.length || 1;
  text.style.letterSpacing = "0px";
  const extra = (path.getTotalLength() - text.getComputedTextLength()) / chars;
  text.style.letterSpacing = `${Math.max(0, extra)}px`;
}

function playLoader(root: HTMLElement, ready: Promise<unknown>) {
  const loader = root.querySelector<HTMLElement>(".p-home-loading");
  if (!loader) return;
  fitRing(loader);
  document.fonts?.ready.then(() => fitRing(loader));
  if (loaderShown || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    loader.remove();
    return;
  }
  loaderShown = true;
  const filter = loader.querySelector(".p-home-loading__filter");
  const texts = [...loader.querySelectorAll(".p-home-loading__cover p")];
  // wait for the scene's first frame, but never longer than 8s
  Promise.race([Promise.all([pageLoaded(), ready]), wait(8000)]).then(() => {
    const tl = gsap.timeline({ delay: 0.5 });
    tl.to(filter, { opacity: 0.5, duration: 0.8, ease: "power2.out" }, 0)
      .fromTo(texts, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power2.out", stagger: 0.15 }, 0.4)
      .to(loader, { autoAlpha: 0, duration: 0.8, ease: "power2.out" }, "+=3.5")
      .add(() => loader.remove());
  });
}

let cleanup: (() => void) | null = null;

export async function enterHome(container: HTMLElement) {
  leaveHome();
  const host = container.querySelector<HTMLElement>("[data-scene]");
  const side = container.querySelector<HTMLElement>(".p-home__side");
  const stage = container.querySelector<HTMLElement>(".p-home__stage");
  if (!host || !side) return;

  const mobile = isMobile();
  if (mobile) document.body.classList.add(LOCK);
  const stalker = createStalker(container.querySelector("[data-stalker]"));
  let room: Room | null = null;
  let panelTl: gsap.core.Timeline | null = null;
  let alive = true;
  // until the scene exists, leaving only needs to stop the async setup
  cleanup = () => {
    alive = false;
    stalker?.destroy();
    document.body.classList.remove(LOCK);
  };

  const sticker = container.querySelector(".sticker-badge");
  const stickerTl = sticker ? gsap.to(sticker, { rotate: -4, transformOrigin: "50% 50%", duration: 1.6, ease: "sine.inOut", yoyo: true, repeat: -1, paused: true }) : null;

  const openPanel = () => {
    if (panelTl) return;
    side.removeAttribute("inert");
    stickerTl?.play();
    panelTl = gsap.timeline();
    panelTl.set(side, { opacity: 1, pointerEvents: "auto" }, 0);
    if (mobile) {
      const from = window.innerHeight - side.getBoundingClientRect().top;
      panelTl.fromTo(side, { y: from }, { y: 0, duration: 1.25, ease: "elastic.out(1, 0.62)" }, 0);
      panelTl.call(() => document.body.classList.remove(LOCK));
      return;
    }
    if (stage) panelTl.to(stage, { x: -side.offsetWidth / 2, duration: 1, ease: "power3.out" }, 0);
    panelTl.fromTo(side, { xPercent: 100 }, { xPercent: 0, duration: 1.25, ease: "elastic.out(1, 0.62)" }, 0);
  };

  let resolveReady: (v?: unknown) => void = () => {};
  const ready = new Promise((r) => (resolveReady = r));
  playLoader(container, ready);

  const { createRoom } = await import("./three/room");
  if (!alive) return;
  try {
    room = await createRoom(host, {
      night: isNight(),
      onReady: () => resolveReady(),
      onReveal: openPanel,
      onHoverChange: (over, e) => (over ? stalker?.show(e) : stalker?.hide()),
    });
  } catch (err) {
    // no WebGL: skip straight to the profile so the page still works
    console.warn("3D scene unavailable", err);
    resolveReady();
    openPanel();
  }
  if (!alive) { room?.destroy(); return; }

  const onClick = (e: MouseEvent) => {
    if (room?.click(e)) stalker?.hide();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    room ? room.turnAround() : openPanel();
    host.removeAttribute("role");
    host.tabIndex = -1;
  };
  host.addEventListener("click", onClick);
  host.addEventListener("keydown", onKey);

  cleanup = () => {
    alive = false;
    host.removeEventListener("click", onClick);
    host.removeEventListener("keydown", onKey);
    panelTl?.kill();
    stickerTl?.kill();
    stalker?.destroy();
    room?.destroy();
    document.body.classList.remove(LOCK);
  };
}

export function leaveHome() {
  cleanup?.();
  cleanup = null;
}
