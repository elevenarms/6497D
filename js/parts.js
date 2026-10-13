// Assembly data for the ETA 6497 movement.
// Order, position numbers, torques and lubricants follow ETA "Technical Communication"
// CT 6497-2 (Order of assembly, pp. 8–19). Mesh indices refer to assets/movement.json,
// tessellated from "ETA 6497-1 Movement Corrected.STEP". Model units are millimetres;
// +z is the bridge (back) side, −z the dial side. Pivots were measured from jewel holes.

export const SIDE = { DIAL: 'dial', BRIDGE: 'bridge' };

// Arbors (x, y) used for both assembly anchors and running kinematics.
export const ARBORS = {
  centre: [0, 0],
  third: [-2.66, -6.07],
  second: [0, -10.25],
  escape: [4.70, -10.65],
  pallet: [7.08, -7.81],
  balance: [10.363, -3.905],
  barrel: [-8.40, 4.50],
  crown: [0, 11.10],
  minute: [4.61, 2.40],
  setting: [-0.015, 10.16],
  intermediate: [2.56, 7.69],
  click: [-12.35, -2.90],
};

export const STAGES = [
  {
    id: 'I', side: SIDE.DIAL,
    title: 'The Keyless Work',
    sub: 'Handsetting mechanism, first part',
    fig: 'The dial side of the plate, showing the setting lever and winding pinions.',
    intro: 'Work begins on the dial side of the plate. The keyless work is assembled first, for it is beneath the motion work and must be correct before anything else is placed above it.',
  },
  {
    id: 'II', side: SIDE.DIAL,
    title: 'The Yoke and Setting Wheels',
    sub: 'Handsetting mechanism, second part',
    fig: 'The keyless work complete, with yoke, setting wheels and minute wheel in place.',
    intro: 'The yoke, its spring and the setting wheels complete the keyless work. Every part should move freely before the jumper is screwed down over them.',
  },
  {
    id: 'III', side: SIDE.BRIDGE,
    title: 'The Going Train',
    sub: 'Basic movement, first part',
    fig: 'The going train under its bridge, seen from the back of the movement.',
    intro: 'The movement is turned over. The four wheels of the going train are placed in their lower jewels, smallest first, and the train bridge is lowered over all four pivots together.',
  },
  {
    id: 'IV', side: SIDE.BRIDGE,
    title: 'The Barrel and Winding Wheels',
    sub: 'Basic movement, second part',
    fig: 'The barrel bridge with crown wheel, click and ratchet wheel.',
    intro: 'The barrel supplies the power, and the winding wheels above it put that power in. The click should be checked carefully, because a weak click lets a wound mainspring run back at once.',
  },
  {
    id: 'V', side: SIDE.BRIDGE,
    title: 'The Escapement',
    sub: 'Basic movement, third part',
    fig: 'The lever escapement and balance, with the Incabloc shock-absorber and regulator.',
    intro: 'The escapement is the most delicate work in the movement and is left until last. The pallets are tried for freedom and the balance is lowered so that its impulse pin enters the fork notch.',
  },
  {
    id: 'VI', side: SIDE.DIAL,
    title: 'The Motion Work',
    sub: 'Wheel train, dial side',
    fig: 'The motion work: cannon pinion and hour wheel on the centre arbor.',
    intro: 'The movement is turned over once more. The cannon pinion is pressed friction-tight onto the centre arbor, and the hour wheel goes over it to carry the hour hand.',
  },
];

// kind: plate | bridge | wheel | screw | lever | stem
// axis: rotation axis for running/seating ('z' or 'y'); pivot: [x,y,z] in model space
// approach: unit direction the part arrives from (model space)
const Z_UP = [0, 0, 1], Z_DOWN = [0, 0, -1];

