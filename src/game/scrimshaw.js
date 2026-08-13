// Scrimshaw — carved bone charms, and the passive system that replaced rings.
//
// THE RULE THAT MAKES IT OURS: a charm is slotted BY TIDE LEVEL, and it only
// works while the water is at that level. A charm in the LOW case is dead at
// HIGH tide. You carry three loadouts, not one, and sounding the conch changes
// what you are good at as well as where you can walk.
//
// Two consequences worth stating out loud, because both are load-bearing:
//
//   1. The level that decides is the one UNDER THE PLAYER'S FEET, not the
//      base. The tide is a field (see CLAUDE.md), so standing inside the
//      Tidewright's Anchor's held patch keeps that patch's charms alive while
//      the rest of the room has moved on. That is deliberate: it gives the
//      Anchor a second, quieter use, and it is the reading a player will
//      assume the first time they try it.
//   2. A charm is pure data here. Nothing in this file applies an effect —
//      the systems affected ask `game.charm(id)` themselves, exactly as they
//      used to ask `hasRing`. A charm with no reader is a charm that does
//      nothing, which is what tools/check-charms.mjs exists to catch.
//
// Slots: 'low' | 'mid' | 'high' name the case a charm fits, and match tide
// levels 0/1/2. 'any' fits all three cases — those are the cross-slot charms,
// and being placeable is the whole of what makes them special.

import { TIDE_COUNT } from './tide.js';
import { tideAt } from './entity.js';
import {
  NEAP_GRACE_FRAMES, CHARM_CASE_MAX,
  CHARM_LOW_ESSENCES, CHARM_HIGH_ESSENCES, CHARM_CASE_ESSENCES,
} from '../data/feel.js';

/** Case names, indexed by tide level. */
export const CHARM_SLOTS = ['low', 'mid', 'high'];

/**
 * The roster. Thirty charms; every one of them is read somewhere in src/, and
 * tools/check-charms.mjs proves each in-engine.
 *
 * `slot`  which case it fits ('any' fits all three)
 * `desc`  one line, and it is the whole specification of the effect
 * `color` palette for the carved-bone icon, so a case reads at a glance
 */
