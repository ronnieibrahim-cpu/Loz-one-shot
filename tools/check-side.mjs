// THE SIDE CONTENT CAN BE WON (S155).
//
// The human's rule for the side content: its heart-piece prizes are EXISTING
// pieces moved off the map, not new ones, and every prize is proved reachable
// by the robot or a checker. `check-hearts.mjs` proves the count still lands;
// this proves each prize can actually be taken, in the real engine, by the
// same actor directives the playthrough uses — a bomb set against the right
// wall, a race run inside its clock, an errand walked there and back.
//
// Each scenario is a stated world (`setup`, the replay shape: items, flags,
// tide, the room to start in) plus a handful of directives, and an assertion
// read off the live game at the end. Most prizes also carry a NEGATIVE
// scenario — the same walk without the thing that is supposed to be needed —
// because a prize that can be taken without its verb is a prize on the floor.
//
// The world the robot never plays: none of these prizes is on the
// playthrough's route, which is why the pieces moved were ones it never
// collected (NEXT-PROMPT S154). So nothing here may lean on the playthrough.
//
// Usage: node tools/check-side.mjs [--only <name>] [--dump <name>]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { installRuntime } from './actor-runtime.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ONLY = (() => { const i = process.argv.indexOf('--only'); return i > 0 ? process.argv[i + 1] : null; })();

const BASE = { seed: 20260806, maxHearts: 12, hearts: 12, tide: 1 };
const setup = (o) => ({ ...BASE, ...o });