export const PARTS = [
  // ── Stage I ──────────────────────────────────────────────
  { id: 'mainplate', eta: '1', name: 'Main plate, jewelled', stage: 'I', kind: 'plate',
    meshes: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 63, 64, 65, 66], approach: Z_DOWN, anchor: [0, 0],
    text: 'The main plate, already jewelled and fitted with the lower Incabloc shock-absorber, is set dial side uppermost in the movement holder. Every hole should be clean, and the jewels should be inspected under the glass for chips.' },
  { id: 'settinglever', eta: '2', name: 'Setting lever', stage: 'I', kind: 'lever',
    meshes: [19], approach: Z_DOWN, anchor: [-2.7, 15.6],
    lube: 'Moebius HP-1300 or D5 at the pivot',
    text: 'The setting lever is placed on its post. Its pin will later engage the groove in the winding stem and so locate the stem in either of its two positions.' },
  { id: 'screwsettinglever', eta: '900', name: 'Screw for setting lever', stage: 'I', kind: 'screw', side: SIDE.BRIDGE,
    meshes: [22], approach: Z_UP, anchor: [-1.96, 17.10], torque: '1.0 Ncm',
    text: 'The setting lever screw goes in from the bridge side, and the movement must be turned over to fit it. Screw it in no more than two turns at first, since the stem has still to pass the lever pin. It is tightened once the stem is home.' },
  { id: 'windingpinion', eta: '3', name: 'Winding pinion', stage: 'I', kind: 'wheel', axis: 'y',
    meshes: [37], approach: Z_DOWN, anchor: [0, 13.6], pivot: [0, 13.6, -0.4],
    lube: 'Moebius HP-1300 on the teeth',
    text: 'The winding pinion lies in its slot in the plate, with its crown teeth facing outward toward the pendant.' },
  { id: 'slidingpinion', eta: '4', name: 'Sliding pinion', stage: 'I', kind: 'wheel', axis: 'y',
    meshes: [36], approach: Z_DOWN, anchor: [0, 15.26], pivot: [0, 15.26, -0.4],
    text: 'The sliding pinion goes outside the winding pinion with its ratchet teeth facing it. It slides on the square of the stem: pushed in, it winds the watch, and pulled out by the yoke, it sets the hands.' },
  { id: 'stem', eta: '5', name: 'Winding stem', stage: 'I', kind: 'stem', axis: 'y',
    meshes: [35], approach: [0, 1, 0], anchor: [0, 22], pivot: [0, 22, -0.4],
    text: 'The stem is passed in through the pendant hole and through both pinions until the setting lever pin drops into its groove. Only now is the setting lever screw tightened.' },

  // ── Stage II ─────────────────────────────────────────────
  { id: 'yoke', eta: '6', name: 'Yoke', stage: 'II', kind: 'lever',
    meshes: [17], approach: Z_DOWN, anchor: [3.5, 13.4],
    lube: 'Moebius HP-1300 at the pivot and in the sliding-pinion groove',
    text: 'The yoke is placed with its fork in the groove of the sliding pinion. It is the yoke that carries the sliding pinion to and fro.' },
  { id: 'yokespring', eta: '7', name: 'Yoke spring', stage: 'II', kind: 'lever',
    meshes: [20], approach: Z_DOWN, anchor: [6.5, 10.1],
    text: 'The yoke spring always pushes the yoke outward, so that the sliding pinion engages the crown teeth of the winding pinion. Hold it down with pegwood, because a released spring may be lost across the bench.' },
  { id: 'settingwheel', eta: '8', name: 'Setting wheel', stage: 'II', kind: 'wheel',
    meshes: [14], approach: Z_DOWN, anchor: [-0.015, 10.16], pivot: [-0.015, 10.16, 0], arbor: 'setting',
    text: 'The setting wheel is placed on its stud next to the sliding pinion. It is driven only when the stem is pulled out to the hand-setting position.' },
  { id: 'intsettingwheel', eta: '9', name: 'Intermediate setting wheel', stage: 'II', kind: 'wheel',
    meshes: [15], approach: Z_DOWN, anchor: [2.56, 7.69], pivot: [2.56, 7.69, 0], arbor: 'intermediate',
    text: 'The intermediate setting wheel, identical with the setting wheel, carries the motion from it to the minute wheel.' },
  { id: 'minutewheel', eta: '10', name: 'Minute wheel', stage: 'II', kind: 'wheel',
    meshes: [16], approach: Z_DOWN, anchor: [4.61, 2.40], pivot: [4.61, 2.40, 0], arbor: 'minute',
    text: 'The minute wheel and its pinion form the reduction between the cannon pinion and the hour wheel. There should be a little endshake, and the wheel should spin freely.' },
  { id: 'jumper', eta: '11', name: 'Setting lever jumper', stage: 'II', kind: 'lever',
    meshes: [18], approach: Z_DOWN, anchor: [4.0, 10.5],
    text: 'The jumper is laid over the keyless work. Its spring arm holds the setting lever positively in each position, and the plate over it keeps the setting wheels in place.' },
  { id: 'screwjumper', eta: '901', name: 'Screw for setting lever jumper', stage: 'II', kind: 'screw',
    meshes: [21], approach: Z_DOWN, anchor: [5.74, 8.45], torque: '1.2 Ncm',
    text: 'The countersunk jumper screw is tightened down. Before going on, pull the stem out and push it in again. It should click positively into both positions, and the setting wheels should turn freely.' },

  // ── Stage III ────────────────────────────────────────────
  { id: 'escapewheel', eta: '12', name: 'Escape wheel', stage: 'III', kind: 'wheel',
    meshes: [38], approach: Z_UP, anchor: [4.70, -10.65], pivot: [4.70, -10.65, 0], arbor: 'escape',
    text: 'The escape wheel is placed first, its lower pivot in the plate jewel. Its fifteen club teeth are steel, flat polished with polished impulse faces, and have been epilame-coated, so do not handle them with fingers.' },
  { id: 'thirdwheel', eta: '13', name: 'Third wheel', stage: 'III', kind: 'wheel',
    meshes: [31, 32, 33, 34], approach: Z_UP, anchor: [-2.66, -6.07], pivot: [-2.66, -6.07, 0], arbor: 'third',
    text: 'The third wheel goes next. It turns once in 7½ minutes and links the centre wheel to the fourth wheel.' },
  { id: 'secondwheel', eta: '14', name: 'Second wheel', stage: 'III', kind: 'wheel',
    meshes: [27, 28, 29, 30], approach: Z_UP, anchor: [0, -10.25], pivot: [0, -10.25, 0], arbor: 'second',
    text: 'The fourth or seconds wheel turns once a minute. Its long lower pivot comes through the plate at six o’clock to carry the small-seconds hand.' },
  { id: 'centrewheel', eta: '15', name: 'Centre wheel', stage: 'III', kind: 'wheel',
    meshes: [23, 24, 25, 26], approach: Z_UP, anchor: [0, 0], pivot: [0, 0, 0], arbor: 'centre',
    text: 'The centre wheel turns once an hour and is the largest of the train. Its arbor passes through the plate to carry the cannon pinion and the minute hand.' },
  { id: 'trainbridge', eta: '16', name: 'Train wheel bridge', stage: 'III', kind: 'bridge',
    meshes: [53, 54, 55, 56], approach: Z_UP, anchor: [0, -11],
    text: 'Lower the train bridge gently and guide each upper pivot into its jewel with the tweezers. Never press the bridge down by force. When every pivot is in, the bridge will drop onto its feet under its own weight.' },
  { id: 'screwtrain1', eta: '902', name: 'Screw for train wheel bridge', stage: 'III', kind: 'screw',
    meshes: [57], approach: Z_UP, anchor: [7.27, -14.70], torque: '1.3 Ncm',
    text: 'The first train bridge screw is fitted. Before tightening fully, check with a touch of air that every wheel spins freely.' },
  { id: 'screwtrain2', eta: '902', name: 'Screw for train wheel bridge', stage: 'III', kind: 'screw',
    meshes: [58], approach: Z_UP, anchor: [-8.46, -13.02], torque: '1.3 Ncm',
    text: 'The second train bridge screw is tightened, and the freedom of the train is checked once more.' },

  // ── Stage IV ─────────────────────────────────────────────
  { id: 'barrel', eta: '17', name: 'Movement barrel complete', stage: 'IV', kind: 'wheel',
    meshes: [72, 73, 74, 75], approach: Z_UP, anchor: [-8.40, 4.50], pivot: [-8.40, 4.50, 0], arbor: 'barrel',
    text: 'The barrel comes complete with a Nivaflex mainspring and its cover closed. Fit it with its teeth meshing with the centre pinion.' },
  { id: 'barrelbridge', eta: '18', name: 'Barrel bridge, jewelled', stage: 'IV', kind: 'bridge',
    meshes: [76, 77, 78], approach: Z_UP, anchor: [-6, 8],
    text: 'The barrel bridge is large and covers the barrel and the upper centre pivot. It carries the click spring. Lower it level and check the barrel’s endshake before any screw is tightened.' },
  { id: 'screwbarrel1', eta: '902', name: 'Screw for barrel bridge', stage: 'IV', kind: 'screw',
    meshes: [79], approach: Z_UP, anchor: [-11.83, -7.95], torque: '1.3 Ncm',
    text: 'The barrel bridge has three screws. Tighten them in turn, a little at a time, so that the bridge comes down evenly.' },
  { id: 'screwbarrel2', eta: '902', name: 'Screw for barrel bridge', stage: 'IV', kind: 'screw',
    meshes: [80], approach: Z_UP, anchor: [8.41, 11.40], torque: '1.3 Ncm',
    text: 'The second barrel bridge screw.' },
  { id: 'screwbarrel3', eta: '902', name: 'Screw for barrel bridge', stage: 'IV', kind: 'screw',
    meshes: [81], approach: Z_UP, anchor: [-6.76, 14.67], torque: '1.3 Ncm',
    text: 'The third barrel bridge screw. Check that the barrel still turns freely between bridge and plate.' },
  { id: 'crownring', eta: '19', name: 'Crown wheel ring', stage: 'IV', kind: 'lever',
    meshes: [82], approach: Z_UP, anchor: [0, 11.10],
    text: 'The crown wheel ring acts as a bush on which the crown wheel turns.' },
  { id: 'crownwheel', eta: '20', name: 'Crown wheel', stage: 'IV', kind: 'wheel',
    meshes: [83], approach: Z_UP, anchor: [0, 11.10], pivot: [0, 11.10, 0], arbor: 'crown',
    text: 'The crown wheel meshes with the winding pinion underneath and with the ratchet wheel beside it. It turns the opposite way to the ratchet wheel.' },
  { id: 'screwcrown', eta: '903', name: 'Screw for crown wheel', stage: 'IV', kind: 'screw',
    meshes: [87], approach: Z_UP, anchor: [0, 11.10], torque: '1.1 Ncm',
    text: 'The crown wheel screw has a left-hand thread, like that of almost every crown wheel. It tightens anticlockwise, so take care.' },
  { id: 'click', eta: '22', name: 'Click', stage: 'IV', kind: 'lever',
    meshes: [85], approach: Z_UP, anchor: [-12.6, -3.1],
    lube: 'Moebius D5, the merest trace at the pivot',
    text: 'The click is placed so that its nose rests against the ratchet teeth, with its tail pressed by the click spring that is already in the bridge.' },
  { id: 'screwclick', eta: '904', name: 'Screw for click', stage: 'IV', kind: 'screw',
    meshes: [88], approach: Z_UP, anchor: [-12.35, -2.90], torque: '0.8 Ncm',
    text: 'The click screw is the lightest in the movement. Overtightening it will bind the click.' },
  { id: 'ratchet', eta: '23', name: 'Ratchet wheel', stage: 'IV', kind: 'wheel',
    meshes: [84], approach: Z_UP, anchor: [-8.40, 4.50], pivot: [-8.40, 4.50, 0], arbor: 'barrel',
    text: 'The ratchet wheel goes onto the square of the barrel arbor. Turned by the crown wheel, it winds the mainspring, and the click holds it there.' },
  { id: 'screwratchet', eta: '905', name: 'Screw for ratchet wheel', stage: 'IV', kind: 'screw',
    meshes: [86], approach: Z_UP, anchor: [-8.40, 4.50], torque: '1.0 Ncm',
    text: 'The ratchet screw is tightened. Wind a few clicks now, and the train should run briefly as it would without the escapement.' },

  // ── Stage V ──────────────────────────────────────────────
  { id: 'palletfork', eta: '25', name: 'Pallet fork', stage: 'V', kind: 'wheel',
    meshes: [39, 40, 41], approach: Z_UP, anchor: [7.08, -7.81], pivot: [7.08, -7.81, 0], arbor: 'pallet',
    text: 'The pallet fork is steel and flat polished, with red ruby pallets that have been epilame-coated. Place it with the pallets straddling the escape wheel and the fork pointing toward the balance.' },
  { id: 'palletbridge', eta: '26', name: 'Pallet bridge, jewelled', stage: 'V', kind: 'bridge',
    meshes: [42, 43], approach: Z_UP, anchor: [10, -5],
    text: 'The pallet bridge holds the upper pallet pivot. With the bridge screwed down, move the fork from banking to banking. Each pallet should lock and then release a tooth.' },
  { id: 'screwpallet1', eta: '906', name: 'Screw for pallet bridge', stage: 'V', kind: 'screw',
    meshes: [44], approach: Z_UP, anchor: [13.16, -7.28], torque: '1.3 Ncm',
    text: 'The first pallet bridge screw.' },
  { id: 'screwpallet2', eta: '906', name: 'Screw for pallet bridge', stage: 'V', kind: 'screw',
    meshes: [45], approach: Z_UP, anchor: [6.98, -2.08], torque: '1.3 Ncm',
    text: 'The second pallet bridge screw. Test the escapement for drop and lock before going further.' },
  { id: 'balance', eta: '27', name: 'Balance with hairspring', stage: 'V', kind: 'wheel',
    meshes: [46, 47, 48, 49, 50], approach: Z_UP, anchor: [10.363, -3.905], pivot: [10.363, -3.905, 0], arbor: 'balance',
    text: 'The balance is a Glucydur annular balance, gilt and timed in the factory, with an Anachron hairspring. Lift it by the stud and lower it so that the impulse pin goes into the fork notch. The lift angle is 44°.' },
  { id: 'balancebridge', eta: '28', name: 'Balance bridge, assembled', stage: 'V', kind: 'bridge',
    meshes: [51, 59, 60, 61, 62, 67, 68, 69, 70, 71], approach: Z_UP, anchor: [14, 4],
    text: 'The balance bridge carries the ETACHRON regulator and the upper Incabloc shock-absorber. Bring it down with the upper balance pivot entering the jewel. The balance should start to swing as soon as the pivot is free.' },
  { id: 'screwbalance', eta: '902', name: 'Screw for balance bridge', stage: 'V', kind: 'screw',
    meshes: [52], approach: Z_UP, anchor: [15.52, 3.23], torque: '1.3 Ncm',
    text: 'The balance bridge screw is tightened, and the watch is now going. Listen to the beat, which should sound even, tick and tock alike.' },

  // ── Stage VI ─────────────────────────────────────────────
  { id: 'cannonpinion', eta: '24', name: 'Driver cannon pinion', stage: 'VI', kind: 'wheel',
    meshes: [12], approach: Z_DOWN, anchor: [0, 0], pivot: [0, 0, 0], arbor: 'centre',
    text: 'The cannon pinion is pressed onto the centre arbor and held there by friction, which is what allows the hands to be set while the train runs on. It should be held firmly but should still slip under the setting wheels.' },
  { id: 'hourwheel', eta: '29', name: 'Hour wheel', stage: 'VI', kind: 'wheel',
    meshes: [13], approach: Z_DOWN, anchor: [0, 0], pivot: [0, 0, 0], arbor: 'hour',
    text: 'Last, the hour wheel goes over the cannon pinion and meshes with the minute-wheel pinion. It turns once in twelve hours. The movement is complete.' },
];

for (const p of PARTS) p.side = p.side || STAGES.find(s => s.id === p.stage).side;

// Jewels and other sub-meshes that take a special material.
export const RUBY_MESHES = new Set([0, 1, 2, 3, 4, 39, 41, 43, 53, 55, 56, 60, 64, 65, 76]);
export const HAIRSPRING_MESH = 47;
export const MAINSPRING_MESH = 75;
export const BARREL_ARBOR_MESH = 74;
