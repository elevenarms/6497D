import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { PARTS, STAGES, SIDE, ARBORS, RUBY_MESHES, HAIRSPRING_MESH, MAINSPRING_MESH, BARREL_ARBOR_MESH } from './parts.js';

const $ = (id) => document.getElementById(id);
const TAU = Math.PI * 2;
const PAPER = 0xf7f3ea;

// ───────────────────────── Renderer & scene ─────────────────────────
const canvas = $('gl');
const figure = $('figure');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(PAPER);
const pmrem = new THREE.PMREMGenerator(renderer);
const envMap = pmrem.fromScene(new RoomEnvironment(), 0.035).texture;
scene.environment = envMap;

const camera = new THREE.PerspectiveCamera(28, 1, 1, 2000);
const HOME_CAM = new THREE.Vector3(0, 96, 44);
camera.position.copy(HOME_CAM);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 22;
controls.maxDistance = 240;
controls.target.set(0, 0, 0);

scene.add(new THREE.HemisphereLight(0xfff8ec, 0x6b6250, 0.55));
const key = new THREE.DirectionalLight(0xfff4e0, 1.6);
key.position.set(-30, 60, 40);
scene.add(key);
const rim = new THREE.DirectionalLight(0xe8eeff, 0.6);
rim.position.set(40, 20, -50);
scene.add(rim);

// Soft contact shadow, like a photograph on a lightbox
{
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(128, 128, 20, 128, 128, 128);
  grd.addColorStop(0, 'rgba(60,45,25,0.38)'); grd.addColorStop(0.55, 'rgba(60,45,25,0.12)'); grd.addColorStop(1, 'rgba(60,45,25,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(64, 64),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -9;
  scene.add(shadow);
}

// flip: turns the movement over about the 12–6 axis. root: model space (+z = bridge side → world up).
const flip = new THREE.Group();
scene.add(flip);
const root = new THREE.Group();
root.rotation.x = -Math.PI / 2;
flip.add(root);

// ───────────────────────── Materials ─────────────────────────
const MAT = {
  plate: new THREE.MeshStandardMaterial({ color: 0xb98f4a, metalness: 1, roughness: 0.46 }), // frosted brass, warmer and duller than the gilt wheels
  rhodium: new THREE.MeshStandardMaterial({ color: 0xcfd1d4, metalness: 1, roughness: 0.34 }),
  gilt: new THREE.MeshStandardMaterial({ color: 0xe2bb6a, metalness: 1, roughness: 0.27 }),
  brass: new THREE.MeshStandardMaterial({ color: 0xc9a259, metalness: 1, roughness: 0.38 }),
  steel: new THREE.MeshStandardMaterial({ color: 0xc7cbd0, metalness: 1, roughness: 0.17 }),
  darksteel: new THREE.MeshStandardMaterial({ color: 0x80878f, metalness: 1, roughness: 0.32 }),
  blued: new THREE.MeshStandardMaterial({ color: 0x22336e, metalness: 0.8, roughness: 0.3 }),
  ruby: new THREE.MeshPhysicalMaterial({ color: 0x6e0619, metalness: 0.1, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 0.6 }),
  holder: new THREE.MeshStandardMaterial({ color: 0x8d8579, metalness: 0.6, roughness: 0.55 }),
  ghost: new THREE.MeshBasicMaterial({ color: 0x1d1a15, transparent: true, opacity: 0.16, depthWrite: false }),
  edge: new THREE.LineBasicMaterial({ color: 0x1d1a15 }),
};
// Engraving fills: a pale wash of each metal, as if hand-tinted over the line work
const washOf = (hex) => new THREE.MeshLambertMaterial({ color: hex, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
const WASH = {
  plate: washOf(0xe2cc9c), rhodium: washOf(0xe9e8e3), gilt: washOf(0xf1db9f), brass: washOf(0xe6cf98),
  steel: washOf(0xdfe4e8), darksteel: washOf(0xbfc5cb), blued: washOf(0x9aa7c9), ruby: washOf(0xcf8c97),
  holder: washOf(0xd6cfc2),
};
const PART_MAT = {
  mainplate: 'plate', trainbridge: 'rhodium', barrelbridge: 'rhodium', palletbridge: 'rhodium', balancebridge: 'rhodium',
  thirdwheel: 'gilt', secondwheel: 'gilt', centrewheel: 'gilt', minutewheel: 'gilt', hourwheel: 'gilt', barrel: 'brass',
};
function materialFor(part, meshIndex) {
  if (RUBY_MESHES.has(meshIndex)) return 'ruby';
  if (meshIndex === HAIRSPRING_MESH || meshIndex === MAINSPRING_MESH) return 'darksteel';
  if (meshIndex === 50) return 'gilt'; // balance rim (Glucydur, gilt)
  if (meshIndex === BARREL_ARBOR_MESH) return 'steel';
  if (part.id === 'mainplate' && meshIndex >= 63) return 'steel'; // lower Incabloc
  if (part.id === 'balancebridge' && meshIndex !== 51) return 'steel';
  if (part.kind === 'screw') return 'blued';
  return PART_MAT[part.id] || 'steel';
}

// Movement holder (a split ring, open at twelve for the stem)
let holderRing;
{
  const s = new THREE.Shape();
  const gap = 0.2, R = 21.2, r = 18.75;
  s.absarc(0, 0, R, Math.PI / 2 + gap, Math.PI / 2 - gap + TAU, false);
  s.absarc(0, 0, r, Math.PI / 2 - gap + TAU, Math.PI / 2 + gap, true);
  const geo = new THREE.ExtrudeGeometry(s, { depth: 1.5, bevelEnabled: true, bevelThickness: 0.2, bevelSize: 0.2, bevelSegments: 2, curveSegments: 96 });
  const ring = new THREE.Mesh(geo, MAT.holder);
  ring.position.z = -1.85;
  ring.userData.matKey = 'holder';
  root.add(ring);
  holderRing = ring;
}

// ───────────────────────── Loading the movement ─────────────────────────
async function fetchWithProgress(url, onProgress) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  const total = +res.headers.get('content-length') || 3510692;
  const reader = res.body.getReader();
  const chunks = []; let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value); got += value.length; onProgress(got / total);
  }
  const out = new Uint8Array(got); let o = 0;
  for (const c of chunks) { out.set(c, o); o += c.length; }
  return out.buffer;
}

