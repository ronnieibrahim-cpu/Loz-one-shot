// Every picture in the guide, as a raw capture plus markup. See annotate.mjs.
// Marks: { n, at } numbered badge · { ring } circle · { path, dash } arrow ·
// { box: [x0,y0,x1,y1] } dashed box · { text, at, anchor } label ·
// { tag, corner } corner caption · { trail: { from, to } } the route's own
// footsteps between two directives. `at`-style points are room tiles
// ([tx, ty]; on a stitched map [rx, ry, tx, ty]); the `...px` forms are raw
// source pixels.
const D1 = ['3,7','3,6','2,6','3,5','2,5','4,5','3,4','2,4','4,4','3,3','2,3','3,2','4,2','5,2','5,1','4,1','5,3','4,3','2,2','1,2','1,3','1,1','2,1','3,1'];
const ow = (cols, rows, t = 1) => { const a = []; for (const ry of rows) for (const rx of cols) a.push(`ow-t${t}-${rx}-${ry}`); return a; };
import { DUNGEON_ROOMS } from './rooms-list.mjs';
// Every room of one floor of a dungeon, as stitched-map sources.
const floorRooms = (map, f) => DUNGEON_ROOMS[map].filter(k => k.startsWith(f + ',')).map(k => `${map}map-${k.replace(/,/g, '-')}`);
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const LOW = { tag: 'LOW TIDE' }, MID = { tag: 'MID TIDE' }, HIGH = { tag: 'HIGH TIDE' };
// A throw: where to stand, which way the Anchor flies, and the 5x5 patch it holds.
const throwAt = (n, sx, sy, tx, ty) => [
  { ring: [sx, sy] },
  { path: [[sx, sy], [tx, ty]], w: 5 },
  { box: [tx - 2, ty - 2, tx + 2, ty + 2] },
  { n, at: [sx, sy], off: [-13, -11] },
];

