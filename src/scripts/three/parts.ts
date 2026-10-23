import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

/* Palette for the clay-toy look. Soft, slightly desaturated, warm. */
export const PAL = {
  skin: 0xf6d2bb,
  skinShade: 0xeab79e,
  blush: 0xf59a8a,
  hair: 0x1f1c1a,
  hoodie: 0x2e3442,
  hoodieDark: 0x252a36,
  pants: 0x1d1f25,
  shoe: 0xf2f0ea,
  eye: 0x231c17,
  white: 0xffffff,
  orange: 0xfea831,
  wood: 0xc98d5b,
  woodDark: 0xa86f43,
  wall: 0x76b0b4,
  wallSide: 0x6aa3a7,
  floor: 0xd9a676,
  drawer: 0xf3efe7,
  metal: 0x2b2b2b,
  leaf: 0x5fae4a,
  leafLight: 0x8cc85a,
  pot: 0xf2efe8,
  chair: 0xd7b48a,
};

const matCache = new Map<string, THREE.Material>();
export const mat = (color: number, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) => {
  const key = color + JSON.stringify(opts);
  let m = matCache.get(key) as THREE.MeshStandardMaterial | undefined;
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0, ...opts });
    matCache.set(key, m);
  }
  return m;
};

export const mesh = (geo: THREE.BufferGeometry, m: THREE.Material, shadow = true) => {
  const o = new THREE.Mesh(geo, m);
  o.castShadow = shadow;
  o.receiveShadow = true;
  return o;
};

export const rbox = (w: number, h: number, d: number, r = 0.03, color = 0xffffff, opts = {}) =>
  mesh(new RoundedBoxGeometry(w, h, d, 4, Math.min(r, Math.min(w, h, d) / 2 - 0.0001)), mat(color, opts));

export const sphere = (r: number, color: number, opts = {}, seg = 40) =>
  mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * 0.75)), mat(color, opts));

export const capsule = (r: number, len: number, color: number, opts = {}) =>
  mesh(new THREE.CapsuleGeometry(r, len, 8, 20), mat(color, opts));

export const cyl = (rt: number, rb: number, h: number, color: number, opts = {}, seg = 32) =>
  mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(color, opts));

/* ------------------------------------------------------------------
   Chibi character. Built facing +Z (towards the camera); the room scene
   rotates the whole rig 180° so we see his back while he types.
   ------------------------------------------------------------------ */
export type Rig = {
  root: THREE.Group; // swivel (chair + body)
  body: THREE.Group; // hips pivot, leans
  chest: THREE.Group;
  neck: THREE.Group; // head pivot
  head: THREE.Group;
  armL: THREE.Group; // shoulder pivots
  armR: THREE.Group;
  foreL: THREE.Group; // elbow pivots
  foreR: THREE.Group;
  eyes: THREE.Object3D[];
  lids: THREE.Object3D[];
  mouth: THREE.Mesh;
  winkL: THREE.Object3D;
  chair: THREE.Group;
  hitTargets: THREE.Object3D[];
};

const armGeo = (len: number) => new THREE.CapsuleGeometry(0.075, len, 6, 16);