function buildGeometry(meta, buf, m) {
  const [mn, mx] = [meta.bboxMin, meta.bboxMax];
  const q = new Uint16Array(buf, m.pOff, m.v * 3);
  const pos = new Float32Array(m.v * 3);
  for (let k = 0; k < pos.length; k++) { const j = k % 3; pos[k] = mn[j] + (q[k] / 65535) * (mx[j] - mn[j]); }
  const n8 = new Int8Array(buf, m.nOff, m.v * 4);
  const nrm = new Float32Array(m.v * 3);
  for (let k = 0; k < m.v; k++) for (let j = 0; j < 3; j++) nrm[k * 3 + j] = n8[k * 4 + j] / 127;
  const idx = m.i32 ? new Uint32Array(buf, m.iOff, m.iCount) : new Uint16Array(buf, m.iOff, m.iCount);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  g.setIndex(new THREE.BufferAttribute(idx.slice(), 1));
  g.computeBoundingSphere(); g.computeBoundingBox();
  return g;
}

// Layers of the build, counted outward from the plate on each side
const EXPLODE_STEP = 5.5;
const EXPLODE_LAYER = {
  mainplate: 0,
  // dial side: keyless work on the plate, then wheels, jumper, screw, motion work
  settinglever: 1, windingpinion: 1, slidingpinion: 1, stem: 1.2, screwsettinglever: 1,
  yoke: 2, yokespring: 2.6, settingwheel: 2, intsettingwheel: 2, minutewheel: 2,
  jumper: 3.2, screwjumper: 4.2, cannonpinion: 2.4, hourwheel: 3.4,
  // bridge side: wheels on the plate, bridges over the wheels, screws and winding wheels over the bridges
  escapewheel: 1, thirdwheel: 1, secondwheel: 1, centrewheel: 1, barrel: 1, palletfork: 1, balance: 1,
  trainbridge: 2, barrelbridge: 2, palletbridge: 2, balancebridge: 2,
  screwtrain1: 3, screwtrain2: 3, screwbarrel1: 3, screwbarrel2: 3, screwbarrel3: 3,
  screwpallet1: 3, screwpallet2: 3, screwbalance: 3,
  crownring: 2.7, crownwheel: 3.2, click: 3.2, ratchet: 3.2,
  screwcrown: 4.2, screwclick: 4.2, screwratchet: 4.2,
};
const HANDS_LAYER = 4.4;

const allMeshes = [holderRing]; // every visible movement mesh, for raycasting and style changes
const ghostMeshes = [];

function makePart(part, meta, buf) {
  part.bmin = new THREE.Vector3(Infinity, Infinity, Infinity);
  part.bmax = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
  for (const i of part.meshes) {
    const m = meta.meshes[i];
    part.bmin.min(new THREE.Vector3(...m.min)); part.bmax.max(new THREE.Vector3(...m.max));
  }
  const pv = part.id === 'click' ? [...ARBORS.click, 0] : part.pivot || [part.anchor[0], part.anchor[1], 0];
  part.pivotV = new THREE.Vector3(...pv);
  part.approachV = new THREE.Vector3(...part.approach);
  part.lift = part.kind === 'stem' ? 11 : part.kind === 'plate' ? 9 : 5;
  part.offset = new THREE.Vector3();
  // exploded view: each part rises by its layer in the build, so it stays above what it is mounted on
  part.explode = (EXPLODE_LAYER[part.id] ?? 1) * EXPLODE_STEP;

  part.holder = new THREE.Group(); part.holder.visible = false; root.add(part.holder);
  part.spin = new THREE.Group(); part.spin.position.copy(part.pivotV); part.holder.add(part.spin);
  part.ghost = new THREE.Group(); part.ghost.visible = false; root.add(part.ghost);
  const sub = (name) => { const g = new THREE.Group(); g.position.copy(part.pivotV); part.holder.add(g); part[name] = g; return g; };

  for (const i of part.meshes) {
    const geo = buildGeometry(meta, buf, meta.meshes[i]);
    const matKey = materialFor(part, i);
    const mesh = new THREE.Mesh(geo, MAT[matKey]);
    mesh.userData = { part, matKey };
    mesh.position.copy(part.pivotV).negate();
    let parent = part.spin;
    if (i === BARREL_ARBOR_MESH) parent = sub('arborSpin');
    if (i === HAIRSPRING_MESH) parent = sub('hairSpin');
    parent.add(mesh);
    allMeshes.push(mesh);
    const gm = new THREE.Mesh(geo, MAT.ghost);
    gm.renderOrder = 2;
    part.ghost.add(gm); ghostMeshes.push(gm);
  }
}

// Breguet-style blued hands, built in model space on the dial side
const hands = new THREE.Group(); hands.visible = false; root.add(hands);
function makeHand(len, width, pomme, z, at = [0, 0]) {
  const g = new THREE.Group(); g.position.set(at[0], at[1], z);
  const s = new THREE.Shape();
  s.moveTo(-width, -len * 0.18); s.lineTo(width, -len * 0.18);
  s.lineTo(width * 0.55, len * 0.6); s.lineTo(0.04, len); s.lineTo(-0.04, len); s.lineTo(-width * 0.55, len * 0.6);
  s.closePath();
  const ext = { depth: 0.06, bevelEnabled: false };
  const blade = new THREE.Mesh(new THREE.ExtrudeGeometry(s, ext), MAT.blued);
  blade.position.z = -0.03; g.add(blade);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(width * 2.4, width * 2.4, 0.12, 32), MAT.blued);
  hub.rotation.x = Math.PI / 2; g.add(hub);
  if (pomme) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(pomme, pomme * 0.28, 8, 40), MAT.blued);
    ring.position.y = len * 0.66; ring.scale.z = 0.25; g.add(ring);
  }
  hands.add(g);
  return g;
}
const hourHand = makeHand(8.2, 0.42, 1.1, -3.7);
const minuteHand = makeHand(14.2, 0.32, 0.95, -4.25);
const secondsHand = makeHand(3.6, 0.14, 0, -3.15, ARBORS.second);
for (const h of [hourHand, minuteHand, secondsHand]) h.traverse(o => { if (o.isMesh) { o.userData.matKey = 'blued'; allMeshes.push(o); } });

// ───────────────────────── State ─────────────────────────
const byId = Object.fromEntries(PARTS.map(p => [p.id, p]));
PARTS.forEach((p, i) => { p.index = i; });
const state = {
  next: 0, fitted: new Set(), held: null, busy: false, auto: false,
  faults: 0, startedAt: null, finishedAt: null, assisted: false,
  side: SIDE.DIAL, explodeE: 0, showHands: true, sound: true,
};
const complete = () => state.next >= PARTS.length;
const nextPart = () => PARTS[state.next];

// ───────────────────────── Tweens ─────────────────────────
const tweens = new Set();
const ease = {
  inOut: (k) => k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2,
  out: (k) => 1 - Math.pow(1 - k, 3),
  lin: (k) => k,
};
function tween(dur, fn, e = ease.inOut) {
  return new Promise(res => tweens.add({ t: 0, dur: Math.max(dur, 1e-3), fn, e, res }));
}
function stepTweens(dt) {
  for (const t of tweens) {
    t.t += dt;
    const k = Math.min(1, t.t / t.dur);
    t.fn(t.e(k));
    if (k >= 1) { tweens.delete(t); t.res(); }
  }
}
const sleep = (s) => tween(s, () => {});

