// Every picture in the guide, as a raw capture plus markup. See annotate.mjs.
// Marks: { n, at } numbered badge · { ring } circle · { path, dash } arrow ·
// { box: [x0,y0,x1,y1] } dashed box · { text, at, anchor } label ·
// { tag, corner } corner caption · { trail: { from, to } } the route's own
// footsteps between two directives. `at`-style points are room tiles
// ([tx, ty]; on a stitched map [rx, ry, tx, ty]); the `...px` forms are raw
// source pixels.
const D1 = ['3,7','3,6','2,6','3,5','2,5','4,5','3,4','2,4','4,4','3,3','2,3','3,2','4,2','5,2','5,1','4,1','5,3','4,3','2,2','1,2','1,3','1,1','2,1','3,1'];
const ow = (cols, rows, t = 1) => { const a = []; for (const ry of rows) for (const rx of cols) a.push(`ow-t${t}-${rx}-${ry}`); return a; };
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
  { out: 'intro', src: 'intro-farore', scale: 3 },
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
  { out: 'd1-chart-open', src: 'd1-chart-open', marks: [] },
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
  { out: 'd1-den-piece', src: 'd1-den-piece-whole', scale: 2, marks: [
    { ring: [20, 6] }, { text: 'Piece of Heart', at: [20, 7], anchor: 's', size: 12 },
    { path: [[19, 5], [0.6, 5]], w: 4, dash: true },
  ] },
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
  { out: 'd1-boss-a', src: 'd1-boss-a', marks: [] },
  { out: 'd1-boss-b', src: 'd1-boss-b', marks: [] },
  { out: 'd1-boss-c', src: 'd1-boss-c', marks: [] },
  { out: 'd1-boss-d', src: 'd1-boss-d', marks: [] },
  { out: 'd1-boss-e', src: 'd1-boss-e', marks: [] },
  { out: 'd1-boss-f', src: 'd1-boss-f', marks: [] },
  { out: 'd1-boss-g', src: 'd1-boss-g', marks: [] },
  { out: 'd1-essence', src: 'd1-essence', marks: [] },
];