export const FIGURES = [
  // ------------------------------------------------------------ how to play
  { out: 'title', src: 'title', scale: 3 },
  { out: 'hud', src: 'village', scale: 3, marks: [
    { n: 1, atpx: [9, 4] }, { n: 2, atpx: [37, 4] }, { n: 3, atpx: [66, 4] },
    { n: 4, atpx: [84, 4] }, { n: 5, atpx: [132, 4] },
    { text: 'Room name (shown as you arrive)', atpx: [80, 44], anchor: 's', size: 12 },
  ] },
  { out: 'menu', src: 'menu-anchor', scale: 3, marks: [
    { ringpx: [48, 35], r: 11 }, { ringpx: [71, 35], r: 11 },
    { text: 'on B', atpx: [48, 58], anchor: 's', size: 12 }, { text: 'on A', atpx: [71, 58], anchor: 's', size: 12 },
    { text: 'the item under the cursor', atpx: [80, 118], anchor: 's', size: 12 },
  ] },
  { out: 'conch-wave', src: 'd1-mouth-conch', scale: 3, marks: [
    { pathpx: [[66, 34], [66, 17]], w: 3 }, { text: 'the tide gauge: H', atpx: [66, 34], anchor: 's', size: 12 },
  ] },
  { out: 'ow-to-grotto', scale: 2, map: { rooms: ow(range(3, 8), [7, 8]) }, marks: [
    { trail: { from: 1, to: 25 }, w: 4 },
    { n: 1, at: [4, 7, 5, 4] }, { n: 2, at: [3, 7, 3, 2] }, { n: 3, at: [6, 7, 4, 3] }, { n: 4, at: [8, 8, 4, 2] },
  ] },

  // ------------------------------------------------------------------- D1
  { out: 'd1-map', scale: 1, map: { rooms: D1.map(k => 'd1map-t1-' + k.replace(',', '')) }, marks: [
    { n: 1, at: [3, 7, 7, 5] }, { n: 2, at: [3, 5, 7, 7] }, { n: 3, at: [2, 5, 7, 5] }, { n: 4, at: [4, 5, 7, 4] },
    { n: 5, at: [2, 4, 7, 6] }, { n: 6, at: [4, 4, 7, 7] }, { n: 7, at: [3, 4, 7, 1] }, { n: 8, at: [3, 3, 7, 1] },
    { n: 9, at: [3, 2, 7, 4] }, { n: 10, at: [4, 2, 6, 5] }, { n: 11, at: [5, 2, 7, 1] }, { n: 12, at: [5, 1, 8, 5] },
    { n: 13, at: [4, 1, 7, 6] }, { n: 14, at: [5, 3, 20, 7] }, { n: 15, at: [4, 3, 7, 4] }, { n: 16, at: [4, 3, 12, 9] },
    { n: 17, at: [2, 2, 8, 5] }, { n: 18, at: [1, 1, 7, 5] }, { n: 19, at: [2, 1, 7, 5] }, { n: 20, at: [3, 2, 7, 1] },
    { n: 21, at: [3, 1, 7, 6] },
  ] },
  { out: 'd1-mouth', src: 'd1-mouth-low-whole', marks: [
    { ring: [7, 6] }, { text: 'Stand on dry stone and\nplay the conch TWICE:\nMID → HIGH → LOW', at: [7, 7], anchor: 's' },
    { path: [[7, 5.4], [7, 0.4]], w: 5 }, LOW,
  ] },
  { out: 'd1-drink-mid', src: 'd1map-t1-36', marks: [{ text: 'At MID these wells\nare over your head', at: [7, 5], anchor: 'c' }, MID] },
  { out: 'd1-drink-low', src: 'd1-drink-whole', marks: [
    { path: [[7, 9.6], [7, 0.4]], w: 5 }, { text: 'Bone Cell\n(optional)', at: [0.5, 5], anchor: 'e', size: 12 }, LOW,
  ] },
  { out: 'd1-hall', src: 'd1-hall-whole', marks: [
    { n: 1, at: [2, 4], off: [-12, -12] }, { path: [[2, 6.2], [2, 3.3]], w: 5 },
    { n: 2, at: [12, 4], off: [12, -12] }, { path: [[12, 6.2], [12, 3.3]], w: 5 },
    { ring: [7, 6] }, { text: 'fairy', at: [7, 6.8], anchor: 's', size: 12 },
    { text: 'Map', at: [0.4, 5], anchor: 'e', size: 12 }, { text: 'Chartstone', at: [14.6, 5], anchor: 'w', size: 12 },
    { text: 'Tide Gallery', at: [7, 0.3], anchor: 's', size: 12 },
  ] },
  { out: 'd1-hall-push', src: 'd1-hall-push1', marks: [] },
  { out: 'd1-mapalcove', src: 'd1-mapalcove-whole', marks: [
    { ring: [7, 5] }, { path: [[13.6, 5], [8.2, 5]], w: 5 }, { text: 'Dungeon Map', at: [7, 6.6], anchor: 's', size: 13 },
  ] },
  { out: 'd1-chart', src: 'd1-chart-whole', marks: [
    { path: [[0.6, 5], [4, 5], [4, 6], [6.6, 6]], w: 5 }, { ring: [7, 6] },
    { text: 'stand below the chest,\nface up, press A', at: [7, 7], anchor: 's', size: 13 },
  ] },
  { out: 'd1-gallery', src: 'd1-gallery-whole', marks: [
    { ring: [7, 0] }, { text: 'locked: needs a Small Key', at: [7, 1.1], anchor: 's', size: 13 },
    { text: '← Crab Pit\n   (key 1)', at: [0.4, 5], anchor: 'e', size: 12 }, { text: 'Switch Room →\n(key 2)', at: [14.6, 5], anchor: 'w', size: 12 },
  ] },
  { out: 'd1-crabpit', src: 'd1-crabpit-whole', marks: [
    { ring: [7, 5] }, { text: 'the key drops here', at: [7, 5.8], anchor: 's', size: 12 },
  ] },
  { out: 'd1-crabpit-key', src: 'd1-crabpit-key', marks: [] },
  { out: 'd1-switch', src: 'd1-switch-whole', marks: [
    { n: 1, at: [4, 4], off: [-12, -12] }, { path: [[4, 6.2], [4, 3.3]], w: 5 },
    { n: 2, at: [10, 4], off: [12, -12] }, { path: [[10, 6.2], [10, 3.3]], w: 5 },
    { ring: [7.5, 7], r: 18 }, { text: 'key + heart', at: [7.5, 8], anchor: 's', size: 12 },
  ] },
  { out: 'd1-gallery-door', src: 'd1-gallery-door', marks: [] },
  { out: 'd1-stair', src: 'd1-stair-whole', marks: [
    { ring: [7, 0] }, { text: 'second key door', at: [7, 1.1], anchor: 's', size: 13 },
    { text: 'Weeping Wall\n(optional)', at: [0.4, 5], anchor: 'e', size: 12 },
    { box: [12, 8, 12, 8], solid: true }, { text: 'both wings’ stairs\nbring you up here', at: [11.5, 9.4], anchor: 'nw', size: 12 },
  ] },
  { out: 'd1-sluicegate', src: 'd1-sluicegate-whole', marks: [
    { n: 1, at: [7, 2], off: [-14, -8] }, { ring: [7, 2] }, { text: 'stand above the chest,\nface down, press A', at: [9.2, 2], anchor: 'e', size: 12 },
    { ring: [7, 0] }, { text: 'BOSS DOOR (later)', at: [8, 0.2], anchor: 'e', size: 12 },
    { text: 'east wing →', at: [14.6, 5], anchor: 'w', size: 12 }, { text: '← west wing\n(later)', at: [0.4, 5], anchor: 'e', size: 12 },
  ] },
  { out: 'd1-anchor-get', src: 'd1-anchor-get', marks: [] },
  { out: 'd1-pipe', src: 'd1-pipe-throw-whole', marks: [
    ...throwAt(1, 6, 7, 6, 5), { text: 'held at LOW', at: [6, 2.2], anchor: 'n', size: 12 }, LOW,
  ] },
  { out: 'd1-pipe-mid', src: 'd1-pipe-mid-whole', marks: [
    { n: 2, at: [2, 2] }, { text: 'conch once:\nLOW → MID', at: [2.8, 2], anchor: 'e', size: 12 },
    { path: [[6, 5], [13.8, 5]], w: 5 }, { n: 3, at: [11, 3.6] }, MID,
  ] },
  { out: 'd1-chamber-mid', src: 'd1-chamber-whole', marks: [
    { text: 'At MID: deep water,\nand two fish', at: [7, 5], anchor: 'c', size: 13 }, MID,
  ] },
  { out: 'd1-chamber-low', src: 'd1-chamber-low-whole', marks: [
    { path: [[0.6, 5], [1, 5], [1, 1], [7, 1], [7, 0.3]], w: 5 }, LOW,
  ] },
  { out: 'd1-race', src: 'd1-race-throw-whole', marks: [
    { path: [[7, 9.6], [7, 8], [11, 8], [11, 3], [8.6, 3]], w: 4, dash: true },
    ...throwAt(1, 8, 3, 8, 5), LOW,
  ] },
  { out: 'd1-race-mid', src: 'd1-race-mid-whole', marks: [
    { n: 2, at: [12, 2] }, { text: 'conch once → MID', at: [12, 3], anchor: 's', size: 12 },
    { path: [[8, 5], [0.4, 5]], w: 5 }, MID,
  ] },
  { out: 'd1-keyvault', src: 'd1-keyvault-whole', marks: [
    { path: [[14.4, 5], [9, 5], [9, 4], [7.6, 4]], w: 5 }, { ring: [7, 4] },
    { text: 'stand above the chest,\nface down, press A', at: [7, 6.3], anchor: 's', size: 12 },
  ] },
  { out: 'd1-keyvault-key', src: 'd1-keyvault-key', marks: [] },
  { out: 'd1-race-back', src: 'd1-race-mid-whole', marks: [
    { path: [[0.4, 5], [10, 5], [10, 8], [7, 8], [7, 9.6]], w: 5 }, MID,
    { text: 'the Anchor is still here,\nso the way back is open', at: [4, 2], anchor: 'c', size: 12 },
  ] },
  { out: 'd1-chamber-back', src: 'd1-chamber-low-whole', marks: [
    { path: [[7, 0.4], [7, 1], [12, 1], [12, 9], [7, 9], [7, 9.6]], w: 5 }, LOW,
  ] },
  { out: 'd1-den', src: 'd1-den-whole', scale: 2, marks: [
    { ring: [20, 5], r: 18 }, { text: 'Clawcrab', at: [20, 3.4], anchor: 'n', size: 13 },
    { ring: [0, 5] }, { text: 'key door\n(after the fight)', at: [0.8, 5], anchor: 'e', size: 12 }, MID,
  ] },
  { out: 'd1-den-fight1', src: 'd1-den-fight1', marks: [] },
  { out: 'd1-den-fight2', src: 'd1-den-fight2', marks: [] },
  { out: 'd1-gauges', src: 'd1-gauges-throw-whole', marks: [
    ...throwAt(1, 4, 6, 4, 4),
    { ring: [3, 2] }, { text: 'keep this well EMPTY', at: [3.8, 1.3], anchor: 'e', size: 11 },
    { ring: [11, 2] }, { text: 'this one must fill', at: [10.2, 3.1], anchor: 'w', size: 11 },
    { ring: [7, 7] }, LOW,
  ] },
  { out: 'd1-gauges-open', src: 'd1-gauges-open-whole', marks: [
    { n: 2, at: [9, 5] }, { text: 'conch twice:\nLOW → MID → HIGH', at: [9.8, 5], anchor: 'e', size: 12 },
    { path: [[7, 6], [7, 8], [3.6, 8]], w: 5 }, { ring: [3, 8] }, { text: 'Heart', at: [3, 9.2], anchor: 's', size: 11 },
    { path: [[4, 9], [11.4, 9]], w: 4, dash: true }, { text: 'stairs', at: [12.5, 8.6], anchor: 'n', size: 11 }, HIGH,
  ] },
  { out: 'd1-sluice-1', src: 'd1-sluice-throw1-whole', marks: [...throwAt(1, 11, 7, 11, 5), MID] },
  { out: 'd1-sluice-2', src: 'd1-sluice-throw2-whole', marks: [
    { n: 2, at: [11, 1.4] }, { text: 'conch twice → LOW', at: [10.3, 1.4], anchor: 'w', size: 12 },
    { path: [[11, 5], [8, 5], [7, 6], [6.3, 6.7]], w: 4, dash: true },
    ...throwAt(3, 6, 7, 6, 5), LOW,
  ] },
  { out: 'd1-sluice-3', src: 'd1-sluice-mid-whole', marks: [
    { n: 4, at: [6, 1.4] }, { text: 'conch once → MID', at: [6.8, 1.4], anchor: 'e', size: 12 },
    { path: [[6, 5], [0.4, 5]], w: 5 }, MID,
  ] },
  { out: 'd1-turn', src: 'd1-turn-whole', marks: [
    { path: [[14.4, 5], [11, 5], [11, 2], [7, 2], [7, 0.4]], w: 5 },
    { text: 'Weeping Cistern\n(optional) ↓', at: [7, 9.6], anchor: 'n', size: 12 },
  ] },
  { out: 'd1-drip', src: 'd1-drip-throw-whole', marks: [
    ...throwAt(1, 7, 6, 7, 4),
    { ring: [7, 2] }, { text: 'keep EMPTY', at: [8, 2], anchor: 'e', size: 11 },
    { ring: [7, 8] }, { text: 'must fill', at: [8, 8], anchor: 'e', size: 11 },
    { ring: [14, 5] }, LOW,
  ] },
  { out: 'd1-drip-open', src: 'd1-drip-open-whole', marks: [
    { n: 2, at: [11, 2] }, { text: 'conch twice → HIGH', at: [11, 3], anchor: 's', size: 12 },
    { path: [[7, 5], [13.8, 5]], w: 5 }, HIGH,
  ] },
  { out: 'd1-bkvault', src: 'd1-bkvault-whole', marks: [
    { path: [[0.4, 5], [5, 5], [5, 3], [6.5, 3]], w: 5 }, { ring: [7, 3] },
    { text: 'stand above the chest,\nface down, press A', at: [7, 1.9], anchor: 'n', size: 12 },
    { path: [[7, 5], [9.6, 7]], w: 4, dash: true }, { text: 'stairs home', at: [10.5, 8], anchor: 's', size: 12 },
  ] },
  { out: 'd1-bosskey', src: 'd1-bosskey', marks: [] },
  { out: 'd1-bossdoor', src: 'd1-bossdoor', marks: [] },
  { out: 'd1-boss-intro', src: 'd1-boss-intro', marks: [] },
  { out: 'd1-boss-b', src: 'd1-boss-b', marks: [] },
  { out: 'd1-boss-c', src: 'd1-boss-c', marks: [] },
  { out: 'd1-essence', src: 'd1-essence', marks: [] },
];