// ───────────────────────── Turning the movement over ─────────────────────────
let flipAngle = Math.PI; // dial side up at the start
flip.rotation.z = flipAngle;
async function turnTo(side) {
  if (state.side === side && !flipping) return;
  state.side = side;
  const from = flip.rotation.z, to = side === SIDE.DIAL ? Math.PI : 0;
  flipping = true;
  await tween(0.9 / autoPace(), (k) => {
    flip.rotation.z = from + (to - from) * k;
    flip.position.y = Math.sin(k * Math.PI) * 6;
  });
  flipping = false;
  renderLesson();
}
let flipping = false;
const autoPace = () => (state.auto ? state.autoSpeed || 1 : 1);

// ───────────────────────── Pointer → model plane ─────────────────────────
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const pointer = { x: 0, y: 0, inside: false, downX: 0, downY: 0, downT: 0 };
const invRoot = new THREE.Matrix4();
function pointerToModelPlane(z) {
  raycaster.setFromCamera(ndc, camera);
  root.updateWorldMatrix(true, false);
  invRoot.copy(root.matrixWorld).invert();
  const r = raycaster.ray.clone().applyMatrix4(invRoot);
  if (Math.abs(r.direction.z) < 1e-6) return null;
  const t = (z - r.origin.z) / r.direction.z;
  if (t < 0) return null;
  return r.at(t, new THREE.Vector3());
}
function heldPlaneZ(p) {
  const a = p.approachV;
  const zRef = a.z > 0 ? p.bmax.z : a.z < 0 ? p.bmin.z : p.pivotV.z;
  return zRef + a.z * p.lift;
}
const snapRadius = (p) => (p.kind === 'plate' ? 14 : p.kind === 'stem' ? 5 : 2.6);
let nearTarget = false;

function updateHeld() {
  const p = state.held;
  if (!p || p.seating) return;
  const P = pointer.inside ? pointerToModelPlane(heldPlaneZ(p)) : null;
  if (!P) return;
  const dx = P.x - p.anchor[0], dy = P.y - p.anchor[1];
  const d = Math.hypot(dx, dy);
  nearTarget = d < snapRadius(p);
  // a gentle magnetism once the part is close to its place
  const pull = nearTarget ? 0.35 : 1;
  const want = new THREE.Vector3(dx * pull, dy * pull, 0).addScaledVector(p.approachV, p.lift);
  p.offset.lerp(want, 0.45);
  MAT.ghost.color.set(nearTarget ? 0x8c2a1c : 0x1d1a15);
}

// ───────────────────────── Picking and fitting parts ─────────────────────────
function startClock() { if (!state.startedAt) state.startedAt = performance.now(); }

async function pick(p) {
  if (state.busy) return;
  if (state.held === p) { putBack(); return; }
  if (state.held) putBack();
  startClock();
  state.busy = true;
  await turnTo(p.side);
  state.busy = false;
  state.held = p;
  p.holder.visible = true;
  // arrive from outside the figure along the approach direction
  p.offset.copy(p.approachV).multiplyScalar(p.lift + 25);
  p.ghost.visible = true;
  canvas.classList.add('holding');
  notice(p.kind === 'stem'
    ? 'Bring the stem to the pendant at twelve o’clock and click to pass it in. (Enter sets it for you.)'
    : `Bring the ${p.name.toLowerCase()} over its place, shown in shadow, and click to set it down. (Enter sets it for you.)`, 'good');
  renderParts(); renderLesson();
}

function putBack() {
  const p = state.held; if (!p) return;
  p.holder.visible = false; p.ghost.visible = false; p.offset.set(0, 0, 0);
  state.held = null; canvas.classList.remove('holding');
  renderParts();
}

async function seat(p) {
  p.seating = true; state.busy = true;
  const pace = autoPace();
  const start = p.offset.clone();
  const above = p.approachV.clone().multiplyScalar(p.lift * 0.6);
  await tween(0.32 / pace, (k) => p.offset.lerpVectors(start, above, k));
  // screws are driven home: right-hand threads clockwise from the head, the crown wheel screw left-handed
  const turns = p.kind === 'screw' ? 3 : 0;
  const dir = (p.approachV.z > 0 ? -1 : 1) * (p.id === 'screwcrown' ? -1 : 1);
  await tween((p.kind === 'screw' ? 0.75 : 0.45) / pace, (k) => {
    p.offset.copy(above).multiplyScalar(1 - k);
    if (turns) p.spin.rotation.z = dir * (1 - k) * turns * TAU;
  }, ease.out);
  p.offset.set(0, 0, 0); p.spin.rotation.z = 0;
  p.ghost.visible = false; p.seating = false;
  state.held = null; state.busy = false; nearTarget = false;
  canvas.classList.remove('holding');
  state.fitted.add(p.id);
  state.next++;
  if (p.torque && !state.auto) notice(`Tightened to ${p.torque}.`, 'good');
  else if (!state.auto) notice('', 'good');
  renderParts(); renderLesson();
  if (complete()) onComplete();
}

function tryPlace() {
  const p = state.held;
  if (!p || p.seating || state.busy) return;
  if (nearTarget) seat(p);
  else notice(`That is not where the ${p.name.toLowerCase()} goes. Its place is shown in shadow on the figure.`);
}

function choose(p) {
  if (state.auto) { notice('The assembly is proceeding automatically. Pause it first to work by hand.'); return; }
  if (state.busy) return;
  if (state.fitted.has(p.id)) { notice(`The ${p.name.toLowerCase()} is already in place.`, 'good'); return; }
  const n = nextPart();
  if (p !== n && !(p.name === n.name)) {
    state.faults++;
    startClock();
    const btn = document.querySelector(`[data-part="${p.id}"]`);
    btn?.classList.remove('shake'); void btn?.offsetWidth; btn?.classList.add('shake');
    notice(`The ${p.name.toLowerCase()} cannot be fitted yet. The ${n.name.toLowerCase()} (${n.eta}) must go in first.`);
    renderFolio();
    return;
  }
  pick(n);
}