export function createCharacter({ withChair = true } = {}): Rig {
  const root = new THREE.Group();
  const hitTargets: THREE.Object3D[] = [];

  /* chair */
  const chair = new THREE.Group();
  if (withChair) {
    const seat = rbox(0.62, 0.08, 0.56, 0.035, PAL.chair, { roughness: 0.7 });
    seat.position.set(0, 0.5, 0);
    const back = rbox(0.52, 0.26, 0.06, 0.03, PAL.chair, { roughness: 0.7 });
    back.position.set(0, 0.8, -0.3);
    back.rotation.x = -0.08;
    chair.add(seat, back);
    const legMat = mat(PAL.metal, { roughness: 0.4, metalness: 0.3 });
    for (const [x, z] of [[-0.25, -0.22], [0.25, -0.22], [-0.25, 0.22], [0.25, 0.22]]) {
      const leg = mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.5, 12), legMat);
      leg.position.set(x, 0.25, z);
      chair.add(leg);
    }
    for (const x of [-0.24, 0.24]) {
      const post = mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.3, 12), legMat);
      post.position.set(x * 0.85, 0.66, -0.3);
      chair.add(post);
    }
    root.add(chair);
  }

  /* body */
  const body = new THREE.Group();
  body.position.set(0, 0.56, 0.02);
  root.add(body);

  const hips = rbox(0.5, 0.2, 0.42, 0.1, PAL.pants);
  hips.position.set(0, 0.06, 0);
  body.add(hips);

  // thighs + shins (seated)
  for (const s of [-1, 1]) {
    const thigh = capsule(0.1, 0.26, PAL.pants);
    thigh.rotation.x = Math.PI / 2;
    thigh.position.set(0.12 * s, 0.06, 0.24);
    const shin = capsule(0.09, 0.3, PAL.pants);
    shin.position.set(0.12 * s, -0.2, 0.42);
    const shoe = rbox(0.17, 0.11, 0.27, 0.05, PAL.shoe, { roughness: 0.5 });
    shoe.position.set(0.12 * s, -0.43, 0.48);
    body.add(thigh, shin, shoe);
  }

  const chest = new THREE.Group();
  chest.position.set(0, 0.14, 0);
  body.add(chest);

  const torso = mesh(new THREE.CapsuleGeometry(0.27, 0.22, 10, 28), mat(PAL.hoodie, { roughness: 0.85 }));
  torso.scale.set(1.08, 1, 0.82);
  torso.position.set(0, 0.24, 0);
  chest.add(torso);
  hitTargets.push(torso, hips);

  // ribbed collar
  const collar = mesh(new THREE.TorusGeometry(0.15, 0.045, 12, 32), mat(PAL.hoodieDark, { roughness: 0.9 }));
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 0.52, 0);
  chest.add(collar);
  // hem
  const hem = mesh(new THREE.TorusGeometry(0.27, 0.035, 10, 40), mat(PAL.hoodieDark, { roughness: 0.9 }));
  hem.rotation.x = Math.PI / 2;
  hem.scale.set(1.08, 0.82, 1);
  hem.position.set(0, 0.02, 0);
  chest.add(hem);

  /* arms: shoulder pivot -> upper arm -> elbow pivot -> forearm + hand */
  const makeArm = (s: number) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(0.3 * s, 0.42, 0);
    const upper = mesh(armGeo(0.14), mat(PAL.hoodie, { roughness: 0.85 }));
    upper.position.y = -0.11;
    shoulder.add(upper);
    const elbow = new THREE.Group();
    elbow.position.y = -0.24;
    shoulder.add(elbow);
    const fore = mesh(armGeo(0.12), mat(PAL.hoodie, { roughness: 0.85 }));
    fore.position.y = -0.1;
    const cuff = cyl(0.08, 0.08, 0.05, PAL.hoodieDark, { roughness: 0.9 });
    cuff.position.y = -0.2;
    const hand = sphere(0.075, PAL.skin, { roughness: 0.55 });
    hand.scale.set(1, 1.1, 0.85);
    hand.position.y = -0.27;
    const thumb = sphere(0.03, PAL.skin, { roughness: 0.55 });
    thumb.position.set(-0.06 * s, -0.24, 0.02);
    elbow.add(fore, cuff, hand, thumb);
    chest.add(shoulder);
    hitTargets.push(upper, fore, hand);
    return { shoulder, elbow };
  };
  const L = makeArm(-1);
  const R = makeArm(1);

  /* head */
  const neck = new THREE.Group();
  neck.position.set(0, 0.56, 0);
  chest.add(neck);
  const head = new THREE.Group();
  head.position.set(0, 0.36, 0);
  neck.add(head);

  const skull = sphere(0.4, PAL.skin, { roughness: 0.5 }, 64);
  skull.scale.set(1.08, 0.98, 1);
  head.add(skull);
  hitTargets.push(skull);

  const cheekMat = mat(PAL.blush, { roughness: 0.9, transparent: true, opacity: 0.55 });
  for (const s of [-1, 1]) {
    const ear = sphere(0.09, PAL.skin, { roughness: 0.5 });
    ear.scale.set(0.6, 1, 0.8);
    ear.position.set(0.43 * s, -0.02, -0.02);
    head.add(ear);
    const blush = mesh(new THREE.CircleGeometry(0.06, 24), cheekMat, false);
    blush.position.set(0.24 * s, -0.12, 0.335);
    blush.rotation.y = 0.55 * s;
    blush.scale.set(1.2, 0.8, 1);
    head.add(blush);
  }

  // hair: a hemisphere tilted back (high hairline in front, covers the nape behind),
  // plus soft rounded tufts and a side-swept fringe. Matte so it doesn't read as a helmet.
  const hairMat = mat(PAL.hair, { roughness: 0.78 });
  const cap = mesh(new THREE.SphereGeometry(0.43, 64, 32, 0, Math.PI * 2, 0, Math.PI * 0.5), hairMat);
  cap.scale.set(1.1, 1.06, 1.06);
  cap.rotation.x = -0.42;
  cap.position.set(0, 0.02, -0.01);
  head.add(cap);
  const nape = mesh(new THREE.SphereGeometry(0.432, 48, 24, Math.PI * 0.12, Math.PI * 0.76, Math.PI * 0.4, Math.PI * 0.5), hairMat);
  nape.rotation.y = Math.PI;
  nape.scale.set(1.09, 1, 1.06);
  head.add(nape);
  const tufts: [number, number, number, number, number, number][] = [
    // x, y, z, size, rotZ, rotX
    [0.1, 0.4, 0.06, 0.17, -0.5, 0.2],
    [-0.14, 0.4, 0.0, 0.16, 0.5, 0.1],
    [0.0, 0.37, -0.2, 0.17, 0, -0.5],
    [0.24, 0.3, 0.16, 0.13, -0.9, 0.4],
    [-0.27, 0.28, 0.12, 0.12, 0.9, 0.3],
  ];
  for (const [x, y, z, s, rz, rx] of tufts) {
    const t = sphere(s, PAL.hair, { roughness: 0.78 }, 24);
    t.scale.set(1.25, 0.55, 1);
    t.position.set(x, y, z);
    t.rotation.set(rx, 0, rz);
    head.add(t);
  }
  // a few locks at the back so the head reads as hair, not a helmet, from behind
  for (const [x, y, s, rz] of [[0.0, 0.12, 0.15, 0], [0.2, 0.05, 0.12, -0.6], [-0.2, 0.05, 0.12, 0.6], [0.0, -0.1, 0.13, 0]] as const) {
    const lock = sphere(s, PAL.hair, { roughness: 0.78 }, 20);
    lock.scale.set(1.3, 0.7, 0.55);
    lock.position.set(x, y, -0.4);
    lock.rotation.set(-0.3, 0, rz);
    head.add(lock);
  }
  // side-swept fringe over the forehead
  for (const [x, y, s, rz] of [[0.16, 0.25, 0.12, -0.5], [0.02, 0.27, 0.11, -0.35], [-0.12, 0.26, 0.09, -0.2]] as const) {
    const f = sphere(s, PAL.hair, { roughness: 0.78 }, 20);
    f.scale.set(1.5, 0.55, 0.7);
    f.position.set(x, y, 0.3);
    f.rotation.set(0.5, 0, rz);
    head.add(f);
  }

  // face
  const eyes: THREE.Object3D[] = [];
  const lids: THREE.Object3D[] = [];
  let winkL: THREE.Object3D = new THREE.Object3D();
  for (const s of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.set(0.14 * s, 0.01, 0.36);
    const ball = sphere(0.064, PAL.eye, { roughness: 0.25 }, 24);
    ball.scale.set(0.9, 1.15, 0.5);
    const glint = sphere(0.018, PAL.white, { roughness: 0.1, emissive: 0xffffff, emissiveIntensity: 0.6 }, 12);
    glint.position.set(0.02, 0.03, 0.025);
    eye.add(ball, glint);
    head.add(eye);
    eyes.push(eye);
    // closed-eye arc used for blinking and sleeping
    const lid = mesh(new THREE.TorusGeometry(0.05, 0.012, 8, 20, Math.PI), mat(PAL.eye), false);
    lid.position.set(0.14 * s, -0.02, 0.385);
    lid.rotation.z = Math.PI;
    lid.visible = false;
    head.add(lid);
    lids.push(lid);
    if (s === -1) winkL = lid;
    const brow = rbox(0.1, 0.022, 0.02, 0.01, PAL.hair);
    brow.position.set(0.14 * s, 0.13, 0.36);
    brow.rotation.z = -0.08 * s;
    head.add(brow);
  }
  const mouth = mesh(new THREE.TorusGeometry(0.036, 0.01, 8, 24, Math.PI), mat(0x8a3b2e), false);
  mouth.position.set(0, -0.14, 0.372);
  mouth.rotation.z = Math.PI;
  head.add(mouth);
  const nose = sphere(0.022, PAL.skinShade, { roughness: 0.5 }, 16);
  nose.position.set(0, -0.07, 0.39);
  head.add(nose);

  return {
    root, body, chest, neck, head,
    armL: L.shoulder, armR: R.shoulder, foreL: L.elbow, foreR: R.elbow,
    eyes, lids, mouth, winkL, chair, hitTargets,
  };
}

