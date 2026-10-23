import * as THREE from "three";
import { gsap } from "gsap";
import {
  PAL, mat, mesh, rbox, sphere, cyl,
  createCharacter, poseTyping, setEyesClosed, studioEnv, makeRenderer, type Rig,
} from "./parts";

export type RoomOptions = {
  night: boolean;
  onReady?: () => void;
  /** Fires once when the turn-around clip passes its midpoint (mirrors the reference's 50% trigger). */
  onReveal?: () => void;
  onHoverChange?: (over: boolean, e: PointerEvent) => void;
};

export type Room = {
  canvas: HTMLCanvasElement;
  click: (e?: PointerEvent | MouseEvent) => boolean;
  turnAround: () => void;
  isOverCharacter: (e: PointerEvent | MouseEvent) => boolean;
  destroy: () => void;
};

/* ---------- textures drawn on canvas (no image assets needed) ---------- */
function canvasTex(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  draw(cv.getContext("2d")!);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

const codeTexture = (night: boolean) =>
  canvasTex(640, 400, (c) => {
    c.fillStyle = night ? "#1d2333" : "#f4f6f8";
    c.fillRect(0, 0, 640, 400);
    c.fillStyle = night ? "#151a27" : "#e4e8ee";
    c.fillRect(0, 0, 120, 400);
    c.fillRect(0, 0, 640, 26);
    const cols = ["#fea831", "#4c9be8", "#5fae4a", "#c678dd", "#e06c75", night ? "#c9d1e0" : "#3c3728"];
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 18; i++) {
      let x = 140 + Math.floor(rnd() * 4) * 18;
      const y = 44 + i * 19;
      const n = 2 + Math.floor(rnd() * 4);
      for (let k = 0; k < n; k++) {
        const w = 30 + rnd() * 90;
        c.fillStyle = cols[Math.floor(rnd() * cols.length)];
        c.globalAlpha = 0.85;
        c.fillRect(x, y, w, 8);
        x += w + 10;
      }
    }
    for (let i = 0; i < 12; i++) {
      c.fillStyle = night ? "#2a3247" : "#cfd6df";
      c.globalAlpha = 1;
      c.fillRect(16, 44 + i * 24, 70 + (i % 3) * 12, 8);
    }
  });

const mountainTexture = () =>
  canvasTex(400, 300, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 300);
    g.addColorStop(0, "#fbe3b8");
    g.addColorStop(1, "#fbd08f");
    c.fillStyle = g;
    c.fillRect(0, 0, 400, 300);
    c.fillStyle = "#fea831";
    c.beginPath();
    c.arc(300, 90, 34, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#3c3728";
    c.beginPath();
    c.moveTo(0, 300); c.lineTo(110, 120); c.lineTo(170, 200); c.lineTo(240, 90); c.lineTo(400, 300);
    c.fill();
    c.fillStyle = "#f7f5f1";
    c.beginPath(); c.moveTo(110, 120); c.lineTo(88, 156); c.lineTo(130, 152); c.fill();
    c.beginPath(); c.moveTo(240, 90); c.lineTo(212, 136); c.lineTo(268, 132); c.fill();
  });

const abstractTexture = () =>
  canvasTex(300, 300, (c) => {
    c.fillStyle = "#f2b33d";
    c.fillRect(0, 0, 300, 300);
    c.fillStyle = "#f7c55f";
    c.fillRect(0, 170, 300, 130);
  });

const woodTexture = () =>
  canvasTex(512, 512, (c) => {
    c.fillStyle = "#d9a676";
    c.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 16; i++) {
      c.fillStyle = i % 2 ? "#d39f6e" : "#ddb07f";
      c.fillRect(0, i * 32, 512, 31);
      c.fillStyle = "#c18c5c";
      c.fillRect(0, i * 32 + 31, 512, 1);
      c.fillRect(((i * 197) % 512), i * 32, 1, 32);
    }
  });