export const CHARMS = {
  // ---- LOW: exposed floor, dry ground ------------------------------------
  dunerunner: { slot: 'low', name: 'Dunerunner', color: 'sand',
    desc: 'Sand and salt crust no longer slow you.' },
  wreckersEye: { slot: 'low', name: "Wrecker's Eye", color: 'gold',
    desc: 'Chests and buried secrets glimmer through the terrain.' },
  saltEtched: { slot: 'low', name: 'Salt-Etched', color: 'stone',
    desc: 'Sword +1 damage while any part of the room is dry.' },
  beachcomber: { slot: 'low', name: 'Beachcomber', color: 'rupee',
    desc: 'Enemies drop double rupees.' },
  strandwalker: { slot: 'low', name: 'Strandwalker', color: 'heart',
    desc: 'You recover slowly while both feet are on dry ground.' },
  dryKindling: { slot: 'low', name: 'Dry Kindling', color: 'fire',
    desc: 'Bombs blast wider.' },
  gullsTally: { slot: 'low', name: "Gull's Tally", color: 'npc',
    desc: 'Dropped pickups take twice as long to fade.' },
  chandlersEye: { slot: 'low', name: "Chandler's Eye", color: 'tree',
    desc: 'Shopkeepers charge you a quarter less.' },

  // ---- MID: general -------------------------------------------------------
  splitFang: { slot: 'mid', name: 'Split Fang', color: 'stone',
    desc: 'Your sword sweeps a wider arc.' },
  ballastHeart: { slot: 'mid', name: 'Ballast Heart', color: 'enemyb',
    desc: 'Knockback taken is halved.' },
  barnacleSkin: { slot: 'mid', name: 'Barnacle Skin', color: 'marble',
    desc: 'One free hit per room; it cracks until you leave.' },
  quartermaster: { slot: 'mid', name: "Quartermaster's Mark", color: 'grass',
    desc: 'Carry two more Reefseeds.' },
  lamplighter: { slot: 'mid', name: "Lamplighter's Wick", color: 'gold',
    desc: 'Dark rooms are less dark.' },
  bosunsWhistle: { slot: 'mid', name: "Bosun's Whistle", color: 'essence',
    desc: 'The conch sounds faster.' },
  potHauler: { slot: 'mid', name: 'Pot-Hauler', color: 'brick',
    desc: 'Carrying something no longer slows you.' },
  coilrope: { slot: 'mid', name: 'Coilrope', color: 'wood',
    desc: 'The Dredge Line reaches one tile further.' },

  // ---- HIGH: submerged ----------------------------------------------------
  gillcarve: { slot: 'high', name: 'Gillcarve', color: 'water',
    desc: 'Your breath never runs out on the seafloor.' },
  riptideFin: { slot: 'high', name: 'Riptide Fin', color: 'water',
    desc: 'You swim half again as fast.' },
  anemonesGift: { slot: 'high', name: "Anemone's Gift", color: 'enemyg',
    desc: 'Contact damage from sea creatures is halved.' },
  drownedLantern: { slot: 'high', name: 'Drowned Lantern', color: 'magic',
    desc: 'Dark rooms are less dark.' },
  pressureScar: { slot: 'high', name: 'Pressure Scar', color: 'marble',
    desc: 'Diving and surfacing take half as long.' },
  kelpBraid: { slot: 'high', name: 'Kelp Braid', color: 'grass',
    desc: 'Currents push you half as hard.' },
  brineSkin: { slot: 'high', name: 'Brine Skin', color: 'enemyb',
    desc: 'Spikes, lava and other hazards hurt half as much.' },
  ballastLung: { slot: 'high', name: 'Ballast Lung', color: 'stone',
    desc: 'You may draw the sword on the seafloor.' },

  // ---- cross-slot: the interesting ones -----------------------------------
  wrackbone: { slot: 'any', name: 'Wrackbone', color: 'lava',
    desc: 'Double sword damage, double damage taken.' },
  neapCharm: { slot: 'any', name: 'Neap Charm', color: 'essence',
    desc: 'Your charms linger three seconds after the tide leaves them.' },
  fishermansRegret: { slot: 'any', name: "Fisherman's Regret", color: 'npc',
    desc: 'The case one level below the tide stays awake too.' },
  deadweight: { slot: 'any', name: 'Deadweight', color: 'stone',
    desc: 'No current can move you, and you are slower everywhere.' },
  hagstone: { slot: 'any', name: 'Hagstone', color: 'magic',
    desc: 'One hit in four passes straight through you.' },
  seawolfsTooth: { slot: 'any', name: "Sea-Wolf's Tooth", color: 'enemyr',
    desc: 'Your sword knocks enemies twice as far.' },
};

export const CHARM_COUNT = Object.keys(CHARMS).length;

/** Fresh, empty case set. Shape matters: migrate() rebuilds it from here. */
export function newCharmSlots() {
  return { low: [null, null], mid: [null, null], high: [null, null] };
}

export function fitsSlot(id, slot) {
  const c = CHARMS[id];
  if (!c) return false;
  return c.slot === 'any' || c.slot === slot;
}

export function ownedCharms(progress) {
  return Object.keys(CHARMS).filter(id => progress.charms[id]);
}

/** Owned charms that could go in this case, in roster order. */
export function charmsForSlot(progress, slot) {
  return ownedCharms(progress).filter(id => fitsSlot(id, slot));
}

export function giveCharm(progress, id) {
  if (!CHARMS[id] || progress.charms[id]) return false;
  progress.charms[id] = true;
  return true;
}

/**
 * Put `id` in case `slot` at `index`, or clear it when `id` is null.
 * A charm may only be in one place at a time, so it is pulled out of wherever
 * it already was first — otherwise the second copy would double every effect
 * that counts rather than tests.
 */
export function slotCharm(progress, slot, index, id) {
  const cases = progress.charmSlots;
  if (!cases || !cases[slot]) return false;
  if (index < 0 || index >= caseSize(progress)) return false;
  if (id != null) {
    if (!progress.charms[id] || !fitsSlot(id, slot)) return false;
    if (!slotOpen(progress, slot)) return false;
    for (const s of CHARM_SLOTS) {
      const at = cases[s].indexOf(id);
      if (at >= 0) cases[s][at] = null;
    }
  }
  cases[slot][index] = id;
  return true;
}

/** How many charms fit in each case. The late-game case upgrade makes it 2. */
export function caseSize(progress) {
  return Math.max(1, Math.min(CHARM_CASE_MAX, progress.charmCase || 1));
}

export function slotOpen(progress, slot) {
  return !!(progress.charmOpen && progress.charmOpen[slot]);
}

