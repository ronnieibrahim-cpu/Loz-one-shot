// The moments the guide photographs. See capture.mjs for what `after`,
// `until` and `plus` mean. Route shots must stay in route order.
const DLG = 'g.dialogue.active && g.dialogue.chars >= g.dialogue.pageLen';
const ANCHOR_FLYING = "g.entities.some(e => e.sprite === 'o_anchor' && e.state === 'flight')";
const ANCHOR_HELD = "g.entities.some(e => e.sprite === 'o_anchor' && e.state === 'held')";
const ITEM = 'g.itemShow && g.itemShow.t < 100';
const IN = (k) => `g.room && g.mapId + ' ' + g.room.key === ${JSON.stringify(k)}`;

export const ROUTE_SHOTS = [
  // --------------------------------------------------------- the start
  { id: 'intro-farore', after: -1, until: "g.mode === 'cutscene' && g.dialogue.active", plus: 40, by: 0 },
  { id: 'village', after: 0, plus: 30, whole: true },
  { id: 'village-conch', after: 13, until: 'g.tide.busy', plus: 10, by: 14 },
  { id: 'ow-grotto', after: 24, plus: 0, whole: true },
  // --------------------------------------------------------------- D1
  { id: 'd1-enter', after: 25, until: IN('d1 0,3,7'), plus: 70, whole: true },
  { id: 'd1-mouth-conch', after: 28, until: 'g.tide.busy', plus: 8, by: 29, whole: true },
  { id: 'd1-mouth-low', after: 30, whole: true },
  { id: 'd1-drink', after: 31, plus: 20, whole: true },
  { id: 'd1-hall', after: 35, plus: 30, whole: true },
  { id: 'd1-hall-push1', after: 39, plus: 40, whole: true },
  { id: 'd1-hall-push2', after: 41, plus: 60, whole: true },
  { id: 'd1-hall-fairy', after: 43, plus: 10, whole: true },
  { id: 'd1-mapalcove', after: 45, plus: 20, whole: true },
  { id: 'd1-chart', after: 48, plus: 10, whole: true },
  { id: 'd1-chart-open', after: 53, until: 'g.dialogue.active', plus: 20 },
  { id: 'd1-gallery', after: 56, plus: 10, whole: true },
  { id: 'd1-crabpit', after: 60, plus: 30, whole: true },
  { id: 'd1-crabpit-key', after: 62, until: DLG, plus: 2, whole: true },
  { id: 'd1-switch', after: 65, plus: 10, whole: true },
  { id: 'd1-switch-done', after: 71, until: DLG, plus: 2, whole: true },
  { id: 'd1-gallery-door', after: 78, until: DLG, plus: 1, whole: true },
  { id: 'd1-stair', after: 81, plus: 30, whole: true },
  
  { id: 'd1-sluicegate', after: 89, plus: 20, whole: true },
  { id: 'd1-anchor-get', after: 92, until: 'g.dialogue.active', plus: 20 },
  { id: 'd1-anchor-menu', after: 95, until: "g.mode === 'menu'", plus: 60 },
  { id: 'd1-pipe', after: 97, plus: 10, whole: true },
  { id: 'd1-pipe-throw', after: 97, until: ANCHOR_FLYING, plus: 6, whole: true },
  { id: 'd1-pipe-held', after: 98, plus: 0, whole: true },
  { id: 'd1-pipe-mid', after: 99, plus: 30, whole: true },
  { id: 'd1-chamber', after: 101, plus: 10, whole: true },
  { id: 'd1-chamber-low', after: 102, plus: 5, whole: true },
  { id: 'd1-race', after: 105, plus: 10, whole: true },
  { id: 'd1-race-throw', after: 106, until: ANCHOR_FLYING, plus: 6, whole: true },
  { id: 'd1-race-mid', after: 108, plus: 30, whole: true },
  { id: 'd1-keyvault', after: 110, plus: 10, whole: true },
  { id: 'd1-keyvault-key', after: 116, until: 'g.dialogue.active', plus: 20 },
  { id: 'd1-den', after: 129, plus: 10, whole: true },
  { id: 'd1-den-fight1', after: 130, plus: 120, whole: true },
  { id: 'd1-den-fight2', after: 130, plus: 30 },
  { id: 'd1-den-fight3', after: 130, plus: 180 },
  { id: 'd1-den-piece', after: 132, plus: 10, whole: true },
  { id: 'd1-den-door', after: 136, plus: 2 },
  { id: 'd1-gauges', after: 139, plus: 10, whole: true },
  { id: 'd1-gauges-low', after: 141, plus: 5, whole: true },
  { id: 'd1-gauges-throw', after: 141, until: ANCHOR_FLYING, plus: 6, whole: true },
  { id: 'd1-gauges-open', after: 143, until: DLG, plus: 2, whole: true },
  { id: 'd1-gauges-piece', after: 145, plus: 12 },
  { id: 'd1-gauges-stair', after: 147, plus: 60, whole: true },
  { id: 'd1-stair2', after: 148, plus: 10, whole: true },
  { id: 'd1-sluice', after: 160, plus: 10, whole: true },
  { id: 'd1-sluice-throw1', after: 160, until: ANCHOR_FLYING, plus: 6, whole: true },
  { id: 'd1-sluice-low', after: 162, plus: 5, whole: true },
  { id: 'd1-sluice-throw2', after: 163, until: ANCHOR_FLYING, plus: 6, whole: true },
  { id: 'd1-sluice-mid', after: 165, plus: 30, whole: true },
  { id: 'd1-turn', after: 167, plus: 10, whole: true },
  { id: 'd1-drip', after: 169, plus: 10, whole: true },
  { id: 'd1-drip-throw', after: 174, until: ANCHOR_FLYING, plus: 6, whole: true },
  { id: 'd1-drip-open', after: 176, plus: 0, whole: true },
  { id: 'd1-bkvault', after: 179, plus: 10, whole: true },
  { id: 'd1-bosskey', after: 183, plus: 30 },
  { id: 'd1-bossdoor', after: 196, plus: 2, whole: true },
  { id: 'd1-boss-intro', after: 199, plus: 40, whole: true },
  { id: 'd1-boss-a', after: 200, plus: 40 },
  { id: 'd1-boss-b', after: 200, plus: 70 },
  { id: 'd1-boss-c', after: 200, plus: 70 },
  { id: 'd1-boss-d', after: 200, plus: 70 },
  { id: 'd1-boss-e', after: 200, plus: 70 },
  { id: 'd1-boss-f', after: 200, plus: 70 },
  { id: 'd1-boss-g', after: 200, plus: 70 },
  { id: 'd1-boss-h', after: 200, plus: 70 },
  { id: 'd1-boss-won', after: 202, plus: 0, whole: true },
  { id: 'd1-essence', after: 204, until: DLG, plus: 2 },
  { id: 'end-d1', after: 209 },
];

const D1 = ['3,7','3,6','2,6','3,5','2,5','4,5','3,4','2,4','4,4','3,3','2,3','3,2','4,2','5,2','5,1','4,1','5,3','4,3','2,2','1,2','1,3','1,1','2,1','3,1'];
export const STATIC_SHOTS = [
  { id: 'title', title: true, frames: 400 },
  { id: 'menu-anchor', room: ['d1', 0, 3, 2], tide: 0, whole: false, player: true, keepDialogue: true,
    prep: { script: "g.progress.items.anchor = 1; g.progress.equipA = 'anchor'; g.menu.open(); H.step(3);" } },
];
for (let ry = 0; ry < 10; ry++) for (let rx = 0; rx < 12; rx++) {
  for (const t of [1]) STATIC_SHOTS.push({ id: `ow-t${t}-${rx}-${ry}`, room: ['overworld', 0, rx, ry], tide: t });
}
for (const t of [0, 1, 2]) for (const k of D1) {
  const [rx, ry] = k.split(',').map(Number);
  STATIC_SHOTS.push({ id: `d1map-t${t}-${rx}${ry}`, room: ['d1', 0, rx, ry], tide: t });
}