// `expect` is evaluated in the page with the game as `g`; it returns true or
// a string saying what was wrong.
const SCENARIOS = [
  {
    name: 'Hollow Den: a bomb opens the cracked wall and the Piece of Heart is inside',
    setup: setup({ items: { sword: 1, bombs: 1 }, equipA: 'sword', equipB: 'bombs',
      enter: ['overworld', 0, 3, 6, 64, 64, 'up'] }),
    steps: [['goto', 4, 2, 400], ['hold', ['up'], 6], ['use', 'bombs', 1, 10],
      ['goto', 4, 4, 200], ['wait', 120], ['goto', 4, 2, 300], ['hold', ['up'], 60],
      ['wait', 60], ['goto', 4, 3, 400], ['hold', ['up'], 30], ['wait', 200]],
    expect: `g.mapId === 'cave5' && g.progress.heartPieces === 1 || ('in ' + g.mapId + ', pieces ' + g.progress.heartPieces)`,
  },
  {
    name: 'Hollow Den: without a bomb the crack is a wall',
    setup: setup({ items: { sword: 1 }, equipA: 'sword',
      enter: ['overworld', 0, 3, 6, 64, 64, 'up'] }),
    steps: [['goto', 4, 2, 400], ['hold', ['up'], 90], ['wait', 30]],
    expect: `g.mapId === 'overworld' || ('walked into ' + g.mapId + ' with no bomb')`,
  },
  {
    name: 'Slackwater Cave: at LOW the mouth is dry, and the Piece of Heart is inside',
    setup: setup({ items: { sword: 1, conch: 1 }, equipA: 'sword', equipB: 'conch', tide: 0,
      enter: ['overworld', 0, 1, 2, 48, 64, 'up'] }),
    steps: [['goto', 3, 2, 400], ['hold', ['up'], 60], ['wait', 60],
      ['goto', 4, 5, 400], ['hold', ['up'], 30], ['wait', 200]],
    expect: `g.mapId === 'cave6' && g.progress.heartPieces === 1 || ('in ' + g.mapId + ', pieces ' + g.progress.heartPieces)`,
  },
  {
    name: 'Slackwater Cave: the conch is held inside, and the way out is dry',
    setup: setup({ items: { sword: 1, conch: 1 }, equipA: 'sword', equipB: 'conch', tide: 0,
      enter: ['cave6', 0, 0, 0, 72, 81, 'up'] }),
    steps: [['use', 'conch', 2, 140], ['goto', 5, 5, 300], ['hold', ['down'], 60], ['wait', 60]],
    expect: `g.mapId === 'overworld' && g.tide.level === 0 && !g.player.inDeep || ('in ' + g.mapId + ' at tide ' + g.tide.level)`,
  },
  ...[1, 2].map(t => ({
    name: `Slackwater Cave: at ${t === 1 ? 'MID' : 'HIGH'} the sea stands in the mouth`,
    setup: setup({ items: { sword: 1, conch: 1 }, equipA: 'sword', equipB: 'conch', tide: t,
      enter: ['overworld', 0, 1, 2, 48, 48, 'up'] }),
    steps: [['hold', ['up'], 180], ['wait', 30]],
    expect: `g.mapId === 'overworld' || ('got into ' + g.mapId + ' at tide ' + g.tide.level)`,
  })),
  {
    name: 'The ledger: found on the South Sands, carried to the shop, paid for with a Piece of Heart',
    setup: setup({ items: { sword: 1 }, equipA: 'sword', tide: 0, enter: ['overworld', 0, 5, 9, 64, 32, 'right'] }),
    steps: [['goto', 8, 2, 400], ['wait', 90], ['travel', 5, 8, 3000], ['wait', 30], ['travel', 5, 7, 3000], ['wait', 30],
      ['goto', 2, 5, 600], ['hold', ['up'], 40], ['wait', 60], ['errand', 'ledgerDone', 1500], ['wait', 60]],
    expect: `g.progress.flags.foundLedger && g.progress.flags.ledgerDone && g.progress.heartPieces === 1 || ('ledger ' + !!g.progress.flags.foundLedger + ', pieces ' + g.progress.heartPieces)`,
  },
  {
    name: 'The ledger: the shopkeeper pays nothing until it is home',
    setup: setup({ items: { sword: 1 }, equipA: 'sword', enter: ['houseShop', 0, 0, 0, 72, 81, 'up'] }),
    steps: [['errand', 'ledgerDone', 600]],
    expectError: /never landed/,
    expect: `g.progress.heartPieces === 0 || 'paid without the ledger'`,
  },
  {
    name: 'The kite: blown out of the tree with the Bellows, carried home, paid for with a Piece of Heart',
    setup: setup({ items: { sword: 1, bellows: 1 }, equipA: 'sword', equipB: 'bellows',
      enter: ['overworld', 0, 3, 6, 112, 64, 'up'] }),
    steps: [['goto', 7, 2, 400], ['hold', ['up'], 6], ['wait', 5], ['hold', ['b'], 80], ['wait', 200],
      ['travel', 3, 7, 3000], ['wait', 30], ['travel', 4, 7, 3000], ['wait', 30],
      ['goto', 2, 5, 600], ['hold', ['up'], 40], ['wait', 60], ['errand', 'kiteDone', 1500], ['wait', 60]],
    expect: `g.progress.flags.foundKite && g.progress.flags.kiteDone && g.progress.heartPieces === 1 || ('kite ' + !!g.progress.flags.foundKite + ', pieces ' + g.progress.heartPieces + ' in ' + g.mapId)`,
  },
  {
    name: 'The kite: a sword does not bring it down',
    setup: setup({ items: { sword: 1 }, equipA: 'sword', enter: ['overworld', 0, 3, 6, 112, 64, 'up'] }),
    steps: [['goto', 7, 2, 400], ['hold', ['up'], 6], ['tap', 'a', 30], ['tap', 'a', 30], ['tap', 'a', 30], ['wait', 60]],
    expect: `!g.progress.flags.foundKite && g.entities.some(e => e.perched) || 'the kite came down without a wind'`,
  },
  // The bog is a long way from the village and the actor's travel planner does
  // not cross the marsh on its own, so this errand is proved in its two halves:
  // the jar is picked up where it lies, and the netmaker pays for it at home.
  // That Bog Head can be walked to at all is check-overworld's and
  // check-progression's to prove, and they do.
  {
    name: 'The bog water: the jar can be picked up at Bog Head',
    setup: setup({ items: { sword: 1, bombs: 1 }, equipA: 'sword', tide: 0,
      enter: ['overworld', 0, 0, 6, 128, 64, 'left'] }),
    steps: [['goto', 4, 5, 600], ['wait', 200]],
    expect: `g.progress.flags.foundBogWater || 'the jar was not picked up'`,
  },
  {
    name: 'The bog water: the netmaker pays a hundred rupees for it',
    setup: setup({ items: { sword: 1 }, equipA: 'sword', flags: ['foundBogWater'], rupees: 0,
      enter: ['houseHearth', 0, 0, 0, 72, 81, 'up'] }),
    steps: [['errand', 'bogwaterDone', 1500], ['wait', 60]],
    expect: `g.progress.rupees === 100 && g.progress.heartPieces === 0 || ('rupees ' + g.progress.rupees)`,
  },
  {
    name: 'The bog water: nothing is paid before the jar is home',
    setup: setup({ items: { sword: 1 }, equipA: 'sword', rupees: 0, enter: ['houseHearth', 0, 0, 0, 72, 81, 'up'] }),
    steps: [['errand', 'bogwaterDone', 600]],
    expectError: /never landed/,
    expect: `g.progress.rupees === 0 || 'paid without the jar'`,
  },
  {
    name: 'The race: at LOW the sand path gets you to Pip inside the clock, for a Piece of Heart',
    setup: setup({ items: { sword: 1 }, equipA: 'sword', tide: 0, enter: ['overworld', 0, 3, 9, 48, 48, 'left'] }),
    steps: [['race', 600], ['goto', 1, 6, 300], ['hold', ['right'], 600], ['wait', 200]],
    expect: `g.progress.flags.raceWon && g.progress.heartPieces === 1 && !g.race || ('won ' + !!g.progress.flags.raceWon + ', pieces ' + g.progress.heartPieces)`,
  },
  {
    name: 'The race: won again, it pays rupees, not a second piece',
    setup: setup({ items: { sword: 1 }, equipA: 'sword', tide: 0, flags: ['raceWon'], rupees: 0,
      enter: ['overworld', 0, 3, 9, 48, 48, 'left'] }),
    steps: [['race', 600], ['goto', 1, 6, 300], ['hold', ['right'], 600], ['wait', 200]],
    expect: `g.progress.rupees === 20 && g.progress.heartPieces === 0 || ('rupees ' + g.progress.rupees + ', pieces ' + g.progress.heartPieces)`,
  },
  {
    name: 'The race: dawdle at the start and the clock runs out',
    setup: setup({ items: { sword: 1 }, equipA: 'sword', tide: 0, enter: ['overworld', 0, 3, 9, 48, 48, 'left'] }),
    steps: [['race', 600], ['wait', 240], ['goto', 1, 6, 300], ['hold', ['right'], 900], ['wait', 200]],
    expect: `!g.progress.flags.raceWon && g.progress.heartPieces === 0 && !g.race || 'won after dawdling'`,
  },
  ...[1, 2].map(t => ({
    name: `The race: at ${t === 1 ? 'MID' : 'HIGH'} the sand path is under the sea and Pip cannot be reached`,
    setup: setup({ items: { sword: 1 }, equipA: 'sword', tide: t, enter: ['overworld', 0, 3, 9, 48, 48, 'left'] }),
    steps: [['race', 600], ['hold', ['down'], 60], ['hold', ['right'], 600], ['wait', 200]],
    expect: `!g.progress.flags.raceWon && !g.race || 'reached Pip at tide ' + g.tide.level`,
  })),
  {
    name: 'The dive: Dov asks, all five casks come up in one breath, and he pays a Piece of Heart',
    setup: setup({ items: { sword: 1, cleats: 1 }, equipA: 'sword', equipB: 'cleats',
      enter: ['overworld', 0, 11, 9, 64, 48, 'down'] }),
    steps: [['errandAsk', 'diveDone', 900], ['goto', 1, 4, 400], ['soles', 'sink'],
      ['goto', 2, 5, 300], ['goto', 4, 6, 300], ['goto', 5, 5, 300], ['goto', 7, 6, 300], ['goto', 7, 5, 300],
      ['wait', 120], ['goto', 8, 4, 400], ['wait', 30], ['errand', 'diveDone', 1500], ['wait', 60]],
    expect: `g.progress.flags.salvageDone && g.progress.flags.diveDone && g.progress.heartPieces === 1 || ('salvage ' + !!g.progress.flags.salvageDone + ', pieces ' + g.progress.heartPieces)`,
  },
  {
    name: 'The dive: surface with two casks and they sink back where they lay',
    setup: setup({ items: { sword: 1, cleats: 1 }, equipA: 'sword', equipB: 'cleats',
      enter: ['overworld', 0, 11, 9, 64, 48, 'down'] }),
    steps: [['errandAsk', 'diveDone', 900], ['goto', 1, 4, 400], ['soles', 'sink'],
      ['goto', 2, 5, 300], ['goto', 4, 6, 300], ['goto', 1, 4, 400], ['wait', 60]],
    expect: `!g.progress.flags.salvageDone && !g.dive && g.entities.filter(e => e.kind === 'salvage' && !e.remove).length === 5 || ('casks lying: ' + g.entities.filter(e => e.kind === 'salvage' && !e.remove).length)`,
  },
  {
    name: 'The dive: a swimmer on the surface passes over the casks and takes none',
    setup: setup({ items: { sword: 1, cleats: 1 }, equipA: 'sword', equipB: 'cleats',
      enter: ['overworld', 0, 11, 9, 64, 48, 'down'] }),
    steps: [['errandAsk', 'diveDone', 900], ['goto', 1, 4, 400], ['soles', 'swim'],
      ['hold', ['down'], 20], ['hold', ['right'], 40], ['wait', 20]],
    expect: `!g.dive && g.entities.filter(e => e.kind === 'salvage' && !e.remove).length === 5 && g.player.inDeep || ('deep ' + g.player.inDeep + ', casks ' + g.entities.filter(e => e.kind === 'salvage' && !e.remove).length)`,
  },
  // THE SALT PAN'S LOWER VAULT (S160), an optional dungeon: the Kilnshell's.
  // One run from the Kiln Stair to the Saltwraith's Piece of Heart, the fire
  // struck in the dry kiln each time and carried down lit, thrown at LOW over
  // the sumps and into the kelp. The pan is fought at HIGH, where brine thins
  // the wraith's bolts (tools/check-kiln.mjs proves each throw on its own).
  {
    name: "The Lower Vault: the fire carried down from the kiln and thrown at LOW wins the Saltwraith's Piece of Heart",
    setup: setup({ items: { sword: 1, conch: 1, kilnshell: 1 }, equipA: 'sword', equipB: 'kilnshell',
      maxHearts: 64, hearts: 64, tide: 0, enter: ['vault', 0, 1, 2, 112, 128, 'up'] }),
    steps: [
      // the Kiln Stair: strike into the tangle, lift the shell
      ['goto', 7, 4, 600], ['hold', ['up'], 2], ['use', 'kilnshell', 1, 30], ['wait', 20], ['tap', 'a', 30],
      ['goto', 7, 1, 600], ['hold', ['up'], 40], ['wait', 20],
      // the Sump: thrown from the bank to the island brazier
      ['goto', 3, 5, 1200], ['hold', ['right'], 2], ['tap', 'a', 90],
      // back to the kiln for a new flame, and on to the Kelp Cell
      ['goto', 7, 9, 1200], ['hold', ['down'], 40], ['wait', 20],
      ['goto', 7, 4, 800], ['hold', ['down'], 2], ['use', 'kilnshell', 1, 30], ['tap', 'a', 30],
      ['goto', 7, 1, 600], ['hold', ['up'], 40], ['wait', 20],
      ['goto', 13, 5, 1200], ['hold', ['right'], 40], ['wait', 30],
      ['goto', 7, 5, 1200], ['hold', ['up'], 2], ['tap', 'a', 90],
      ['goto', 7, 2, 600], ['hold', ['left'], 2], ['tap', 'a', 30], ['dialogue', 300], ['wait', 30],
      ['goto', 7, 1, 400], ['hold', ['left'], 24], ['wait', 20],
      // the Small Key turned in the Sump's west door, with empty hands
      ['goto', 7, 5, 600], ['hold', ['down'], 2], ['goto', 1, 5, 1200], ['hold', ['left'], 40], ['wait', 20],
      ['goto', 1, 5, 600], ['hold', ['left'], 8], ['tap', 'a', 30], ['dialogue', 300], ['wait', 20],
      ['goto', 7, 9, 1200], ['hold', ['down'], 40], ['wait', 20],
      ['goto', 7, 4, 800], ['hold', ['down'], 2], ['use', 'kilnshell', 1, 30], ['tap', 'a', 30],
      ['goto', 7, 1, 600], ['hold', ['up'], 40], ['wait', 20],
      ['goto', 1, 5, 1200], ['hold', ['left'], 40], ['wait', 30],
      // the Brine Gallery: one throw at the tangle burns it and, resting a
      // tile from the near brazier, lights that too (S162); lift it, then the island
      // S164: carrying no longer slows Link, so the shell lands a step out of
      // reach of where he threw it from — walk up to it before lifting.
      ['goto', 3, 6, 1200], ['hold', ['up'], 2], ['tap', 'a', 90],
      ['goto', 3, 5, 600], ['hold', ['up'], 2], ['tap', 'a', 30],
      ['goto', 9, 5, 1200], ['hold', ['down'], 1], ['tap', 'a', 90],
      ['goto', 7, 1, 1200], ['hold', ['up'], 40], ['wait', 20],
      // the Kiln Walk: dry, so struck where it is needed
      ['fight', 3000, 3000], ['goto', 11, 5, 1200], ['hold', ['right'], 2], ['use', 'kilnshell', 1, 40], ['wait', 30],
      ['goto', 13, 5, 600], ['hold', ['right'], 40], ['wait', 40],
      // the Saltwraith's Pan, at HIGH
      ['equip', 'conch', 'B', 120], ['tide', 2, 20, 600], ['wait', 60], ['goto', 3, 5, 600],
      // S164: `reachSwing` (swept eight option sets; it wins at every entry
      // wait from 30 to 120 frames, the plain fight no longer does). Then
      // walking went to Seasons' 1 px/f: on 64 quarter-hearts (as the Eyrie
      // and the eel are given more) it wins at every wait swept; every goto's
      // time limit in this run was doubled, and the key door wants 8 frames of
      // lean instead of 4.
      ['boss', 14000, 'saltwraith', { reachSwing: true }], ['wait', 120], ['loot', 900], ['wait', 60],
    ],
    expect: `g.progress.flags.vault_wraith && g.progress.heartPieces === 1 || ('wraith ' + !!g.progress.flags.vault_wraith + ', pieces ' + g.progress.heartPieces + ' in ' + g.room.key)`,
  },
  // A SOLVED TORCH ROOM COMES BACK LIT (S162). The puzzle's flag and door
  // were remembered on re-entry and the flames were not.
  {
    name: 'The Lower Vault: walk back into the solved Sump and its brazier is still burning',
    setup: setup({ items: { sword: 1 }, equipA: 'sword', tide: 0, flags: ['vault_sump'],
      enter: ['vault', 0, 1, 1, 112, 144, 'up'] }),
    steps: [['wait', 10]],
    expect: `g.entities.some(e => e.constructor.name === 'Torch') && g.entities.filter(e => e.constructor.name === 'Torch').every(t => t.lit) || 'a torch is dark'`,
  },
  {
    name: 'The Lower Vault: an unsolved Sump\'s brazier is dark',
    setup: setup({ items: { sword: 1 }, equipA: 'sword', tide: 0,
      enter: ['vault', 0, 1, 1, 112, 144, 'up'] }),
    steps: [['wait', 10]],
    expect: `g.entities.filter(e => e.constructor.name === 'Torch').every(t => !t.lit) || 'a torch is lit'`,
  },
  {
    name: 'The Lower Vault: without the Kilnshell the tangle on the Kiln Stair is a wall',
    setup: setup({ items: { sword: 1, conch: 1 }, equipA: 'sword', equipB: 'conch', tide: 0,
      enter: ['vault', 0, 1, 2, 112, 128, 'up'] }),
    steps: [['goto', 7, 4, 300], ['hold', ['up'], 90], ['tap', 'a', 30], ['hold', ['up'], 60], ['wait', 20]],
    expect: `g.room.key === '0,1,2' && g.room.baseName(7, 3) === 'dTangleSalt' || ('got to ' + g.room.key)`,
  },
  // THE GULLWIND EYRIE (S160), an optional dungeon: the Ferryman's Coin's.
  // One run from the Gull Stair to the Gustharpy's Piece of Heart: every
  // crossing a throw and a turn of the tide, the coin recalled before each
  // new throw because after a swap it lies where Link stood. The High Water
  // Wall is crossed at HIGH and arrived at LOW (tools/check-coin.mjs proves
  // each crossing on its own). The Gustharpy is fought at LOW, where its
  // downdraught has no sea to push with.
  {
    name: "The Gullwind Eyrie: every drop crossed by the coin and the tide wins the Gustharpy's Piece of Heart",
    setup: setup({ items: { sword: 1, conch: 1, coin: 1, cleats: 1 }, equipA: 'conch', equipB: 'coin',
      maxHearts: 64, hearts: 64, tide: 0, enter: ['eyrie', 0, 1, 2, 112, 128, 'up'] }),
    steps: [
      ['goto', 7, 7, 300],
      ['hold', ['up'], 2],
      ['use', 'coin', 1, 50],
      ['tide', 1, 20, 600],
      ['wait', 90],
      ['goto', 7, 1, 300],
      ['hold', ['up'], 40],
      ['wait', 20],
      ['goto', 13, 5, 600],
      ['hold', ['right'], 40],
      ['wait', 20],
      ['use', 'coin', 1, 30],
      ['dialogue', 200],
      ['goto', 2, 5, 400],
      ['hold', ['right'], 2],
      ['use', 'coin', 1, 50],
      ['tide', 2, 20, 600],
      ['wait', 90],
      ['hold', ['right'], 4],
      ['tap', 'a', 30],
      ['dialogue', 300],
      ['wait', 20],
      ['goto', 7, 4, 200],
      ['wait', 20],
      ['tide', 0, 20, 600],
      ['wait', 90],
      ['goto', 1, 5, 400],
      ['hold', ['left'], 40],
      ['wait', 20],
      ['goto', 1, 5, 300],
      ['hold', ['left'], 4],
      ['tap', 'a', 30],
      ['dialogue', 300],
      ['wait', 20],
      ['hold', ['left'], 40],
      ['wait', 20],
      ['use', 'coin', 1, 30],
      ['dialogue', 200],
      ['tide', 2, 20, 900],
      ['wait', 60],
      ['goto', 3, 6, 400],
      ['hold', ['up'], 2],
      ['use', 'coin', 1, 50],
      ['tide', 0, 20, 600],
      ['wait', 90],
      ['goto', 3, 1, 300],
      ['hold', ['up'], 40],
      ['wait', 20],
      ['use', 'coin', 1, 30],
      ['dialogue', 200],
      ['goto', 3, 5, 400],
      ['hold', ['right'], 2],
      ['use', 'coin', 1, 50],
      ['tide', 1, 20, 600],
      ['wait', 90],
      ['use', 'coin', 1, 30],
      ['dialogue', 200],
      ['hold', ['right'], 2],
      ['use', 'coin', 1, 50],
      ['tide', 2, 20, 600],
      ['wait', 90],
      ['goto', 13, 5, 300],
      ['hold', ['right'], 40],
      ['wait', 20],
      ['use', 'coin', 1, 30],
      ['dialogue', 200],
      ['tide', 0, 20, 600],
      ['wait', 40],
      ['equip', 'sword', 'A', 120],
      ['goto', 3, 5, 300],
      // S164: walking at Seasons' 1 px/f, the robot no longer wins this on 32
      // quarter-hearts at more than two entry waits; on 64 with the diagonal
      // retreat it wins at five of six (1-90 frames). The robot is not the
      // player (item 5 on the list is the human's tuning); this proves the
      // dungeon can be finished, as the eel scenario's 200 does.
      ['boss', 14000, 'gustharpy', { diagRetreat: true, reachSwing: true }],
      ['wait', 120],
      ['loot', 900],
      ['wait', 60],
    ],
    expect: `g.progress.flags.eyrie_harpy && g.progress.heartPieces === 1 || ('harpy ' + !!g.progress.flags.eyrie_harpy + ', pieces ' + g.progress.heartPieces + ' in ' + g.room.key)`,
  },
  {
    name: 'The Gullwind Eyrie: without the coin the Gull Stair is a drop, and the tide changes nothing',
    setup: setup({ items: { sword: 1, conch: 1 }, equipA: 'sword', equipB: 'conch', tide: 0,
      enter: ['eyrie', 0, 1, 2, 112, 128, 'up'] }),
    steps: [['goto', 7, 7, 300], ['use', 'conch', 1, 90], ['use', 'conch', 1, 90], ['use', 'conch', 1, 90], ['wait', 30]],
    expect: `g.room.key === '0,1,2' && g.player.y > 100 || ('got to ' + g.room.key + ' at ' + g.player.x + ',' + g.player.y)`,
  },
  // THE SUNKEN PALACE (S161), an optional dungeon: the whirlpools'. HIGH takes
  // you down through them, LOW walks across them. Each prize is taken from a
  // stated world in its own room (tools/check-whirlpool.mjs proves every
  // whirlpool, and walk-dungeons that the rooms join up), and each is refused
  // at the sea that should refuse it.
  {
    // THE WHOLE PALACE IN ONE RUN (S162), from the Porch's door to the eel:
    // both Small Keys, the Boss Key from the cellar only the Weir's whirlpool
    // reaches, the boss door, the Throne Pool's drop at HIGH and Thalassor at
    // LOW. Until S162 the Palace was proved room by room and never walked
    // through, which is how its Boss Key could come to rest inside a wall
    // with every tool green. Handed the same bar as the eel scenario below.
    name: "The Sunken Palace: one run from the door, down and up both floors, wins Thalassor's Piece of Heart",
    setup: setup({ items: { sword: 2, conch: 1, anchor: 1, cleats: 1, bombs: 1 }, equipA: 'sword', equipB: 'conch',
      maxHearts: 200, hearts: 200, tide: 0, enter: ['palace', 1, 1, 2, 112, 144, 'up'] }),
    steps: [
      // the Palace Stair: down the stair (the pools are the way down too, at HIGH)
      ['goto', 12, 8, 400], ['wait', 40],
      // Beneath the Stair -> the Undercroft -> Under the Gallery
      ['goto', 7, 1, 400], ['hold', ['up'], 40], ['wait', 20],
      ['goto', 1, 5, 400], ['hold', ['left'], 40], ['wait', 20],
      // up the stair to the Whirl Gallery's island: the first Small Key
      ['goto', 6, 6, 400], ['wait', 40],
      ['goto', 8, 5, 200], ['hold', ['up'], 4], ['tap', 'a', 60], ['dialogue', 300], ['loot', 400], ['wait', 20],
      ['goto', 6, 6, 300], ['wait', 40],
      // back east, and the first key turned in the Undercroft's east door
      ['goto', 13, 5, 500], ['hold', ['right'], 40], ['wait', 20],
      ['goto', 13, 5, 300], ['hold', ['right'], 4], ['tap', 'a', 30], ['dialogue', 300], ['wait', 20],
      ['hold', ['right'], 40], ['wait', 20],
      // Under the Court: the sumps are a hole at LOW, a swim above it
      ['tide', 1, 20, 600], ['wait', 60],
      ['goto', 12, 5, 600], ['wait', 40],
      // the Sluice Court: wade the pool at LOW for the second key
      ['tide', 0, 20, 600], ['wait', 60],
      ['goto', 6, 6, 400], ['hold', ['up'], 4], ['tap', 'a', 60], ['dialogue', 300], ['loot', 400], ['wait', 20],
      ['goto', 12, 5, 400], ['wait', 40],
      // the second key in Under the Court's north door
      ['goto', 11, 1, 400], ['hold', ['up'], 4], ['tap', 'a', 30], ['dialogue', 300], ['wait', 20],
      ['hold', ['up'], 40], ['wait', 20],
      // Under the Weir, up its stair to the Weir: at HIGH swim the rim into the
      // whirlpool, down into the sealed cellar — the Boss Key
      ['goto', 12, 8, 400], ['wait', 40],
      ['tide', 2, 20, 900], ['wait', 60],
      ['goto', 8, 4, 400], ['hold', ['left'], 90], ['wait', 90],
      ['goto', 8, 5, 300], ['hold', ['up'], 4], ['tap', 'a', 60], ['dialogue', 300], ['loot', 400], ['wait', 20],
      ['goto', 8, 6, 300], ['wait', 40],
      // and home: down, south, west over the sumps (a swim at HIGH), back up the
      // first stair and north to the Hall of Tides
      ['goto', 12, 8, 300], ['wait', 40],
      ['goto', 11, 9, 400], ['hold', ['down'], 40], ['wait', 20],
      ['goto', 1, 5, 600], ['hold', ['left'], 40], ['wait', 20],
      ['tide', 0, 20, 900], ['wait', 30],
      ['goto', 7, 9, 600], ['hold', ['down'], 40], ['wait', 20],
      ['goto', 12, 8, 400], ['wait', 40],
      ['goto', 7, 1, 600], ['hold', ['up'], 40], ['wait', 20],
      ['fight', 3000, 3000],
      ['goto', 7, 1, 600], ['hold', ['up'], 4], ['tap', 'a', 30], ['dialogue', 300], ['wait', 20],
      ['hold', ['up'], 40], ['wait', 20],
      ['tide', 2, 20, 900], ['wait', 30],
      // the Throne Pool at HIGH: down to Thalassor, who is fought at LOW
      ['hold', ['up'], 200], ['wait', 90],
      ['tide', 0, 20, 900], ['wait', 30],
      ['boss', 20000, 'thalassor'], ['wait', 120], ['hold', ['up'], 24], ['goto', 7, 8, 400], ['loot', 900], ['wait', 60],
      // and the stair out, once the eel is beaten
      ['goto', 2, 9, 400], ['wait', 60],
    ],
    expect: `g.progress.flags.palace_eel && g.progress.heartPieces === 1 && g.progress.bossKeys.palace || ('eel ' + !!g.progress.flags.palace_eel + ', boss key ' + !!g.progress.bossKeys.palace + ', pieces ' + g.progress.heartPieces + ' in ' + g.room.key)`,
  },
  {
    name: "The Sunken Palace: the Anchor holds the Chapel's whirlpools at LOW while HIGH covers the wall — a Piece of Heart",
    setup: setup({ items: { sword: 2, conch: 1, anchor: 1, cleats: 1 }, equipA: 'anchor', equipB: 'conch',
      maxHearts: 24, hearts: 24, tide: 0, enter: ['palace', 1, 0, 2, 48, 144, 'up'] }),
    steps: [
      ['goto', 7, 8, 300], ['hold', ['up'], 2], ['use', 'anchor', 1, 60],
      ['tide', 2, 20, 900], ['wait', 60],
      ['goto', 7, 4, 300], ['hold', ['up'], 50], ['wait', 60],
    ],
    expect: `g.progress.heartPieces === 1 && g.room.key === '1,0,2' || ('pieces ' + g.progress.heartPieces + ' in ' + g.room.key)`,
  },
  {
    name: 'The Sunken Palace: without the Anchor, HIGH takes you down through the Chapel\'s whirlpools',
    setup: setup({ items: { sword: 2, conch: 1, cleats: 1 }, equipA: 'sword', equipB: 'conch',
      maxHearts: 24, hearts: 24, tide: 2, enter: ['palace', 1, 0, 2, 48, 144, 'up'] }),
    steps: [['goto', 7, 8, 300], ['hold', ['up'], 120], ['wait', 90]],
    expect: `g.progress.heartPieces === 0 && g.room.key === '0,0,2' || ('pieces ' + g.progress.heartPieces + ' in ' + g.room.key)`,
  },
  {
    name: 'The Sunken Palace: sound LOW and wade the Pearl Vault\'s ring — the Coilbone',
    setup: setup({ items: { sword: 2, conch: 1, cleats: 1 }, equipA: 'sword', equipB: 'conch',
      maxHearts: 24, hearts: 24, tide: 2, enter: ['palace', 1, 0, 0, 192, 144, 'up'] }),
    steps: [['tide', 0, 20, 900], ['wait', 60], ['goto', 7, 5, 400], ['hold', ['up'], 2], ['tap', 'a', 60], ['dialogue', 300], ['wait', 20]],
    expect: `!!g.progress.charms.coilbone || ('no Coilbone; in ' + g.room.key)`,
  },
  {
    name: 'The Sunken Palace: at HIGH the Pearl Vault\'s ring takes you back down',
    setup: setup({ items: { sword: 2, conch: 1, cleats: 1 }, equipA: 'sword', equipB: 'conch',
      maxHearts: 24, hearts: 24, tide: 2, enter: ['palace', 1, 0, 0, 112, 144, 'up'] }),
    steps: [['hold', ['up'], 160], ['wait', 90]],
    expect: `!g.progress.charms.coilbone && g.room.key === '0,0,0' || ('coilbone ' + !!g.progress.charms.coilbone + ' in ' + g.room.key)`,
  },
  {
    name: "The Sunken Palace: at HIGH the Throne Pool takes you down to Thalassor — beaten at LOW, a Piece of Heart",
    setup: setup({ items: { sword: 2, conch: 1, cleats: 1 }, equipA: 'sword', equipB: 'conch',
      // The robot is a clumsy fighter (it spent ~38 hearts here at S161); the
      // fight is not tuned to it (S150), so it is handed the bar it needs.
      maxHearts: 200, hearts: 200, tide: 2, enter: ['palace', 1, 1, 0, 112, 144, 'up'] }),
    steps: [
      ['hold', ['up'], 200], ['wait', 90],
      ['tide', 0, 20, 900], ['wait', 30],
      ['boss', 20000, 'thalassor'], ['wait', 120], ['tide', 0, 140, 900],
      // S166: the fight can end with the robot on the stair out, which opens
      // with the eel's death; step up off it before going for the loot.
      ['hold', ['up'], 32], ['goto', 1, 6, 400], ['loot', 900], ['wait', 60],
    ],
    expect: `g.progress.flags.palace_eel && g.progress.heartPieces === 1 || ('eel ' + !!g.progress.flags.palace_eel + ', pieces ' + g.progress.heartPieces + ' in ' + g.room.key)`,
  },
  {
    name: 'The Sunken Palace: below HIGH the Throne Pool\'s rim is a wall',
    setup: setup({ items: { sword: 2, conch: 1, cleats: 1 }, equipA: 'sword', equipB: 'conch',
      maxHearts: 24, hearts: 24, tide: 1, enter: ['palace', 1, 1, 0, 112, 144, 'up'] }),
    steps: [['hold', ['up'], 200], ['wait', 30]],
    expect: `g.room.key === '1,1,0' || ('got to ' + g.room.key)`,
  },
];