// ───────────────────────── Automatic assembly ─────────────────────────
async function autoAssemble(speed = 1) {
  if (complete()) return;
  state.auto = true; state.autoSpeed = speed; state.assisted = true;
  startClock();
  renderControls();
  notice('The movement is being assembled in the order laid down by the maker.', 'good');
  if (state.held) putBack();
  while (state.auto && !complete()) {
    while (state.busy) await sleep(0.05);
    const p = nextPart();
    await turnTo(p.side);
    if (!state.auto) break;
    state.held = p; p.holder.visible = true; p.ghost.visible = true;
    renderParts(); renderLesson();
    // fly in from beyond the page edge
    const from = new THREE.Vector3(p.anchor[0], p.anchor[1], 0).normalize().multiplyScalar(30)
      .addScaledVector(p.approachV, p.lift + 14);
    if (!isFinite(from.x)) from.set(30, 0, 0).addScaledVector(p.approachV, p.lift + 14);
    const to = p.approachV.clone().multiplyScalar(p.lift);
    await tween(0.5 / state.autoSpeed, (k) => p.offset.lerpVectors(from, to, k));
    await seat(p);
    await sleep(0.12 / state.autoSpeed);
  }
  state.auto = false;
  if (complete()) notice('Assembled in the maker’s order. The movement may now be wound and run.', 'good');
  renderControls(); renderParts();
}

// ───────────────────────── Running the watch ─────────────────────────
const LIFT = 44 * Math.PI / 180;         // lift angle of the balance (ETA)
const FORK = 0.11;                         // fork swing, radians either side
const RESERVE_H = 56;                      // running time when fully wound (ETA, rev. 09)
// gear reductions: escape wheel 12 rpm (15 teeth, 21,600 A/h); 4th wheel 1 rpm; 3rd 1 rev / 7½ min; centre 1 rev/h; barrel 1/8 rev/h
const sim = {
  running: false, reserve: 0, amp: 0, phi: 0, esc: 0, lastEscPos: null, clock: 0, speed: 1,
  arbor: 0, crown: 0, stem: 0, winding: false, setting: false, settingRevs: 0, stemPull: 0, lastSin: 0, clickA: 0,
};
function nowSeconds() { const d = new Date(); return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds() + d.getMilliseconds() / 1000; }

async function wind() {
  if (!complete() || sim.winding) return;
  if (sim.setting) { await setHands(); return; }
  if (sim.reserve > RESERVE_H - 0.5) { notice('The mainspring is fully wound. Do not force the crown.'); return; }
  sim.winding = true; renderControls();
  ensureAudio();
  const r0 = sim.reserve, dur = 0.5 + 2.4 * (RESERVE_H - r0) / RESERVE_H;
  let lastTooth = Math.floor(sim.arbor * 24);
  await tween(dur, (k) => {
    const r = r0 + (RESERVE_H - r0) * k;
    const dr = r - sim.reserve; sim.reserve = r;
    sim.arbor += dr / RESERVE_H * 1.6;
    const tooth = Math.floor(sim.arbor * 24);
    if (tooth !== lastTooth) { lastTooth = tooth; clickSound(); }
  }, ease.inOut);
  sim.winding = false;
  notice('Wound fully: about 56 hours of running.', 'good');
  renderControls();
}

async function setHands() {
  sim.winding = true; renderControls();
  const c0 = sim.clock, s0 = sim.settingRevs;
  await tween(1.2, (k) => { sim.clock = c0 + 1800 * k; sim.settingRevs = s0 + 1.5 * k; });
  sim.winding = false; renderControls();
}

async function toggleStem() {
  if (!complete()) return;
  sim.setting = !sim.setting;
  const from = sim.stemPull, to = sim.setting ? 1 : 0;
  await tween(0.35, (k) => { sim.stemPull = from + (to - from) * k; });
  notice(sim.setting ? 'The crown is in position 2, for hand setting. Turn it to move the hands. The 6497 has no stop-seconds, so the balance runs on.'
    : 'The crown is pushed home to position 1, for running and winding.', 'good');
  renderControls();
}

async function runWatch() {
  if (sim.running) { sim.running = false; renderControls(); notice('The balance has been stopped with a fine brush.', 'good'); return; }
  ensureAudio();
  if (!complete()) {
    await autoAssemble(2.4);
    if (!complete()) return;
  }
  if (state.side !== SIDE.BRIDGE) await turnTo(SIDE.BRIDGE);
  if (sim.reserve < 1) await wind();
  if (!sim.clockSet) { sim.clock = nowSeconds(); sim.clockSet = true; }
  sim.running = true;
  notice('The watch is going. Listen for the beat, which should be even.', 'good');
  renderControls();
}

function simStep(dt) {
  const target = sim.running && sim.reserve > 0 ? (200 + 105 * Math.min(1, sim.reserve / 30)) * Math.PI / 180 : 0;
  sim.amp += (target - sim.amp) * (1 - Math.exp(-dt * (target > sim.amp ? 1.6 : 1.1)));
  if (sim.amp < 0.02 && target === 0) sim.amp = 0;
  if (sim.amp === 0) { sim.lastEscPos = null; return; }

  // the balance always swings at its true 3 Hz on screen; at higher speeds the train is driven continuously
  sim.phi += TAU * 3 * dt;
  const s = Math.sin(sim.phi);
  const theta = sim.amp * s;
  if (Math.sign(s) !== Math.sign(sim.lastSin) && sim.speed === 1 && sim.amp > LIFT / 2) tick(s > 0);
  sim.lastSin = s;
  let dEsc = 0;
  if (sim.speed === 1) {
    const k = Math.round(sim.phi / Math.PI);
    const dir = k % 2 === 0 ? 1 : -1;
    const u = THREE.MathUtils.clamp((theta * dir + LIFT / 2) / LIFT, 0, 1);
    const escPos = (k - 1 + u) / 30; // revolutions: half a tooth (12°) per beat
    if (sim.lastEscPos !== null) dEsc = Math.max(0, escPos - sim.lastEscPos);
    sim.lastEscPos = escPos;
  } else {
    sim.lastEscPos = null;
    if (sim.amp > LIFT / 2) dEsc = 0.2 * dt * sim.speed * Math.min(1, sim.amp / target || 1);
  }
  sim.esc += dEsc;
  sim.clock += dEsc * 5;                 // one escape-wheel turn = 5 seconds
  sim.reserve = Math.max(0, sim.reserve - dEsc * 5 / 3600);
  if (sim.reserve === 0 && sim.running) { sim.running = false; notice('The mainspring has run down and the watch has stopped.'); renderControls(); }
  sim.theta = theta;
}

