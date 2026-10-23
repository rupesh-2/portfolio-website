import * as THREE from "three";
import { PAL, mat, mesh, rbox, sphere, cyl, createCharacter, setEyesClosed, studioEnv, makeRenderer, type Rig } from "./parts";

/*
  One offscreen WebGL renderer draws whichever icon is visible into that slide's
  2D canvas. Only the active slide renders, so seven icons cost one GPU context.
*/

type Model = { group: THREE.Group; update: (t: number) => void };

function bust(waving: boolean): Model {
  const rig: Rig = createCharacter({ withChair: false });
  const g = new THREE.Group();
  rig.root.position.set(0, -1.15, 0);
  g.add(rig.root);
  for (const [sh, el, s] of [[rig.armL, rig.foreL, -1], [rig.armR, rig.foreR, 1]] as const) {
    sh.rotation.set(-0.3, 0, 0.12 * s);
    el.rotation.set(-0.8, 0, 0);
  }
  rig.mouth.scale.set(1.25, 1.35, 1);
  let winkT = 0;
  return {
    group: g,
    update(t) {
      g.rotation.y = Math.sin(t * 0.8) * 0.25;
      rig.neck.rotation.z = Math.sin(t * 1.6) * 0.06;
      if (waving) {
        rig.armR.rotation.set(-0.15, 0, 2.5);
        rig.foreR.rotation.set(0, 0, Math.sin(t * 7) * 0.45);
      } else {
        // wink every few seconds, like the reference's about icon
        const phase = t % 3.2;
        const wink = phase > 2.6 && phase < 2.95;
        if (wink !== (winkT === 1)) {
          winkT = wink ? 1 : 0;
          rig.eyes[0].visible = !wink;
          rig.winkL.visible = wink;
        }
      }
      if (waving && Math.floor(t * 0.5) % 4 === 3) setEyesClosed(rig, (t * 4) % 1 < 0.12);
      else if (waving) setEyesClosed(rig, false);
    },
  };
}

function easel(): Model {
  const g = new THREE.Group();
  const legMat = mat(PAL.woodDark, { roughness: 0.6 });
  for (const [x, rz] of [[-0.42, -0.18], [0.42, 0.18]] as const) {
    const leg = mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.0, 10), legMat);
    leg.position.set(x, -0.15, 0);
    leg.rotation.z = rz;
    g.add(leg);
  }
  const back = mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.9, 10), legMat);
  back.position.set(0, -0.2, -0.35);
  back.rotation.x = -0.35;
  g.add(back);
  const ledge = rbox(1.2, 0.06, 0.16, 0.02, PAL.wood);
  ledge.position.set(0, -0.45, 0.1);
  g.add(ledge);
  const canvasBoard = rbox(1.15, 0.9, 0.06, 0.02, 0xf7f5f1);
  canvasBoard.position.set(0, 0.05, 0.12);
  g.add(canvasBoard);
  const sunDisc = mesh(new THREE.CircleGeometry(0.17, 32), mat(PAL.orange, { roughness: 0.8 }));
  sunDisc.position.set(0.22, 0.2, 0.16);
  g.add(sunDisc);
  const hill = mesh(new THREE.CircleGeometry(0.5, 32, 0, Math.PI), mat(0x4c7fa8, { roughness: 0.8 }));
  hill.position.set(-0.12, -0.36, 0.155);
  hill.scale.set(1, 0.8, 1);
  g.add(hill);
  // price tag hanging off the corner
  const tag = new THREE.Group();
  const card = rbox(0.34, 0.2, 0.02, 0.03, PAL.orange);
  const hole = mesh(new THREE.TorusGeometry(0.025, 0.008, 8, 16), mat(0xffffff));
  hole.position.set(-0.12, 0, 0.012);
  tag.add(card, hole);
  tag.position.set(0.62, -0.25, 0.25);
  g.add(tag);
  // sparkle (AI) stars
  const stars: THREE.Mesh[] = [];
  for (const [x, y, s] of [[-0.62, 0.62, 1], [0.7, 0.55, 0.7]] as const) {
    const st = mesh(new THREE.OctahedronGeometry(0.1 * s, 0), mat(0xfff1c9, { emissive: 0xfea831, emissiveIntensity: 0.4 }));
    st.scale.set(0.5, 1, 0.5);
    st.position.set(x, y, 0.2);
    g.add(st);
    stars.push(st);
  }
  return {
    group: g,
    update(t) {
      g.rotation.y = Math.sin(t * 0.7) * 0.35;
      tag.rotation.z = Math.sin(t * 2) * 0.2;
      stars.forEach((s, i) => { s.rotation.y = t * 2 + i; s.scale.setScalar(0.9 + Math.sin(t * 3 + i) * 0.2); });
    },
  };
}

