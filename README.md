# Rupesh Bhandari — Portfolio

Personal portfolio built in the style of mildsugardesign.jp, with a live 3D room and character.

## Stack

| Tool | Why |
| --- | --- |
| [Astro 7](https://astro.build) | Static pages, zero JS by default, fast builds |
| [Barba.js 2](https://barba.js.org) | Page transitions without full reloads (orange curtain wipe) |
| [GSAP 3](https://gsap.com) + ScrollTrigger | Every animation: menu morph, loader, pager, char-by-char titles, scroll reveals |
| [Three.js](https://threejs.org) | The 3D room, the chibi character and the work-page icons |

## Commands

```bash
npm install
npm run dev       # http://localhost:4321 with hot reload
npm run build     # outputs static site to dist/
npm run preview   # serve dist/ locally
```

Force day or night on the home page with `/?mode=day` or `/?mode=night`. With no parameter it is night from 21:00 to 04:00 in the visitor's local time.

## Where things live

```
src/data/site.ts          ← all text: profile, the five case studies, about, skills, education
src/pages/                ← index (room), work/ (pager), work/[slug] (case pages), work/about
src/styles/global.css     ← all styles; sizes match the reference site
src/scripts/app.ts        ← Barba setup + page transition
src/scripts/menu.ts       ← elastic dot-to-X menu
src/scripts/home.ts       ← loader, click-to-turn, profile panel
src/scripts/pager.ts      ← wheel / swipe / dot navigation on /work/
src/scripts/single.ts     ← case page title + scroll reveals + "next case" teaser
src/scripts/three/parts.ts← character builder and colour palette (PAL)
src/scripts/three/room.ts ← the room scene and character clips (typing, rhythm, stretching, turn-around, sleeping)
src/scripts/three/icons.ts← 3D icons for each work slide
```

## Editing

- **Text and projects:** edit `src/data/site.ts`. Pages regenerate from it.
- **Character look:** colours are in `PAL` at the top of `src/scripts/three/parts.ts` (skin, hair, hoodie, wall, etc.). Hair shape is in `createCharacter()`.
- **Animation timing:** constants at the top of each script (`menu.ts`, `slides.ts`, `home.ts`) mirror the reference's durations and easings.

## Deploy

`npm run build` produces a plain static `dist/` folder. Drop it on Vercel, Netlify, Cloudflare Pages or GitHub Pages. No server needed.

`_legacy/` holds the earlier single-file HTML version for reference; it is not part of the build.