function applyKinematics() {
  const esc = sim.esc, second = esc / 12, third = second / 7.5, centre = third / 8, barrel = centre / 8;
  const set = (id, a, axis = 'z') => { const p = byId[id]; if (p) p.spin.rotation[axis] = a; };
  set('escapewheel', -esc * TAU);
  set('secondwheel', second * TAU);
  set('thirdwheel', -third * TAU);
  set('centrewheel', centre * TAU);
  set('barrel', -barrel * TAU);
  const theta = sim.theta || 0;
  set('balance', theta);
  byId.balance.hairSpin.rotation.z = theta * 0.18;
  set('palletfork', -FORK * THREE.MathUtils.clamp(theta / (LIFT / 2), -1, 1));
  // winding: arbor and ratchet together, crown wheel the other way, stem and pinions about the stem axis
  byId.barrel.arborSpin.rotation.z = -sim.arbor * TAU;
  set('ratchet', -sim.arbor * TAU);
  set('crownwheel', sim.arbor * 2.2 * TAU);
  const stemA = sim.arbor * 3.6 * TAU + sim.settingRevs * TAU;
  set('stem', stemA, 'y'); set('windingpinion', sim.setting ? 0 : stemA, 'y'); set('slidingpinion', stemA, 'y');
  const tooth = (sim.arbor * 24) % 1;
  set('click', 0.09 * (1 - tooth) * (sim.winding && !sim.setting ? 1 : 0));
  // motion work follows the time shown
  const minA = (sim.clock % 3600) / 3600 * TAU, hrA = (sim.clock % 43200) / 43200 * TAU;
  set('cannonpinion', minA); set('hourwheel', hrA); set('minutewheel', -minA / 3);
  set('settingwheel', sim.settingRevs * 3.1 * TAU); set('intsettingwheel', -sim.settingRevs * 3.1 * TAU);
  minuteHand.rotation.z = minA; hourHand.rotation.z = hrA;
  secondsHand.rotation.z = (sim.clock % 60) / 60 * TAU;
  // keyless positions: stem drawn out, sliding pinion carried inward by the yoke
  byId.stem.holder.position.y += 0.9 * sim.stemPull;
  byId.slidingpinion.holder.position.y -= 0.55 * sim.stemPull;
}

// ───────────────────────── Sound ─────────────────────────
let audio = null, noiseBuf = null;
function ensureAudio() {
  if (audio) { if (audio.state === 'suspended') audio.resume(); return; }
  try {
    audio = new (window.AudioContext || window.webkitAudioContext)();
    noiseBuf = audio.createBuffer(1, audio.sampleRate * 0.03, audio.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audio.sampleRate * 0.0025));
  } catch { audio = null; }
}
const CLICK_LEVEL = 0.4; // ticks and ratchet clicks sit 60% below their original level, under the music
function blip(freq, gain, q = 6) {
  if (!audio || !state.sound) return;
  const src = audio.createBufferSource(); src.buffer = noiseBuf;
  const f = audio.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
  const g = audio.createGain(); g.gain.value = gain * CLICK_LEVEL;
  src.connect(f).connect(g).connect(audio.destination); src.start();
}
const tick = (tock) => blip(tock ? 2900 : 3600, 0.9);
const clickSound = () => blip(5200, 0.35, 3);

// ───────────────────────── UI rendering ─────────────────────────
function notice(text, kind = '') { const n = $('notice'); n.textContent = text; n.className = 'notice ' + kind; }

function renderParts() {
  const ol = $('parts'); ol.innerHTML = '';
  let lastStage = null;
  for (const p of PARTS) {
    if (p.stage !== lastStage) {
      lastStage = p.stage;
      const st = STAGES.find(s => s.id === p.stage);
      const li = document.createElement('li'); li.className = 'stage-row';
      li.textContent = `${st.id}. ${st.title}`; ol.appendChild(li);
    }
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.className = 'part-btn'; b.dataset.part = p.id; b.type = 'button';
    if (state.fitted.has(p.id)) b.classList.add('fitted');
    else if (state.held === p) b.classList.add('held');
    else if (nextPart() === p && !state.auto) b.classList.add('next');
    b.innerHTML = `<span class="p-no">${p.eta}</span><span class="p-name">${p.name}</span><span class="p-mark"></span>`;
    b.addEventListener('click', () => choose(p));
    li.appendChild(b); ol.appendChild(li);
  }
  $('tally').textContent = `${state.fitted.size} of ${PARTS.length} fitted`;
  const cur = ol.querySelector('.held, .next');
  if (cur) { // scroll the list only, never the page
    const top = cur.offsetTop - ol.offsetTop, h = ol.clientHeight;
    if (top < ol.scrollTop || top > ol.scrollTop + h - 30) ol.scrollTo({ top: Math.max(0, top - h / 3), behavior: 'smooth' });
  }
}

let lastStageShown = null;
function renderLesson() {
  const p = nextPart();
  const st = STAGES.find(s => s.id === (p ? p.stage : 'VI'));
  if (complete()) {
    $('stage-numeral').textContent = 'VII';
    $('stage-title').textContent = 'The Movement Going';
    $('stage-sub').textContent = 'Winding, hand setting and running';
    if (lastStageShown !== 'done') $('stage-intro').textContent = 'The movement is now complete. Wound by the crown, the mainspring drives the train through the barrel, and the escapement lets it turn one tooth at a time. The balance swings three times a second, so the movement beats 21,600 times an hour, with a reserve of about fifty-six hours.';
    lastStageShown = 'done';
    $('step-pos').textContent = '✓';
    $('step-name').textContent = 'Wind, set and run';
    $('step-text').textContent = 'Wind the watch with the crown pushed home. Pull the crown out to set the hands. At ×3600 the barrel can be seen to turn and the reserve to fall.';
    $('step-specs').innerHTML = '<dt>Frequency</dt><dd>21,600 A/h (3 Hz)</dd><dt>Lift angle</dt><dd>44°</dd><dt>Mainspring</dt><dd>Nivaflex, M½ max. 21.08 Nmm</dd><dt>Balance</dt><dd>Glucydur gilt, Anachron hairspring</dd>';
  } else {
    $('stage-numeral').textContent = st.id;
    $('stage-title').textContent = st.title;
    $('stage-sub').textContent = st.sub;
    if (lastStageShown !== st.id) $('stage-intro').textContent = st.intro;
    lastStageShown = st.id;
    $('step-pos').textContent = p.eta;
    $('step-name').textContent = p.name;
    $('step-text').textContent = p.text;
    let specs = `<dt>Side</dt><dd>${p.side === SIDE.DIAL ? 'dial side' : 'bridge side'}</dd>`;
    if (p.torque) specs += `<dt>Torque</dt><dd>${p.torque}</dd>`;
    if (p.lube) specs += `<dt>Lubricant</dt><dd>${p.lube}</dd>`;
    $('step-specs').innerHTML = specs;
  }
  renderCaption();
  const stageNo = complete() ? STAGES.length : STAGES.indexOf(st);
  $('plate-no').textContent = ['XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'][stageNo];
}