/**
 * Open whatever the essence count has earned, and return the line to say — or
 * null if nothing changed.
 *
 * THE CASES OPEN ON THE ESSENCE, NOT ON THE VISIT, and that is a decision D2
 * had to make rather than inherit. This used to live inside
 * `Scrimshander.interact` and fire only when the player TALKED to her, which
 * meant `CHARM_LOW_ESSENCES = 2` — the Coral Spire's own essence — could land
 * on a player who had no reason to walk back to Tidewatch. That is a real save
 * in which you own charms you can never switch on, and it is invisible: every
 * checker stays green because the charm system works perfectly and simply is
 * not turned on.
 *
 * So the shard opens the case. The scrimshander keeps the line — she says it
 * the first time you see her afterwards — but she is the acknowledgement now
 * rather than the gate. `told` is what stops her saying it twice.
 */
export function openCharmCases(progress) {
  const p = progress;
  if (!p.charmOpen) return null;
  const n = (p.essences || []).length;
  if (n >= CHARM_LOW_ESSENCES && !p.charmOpen.low) {
    p.charmOpen.low = true;
    return 'A second case has cut itself into your kit — for the low\nwater, when the floor of the sea is a road.';
  }
  if (n >= CHARM_HIGH_ESSENCES && !p.charmOpen.high) {
    p.charmOpen.high = true;
    return 'A third case, for the high water. Bone keeps better wet\nthan you would think.';
  }
  if (n >= CHARM_CASE_ESSENCES && (p.charmCase || 1) < CHARM_CASE_MAX) {
    p.charmCase = CHARM_CASE_MAX;
    return 'Every case takes two now. You have earned the room.';
  }
  return null;
}

/** What is actually in a case, trimmed to the case's current size. */
export function equippedIn(progress, slot) {
  const cases = progress.charmSlots;
  if (!cases || !cases[slot]) return [];
  return cases[slot].slice(0, caseSize(progress)).filter(Boolean);
}

// ---------------------------------------------------------------- runtime

/**
 * The live half of the system: which cases are awake this frame.
 *
 * Kept on the Game as `game.scrim` and ticked once per update, because two of
 * the charms are about the TRANSITION between tide states and so need a memory
 * of the frame before. `game.charm(id)` is the only thing the rest of the
 * engine should call.
 */
export class Scrimshaw {
  constructor(game) {
    this.game = game;
    this.liveSlots = new Set(['mid']);
    this.active = new Set();
    this.prevSlot = null;
    this.graceSlot = null;
    this.graceT = 0;
    this.wasNeap = false;
  }

  /** The case the water under the player's feet is asking for. */
  currentSlot() {
    const g = this.game;
    const p = g.player;
    let lv = g.tide ? g.tide.level : 1;
    if (p && g.room && g.tide) lv = tideAt(g, p);
    if (lv < 0) lv = 0;
    if (lv >= TIDE_COUNT) lv = TIDE_COUNT - 1;
    return CHARM_SLOTS[lv];
  }

  update() {
    const cur = this.currentSlot();
    if (cur !== this.prevSlot) {
      // The Neap Charm reads the frame BEFORE the change — a charm that has
      // already gone dark cannot be what keeps itself alive.
      if (this.prevSlot != null && this.wasNeap) {
        this.graceSlot = this.prevSlot;
        this.graceT = NEAP_GRACE_FRAMES;
      }
      this.prevSlot = cur;
    }
    if (this.graceT > 0) this.graceT--;
    this.recompute(cur);
    this.wasNeap = this.active.has('neapCharm');
  }

  recompute(cur) {
    const p = this.game.progress;
    const live = new Set();
    if (cur) live.add(cur);
    if (this.graceT > 0 && this.graceSlot) live.add(this.graceSlot);
    // Fisherman's Regret has to be live itself before it can wake anything, so
    // it is resolved in a second pass over the set the first pass produced.
    if (p && this.inAny(p, live, 'fishermansRegret')) {
      const i = CHARM_SLOTS.indexOf(cur);
      if (i > 0) live.add(CHARM_SLOTS[i - 1]);
    }
    this.liveSlots = live;
    this.active = new Set();
    if (!p) return;
    for (const slot of live) {
      if (!slotOpen(p, slot)) continue;
      for (const id of equippedIn(p, slot)) this.active.add(id);
    }
  }

  inAny(progress, slots, id) {
    for (const slot of slots) {
      if (!slotOpen(progress, slot)) continue;
      if (equippedIn(progress, slot).includes(id)) return true;
    }
    return false;
  }

  has(id) { return this.active.has(id); }
}