function planet(): Model {
  const g = new THREE.Group();
  const core = sphere(0.58, 0x7a6be0, { roughness: 0.35 }, 64);
  const band = mesh(new THREE.SphereGeometry(0.585, 64, 8, 0, Math.PI * 2, Math.PI * 0.42, Math.PI * 0.16), mat(0xb8acff, { roughness: 0.35 }));
  const ring = mesh(new THREE.TorusGeometry(0.92, 0.05, 16, 80), mat(PAL.orange, { roughness: 0.3 }));
  ring.rotation.x = Math.PI / 2.4;
  const tilt = new THREE.Group();
  tilt.add(core, band, ring);
  tilt.rotation.z = 0.35;
  g.add(tilt);
  const orbiters: THREE.Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    const s = sphere(0.05 + (i % 2) * 0.03, i % 2 ? 0xfff1c9 : 0xffffff, { emissive: 0xfff1c9, emissiveIntensity: 0.6 }, 16);
    s.userData = { r: 0.95 + i * 0.07, sp: 0.6 + i * 0.15, ph: i * 1.3 };
    g.add(s);
    orbiters.push(s);
  }
  return {
    group: g,
    update(t) {
      tilt.rotation.y = t * 0.5;
      orbiters.forEach((o) => {
        const { r, sp, ph } = o.userData;
        o.position.set(Math.cos(t * sp + ph) * r, Math.sin(t * sp * 1.3 + ph) * 0.5, Math.sin(t * sp + ph) * r * 0.6);
      });
    },
  };
}

function tv(): Model {
  const g = new THREE.Group();
  const body = rbox(1.5, 1.0, 0.16, 0.07, 0x3c3728, { roughness: 0.4 });
  g.add(body);
  const screen = rbox(1.36, 0.86, 0.02, 0.04, 0xf7f5f1, { roughness: 0.3 });
  screen.position.z = 0.08;
  g.add(screen);
  const tiles: THREE.Mesh[] = [];
  const cols = [PAL.orange, 0x5fae4a, 0x4c9be8, 0xd96f4c, 0xf2c14e, 0x8a7be0];
  for (let i = 0; i < 6; i++) {
    const tile = rbox(0.36, 0.3, 0.03, 0.04, cols[i]);
    tile.position.set(-0.43 + (i % 3) * 0.43, 0.18 - Math.floor(i / 3) * 0.37, 0.1);
    g.add(tile);
    tiles.push(tile);
  }
  for (const s of [-1, 1]) {
    const leg = rbox(0.06, 0.4, 0.06, 0.02, 0x3c3728);
    leg.position.set(0.5 * s, -0.62, 0);
    leg.rotation.z = 0.2 * s;
    g.add(leg);
  }
  return {
    group: g,
    update(t) {
      g.rotation.y = Math.sin(t * 0.7) * 0.4;
      tiles.forEach((tl, i) => (tl.position.z = 0.1 + Math.max(0, Math.sin(t * 3 - i * 0.8)) * 0.06));
    },
  };
}

function temple(): Model {
  // a tiered Newari-style pagoda, a nod to the municipal work in Nepal
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const step = rbox(1.5 - i * 0.18, 0.1, 1.5 - i * 0.18, 0.02, 0xe8dccb);
    step.position.y = -0.85 + i * 0.1;
    g.add(step);
  }
  const roofMat = mat(0x9c4a2f, { roughness: 0.55 });
  const wallMat = mat(0xc4673f, { roughness: 0.7 });
  const tiers = [
    { w: 0.8, h: 0.42, y: -0.42, roof: 1.25 },
    { w: 0.62, h: 0.28, y: 0.08, roof: 1.0 },
    { w: 0.46, h: 0.22, y: 0.46, roof: 0.76 },
  ];
  tiers.forEach((t) => {
    const wall = mesh(new THREE.BoxGeometry(t.w, t.h, t.w), wallMat);
    wall.position.y = t.y;
    g.add(wall);
    const door = rbox(t.w * 0.3, t.h * 0.6, 0.02, 0.01, 0x5a2e1c);
    door.position.set(0, t.y - t.h * 0.15, t.w / 2 + 0.01);
    g.add(door);
    const roof = mesh(new THREE.ConeGeometry(t.roof * 0.72, 0.3, 4, 1), roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = t.y + t.h / 2 + 0.13;
    g.add(roof);
  });
  const finial = cyl(0.02, 0.07, 0.28, 0xf2c14e, { metalness: 0.6, roughness: 0.25 });
  finial.position.y = 0.92;
  const knob = sphere(0.06, 0xf2c14e, { metalness: 0.6, roughness: 0.25 }, 16);
  knob.position.y = 1.08;
  g.add(finial, knob);
  return { group: g, update(t) { g.rotation.y = t * 0.45; } };
}