// Lettered callouts: the parts of the present stage, as in an engraved figure
let callouts = [];
function renderCaption() {
  const done = complete();
  const p = nextPart();
  const stage = done ? null : STAGES.find(s => s.id === p.stage);
  let figNo, text;
  let parts;
  if (done) {
    figNo = 7;
    text = state.side === SIDE.DIAL ? 'The motion work and hands, seen from the dial side.' : 'The completed movement, seen from the back.';
    parts = state.side === SIDE.DIAL
      ? ['minutewheel', 'hourwheel', 'cannonpinion', 'settingwheel', 'stem']
      : ['barrel', 'centrewheel', 'thirdwheel', 'secondwheel', 'escapewheel', 'palletfork', 'balance'];
  } else {
    figNo = STAGES.indexOf(stage) + 1;
    text = stage.fig;
    parts = PARTS.filter(q => q.stage === stage.id && q.kind !== 'screw' && (state.fitted.has(q.id) || state.held === q)).map(q => q.id);
  }
  parts = parts.map(id => byId[id]).filter(q => q.side === state.side || done);
  callouts = parts.map((q, i) => ({ part: q, letter: String.fromCharCode(65 + i) }));
  const key = callouts.map(c => `<em>${c.letter}</em>, ${c.part.name.toLowerCase()}`).join('; ');
  $('caption').innerHTML = `<span class="fig-no">Fig. ${figNo}.</span> ${text}${key ? ' ' + key + '.' : ''}`;
}

const svg = $('callouts');
function drawCallouts() {
  const w = figure.clientWidth, h = figure.clientHeight;
  if (state.explodeE > 0.5 || !callouts.length) { svg.innerHTML = ''; return; }
  root.updateWorldMatrix(true, true);
  const items = callouts.filter(c => c.part.holder.visible).map(c => {
    const q = c.part;
    const z = state.side === SIDE.BRIDGE ? q.bmax.z : q.bmin.z;
    const ax = q.kind === 'stem' ? 0 : q.anchor[0], ay = q.kind === 'stem' ? 26 : q.anchor[1];
    const a = new THREE.Vector3(ax, ay, z).add(q.offset).applyMatrix4(root.matrixWorld).project(camera);
    const sx = (a.x * 0.5 + 0.5) * w, sy = (-a.y * 0.5 + 0.5) * h;
    return { c, sx, sy };
  });
  // place labels around a circle outside the movement, keeping them apart
  const centre = new THREE.Vector3(0, 0, 0).applyMatrix4(root.matrixWorld).project(camera);
  const cx = (centre.x * 0.5 + 0.5) * w, cy = (-centre.y * 0.5 + 0.5) * h;
  const edge = new THREE.Vector3(24, 0, 0).applyMatrix4(root.matrixWorld).project(camera);
  const edge2 = new THREE.Vector3(0, 24, 0).applyMatrix4(root.matrixWorld).project(camera);
  const R = Math.max(Math.hypot((edge.x * 0.5 + 0.5) * w - cx, (-edge.y * 0.5 + 0.5) * h - cy),
    Math.hypot((edge2.x * 0.5 + 0.5) * w - cx, (-edge2.y * 0.5 + 0.5) * h - cy)) + 14;
  items.forEach((it, i) => {
    const dx = it.sx - cx, dy = it.sy - cy;
    it.ang = Math.hypot(dx, dy) < 4 ? -Math.PI / 2 + i * 0.5 : Math.atan2(dy, dx);
  });
  items.sort((a, b) => a.ang - b.ang);
  const minSep = 0.26;
  for (let pass = 0; pass < 4; pass++) for (let i = 1; i < items.length; i++) {
    if (items[i].ang - items[i - 1].ang < minSep) items[i].ang = items[i - 1].ang + minSep;
  }
  let out = '';
  for (const it of items) {
    let lx = cx + Math.cos(it.ang) * R, ly = cy + Math.sin(it.ang) * R;
    lx = Math.min(w - 14, Math.max(14, lx)); ly = Math.min(h - 12, Math.max(lx > w - 330 ? 52 : 18, ly));
    const ux = lx - it.sx, uy = ly - it.sy, ul = Math.hypot(ux, uy) || 1;
    out += `<line x1="${it.sx.toFixed(1)}" y1="${it.sy.toFixed(1)}" x2="${(lx - ux / ul * 9).toFixed(1)}" y2="${(ly - uy / ul * 9).toFixed(1)}"/>`;
    out += `<circle class="dot" cx="${it.sx.toFixed(1)}" cy="${it.sy.toFixed(1)}" r="1.6"/>`;
    out += `<text x="${lx.toFixed(1)}" y="${(ly + 5).toFixed(1)}" text-anchor="middle">${it.c.letter}</text>`;
  }
  svg.innerHTML = out;
}

function fmtTime(sec) { const m = Math.floor(sec / 60), s = Math.floor(sec % 60); return `${m}′ ${String(s).padStart(2, '0')}″`; }
function renderFolio() {
  $('folio-score').textContent = `Faults ${state.faults}${state.assisted ? ' · assisted' : ''}`;
  const end = state.finishedAt || performance.now();
  $('folio-time').textContent = state.startedAt ? fmtTime((end - state.startedAt) / 1000) : '0′ 00″';
}

function renderControls() {
  const done = complete();
  $('btn-auto').textContent = state.auto ? 'Pause Assembly' : 'Automatic Assembly';
  $('btn-auto').disabled = done;
  $('btn-auto').classList.toggle('active', state.auto);
  $('btn-run').textContent = sim.running ? 'Stop the Watch' : done ? 'Run the Watch' : 'Assemble & Run the Watch';
  $('btn-run').classList.toggle('active', sim.running);
  $('btn-wind').disabled = !done || sim.winding;
  $('btn-wind').textContent = sim.setting ? 'Turn Crown' : 'Wind';
  $('btn-stem').disabled = !done;
  $('btn-stem').textContent = sim.setting ? 'Push Crown' : 'Pull Crown';
  $('btn-hands').disabled = !done;
  $('btn-reset').disabled = state.fitted.size === 0 && !state.held;
  $('rate-card').hidden = !done;
}