// ------------------------------------------------------------ road to D2
FIGURES.push(
  { out: 'ow-leg2', scale: 1, map: { rooms: ow(range(4, 11), range(4, 8)) }, marks: [
    { trail: { from: 209, to: 267, every: 8 }, w: 3 },
    { n: 1, at: [5, 7, 4, 4] }, { n: 2, at: [9, 8, 6, 1] }, { n: 3, at: [10, 5, 4, 2] },
    { n: 4, at: [10, 8, 6, 4] }, { n: 5, at: [11, 4, 5, 5] },
  ] },
);

// ------------------------------------------------------------------- D2
FIGURES.push(
  { out: 'd2-map-f0', scale: 1, map: { rooms: floorRooms('d2', 0) }, marks: [
    { n: 1, at: [3, 6, 7, 5] }, { n: 2, at: [3, 4, 7, 2] }, { n: 3, at: [2, 4, 3, 5] },
  ] },
  { out: 'd2-map-f1', scale: 1, map: { rooms: floorRooms('d2', 1) }, marks: [
    { n: 4, at: [2, 5, 11, 6] }, { n: 5, at: [4, 4, 3, 3] }, { n: 6, at: [4, 5, 7, 6] }, { n: 7, at: [4, 3, 3, 6] },
    { n: 8, at: [4, 2, 12, 7] }, { n: 9, at: [5, 3, 7, 6] }, { n: 10, at: [5, 4, 7, 6] }, { n: 11, at: [3, 3, 2, 5] },
    { n: 12, at: [2, 2, 4, 7] }, { n: 13, at: [2, 1, 7, 4] }, { n: 14, at: [3, 2, 7, 2] }, { n: 15, at: [3, 1, 7, 7] },
  ] },
  { out: 'd2-landing', src: 'd2-landing-fairy-whole', marks: [{ ring: [7, 6] }, { text: 'fairy', at: [7, 7], anchor: 's', size: 12 }] },
  { out: 'd2-rising', src: 'd2-rising-whole', marks: [
    { n: 1, at: [3, 8], off: [0, -14] }, { path: [[3.4, 8], [1.6, 8]], w: 5 },
    { n: 2, at: [11, 8], off: [0, -14] }, { path: [[10.6, 8], [12.4, 8]], w: 5 },
    { ring: [7, 8] }, { text: 'Barnacle: can’t be killed,\nkeep away', at: [7, 9.3], anchor: 's', size: 11 },
    { path: [[12, 7], [12, 3], [7.6, 3]], w: 4, dash: true }, { ring: [7, 3] }, { text: 'key', at: [7, 2], anchor: 'n', size: 12 },
    { ring: [0, 5] }, { text: 'key door', at: [0.8, 5], anchor: 'e', size: 12 }, MID,
  ] },
  { out: 'd2-sealed', src: 'd2-sealed-whole', marks: [
    { ring: [2, 1] }, { text: 'stand above the chest,\nface down, press A', at: [3, 1], anchor: 'e', size: 12 },
  ] },
  { out: 'd2-lens-get', src: 'd2-lens-get' },
  { out: 'd2-glass', src: 'd2-glass-whole', marks: [
    { text: 'Hold the Lens up to see and hit\nthe three Keese; the Piece of Heart\nappears here when they’re gone', at: [7, 5], anchor: 'c', size: 12 }, LOW,
  ] },
  { out: 'd2-fork', src: 'd2-fork1-valve-whole', marks: [
    { path: [[7, 9.6], [7, 7], [5, 6], [3.4, 6]], w: 4 }, { n: 1, at: [4, 6], off: [0, -14] },
    { ring: [2, 7] }, { n: 2, at: [2, 7], off: [-14, 0] },
    { path: [[3, 5.5], [3, 0.4]], w: 5 }, { n: 3, at: [3, 2], off: [14, 0] },
    { text: 'west shaft', at: [5, 1.5], anchor: 'c', size: 12 },
  ] },
  { out: 'd2-reefguard', src: 'd2-reefguard-whole', scale: 2, marks: [{ ring: [12, 5], r: 18 }, { text: 'Reefguard', at: [12, 3.3], anchor: 'n', size: 13 }] },
  { out: 'd2-reefguard-fight', src: 'd2-reefguard-fight' },
  { out: 'd2-bombvault', src: 'd2-bombvault-whole', marks: [{ ring: [6, 4] }, { text: 'stand to the left,\nface right, press A', at: [5.2, 4], anchor: 'w', size: 12 }] },
  { out: 'd2-bombs-get', src: 'd2-bombs-get' },
  { out: 'd2-whelk', src: 'd2-whelk-whole', marks: [{ ring: [7, 5] }, { text: 'Piece of Heart', at: [7, 6], anchor: 's', size: 12 }] },
  { out: 'd2-ascent', src: 'd2-ascent-whole', scale: 2, marks: [
    { ring: [0, 16] }, { text: 'key door', at: [0.8, 16], anchor: 'e', size: 12 },
    { ring: [7, 0] }, { text: 'boss door', at: [8, 0.3], anchor: 'e', size: 12 },
    { ring: [14, 5] }, { text: 'from Reefguard Hall', at: [13.2, 5], anchor: 'w', size: 11 },
  ] },
  { out: 'd2-soundfork', src: 'd2-soundfork-valve-whole', marks: [
    { path: [[7, 9.6], [7, 8], [3, 8], [3, 6.4]], w: 4 }, { n: 1, at: [3, 7], off: [-14, 0] },
    { ring: [4, 5] }, { n: 2, at: [4, 5], off: [14, 0] },
    { path: [[3, 4.5], [3, 0.4]], w: 5 }, { n: 3, at: [3, 2], off: [-14, 0] },
  ] },
  { out: 'd2-bosskey', src: 'd2-bosskey-whole', marks: [{ ring: [7, 1] }, { text: 'stand above, face down, A', at: [8, 1], anchor: 'e', size: 12 }] },
  { out: 'd2-boss-intro', src: 'd2-boss-intro' },
  { out: 'd2-boss-b', src: 'd2-boss-b' },
  { out: 'd2-boss-d', src: 'd2-boss-d' },
);

