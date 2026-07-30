// Magic rings — the Oracle series' collectible modifier system.
// Effects are read by the systems they affect (see hasRing calls) rather than
// being applied here, so a ring is pure data.

export const RINGS = {
  power: { name: 'Power Ring', desc: 'Sword damage up, damage taken up.', color: 'enemyr' },
  armor: { name: 'Armor Ring', desc: 'Damage taken halved, sword weaker.', color: 'enemyb' },
  swimmer: { name: "Swimmer's Ring", desc: 'Swim faster and resist currents.', color: 'water' },
  tide: { name: 'Tide Ring', desc: 'The conch sounds faster.', color: 'essence' },
  pearl: { name: 'Pearl Ring', desc: 'Breathe longer underwater.', color: 'marble' },
  blast: { name: 'Blast Ring', desc: 'Bombs blast wider.', color: 'fire' },
  octo: { name: 'Octo Ring', desc: 'Octoroks fear you.', color: 'enemyg' },
  light: { name: 'Light Ring', desc: 'Dark rooms are less dark.', color: 'gold' },
  green: { name: 'Green Ring', desc: 'A quarter more rupees from foes.', color: 'grass' },
  heart: { name: 'Heart Ring', desc: 'Slowly recover health as you walk.', color: 'heart' },
  redJoy: { name: 'Red Joy Ring', desc: 'Double damage dealt AND taken.', color: 'lava' },
  whisp: { name: 'Whisp Ring', desc: 'Immune to being cursed.', color: 'magic' },
  gasha: { name: 'Gasha Ring', desc: 'Buried seeds grow richer.', color: 'tree' },
  steadfast: { name: 'Steadfast Ring', desc: 'You are knocked back less.', color: 'stone' },
  discovery: { name: 'Discovery Ring', desc: 'The ground hints at secrets.', color: 'sand' },
};

export function ownedRings(progress) {
  return Object.keys(RINGS).filter(id => progress.rings[id]);
}

export function giveRing(progress, id) {
  if (!RINGS[id] || progress.rings[id]) return false;
  progress.rings[id] = true;
  return true;
}

export function equipRing(progress, id, slot = 0) {
  const max = progress.ringSlots || 1;
  if (slot >= max) return false;
  const eq = progress.ringsEquipped;
  const at = eq.indexOf(id);
  if (at >= 0) { eq[at] = null; return true; }
  eq[slot] = id;
  return true;
}