// Mini dial, after an engraved watch paper
const miniDial = $('mini-dial');
(function drawDial() {
  let s = '<circle r="47" fill="#fbf8f0" stroke="#1d1a15" stroke-width="1"/><circle r="44.5" fill="none" stroke="#1d1a15" stroke-width=".4"/>';
  for (let i = 0; i < 60; i++) {
    const a = i / 60 * TAU, r1 = 44.5, r2 = i % 5 ? 42.5 : 40.5;
    s += `<line x1="${(Math.sin(a) * r1).toFixed(2)}" y1="${(-Math.cos(a) * r1).toFixed(2)}" x2="${(Math.sin(a) * r2).toFixed(2)}" y2="${(-Math.cos(a) * r2).toFixed(2)}" stroke="#1d1a15" stroke-width="${i % 5 ? .4 : .9}"/>`;
  }
  const rn = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  rn.forEach((t, i) => {
    const a = i / 12 * TAU;
    s += `<text x="${(Math.sin(a) * 33).toFixed(2)}" y="${(-Math.cos(a) * 33 + 3.4).toFixed(2)}" text-anchor="middle" font-size="9.5" font-family="EB Garamond, serif" fill="#1d1a15">${t}</text>`;
  });
  s += '<circle cy="16" r="9" fill="none" stroke="#1d1a15" stroke-width=".4"/>';
  const hand = (id, len, w, pomme, cy = 0) => `<g id="${id}" transform="translate(0 ${cy})"><path d="M${-w} ${len * .18} L${w} ${len * .18} L${w * .5} ${-len * .6} L0 ${-len} L${-w * .5} ${-len * .6} Z" fill="#1d1a15"/>${pomme ? `<circle cy="${-len * .66}" r="${pomme}" fill="none" stroke="#1d1a15" stroke-width="${pomme * .5}"/>` : ''}<circle r="${w * 1.6}" fill="#1d1a15"/></g>`;
  s += hand('md-h', 22, 1.8, 3) + hand('md-m', 36, 1.3, 2.6) + hand('md-s', 8, .5, 0, 16);
  miniDial.innerHTML = s;
})();
function renderRate() {
  if ($('rate-card').hidden) return;
  const c = sim.clock;
  const hh = Math.floor(c / 3600) % 24, mm = Math.floor(c / 60) % 60, ss = Math.floor(c) % 60;
  $('r-time').textContent = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  $('r-reserve').textContent = `${sim.reserve.toFixed(sim.reserve < 10 ? 1 : 0)} h`;
  $('r-reserve-bar').style.width = `${(sim.reserve / RESERVE_H) * 100}%`;
  $('r-amp').textContent = sim.amp > 0.01 ? `${Math.round(sim.amp * 180 / Math.PI)}°` : 'stopped';
  const rot = (id, a, cy = 0) => miniDial.querySelector('#' + id).setAttribute('transform', `translate(0 ${cy}) rotate(${a})`);
  rot('md-h', (c % 43200) / 43200 * 360); rot('md-m', (c % 3600) / 3600 * 360); rot('md-s', (c % 60) / 60 * 360, 16);
}

// ───────────────────────── The engraved plate ─────────────────────────
// Every part is drawn in ink line over a pale wash of its metal.
function engrave() {
  for (const m of allMeshes) {
    m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 32), MAT.edge));
    m.material = WASH[m.userData.matKey] || WASH.steel;
  }
  scene.environment = null;
}

// ───────────────────────── Completion ─────────────────────────
function onComplete() {
  state.finishedAt = performance.now();
  renderControls(); renderFolio(); renderLesson();
  hands.visible = state.showHands;
  if (!sim.clockSet) { sim.clock = nowSeconds(); sim.clockSet = true; }
  if (!state.assisted) {
    $('colophon-text').textContent = `Assembled by hand in ${fmtTime((state.finishedAt - state.startedAt) / 1000)}, with ${state.faults === 0 ? 'no faults' : state.faults === 1 ? 'one fault' : state.faults + ' faults'} of order. The movement may now be wound and set going.`;
    $('colophon').hidden = false;
  }
}

async function takeDown() {
  state.auto = false;
  while (state.busy) await sleep(0.05);
  putBack();
  sim.running = false; sim.amp = 0; sim.reserve = 0; sim.setting = false; sim.stemPull = 0; sim.clockSet = false; sim.theta = 0;
  const fitted = PARTS.filter(p => state.fitted.has(p.id)).reverse();
  state.busy = true;
  for (const p of fitted) {
    const to = p.approachV.clone().multiplyScalar(p.lift + 20);
    tween(0.4, (k) => p.offset.lerpVectors(new THREE.Vector3(), to, k)).then(() => { p.holder.visible = false; p.offset.set(0, 0, 0); });
    await sleep(0.025);
  }
  await sleep(0.45);
  state.busy = false;
  state.fitted.clear(); state.next = 0; state.faults = 0; state.startedAt = null; state.finishedAt = null; state.assisted = false;
  hands.visible = false;
  await turnTo(SIDE.DIAL);
  notice('The movement has been taken down. Begin again with the main plate.', 'good');
  renderParts(); renderLesson(); renderControls(); renderFolio();
}

// ───────────────────────── Events ─────────────────────────
canvas.addEventListener('pointermove', (e) => {
  const r = canvas.getBoundingClientRect();
  pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; pointer.inside = true;
  ndc.set((pointer.x / r.width) * 2 - 1, -(pointer.y / r.height) * 2 + 1);
  hoverDirty = true;
});
canvas.addEventListener('pointerleave', () => { pointer.inside = false; $('hover-label').classList.remove('on'); });
canvas.addEventListener('pointerdown', (e) => {
  pointer.downX = e.clientX; pointer.downY = e.clientY; pointer.downT = performance.now();
  const r = canvas.getBoundingClientRect();
  pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; pointer.inside = true;
  ndc.set((pointer.x / r.width) * 2 - 1, -(pointer.y / r.height) * 2 + 1);
});
canvas.addEventListener('pointerup', (e) => {
  if (Math.hypot(e.clientX - pointer.downX, e.clientY - pointer.downY) > 6) return;
  if (state.held) { updateHeld(); tryPlace(); return; }
  // a click on the figure with nothing in hand offers the next part, if the click lands near its place
  if (!complete() && !state.auto && !state.busy) {
    const n = nextPart();
    const P = pointerToModelPlane(state.side === SIDE.BRIDGE ? 1 : -2);
    if (P && Math.hypot(P.x - n.anchor[0], P.y - n.anchor[1]) < snapRadius(n) * 1.5 && state.side === n.side) {
      notice(`Choose the ${n.name.toLowerCase()} from the list of components first.`, 'good');
    }
  }
});
window.addEventListener('keydown', (e) => {
  if (e.target.closest && e.target.closest('input, textarea')) return;
  if (e.key === 'Enter' && state.held && !state.busy) { e.preventDefault(); seat(state.held); }
  if (e.key === 'Escape') {
    if (!$('intro').hidden) closeIntro();
    else if (!$('colophon').hidden) $('colophon').hidden = true;
    else putBack();
  }
});

$('btn-auto').addEventListener('click', () => {
  if (state.auto) { state.auto = false; renderControls(); notice('Assembly paused. You may continue by hand.', 'good'); renderParts(); }
  else autoAssemble(1);
});
$('btn-run').addEventListener('click', runWatch);
$('btn-wind').addEventListener('click', wind);
$('btn-stem').addEventListener('click', toggleStem);
$('btn-hands').addEventListener('click', () => {
  state.showHands = !state.showHands; hands.visible = state.showHands && complete();
  $('btn-hands').setAttribute('aria-pressed', state.showHands);
});
$('btn-sound').addEventListener('click', () => {
  state.sound = !state.sound; $('btn-sound').setAttribute('aria-pressed', state.sound);
  if (state.sound) ensureAudio();
});
$('btn-reset').addEventListener('click', takeDown);