// ---------------------------------------------------------- road to D3
const lbl = (t, at, anchor = 's', size = 12) => ({ text: t, at, anchor, size });
const chestFrom = (tx, ty, side) => {
  const st = { up: [tx, ty - 1], down: [tx, ty + 1], left: [tx - 1, ty], right: [tx + 1, ty] }[side];
  const face = { up: 'down', down: 'up', left: 'right', right: 'left' }[side];
  return [{ ring: st }, lbl(`stand here, face ${face}, A`, [st[0], st[1] + (side === 'down' ? 1 : -1)], side === 'down' ? 's' : 'n')];
};
FIGURES.push(
  { out: 'ow-leg3', scale: 1, map: { rooms: ow(range(1, 10), range(5, 8)) }, marks: [
    { trail: { from: 373, to: 405, every: 8 }, w: 3 },
    { n: 1, at: [2, 7, 8, 2] }, { n: 2, at: [1, 8, 4, 2] },
  ] },
  { out: 'ow3-bomb', src: 'ow3-causeway-whole', marks: [
    { ring: [8, 2] }, lbl('cracked boulder:\nbomb it from the right', [8, 3.2]),
  ] },
  { out: 'ow3-open', src: 'ow3-open-whole', marks: [{ path: [[9, 2], [2, 2], [0.3, 2]], w: 4, dash: true }, LOW] },

  // ------------------------------------------------------------------- D3
  { out: 'd3-map', scale: 1, map: { rooms: floorRooms('d3', 0) }, marks: [
    { n: 1, at: [3, 6, 7, 2] }, { n: 2, at: [2, 5, 7, 6] }, { n: 3, at: [4, 5, 7, 3] }, { n: 4, at: [3, 4, 7, 1] },
    { n: 5, at: [2, 4, 7, 5] }, { n: 6, at: [4, 4, 7, 7] }, { n: 7, at: [3, 3, 7, 6] }, { n: 8, at: [2, 3, 7, 5] },
    { n: 9, at: [1, 3, 7, 4] }, { n: 10, at: [1, 2, 7, 6] }, { n: 11, at: [2, 2, 7, 7] }, { n: 12, at: [2, 1, 7, 7] },
    { n: 13, at: [4, 3, 7, 5] }, { n: 14, at: [5, 4, 7, 7] }, { n: 15, at: [6, 4, 14, 7] }, { n: 16, at: [6, 5, 14, 3] },
    { n: 17, at: [4, 2, 14, 5] }, { n: 18, at: [3, 2, 7, 3] }, { n: 19, at: [3, 1, 7, 7] },
  ] },
  { out: 'd3-nave', src: 'd3-nave-whole', marks: [{ ring: [7, 1] }, lbl('fairy, once the room is clear', [7, 1.9])] },
  { out: 'd3-sluice', src: 'd3-sluice-whole', marks: [
    { n: 1, at: [3, 3], off: [-14, 0] }, { path: [[3, 4.4], [3, 2.4]], w: 5 },
    { n: 2, at: [11, 3], off: [14, 0] }, { path: [[11, 4.4], [11, 2.4]], w: 5 },
    { ring: [7, 2] }, lbl('key', [7, 1.2], 'n'),
  ] },
  { out: 'd3-weir', src: 'd3-weir-whole', marks: [{ ring: [7, 0] }, lbl('key door', [8, 0.3], 'e')] },
  { out: 'd3-silt', src: 'd3-silt-whole', marks: [...chestFrom(7, 3, 'down'), { text: 'Chartstone', at: [7, 2.2], anchor: 'n', size: 12 }] },
  { out: 'd3-reed', src: 'd3-reed-whole', marks: [{ ring: [7, 8] }, lbl('Piece of Heart\n(clear the room)', [7, 8.8])] },
  { out: 'd3-cistern', src: 'd3-cistern-whole', marks: [...chestFrom(7, 4, 'down'), lbl('deep water all round', [2.5, 2], 'c', 11)] },
  { out: 'd3-cleats-get', src: 'd3-cleats-get' },
  { out: 'd3-undertow', src: 'd3-undertow-whole', marks: [
    { path: [[14, 5], [0.4, 5]], w: 5 }, lbl('walk the FLOOR west\n(the surface current pushes east)', [7, 7.4], 's'),
  ] },
  { out: 'd3-vestry', src: 'd3-vestry-whole', marks: [
    { n: 1, at: [11, 2], off: [0, -14] }, { path: [[12.4, 2], [10.4, 2]], w: 5 },
    { n: 2, at: [3, 2], off: [0, -14] }, { path: [[1.6, 2], [3.6, 2]], w: 5 },
    { ring: [7, 0] }, lbl('key door', [8, 0.3], 'e'),
  ] },
  { out: 'd3-drain-gallery', src: 'd3-drain-gallery-whole', marks: [...chestFrom(7, 4, 'down'), lbl('Boss Key', [7, 3.2], 'n')] },
  { out: 'd3-bogmaw', src: 'd3-bogmaw-whole', marks: [{ ring: [7, 5], r: 16 }, lbl('Bogmaw', [7, 6.2])] },
  { out: 'd3-roof', src: 'd3-roof-whole', marks: [{ ring: [7, 5] }, lbl('Piece of Heart', [7, 6])] },
  { out: 'd3-drain', src: 'd3-drain-whole', marks: [
    { trail: { from: 491, to: 501, every: 8 }, w: 4 }, { ring: [7, 8] }, lbl('fairy', [7, 9.2], 's'),
  ] },
  { out: 'd3-soundpool', src: 'd3-soundpool-sink-whole', scale: 2, marks: [
    { ring: [14, 5] }, lbl('plate on the bottom:\nsink onto it', [14, 3.2], 'n'), { ring: [22, 10] }, lbl('opens this door', [21, 9.3], 'w'),
  ] },
  { out: 'd3-weights', src: 'd3-weights-push-whole', scale: 2, marks: [
    { n: 1, at: [8, 5], off: [0, -14] }, { path: [[8.4, 5], [6.4, 5]], w: 5 }, lbl('at LOW, push the block\nonto the left plate', [7, 6.4]),
    { n: 2, at: [21, 6], off: [0, -14] }, { ring: [21, 6] }, lbl('then sink and stand\non this plate', [21, 7.4]),
    { ring: [11, 3] }, lbl('key', [11, 2.2], 'n'),
  ] },
  { out: 'd3-kelp', src: 'd3-kelp-whole', scale: 2, marks: [
    { trail: { from: 576, to: 582, every: 10 }, w: 4 }, lbl('swim with the current,\nthen sink for the last stretch', [14, 5], 'c'),
  ] },
  { out: 'd3-lockgallery', src: 'd3-lockgallery-whole', marks: [
    { ring: [2, 5] }, lbl('plate: opens the shortcut', [2.8, 5], 'e'), { ring: [7, 0] }, lbl('boss door', [8, 0.3], 'e'),
  ] },
  { out: 'd3-boss-intro', src: 'd3-boss-intro' },
  { out: 'd3-boss-a', src: 'd3-boss-a' },

  // ---------------------------------------------------------- road to D4
  { out: 'ow-leg4', scale: 1, map: { rooms: ow(range(1, 4), range(3, 8)) }, marks: [
    { trail: { from: 617, to: 643, every: 8 }, w: 3 },
    { n: 1, at: [3, 4, 9, 4] }, { n: 2, at: [1, 3, 6, 2] },
  ] },
  { out: 'ow4-deepcut', src: 'ow4-deepcut-whole', marks: [{ ring: [8, 4] }, lbl('rockfall: bomb it from the right', [8, 5.2])] },

  // ------------------------------------------------------------------- D4
  { out: 'd4-map', scale: 1, map: { rooms: floorRooms('d4', 0) }, marks: [
    { n: 1, at: [4, 6, 7, 7] }, { n: 2, at: [3, 5, 7, 1] }, { n: 3, at: [4, 4, 22, 5] }, { n: 4, at: [2, 4, 1, 5] },
    { n: 5, at: [1, 4, 7, 6] }, { n: 6, at: [1, 3, 4, 2] }, { n: 7, at: [0, 4, 10, 18] }, { n: 8, at: [1, 5, 7, 6] },
    { n: 9, at: [2, 3, 10, 8] }, { n: 10, at: [2, 2, 4, 6] }, { n: 11, at: [2, 1, 7, 3] }, { n: 12, at: [3, 3, 13, 6] },
    { n: 13, at: [4, 3, 6, 3] }, { n: 14, at: [5, 3, 20, 7] }, { n: 15, at: [5, 2, 1, 6] }, { n: 16, at: [4, 2, 7, 5] },
    { n: 17, at: [4, 1, 3, 3] }, { n: 18, at: [3, 2, 7, 2] }, { n: 19, at: [3, 1, 7, 7] },
  ] },
  { out: 'd4-basin', src: 'd4-basin-whole', marks: [{ ring: [7, 8] }, lbl('key, once the room is clear', [7, 9])] },
  { out: 'd4-floor', src: 'd4-floor-plate-whole', scale: 2, marks: [
    { n: 1, at: [3, 2], off: [0, -14] }, lbl('push the block left\nonto its plate', [4, 3.4], 'nw'),
    { n: 2, at: [41, 8], off: [0, -14] }, { ring: [41, 8] }, lbl('then stand on this plate', [40, 9.4], 'w'),
    { ring: [22, 5] }, lbl('key', [22, 6.2]), LOW,
  ] },
  { out: 'd4-bellows-get', src: 'd4-bellows-get' },
  { out: 'd4-loft', src: 'd4-loft-blow-whole', marks: [
    { ring: [4, 1] }, { ring: [1, 1] }, { path: [[3.4, 1], [1.6, 1]], w: 5 }, lbl('stand on the shelf, face the wheel,\nhold the Bellows', [4.5, 2.2], 'nw'), MID,
  ] },
  { out: 'd4-ebb', src: 'd4-ebb-blow-whole', scale: 2, marks: [
    { ring: [10, 19] }, { ring: [13, 19] }, { path: [[10.6, 19], [12.4, 19]], w: 5 },
    lbl('swim in at HIGH, then LOW,\nthen blow', [11.5, 17.4], 'n'),
  ] },
  { out: 'd4-dsill', src: 'd4-dsill-blow-whole', marks: [
    { ring: [10, 9] }, { ring: [13, 9] }, { path: [[10.6, 9], [12.4, 9]], w: 5 }, lbl('swim in over the wall\nat HIGH, then blow', [10, 7.4], 'n'), HIGH,
  ] },
  { out: 'd4-gauge', src: 'd4-gauge-blow-whole', marks: [
    { ring: [4, 5] }, { ring: [1, 5] }, { path: [[3.4, 5], [1.6, 5]], w: 5 }, lbl('the key pops out here', [4, 6.3]), MID,
  ] },
  { out: 'd4-race', src: 'd4-race-blow2-whole', marks: [
    { n: 1, at: [4, 1], off: [0, 14] }, { ring: [1, 1] }, lbl('first wheel at MID', [2, 2.2], 'nw'),
    { n: 2, at: [10, 5], off: [14, 0] }, { ring: [10, 2] }, { path: [[10, 4.4], [10, 2.6]], w: 5 }, lbl('second wheel at HIGH', [11, 2], 'e'), HIGH,
  ] },
  { out: 'd4-ironknight', src: 'd4-ironknight-whole', scale: 2, marks: [{ ring: [20, 5], r: 16 }, lbl('Ironknight', [20, 3.4], 'n'), HIGH] },
  { out: 'd4-crossed', src: 'd4-crossed-blow2-whole', marks: [
    { n: 1, at: [3, 4], off: [-14, 0] }, { ring: [3, 1] }, lbl('west wheel: MID', [3, 2.4], 'n'),
    { n: 2, at: [11, 4], off: [14, 0] }, { ring: [11, 1] }, lbl('east wheel: HIGH', [11, 2.4], 'n'),
    { n: 3, at: [1, 6], off: [0, 14] }, { ring: [1, 6] }, lbl('plate: shortcut to the boss', [2, 7.2], 'nw'), HIGH,
  ] },
  { out: 'd4-eastlook', src: 'd4-eastlook-whole', marks: [{ ring: [1, 3] }, lbl('Piece of Heart', [1.8, 3], 'e')] },
  { out: 'd4-gate', src: 'd4-gate-whole', marks: [{ ring: [7, 0] }, lbl('boss door: go in at LOW', [8, 0.3], 'e')] },
  { out: 'd4-boss-intro', src: 'd4-boss-intro' },
  { out: 'd4-boss-a', src: 'd4-boss-a' },

  // ---------------------------------------------------------- road to D5
  { out: 'ow5-noble', src: 'ow5-noble' },
  { out: 'ow-leg5', scale: 1, map: { rooms: ow(range(1, 6), range(3, 7)) }, marks: [
    { trail: { from: 820, to: 838, every: 8 }, w: 3 },
    { n: 1, at: [3, 7, 3, 2] }, { n: 2, at: [5, 4, 4, 3] },
  ] },

  // ------------------------------------------------------------------- D5
  { out: 'd5-map', scale: 1, map: { rooms: floorRooms('d5', 0) }, marks: [
    { n: 1, at: [2, 6, 7, 3] }, { n: 2, at: [4, 6, 7, 7] }, { n: 3, at: [2, 5, 7, 3] }, { n: 4, at: [1, 5, 7, 5] },
    { n: 5, at: [4, 5, 7, 5] }, { n: 6, at: [5, 5, 4, 3] }, { n: 7, at: [3, 5, 7, 1] }, { n: 8, at: [4, 4, 7, 8] },
    { n: 9, at: [2, 4, 1, 6] }, { n: 10, at: [1, 4, 7, 6] }, { n: 11, at: [1, 3, 11, 6] }, { n: 12, at: [2, 3, 7, 6] },
    { n: 13, at: [2, 2, 3, 6] }, { n: 14, at: [0, 2, 7, 6] }, { n: 15, at: [0, 3, 5, 5] }, { n: 16, at: [4, 3, 7, 6] },
    { n: 17, at: [5, 3, 7, 6] }, { n: 18, at: [4, 2, 12, 6] }, { n: 19, at: [3, 1, 7, 7] },
  ] },
  { out: 'd5-cloister', src: 'd5-cloister-high-whole', marks: [{ ring: [7, 4] }, lbl('Piece of Heart: swim in at HIGH', [7, 5.2]), HIGH] },
  { out: 'd5-bower', src: 'd5-bower-blow-whole', marks: [
    { ring: [4, 1] }, { ring: [1, 1] }, { path: [[3.4, 1], [1.6, 1]], w: 5 }, lbl('blow the wheel from the stand;\nthe Piece of Heart drops below', [4.5, 2.2], 'nw'),
  ] },
  { out: 'd5-sbracken', src: 'd5-sbracken-whole', marks: [
    { n: 1, at: [4, 1], off: [0, 14] }, { path: [[4.4, 1], [2.6, 1]], w: 5 },
    { n: 2, at: [10, 9], off: [0, -14] }, { path: [[9.6, 9], [11.4, 9]], w: 5 },
    { ring: [7, 9] }, lbl('key', [7, 8.2], 'n'),
  ] },
  { out: 'd5-seed-get', src: 'd5-seed-get' },
  { out: 'd5-stake-high', src: 'd5-stake1-throw-whole', marks: [
    { n: 1, at: [9, 5], off: [0, -14] }, { path: [[9.6, 5], [11, 5]], w: 5 }, lbl('at HIGH the bole is gone:\nthrow the seed over it', [9, 6.6]), HIGH,
  ] },
  { out: 'd5-stake-low', src: 'd5-stake1-cut-whole', marks: [
    { n: 2, at: [11, 5], off: [0, -14] }, lbl('at LOW the pillar is ground:\nstand on it and cut the snarl', [10, 6.6]), LOW,
  ] },
  { out: 'd5-snave', src: 'd5-snave-low-whole', marks: [{ ring: [1, 6] }, lbl('key chest', [1.8, 6.4], 'w')] },
  { out: 'd5-knotted', src: 'd5-knotted-2-whole', marks: [lbl('one stake from the bank at HIGH,\nthe second from the first at LOW', [7, 2.4], 'c'), LOW] },
  { out: 'd5-rootford', src: 'd5-rootford-pushed-whole', marks: [
    { ring: [4, 5] }, { ring: [3, 6] }, lbl('block on one plate,\nyou on the other', [3.5, 7.6]), { ring: [3, 2] }, lbl('key', [3, 1.2], 'n'), LOW,
  ] },
  { out: 'd5-longford', src: 'd5-longford-low-whole', marks: [{ ring: [13, 5] }, lbl('Thornvine’s door (locked)', [12.2, 5], 'w'), LOW] },
  { out: 'd5-thornvine', src: 'd5-thornvine-fight' },
  { out: 'd5-shrineford', src: 'd5-shrineford-2-whole', scale: 2, marks: [
    { ring: [21, 5] }, lbl('1st stake (HIGH, from the bank)', [21, 3.6], 'n', 14),
    { ring: [19, 5] }, lbl('2nd stake (LOW, from the 1st)', [19, 6.8], 's', 14),
    { ring: [12, 4] }, lbl('Boss Key', [12, 3], 'n', 14), LOW,
  ] },
  { out: 'd5-boss-intro', src: 'd5-boss-intro' },
  { out: 'd5-boss-a', src: 'd5-boss-a' },

  // ---------------------------------------------------------- road to D6
  { out: 'ow6-rod', src: 'ow6-rod' },
  { out: 'ow-leg6', scale: 1, map: { rooms: ow(range(1, 4), range(0, 7)) }, marks: [
    { trail: { from: 1262, to: 1283, every: 8 }, w: 3 },
    { n: 1, at: [4, 7, 4, 1] }, { n: 2, at: [3, 4, 9, 4] }, { n: 3, at: [1, 0, 4, 3] },
  ] },

  // ------------------------------------------------------------------- D6
  { out: 'd6-map-f0', scale: 1, map: { rooms: floorRooms('d6', 0) }, marks: [
    { n: 1, at: [4, 6, 7, 7] }, { n: 2, at: [4, 5, 7, 5] }, { n: 3, at: [4, 4, 7, 3] }, { n: 4, at: [2, 4, 7, 6] },
    { n: 5, at: [3, 3, 7, 5] }, { n: 6, at: [4, 3, 7, 6] }, { n: 7, at: [5, 3, 7, 5] }, { n: 8, at: [6, 3, 7, 5] },
    { n: 9, at: [7, 2, 7, 12] }, { n: 10, at: [6, 2, 7, 5] }, { n: 11, at: [2, 3, 7, 5] },
  ] },
  { out: 'd6-map-f1', scale: 1, map: { rooms: floorRooms('d6', 1) }, marks: [
    { n: 12, at: [4, 5, 14, 12] }, { n: 13, at: [4, 4, 7, 6] }, { n: 14, at: [5, 4, 7, 6] }, { n: 15, at: [2, 5, 7, 6] },
    { n: 16, at: [2, 4, 7, 6] }, { n: 17, at: [3, 4, 7, 6] }, { n: 18, at: [2, 3, 7, 7] }, { n: 19, at: [4, 3, 7, 7] },
    { n: 20, at: [3, 2, 7, 6] }, { n: 21, at: [4, 2, 22, 7] }, { n: 22, at: [3, 0, 12, 7] },
  ] },
  { out: 'd6-drain', src: 'd6-drain-done-whole', marks: [
    { ring: [2, 2] }, lbl('block onto the far plate', [2.8, 1.6], 'e'), { ring: [12, 8] }, lbl('stand on this one', [11.2, 8], 'w'), MID,
  ] },
  { out: 'd6-kiln', src: 'd6-kiln-lit-whole', marks: [
    { ring: [2, 2] }, { ring: [12, 2] }, { ring: [2, 8] }, { ring: [12, 8] }, lbl('light all four torches\nwith the Kilnshell', [7, 5], 'c'),
  ] },
  { out: 'd6-crypt', src: 'd6-crypt-blow-whole', marks: [{ ring: [5, 4] }, { path: [[7.4, 4], [5.6, 4]], w: 5 }, lbl('blow the wheel at MID', [7, 5.4])] },
  { out: 'd6-dredge-get', src: 'd6-dredge-get' },
  { out: 'd6-slack', src: 'd6-slack-cast-whole', marks: [lbl('cast over the silted ring at MID:\na Piece of Heart comes up', [7, 2.4], 'c'), MID] },
  { out: 'd6-draw', src: 'd6-draw-cast-whole', marks: [lbl('LOW: stand on the shelf and cast\nat the post across the pit', [7, 2.4], 'c'), LOW] },
  { out: 'd6-tideshade', src: 'd6-tideshade-fight' },
  { out: 'd6-colonnade', src: 'd6-colonnade-rod-whole', marks: [{ ring: [7, 2] }, lbl('ring the Rod here:\nthe grate lifts', [7, 3.4])] },
  { out: 'd6-shafts', src: 'd6-shafts-cast2-whole', scale: 2, marks: [
    lbl('1: HIGH, cast over the bar', [9, 1.6], 'c', 14), lbl('2: LOW, cast from the shelf', [16, 8.6], 'c', 14),
    { ring: [22, 4] }, lbl('Boss Key', [22, 3], 'n', 14),
  ] },
  { out: 'd6-brinehulk', src: 'd6-brinehulk-fight' },
  { out: 'd6-nereth-intro', src: 'd6-nereth-intro' },
  { out: 'd6-nereth-a', src: 'd6-nereth-a' },
  { out: 'd6-nereth-b', src: 'd6-nereth-b' },
  { out: 'd6-end', src: 'd6-end' },
);