// --dump <name>: print the first matching scenario's {setup, steps} as JSON
// and stop — the shape tools/film-steps.mjs and shoot-steps.mjs take.
if (process.argv.includes('--dump')) {
  const k = process.argv[process.argv.indexOf('--dump') + 1].toLowerCase();
  const sc = SCENARIOS.find(s => s.name.toLowerCase().includes(k));
  console.log(JSON.stringify({ setup: sc.setup, steps: sc.steps }));
  process.exit(0);
}

const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const full = join(ROOT, normalize(p)); const s = await stat(full).catch(() => null);
  if (!s || !s.isFile()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': extname(full) === '.html' ? 'text/html' : 'text/javascript' }); res.end(await readFile(full));
});
await new Promise(r => server.listen(0, r));
const PORT = server.address().port;
const browser = await chromium.launch().catch(() =>
  chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' }));

let pass = 0, fail = 0;
for (const sc of SCENARIOS) {
  if (ONLY && !sc.name.toLowerCase().includes(ONLY.toLowerCase())) continue;
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto(`http://localhost:${PORT}/index.html?seed=20260806`);
  await page.waitForFunction(() => !!window.__game && !!window.__harness);
  await page.evaluate(installRuntime);
  await page.evaluate(([s, st]) => window.__rp.beginRecord(s, st), [sc.setup, sc.steps]);
  let err = null;
  for (let i = 0; i < 8000; i++) {
    let r;
    try { r = await page.evaluate(n => window.__rp.pump(n), 100); } catch (e) { err = e.message.split('\n')[0]; break; }
    if (r.done || r.error) { if (r.error) err = r.error; break; }
  }
  // A scenario that is SUPPOSED to be refused names the refusal it expects.
  if (sc.expectError) {
    if (!err || !sc.expectError.test(err)) err = 'expected a refusal matching ' + sc.expectError + ', got ' + (err || 'none');
    else err = null;
  }
  let verdict = err ? 'directive failed: ' + err : null;
  if (!verdict) {
    const v = await page.evaluate(src => { const g = window.__game; return eval(src); }, sc.expect);
    verdict = v === true ? null : String(v);
  }
  if (!verdict && errs.length) verdict = 'page error: ' + errs[0];
  if (verdict) { fail++; console.log(`  FAIL ${sc.name}\n       ${verdict}`); }
  else { pass++; console.log(`  ok   ${sc.name}`); }
  await page.close();
}
await browser.close(); server.close();
console.log(`\n=== ${pass} passed, ${fail} failed ===`);
process.exit(fail ? 1 : 0);