// Music: Mozart, String Quartet No. 19 in C, K. 465, II. Andante cantabile (Musopen, public domain)
const music = $('music');
music.volume = 0.35;
// On by default. Browsers refuse sound before the first gesture, so if the first attempt is
// refused the music waits for the visitor's first click or key press.
let musicWanted = true;
function setMusic(on) {
  musicWanted = on;
  $('btn-music').setAttribute('aria-pressed', on);
  if (on) music.play().catch(() => {});
  else music.pause();
}
function musicOnFirstGesture(e) {
  if (e.target.closest && e.target.closest('#btn-music')) return; // the toggle decides for itself
  window.removeEventListener('pointerdown', musicOnFirstGesture, true);
  window.removeEventListener('keydown', musicOnFirstGesture, true);
  if (musicWanted && music.paused) music.play().catch(() => {});
}
window.addEventListener('pointerdown', musicOnFirstGesture, true);
window.addEventListener('keydown', musicOnFirstGesture, true);
$('btn-music').addEventListener('click', (e) => { e.stopPropagation(); setMusic(!musicWanted); });
setMusic(true);
$('btn-turn').addEventListener('click', () => { if (!state.busy) turnTo(state.side === SIDE.DIAL ? SIDE.BRIDGE : SIDE.DIAL); });
$('btn-explode').addEventListener('click', () => {
  const on = $('btn-explode').getAttribute('aria-pressed') !== 'true';
  $('btn-explode').setAttribute('aria-pressed', on);
  const from = state.explodeE;
  tween(0.8, (k) => { state.explodeE = from + ((on ? 1 : 0) - from) * k; });
});
$('btn-view').addEventListener('click', () => {
  const from = camera.position.clone(), t0 = controls.target.clone();
  tween(0.8, (k) => { camera.position.lerpVectors(from, HOME_CAM, k); controls.target.lerpVectors(t0, new THREE.Vector3(), k); });
});
document.querySelectorAll('.speeds button').forEach(b => b.addEventListener('click', () => {
  sim.speed = +b.dataset.speed;
  document.querySelectorAll('.speeds button').forEach(o => o.setAttribute('aria-checked', o === b));
}));
$('btn-colophon').addEventListener('click', () => { $('colophon').hidden = true; runWatch(); });
$('btn-colophon-close').addEventListener('click', () => { $('colophon').hidden = true; });

// Introductory modal, shown on every visit
function closeIntro() { $('intro').hidden = true; }
$('btn-intro').addEventListener('click', closeIntro);
let modelReady = false, autoWhenReady = false;
$('btn-intro-auto').addEventListener('click', () => {
  closeIntro();
  if (!modelReady) autoWhenReady = true;
  else if (!state.auto && !complete()) autoAssemble(1);
});
$('intro').addEventListener('click', (e) => { if (e.target === $('intro')) closeIntro(); });
$('btn-intro').focus();

// ───────────────────────── Hover labels ─────────────────────────
let hoverDirty = false;
function updateHover() {
  if (!hoverDirty) return; hoverDirty = false;
  const lbl = $('hover-label');
  if (!pointer.inside || state.held) { lbl.classList.remove('on'); return; }
  raycaster.setFromCamera(ndc, camera);
  const hit = raycaster.intersectObjects(allMeshes.filter(m => m.userData.part && m.userData.part.holder.visible), false)[0];
  if (!hit) { lbl.classList.remove('on'); return; }
  const p = hit.object.userData.part;
  lbl.textContent = `${p.name} (${p.eta})`;
  lbl.style.left = pointer.x + 'px'; lbl.style.top = pointer.y + 'px';
  lbl.classList.add('on');
}

// ───────────────────────── Loop ─────────────────────────
function resize() {
  const w = figure.clientWidth, h = figure.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  // keep the whole movement in view on tall, narrow figures
  camera.fov = w / h < 1 ? 2 * Math.atan(Math.tan(14 * Math.PI / 180) / (w / h)) * 180 / Math.PI : 28;
  camera.updateProjectionMatrix();
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
}
new ResizeObserver(resize).observe(figure);

const clock = new THREE.Clock();
let ghostT = 0, frame = 0;
function loop() {
  const dt = Math.min(clock.getDelta(), 0.05);
  stepTweens(dt);
  updateHeld();
  simStep(dt);
  // compose holder positions: assembly offset + exploded view
  for (const p of PARTS) {
    if (!p.holder) continue;
    p.holder.position.copy(p.offset).addScaledVector(p.approachV, p.explode * state.explodeE);
  }
  hands.position.z = -HANDS_LAYER * EXPLODE_STEP * state.explodeE;
  applyKinematics();
  ghostT += dt;
  MAT.ghost.opacity = 0.12 + 0.1 * (0.5 + 0.5 * Math.sin(ghostT * 4)) + (nearTarget ? 0.15 : 0);
  controls.update();
  updateHover();
  renderer.render(scene, camera);
  drawCallouts();
  if (++frame % 10 === 0) { renderRate(); renderFolio(); }
  requestAnimationFrame(loop);
}

// ───────────────────────── Start ─────────────────────────
async function init() {
  renderParts(); renderLesson(); renderControls(); renderFolio();
  try {
    const [meta, buf] = await Promise.all([
      fetch('assets/movement.json').then(r => r.json()),
      fetchWithProgress('assets/movement.bin', (f) => { $('loading-bar').style.width = `${Math.min(100, f * 100)}%`; }),
    ]);
    for (const p of PARTS) makePart(p, meta, buf);
    engrave();
  } catch (err) {
    $('loading').querySelector('em').textContent = 'The plate could not be prepared. Serve this folder over HTTP, for example with “npx serve”.';
    console.error(err);
    return;
  }
  $('loading').classList.add('done');
  resize();
  renderParts(); renderLesson(); renderControls();
  notice('Choose the main plate from the list of components to begin.', 'good');
  modelReady = true;
  loop();
  if (autoWhenReady) autoAssemble(1);
}
init();

// exposed for testing in the console
window.__watch = {
  state, sim, PARTS, autoAssemble, runWatch, turnTo,
  // screen position (canvas px) of where a part is to go, at the height it is carried
  screenOf(id) {
    const p = byId[id]; root.updateWorldMatrix(true, false);
    const v = new THREE.Vector3(p.anchor[0], p.anchor[1], heldPlaneZ(p)).applyMatrix4(root.matrixWorld).project(camera);
    const r = canvas.getBoundingClientRect();
    return { x: r.left + (v.x * 0.5 + 0.5) * r.width, y: r.top + (-v.y * 0.5 + 0.5) * r.height };
  },
};