const glowTexture = () =>
  canvasTex(256, 256, (c) => {
    const g = c.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(255,244,220,0.9)");
    g.addColorStop(0.5, "rgba(255,236,200,0.35)");
    g.addColorStop(1, "rgba(255,236,200,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 256, 256);
  });

const skyTexture = (night: boolean) =>
  canvasTex(256, 512, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 512);
    if (night) { g.addColorStop(0, "#0f1630"); g.addColorStop(1, "#2a3561"); }
    else { g.addColorStop(0, "#ffffff"); g.addColorStop(1, "#fff4dc"); }
    c.fillStyle = g;
    c.fillRect(0, 0, 256, 512);
    if (night) {
      c.fillStyle = "#fff";
      for (let i = 0; i < 40; i++) c.fillRect((i * 73) % 256, (i * 151) % 360, 2, 2);
      c.fillStyle = "#f6e7b0";
      c.beginPath(); c.arc(170, 110, 26, 0, Math.PI * 2); c.fill();
    }
  });

const zzzTexture = () =>
  canvasTex(128, 128, (c) => {
    c.fillStyle = "#ffffff";
    c.font = "bold 92px Righteous, sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("z", 64, 70);
  });

/* ---------- the scene ---------- */
export async function createRoom(host: HTMLElement, opts: RoomOptions): Promise<Room> {
  const { night } = opts;
  const renderer = makeRenderer(false);
  renderer.toneMappingExposure = night ? 0.85 : 1.08;
  host.appendChild(renderer.domElement);
  const canvas = renderer.domElement;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(night ? 0x2b3a4f : PAL.wall);
  scene.environment = await studioEnv(renderer);
  scene.environmentIntensity = night ? 0.18 : 0.55;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  const lookAt = new THREE.Vector3(0, 1.42, -0.6);

  /* lights */
  const hemi = new THREE.HemisphereLight(night ? 0x6f86b8 : 0xfff6e8, night ? 0x2a2230 : 0xd9a676, night ? 0.35 : 1.1);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(night ? 0x9fb4ff : 0xfff0d6, night ? 0.35 : 2.6);
  sun.position.set(4.5, 4.2, 2.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -4; sun.shadow.camera.right = 4;
  sun.shadow.camera.top = 4; sun.shadow.camera.bottom = -2;
  sun.shadow.radius = 6;
  sun.shadow.bias = -0.0004;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(night ? 0x4a5a88 : 0xd8ecff, night ? 0.25 : 0.55);
  fill.position.set(-3, 2.5, 4);
  scene.add(fill);

  /* room shell */
  const floorTex = woodTexture();
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(3, 3);
  const floor = mesh(new THREE.PlaneGeometry(10, 8), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.7 }), false);
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = 1;
  scene.add(floor);

  const backWall = mesh(new THREE.PlaneGeometry(10, 5), mat(PAL.wall, { roughness: 0.95 }), false);
  backWall.position.set(0, 2.5, -1.55);
  scene.add(backWall);
  const leftWall = mesh(new THREE.PlaneGeometry(8, 5), mat(PAL.wallSide, { roughness: 0.95 }), false);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-2.7, 2.5, 2.4);
  scene.add(leftWall);
  const skirting = rbox(10, 0.12, 0.04, 0.01, 0xf3efe7);
  skirting.position.set(0, 0.06, -1.53);
  scene.add(skirting);

  /* window on the right with curtain and light */
  const win = new THREE.Group();
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.4), new THREE.MeshBasicMaterial({ map: skyTexture(night), toneMapped: false }));
  win.add(pane);
  const frameMat = mat(0xf7f5f1, { roughness: 0.6 });
  for (const [w, h, x, y] of [[1.62, 0.08, 0, 1.22], [1.62, 0.08, 0, -1.22], [0.08, 2.5, -0.78, 0], [0.08, 2.5, 0.78, 0], [0.05, 2.4, 0, 0], [1.5, 0.05, 0, 0.3]] as const) {
    const b = mesh(new THREE.BoxGeometry(w, h, 0.08), frameMat, false);
    b.position.set(x, y, 0.03);
    win.add(b);
  }
  win.position.set(2.15, 2.05, -1.5);
  scene.add(win);
  const curtain = mesh(new THREE.PlaneGeometry(0.7, 2.9, 12, 1), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.88, side: THREE.DoubleSide }), false);
  const cpos = curtain.geometry.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < cpos.count; i++) cpos.setZ(i, Math.sin(cpos.getX(i) * 18) * 0.04);
  curtain.geometry.computeVertexNormals();
  curtain.position.set(1.3, 2.0, -1.4);
  scene.add(curtain);

  // soft sun patch on the back wall
  const patch = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.6), new THREE.MeshBasicMaterial({ map: glowTexture(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: night ? 0 : 0.55 }));
  patch.position.set(0.7, 1.9, -1.53);
  patch.rotation.z = 0.35;
  scene.add(patch);

  /* shelf with books and plants */
  const shelf = rbox(2.6, 0.05, 0.24, 0.015, 0xf7f5f1);
  shelf.position.set(-0.1, 2.42, -1.42);
  scene.add(shelf);
  const bookCols = [0x3c3728, 0xfea831, 0x4c7fa8, 0xe8e2d4, 0x2e3442, 0xd96f4c, 0x8fbf8a, 0x3c3728, 0xf2c14e];
  let bx = -1.32;
  bookCols.forEach((c, i) => {
    const h = 0.26 + ((i * 37) % 9) / 90;
    const w = 0.05 + ((i * 13) % 4) / 100;
    const b = rbox(w, h, 0.18, 0.006, c, { roughness: 0.8 });
    b.position.set(bx + w / 2, 2.445 + h / 2, -1.42);
    if (i === bookCols.length - 1) { b.rotation.z = -0.25; b.position.x += 0.04; }
    scene.add(b);
    bx += w + 0.008;
  });
  const smallPlant = (x: number, s = 1) => {
    const g = new THREE.Group();
    const pot = cyl(0.07 * s, 0.055 * s, 0.11 * s, PAL.pot, { roughness: 0.5 });
    pot.position.y = 0.055 * s;
    g.add(pot);
    for (let k = 0; k < 7; k++) {
      const leaf = sphere(0.06 * s, k % 2 ? PAL.leaf : PAL.leafLight, { roughness: 0.6 }, 16);
      leaf.scale.set(0.55, 1, 0.25);
      const a = (k / 7) * Math.PI * 2;
      leaf.position.set(Math.cos(a) * 0.05 * s, 0.17 * s + (k % 3) * 0.03 * s, Math.sin(a) * 0.05 * s);
      leaf.rotation.set(Math.sin(a) * 0.6, a, Math.cos(a) * 0.6);
      g.add(leaf);
    }
    g.position.set(x, 2.445, -1.42);
    scene.add(g);
    return g;
  };
  const shelfPlants = [smallPlant(-0.2), smallPlant(0.35, 0.85), smallPlant(0.9, 1.1)];
  const jar = sphere(0.08, 0xe9f3ee, { roughness: 0.1, transparent: true, opacity: 0.6 }, 24);
  jar.position.set(0.62, 2.53, -1.42);
  scene.add(jar);

  /* prayer flags along the top of the wall: a small Nepal detail */
  const flags: THREE.Mesh[] = [];
  const flagCols = [0x2d8fd5, 0xffffff, 0xd9534f, 0x2f9e6e, 0xfea831];
  const flagCount = 17;
  for (let i = 0; i < flagCount; i++) {
    const p = i / (flagCount - 1);
    const x = -1.2 + p * 2.6;
    const y = 2.98 - Math.sin(p * Math.PI) * 0.22;
    const f = mesh(new THREE.PlaneGeometry(0.15, 0.19), new THREE.MeshStandardMaterial({ color: flagCols[i % 5], roughness: 0.9, side: THREE.DoubleSide }), false);
    f.geometry.translate(0, -0.095, 0);
    f.position.set(x, y, -1.47);
    f.userData.phase = i * 0.7;
    flags.push(f);
    scene.add(f);
  }
  const string = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: 12 }, (_, i) => { const p = i / 11; return new THREE.Vector3(-1.2 + p * 2.6, 2.98 - Math.sin(p * Math.PI) * 0.22, -1.47); })), 40, 0.004, 4),
    mat(0xf7f5f1),
  );
  scene.add(string);

  /* frames on the wall */
  const frame = (w: number, h: number, tex: THREE.Texture, x: number, y: number) => {
    const g = new THREE.Group();
    const outer = rbox(w, h, 0.04, 0.01, 0xf7f5f1);
    const art = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.72, h * 0.72), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
    art.position.z = 0.022;
    g.add(outer, art);
    g.position.set(x, y, -1.52);
    scene.add(g);
  };
  frame(0.62, 0.78, abstractTexture(), -1.15, 1.7);
  frame(0.75, 0.6, mountainTexture(), 1.0, 1.82);

  /* desk */
  const desk = new THREE.Group();
  const top = rbox(2.5, 0.07, 0.86, 0.02, PAL.wood, { roughness: 0.55 });
  top.position.y = 0.94;
  desk.add(top);
  for (const s of [-1, 1]) {
    const unit = rbox(0.6, 0.86, 0.8, 0.02, PAL.drawer, { roughness: 0.6 });
    unit.position.set(0.92 * s, 0.47, 0);
    desk.add(unit);
    const front = rbox(0.56, 0.24, 0.02, 0.01, s < 0 ? PAL.woodDark : 0xf2c472, { roughness: 0.55 });
    front.position.set(0.92 * s, 0.76, 0.405);
    desk.add(front);
    for (const yy of [0.76, 0.46]) {
      const handle = rbox(0.16, 0.02, 0.02, 0.008, 0x9a9a9a, { metalness: 0.5, roughness: 0.3 });
      handle.position.set(0.92 * s, yy, 0.42);
      desk.add(handle);
    }
    for (const xx of [-0.22, 0.22]) {
      const wheel = sphere(0.035, 0x3c3c3c, {}, 12);
      wheel.position.set(0.92 * s + xx, 0.035, 0.3);
      desk.add(wheel);
    }
  }
  desk.position.set(0, 0, -0.95);
  scene.add(desk);

  // monitor (screen faces the character, so the camera sees it past his head)
  const monitor = new THREE.Group();
  const bezel = rbox(1.0, 0.62, 0.04, 0.02, 0xf2f2f2, { roughness: 0.35 });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.94, 0.56), new THREE.MeshBasicMaterial({ map: codeTexture(night), toneMapped: false }));
  screen.position.z = 0.022;
  const neck = rbox(0.06, 0.26, 0.04, 0.015, 0xdedede);
  neck.position.set(0, -0.4, -0.03);
  const foot = rbox(0.32, 0.02, 0.2, 0.01, 0xdedede);
  foot.position.set(0, -0.52, 0.01);
  monitor.add(bezel, screen, neck, foot);
  monitor.position.set(0, 1.5, -1.12);
  scene.add(monitor);
  if (night) {
    const glow = new THREE.PointLight(0x8fb6ff, 1.2, 2.5, 2);
    glow.position.set(0, 1.4, -0.85);
    scene.add(glow);
  }

  const keyboard = rbox(0.6, 0.025, 0.18, 0.01, 0xf2f2f2, { roughness: 0.4 });
  keyboard.position.set(-0.05, 0.99, -0.62);
  scene.add(keyboard);
  const mouse = rbox(0.06, 0.03, 0.1, 0.02, 0xf2f2f2, { roughness: 0.4 });
  mouse.position.set(0.42, 0.99, -0.6);
  scene.add(mouse);

  const speaker = (x: number) => {
    const g = new THREE.Group();
    const box = rbox(0.24, 0.3, 0.22, 0.03, 0x2b2b2b, { roughness: 0.45 });
    const cone = mesh(new THREE.TorusGeometry(0.07, 0.02, 12, 32), mat(0x5a5a5a, { roughness: 0.3 }));
    cone.position.set(0, -0.02, 0.112);
    const dust = sphere(0.04, 0x444444, { roughness: 0.4 }, 16);
    dust.scale.z = 0.4;
    dust.position.set(0, -0.02, 0.105);
    g.add(box, cone, dust);
    g.position.set(x, 1.13, -0.95);
    g.rotation.y = -x * 0.25;
    scene.add(g);
    return g;
  };
  const speakers = [speaker(-0.82), speaker(0.82)];

  const cup = cyl(0.07, 0.065, 0.16, PAL.orange, { roughness: 0.5 });
  cup.position.set(-0.5, 1.06, -0.82);
  scene.add(cup);
  for (let i = 0; i < 6; i++) {
    const p = cyl(0.008, 0.008, 0.26, [0x3c7fd8, 0xe85d4a, 0xf2c14e, 0x5fae4a][i % 4], {}, 8);
    p.position.set(-0.5 + Math.cos(i) * 0.03, 1.14, -0.82 + Math.sin(i) * 0.03);
    p.rotation.set(Math.sin(i) * 0.2, 0, Math.cos(i) * 0.2);
    scene.add(p);
  }
  const mug = cyl(0.055, 0.05, 0.11, 0xf7f5f1, { roughness: 0.4 });
  mug.position.set(0.58, 1.03, -0.75);
  scene.add(mug);
  const handle = mesh(new THREE.TorusGeometry(0.03, 0.01, 8, 16), mat(0xf7f5f1));
  handle.position.set(0.64, 1.03, -0.75);
  handle.rotation.y = Math.PI / 2;
  scene.add(handle);

  // desk lamp (only lit at night)
  const lamp = new THREE.Group();
  const lampBase = cyl(0.08, 0.09, 0.03, 0x3c3728);
  const arm = cyl(0.012, 0.012, 0.42, 0x3c3728, {}, 8);
  arm.position.set(0.05, 0.21, 0);
  arm.rotation.z = -0.25;
  const shade = mesh(new THREE.ConeGeometry(0.1, 0.13, 24, 1, true), mat(PAL.orange, { side: THREE.DoubleSide }));
  shade.position.set(0.12, 0.42, 0);
  shade.rotation.z = 0.8;
  const bulb = sphere(0.035, 0xfff1c9, { emissive: 0xffd58a, emissiveIntensity: night ? 3 : 0.2 }, 12);
  bulb.position.set(0.09, 0.38, 0);
  lamp.add(lampBase, arm, shade, bulb);
  lamp.position.set(-1.0, 0.99, -1.0);
  scene.add(lamp);
  if (night) {
    const lampLight = new THREE.PointLight(0xffc77a, 6, 3.5, 1.6);
    lampLight.position.set(-0.85, 1.35, -0.95);
    lampLight.castShadow = true;
    lampLight.shadow.mapSize.set(1024, 1024);
    lampLight.shadow.radius = 8;
    scene.add(lampLight);
  }

  /* big floor plant on the left */
  const floorPlant = new THREE.Group();
  const bigPot = cyl(0.22, 0.17, 0.42, PAL.pot, { roughness: 0.45 });
  bigPot.position.y = 0.21;
  floorPlant.add(bigPot);
  const leaves: THREE.Object3D[] = [];
  for (let k = 0; k < 9; k++) {
    const stemLen = 0.6 + (k % 3) * 0.25;
    const a = (k / 9) * Math.PI * 2;
    const stem = new THREE.Group();
    stem.position.y = 0.4;
    stem.rotation.set(Math.sin(a) * 0.45, 0, Math.cos(a) * 0.45);
    const s = cyl(0.01, 0.012, stemLen, 0x4f8a3c, {}, 6);
    s.position.y = stemLen / 2;
    const leaf = sphere(0.2, k % 2 ? PAL.leaf : 0x4e9a3e, { roughness: 0.55, side: THREE.DoubleSide }, 20);
    leaf.scale.set(0.8, 0.08, 1.25);
    leaf.position.y = stemLen;
    leaf.rotation.x = 0.5;
    stem.add(s, leaf);
    stem.userData.phase = k;
    leaves.push(stem);
    floorPlant.add(stem);
  }
  floorPlant.position.set(-1.9, 0, -0.9);
  scene.add(floorPlant);

  /* the character */
  const rig: Rig = createCharacter();
  rig.root.position.set(0, 0, 0.12);
  rig.root.rotation.y = Math.PI; // back to camera, facing the desk
  scene.add(rig.root);
  poseTyping(rig);
  rig.foreL.rotation.x = rig.foreR.rotation.x = -0.65;
  const typingPose = { shoulderX: -0.95, foreX: -0.65 };

  /* sleeping Zzz sprites (night) */
  const zMat = new THREE.SpriteMaterial({ map: zzzTexture(), transparent: true, depthWrite: false });
  const zs: THREE.Sprite[] = [];
  if (night) {
    for (let i = 0; i < 3; i++) {
      const z = new THREE.Sprite(zMat.clone());
      z.scale.setScalar(0.18 + i * 0.06);
      z.userData.phase = i / 3;
      scene.add(z);
      zs.push(z);
    }
  }

  /* ---------- clips ---------- */
  type Mode = "typing" | "rhythm" | "stretching" | "sleeping" | "turning" | "facing";
  let mode: Mode = night ? "sleeping" : "typing";
  let idleTl: gsap.core.Timeline | null = null;
  let turnTl: gsap.core.Timeline | null = null;
  let revealed = false;
  let lastIdleSwitch = performance.now();
  const IDLE_SWITCH_MS = 17000;
  const look = { x: 0, y: 0 };

  const applySleepPose = () => {
    rig.body.rotation.x = 0.35;
    rig.neck.rotation.set(0.5, 0, 0.25);
    for (const [sh, el, s] of [[rig.armL, rig.foreL, -1], [rig.armR, rig.foreR, 1]] as const) {
      sh.rotation.set(-1.25, 0, -0.35 * s);
      el.rotation.set(-1.2, 0, 0.9 * s);
    }
    setEyesClosed(rig, true);
  };
  if (night) applySleepPose();

  const playRhythm = () => {
    mode = "rhythm";
    idleTl = gsap.timeline({ onComplete: backToTyping });
    idleTl
      .to(rig.neck.rotation, { z: 0.16, duration: 0.32, ease: "sine.inOut", yoyo: true, repeat: 1 })
      .to(rig.neck.rotation, { z: -0.16, duration: 0.32, ease: "sine.inOut", yoyo: true, repeat: 1 })
      .to(rig.body.rotation, { z: 0.05, duration: 0.64, ease: "sine.inOut", yoyo: true, repeat: 5 }, 0)
      .to(rig.neck.rotation, { z: 0.16, duration: 0.32, ease: "sine.inOut", yoyo: true, repeat: 1 })
      .to(rig.neck.rotation, { z: -0.16, duration: 0.32, ease: "sine.inOut", yoyo: true, repeat: 1 })
      .to(rig.neck.rotation, { x: 0.25, duration: 0.2, ease: "sine.inOut", yoyo: true, repeat: 3 });
  };
  const playStretch = () => {
    mode = "stretching";
    idleTl = gsap.timeline({ onComplete: backToTyping });
    idleTl
      .to([rig.armL.rotation, rig.armR.rotation], { x: -2.95, duration: 0.7, ease: "power2.inOut" }, 0)
      .to(rig.armL.rotation, { z: 0.3, duration: 0.7, ease: "power2.inOut" }, 0)
      .to(rig.armR.rotation, { z: -0.3, duration: 0.7, ease: "power2.inOut" }, 0)
      .to([rig.foreL.rotation, rig.foreR.rotation], { x: -0.1, duration: 0.7, ease: "power2.inOut" }, 0)
      .to(rig.body.rotation, { x: -0.16, duration: 0.7, ease: "power2.inOut" }, 0)
      .to(rig.neck.rotation, { x: -0.35, duration: 0.7, ease: "power2.inOut" }, 0)
      .to(rig.body.rotation, { z: 0.08, duration: 0.5, ease: "sine.inOut", yoyo: true, repeat: 1 }, 0.8)
      .to([rig.armL.rotation, rig.armR.rotation], { x: typingPose.shoulderX, z: 0, duration: 0.8, ease: "power2.inOut" }, 2.0)
      .to(rig.armL.rotation, { z: 0.18, duration: 0.8 }, 2.0)
      .to(rig.armR.rotation, { z: -0.18, duration: 0.8 }, 2.0)
      .to([rig.foreL.rotation, rig.foreR.rotation], { x: typingPose.foreX, duration: 0.8, ease: "power2.inOut" }, 2.0)
      .to(rig.body.rotation, { x: 0.06, duration: 0.8, ease: "power2.inOut" }, 2.0)
      .to(rig.neck.rotation, { x: 0.12, duration: 0.8, ease: "power2.inOut" }, 2.0);
  };
  function backToTyping() {
    idleTl = null;
    mode = "typing";
    lastIdleSwitch = performance.now();
  }

  /* Turn around: swivel the chair to face the camera, hop, wave, wink. */
  const turnAround = () => {
    if (mode === "turning" || mode === "facing") return;
    idleTl?.kill();
    const fromNight = mode === "sleeping";
    mode = "turning";
    zs.forEach((z) => (z.visible = false));
    turnTl = gsap.timeline({
      onUpdate() {
        if (!revealed && turnTl && turnTl.progress() >= 0.5) {
          revealed = true;
          opts.onReveal?.();
        }
      },
      onComplete() { mode = "facing"; },
    });
    const t = turnTl;
    if (fromNight) {
      t.call(() => setEyesClosed(rig, true));
      t.to(rig.neck.rotation, { x: 0, z: 0, duration: 0.6, ease: "power2.out" }, 0)
        .to(rig.body.rotation, { x: 0, duration: 0.6, ease: "power2.out" }, 0)
        .call(() => setEyesClosed(rig, false), [], 0.75)
        .call(() => setEyesClosed(rig, true), [], 0.85)
        .call(() => setEyesClosed(rig, false), [], 0.95);
    }
    const s = fromNight ? 1.0 : 0;
    t.to([rig.armL.rotation, rig.armR.rotation], { x: -0.35, duration: 0.45, ease: "power2.out" }, s)
      .to(rig.armL.rotation, { z: -0.12, duration: 0.45, ease: "power2.out" }, s)
      .to(rig.armR.rotation, { z: 0.12, duration: 0.45, ease: "power2.out" }, s)
      .to([rig.foreL.rotation, rig.foreR.rotation], { x: -0.9, z: 0, duration: 0.45, ease: "power2.out" }, s)
      .to(rig.body.rotation, { x: 0, z: 0, duration: 0.45 }, s)
      .to(rig.neck.rotation, { x: 0, z: 0, duration: 0.45 }, s)
      .to(rig.root.rotation, { y: 0, duration: 1.1, ease: "power3.inOut" }, s + 0.15)
      .to(rig.root.position, { z: 0.35, duration: 1.1, ease: "power3.inOut" }, s + 0.15)
      .to(rig.body.position, { y: "+=0.07", duration: 0.22, ease: "power2.out", yoyo: true, repeat: 1 }, s + 1.15)
      // wave with the right hand
      .to(rig.armR.rotation, { z: 2.5, x: -0.2, duration: 0.45, ease: "back.out(2)" }, s + 1.3)
      .to(rig.foreR.rotation, { x: 0, z: 0.45, duration: 0.18, ease: "sine.inOut", yoyo: true, repeat: 5 }, s + 1.55)
      .to(rig.mouth.scale, { x: 1.25, y: 1.35, duration: 0.3, ease: "back.out(3)" }, s + 1.3)
      .call(() => { rig.eyes[0].visible = false; rig.winkL.visible = true; }, [], s + 1.7)
      .call(() => { rig.eyes[0].visible = true; rig.winkL.visible = false; }, [], s + 2.1)
      .to(rig.armR.rotation, { z: 0.12, x: -0.35, duration: 0.6, ease: "power2.inOut" }, s + 2.7)
      .to(rig.foreR.rotation, { x: -0.9, z: 0, duration: 0.6, ease: "power2.inOut" }, s + 2.7);
  };

  /* ---------- hit testing ---------- */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const isOverCharacter = (e: PointerEvent | MouseEvent) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray.intersectObjects(rig.hitTargets, false).length > 0;
  };
  const click = (e?: PointerEvent | MouseEvent) => {
    if (e && !isOverCharacter(e)) return false;
    if (mode === "turning" || mode === "facing") return false;
    turnAround();
    return true;
  };

  let lastMove = 0;
  let hovering = false;
  const onMove = (e: PointerEvent) => {
    const now = performance.now();
    const r = canvas.getBoundingClientRect();
    look.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    look.y = ((e.clientY - r.top) / r.height) * 2 - 1;
    if (now - lastMove < 100) return;
    lastMove = now;
    const over = mode !== "turning" && mode !== "facing" && isOverCharacter(e);
    canvas.style.cursor = over ? "pointer" : "";
    if (over !== hovering) {
      hovering = over;
      opts.onHoverChange?.(over, e);
    }
  };
  const onLeave = (e: PointerEvent) => {
    canvas.style.cursor = "";
    if (hovering) { hovering = false; opts.onHoverChange?.(false, e); }
  };
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerleave", onLeave);

  /* ---------- sizing ---------- */
  const resize = () => {
    const w = host.clientWidth || window.innerWidth;
    const h = host.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // keep the character the same visual size on tall screens by pulling the camera back
    const portrait = camera.aspect < 1;
    camera.fov = portrait ? 48 : 35;
    const dist = portrait ? 4.0 : 3.55;
    camera.position.set(0, portrait ? 1.6 : 1.58, dist);
    camera.lookAt(lookAt.x, portrait ? 1.3 : lookAt.y, lookAt.z);
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(host);

  /* ---------- loop ---------- */
  const clock = new THREE.Clock();
  let raf = 0;
  let blinkAt = 2.5;
  let firstFrame = true;
  const zBase = new THREE.Vector3();

  const tick = () => {
    raf = requestAnimationFrame(tick);
    const t = clock.getElapsedTime();

    // ambient life
    flags.forEach((f) => (f.rotation.x = Math.sin(t * 2 + f.userData.phase) * 0.25));
    leaves.forEach((l) => (l.rotation.y = Math.sin(t * 0.6 + l.userData.phase) * 0.06));
    shelfPlants.forEach((p, i) => (p.rotation.y = Math.sin(t * 0.5 + i) * 0.05));
    if (!night) patch.material.opacity = 0.5 + Math.sin(t * 0.4) * 0.06;
    speakers.forEach((s, i) => (s.scale.setScalar(mode === "rhythm" ? 1 + Math.abs(Math.sin(t * 9.8 + i)) * 0.03 : 1)));

    // breathing
    rig.chest.scale.set(1, 1 + Math.sin(t * 2.2) * 0.012, 1);

    if (mode === "typing") {
      rig.foreL.rotation.x = typingPose.foreX + Math.max(0, Math.sin(t * 15)) * 0.12;
      rig.foreR.rotation.x = typingPose.foreX + Math.max(0, Math.sin(t * 15 + Math.PI * 0.8)) * 0.12;
      rig.neck.rotation.y = Math.sin(t * 0.7) * 0.08;
      rig.neck.rotation.x = 0.12 + Math.sin(t * 1.3) * 0.02;
      if (performance.now() - lastIdleSwitch > IDLE_SWITCH_MS) (Math.random() < 0.5 ? playRhythm : playStretch)();
    } else if (mode === "sleeping") {
      rig.chest.scale.y = 1 + Math.sin(t * 1.2) * 0.03;
      rig.head.getWorldPosition(zBase);
      zs.forEach((z) => {
        const p = (t * 0.25 + z.userData.phase) % 1;
        z.position.set(zBase.x + 0.3 + p * 0.35, zBase.y + 0.3 + p * 0.6, zBase.z + 0.1);
        z.material.opacity = Math.sin(p * Math.PI);
      });
    } else if (mode === "facing") {
      // follow the cursor a little and blink
      rig.neck.rotation.y += (look.x * 0.35 - rig.neck.rotation.y) * 0.08;
      rig.neck.rotation.x += (look.y * 0.18 - rig.neck.rotation.x) * 0.08;
      if (t > blinkAt) {
        setEyesClosed(rig, true);
        setTimeout(() => mode === "facing" && setEyesClosed(rig, false), 120);
        blinkAt = t + 2.5 + Math.random() * 2.5;
      }
    }

    renderer.render(scene, camera);
    if (firstFrame) { firstFrame = false; opts.onReady?.(); }
  };
  tick();

  const onVis = () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else { cancelAnimationFrame(raf); tick(); }
  };
  document.addEventListener("visibilitychange", onVis);

  return {
    canvas,
    click,
    turnAround,
    isOverCharacter,
    destroy() {
      cancelAnimationFrame(raf);
      idleTl?.kill();
      turnTl?.kill();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
      });
      renderer.dispose();
      canvas.remove();
    },
  };
}