// ---------------------------------------------------- every Piece of Heart
const hp = (out, src, tx, ty, extra = []) => ({ out: 'hp-' + out, src, scale: 2, marks: [{ ring: [tx, ty] }, ...extra] });
FIGURES.push(
  hp('bluff', 'cave1-room', 2, 2), hp('reefhollow', 'cave2-low', 2, 2, [LOW]), hp('porch', 'cave4-room', 4, 1),
  hp('shellflats', 'ow-t1-10-8', 6, 4), hp('outercoral', 'ow-t1-11-4', 5, 5), hp('kell', 'ow-t1-2-3', 6, 3),
  hp('logdrift', 'ow-t1-6-4', 2, 5), hp('rustfall', 'ow-t1-3-0', 2, 5), hp('saltterraces', 'ow-t1-5-0', 6, 4),
  hp('palacewall', 'ow-t1-9-0', 2, 5), hp('drownedshore', 'ow-t1-0-0', 3, 3), hp('witch', 'ow-t1-1-9', 3, 4),
  hp('d1den', 'd1map-t1-53', 20, 6), hp('d1gauges', 'd1map-t1-43', 3, 8),
  hp('d2glass', 'd2map-1-4-5', 7, 5), hp('d2whelk', 'd2map-1-5-4', 7, 5),
  hp('d3reed', 'd3map-0-4-4', 7, 8), hp('d3roof', 'd3map-0-2-1', 7, 5),
  hp('d4rung', 'd4map-0-4-5', 9, 4), hp('d4east', 'd4map-0-4-1', 1, 3),
  hp('d5cloister', 'd5map-0-1-5', 7, 4), hp('d5bower', 'd5map-0-5-5', 4, 2),
  hp('d6slack', 'd6map-0-5-3', 7, 5), hp('d6bar', 'd6map-1-2-3', 5, 2),
);