/* Neutral pose helpers */
export function poseTyping(r: Rig) {
  for (const [sh, el, s] of [[r.armL, r.foreL, -1], [r.armR, r.foreR, 1]] as const) {
    sh.rotation.set(-0.95, 0, -0.18 * s);
    el.rotation.set(-0.85, 0, 0.1 * s);
  }
  r.neck.rotation.set(0.12, 0, 0);
  r.body.rotation.set(0.06, 0, 0);
}
export function poseRest(r: Rig) {
  for (const [sh, el, s] of [[r.armL, r.foreL, -1], [r.armR, r.foreR, 1]] as const) {
    sh.rotation.set(-0.35, 0, 0.12 * s);
    el.rotation.set(-0.9, 0, 0);
  }
  r.neck.rotation.set(0, 0, 0);
  r.body.rotation.set(0, 0, 0);
}

export function setEyesClosed(r: Rig, closed: boolean) {
  r.eyes.forEach((e) => (e.visible = !closed));
  r.lids.forEach((l) => (l.visible = closed));
}

/* Soft studio environment so the plastic/clay materials pick up gentle reflections. */
export async function studioEnv(renderer: THREE.WebGLRenderer) {
  const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
  const pmrem = new THREE.PMREMGenerator(renderer);
  const tex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  return tex;
}

export function makeRenderer(alpha = false) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  return renderer;
}