function projector(): Model {
  const g = new THREE.Group();
  const box = rbox(0.9, 0.42, 0.75, 0.1, 0xf7f5f1, { roughness: 0.4 });
  box.position.set(-0.25, -0.3, 0);
  g.add(box);
  const lens = cyl(0.16, 0.18, 0.14, 0x3c3728, { roughness: 0.3 });
  lens.rotation.z = Math.PI / 2;
  lens.position.set(0.25, -0.3, 0.15);
  g.add(lens);
  const glass = sphere(0.12, 0x9fd3ff, { emissive: 0x9fd3ff, emissiveIntensity: 0.8, roughness: 0.1 }, 20);
  glass.scale.x = 0.3;
  glass.position.set(0.32, -0.3, 0.15);
  g.add(glass);
  const beam = new THREE.Mesh(
    new THREE.ConeGeometry(0.5, 1.0, 32, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xfff1c9, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide }),
  );
  beam.rotation.z = Math.PI / 2;
  beam.position.set(0.82, -0.08, 0.15);
  g.add(beam);
  const wave = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const arc = mesh(new THREE.TorusGeometry(0.12 + i * 0.1, 0.022, 8, 24, Math.PI / 2), mat(PAL.orange));
    arc.rotation.z = Math.PI / 4;
    arc.position.y = 0;
    wave.add(arc);
  }
  wave.position.set(-0.25, 0.05, 0);
  g.add(wave);
  return {
    group: g,
    update(t) {
      g.rotation.y = -0.5 + Math.sin(t * 0.7) * 0.3;
      wave.children.forEach((a, i) => ((a as THREE.Mesh).visible = Math.floor(t * 3) % 4 > i));
      (beam.material as THREE.MeshBasicMaterial).opacity = 0.22 + Math.sin(t * 6) * 0.04;
    },
  };
}

const builders: Record<string, () => Model> = {
  me: () => bust(false),
  wave: () => bust(true),
  frame: easel,
  planet,
  tv,
  temple,
  projector,
};

export type IconStage = {
  setActive: (host: HTMLElement | null) => void;
  destroy: () => void;
};

export async function createIconStage(hosts: HTMLElement[]): Promise<IconStage> {
  const renderer = makeRenderer(true);
  renderer.setClearColor(0x000000, 0);
  const SIZE = 560;
  renderer.setPixelRatio(1);
  renderer.setSize(SIZE, SIZE, false);
  const env = await studioEnv(renderer);

  const entries = hosts.map((host) => {
    const kind = host.dataset.icon || "me";
    const scene = new THREE.Scene();
    scene.environment = env;
    scene.environmentIntensity = 0.7;
    scene.add(new THREE.HemisphereLight(0xfff6e8, 0xd9c2a0, 1.2));
    const key = new THREE.DirectionalLight(0xfff0d6, 2.2);
    key.position.set(2, 3, 4);
    scene.add(key);
    const model = (builders[kind] || builders.me)();
    scene.add(model.group);
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
    // the bust icons frame the head closely, like a profile photo
    const framing: Record<string, [number, number, number]> = { me: [2.3, 0.5, 0.42], wave: [3.3, 0.35, 0.15] };
    const [dist, camY, lookY] = framing[kind] || [4.3, 0.1, 0];
    camera.position.set(0, camY, dist);
    camera.lookAt(0, lookY, 0);
    const cv = host.querySelector("canvas")!;
    cv.width = SIZE;
    cv.height = SIZE;
    const ctx = cv.getContext("2d")!;
    return { host, scene, camera, model, ctx };
  });

  let active: (typeof entries)[number] | null = null;
  let raf = 0;
  const clock = new THREE.Clock();

  const draw = (e: (typeof entries)[number]) => {
    e.model.update(clock.getElapsedTime());
    renderer.render(e.scene, e.camera);
    e.ctx.clearRect(0, 0, SIZE, SIZE);
    e.ctx.drawImage(renderer.domElement, 0, 0);
  };
  // paint every icon once so none is ever blank
  entries.forEach(draw);

  const loop = () => {
    raf = requestAnimationFrame(loop);
    if (active && !document.hidden) draw(active);
  };
  loop();

  return {
    setActive(host) {
      active = entries.find((e) => e.host === host) || null;
    },
    destroy() {
      cancelAnimationFrame(raf);
      entries.forEach((e) => e.scene.traverse((o) => (o as THREE.Mesh).geometry?.dispose?.()));
      env.dispose();
      renderer.dispose();
    },
  };
}
