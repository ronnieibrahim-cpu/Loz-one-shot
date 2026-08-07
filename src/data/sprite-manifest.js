// The complete list of sprite names the engine asks for, grouped by the data
// pack responsible for drawing them. tools/validate.mjs asserts that every name
// here is registered, so a missing sprite is a build failure rather than a
// coloured placeholder someone notices six hours later.
//
// Sizes: everything is 16x16 unless noted. Larger entries give [w, h].

const seq = (base, n, from = 0) => Array.from({ length: n }, (_, i) => base + (i + from));

export const REQUIRED_SPRITES = {
  // ---- pack: sprites-link.js --------------------------------------------
  link: [
    ...seq('link_walk_down_', 2), ...seq('link_walk_up_', 2), ...seq('link_walk_side_', 2),
    'link_sword_down', 'link_sword_up', 'link_sword_side',
    'link_hold_down', 'link_hold_up', 'link_hold_side',
    ...seq('link_swim_down_', 2), ...seq('link_swim_up_', 2), ...seq('link_swim_side_', 2),
    'link_carry_down', 'link_carry_up', 'link_carry_side',
    'link_push_down', 'link_push_up', 'link_push_side',
    'link_hurt_down', 'link_hurt_up', 'link_hurt_side',
    'link_conch_down', 'link_conch_up', 'link_conch_side',
    'link_shield_down', 'link_shield_up', 'link_shield_side',
    ...seq('link_fall_', 3), ...seq('link_dig_', 2), 'link_dive', ...seq('link_spin_', 4),
  ],

  fx: [
    ...seq('fx_puff', 4), ...seq('fx_spark', 3), ...seq('fx_splash', 3),
    ...seq('fx_ripple', 2), ...seq('fx_dust', 3), ...seq('fx_cut', 3),
    ...seq('fx_sparkle', 3), ...seq('fx_flame', 3), ...seq('fx_bubble', 2),
    ...seq('fx_foam', 3), ...seq('fx_shine', 3),
    ...seq('fx_slash_down_', 2), ...seq('fx_slash_up_', 2), ...seq('fx_slash_side_', 2),
    'shadow',
  ],

  // 32x32 explosion frames
  fxBig: [...seq('fx_boom', 5)],

  ui: [
    ...seq('hud_heart', 5), 'hud_rupee',
    'i_sword1', 'i_sword2', 'i_sword3',
    'i_shield1', 'i_shield2', 'i_shield3',
    'i_conch', 'i_feather', 'i_cape',
    'i_bomb', 'i_bomb_lit',
    'i_bracelet', 'i_gloves',
    'i_cleats', 'i_cleats2',
    ...seq('i_boomerang_', 4), 'i_boomerang_mag',
    'i_hookshot', 'i_longhook', 'i_chain', 'i_hookhead',
    'i_satchel', 'i_slingshot', 'i_hyperslingshot',
    'i_shovel', 'i_magnet', 'i_ringbox', 'i_ring',
    'i_map', 'i_compass', 'i_unknown',
    'i_lens', 'i_lens2', 'i_bellows', 'i_reefseed', 'i_dredge', 'i_rod',
    'i_seed_ember', 'i_seed_scent', 'i_seed_pegasus', 'i_seed_gale', 'i_seed_mystery',
  ],

  // ---- pack: sprites-world.js ------------------------------------------
  pickups: [
    'p_rupee', 'p_rupee5', 'p_rupee20', 'p_heart', 'p_fairy', 'p_bombs', 'p_seeds',
    'p_key', 'p_bosskey', 'p_heartpiece', 'p_heartcontainer',
    'p_essence0', 'p_essence1', 'p_essence_dim',
  ],

  objects: [
    'o_chest', 'o_chest_open', 'o_chestbig', 'o_chestbig_open',
    'o_sign', 'o_block', 'o_switch_up', 'o_switch_down',
    'o_torch', 'o_torch_lit0', 'o_torch_lit1',
    'o_raft', 'o_valve', 'o_valve_open', 'o_pot', 'rock16', 'o_coralbud',
  ],

  shots: ['shot', 'shot_rock', 'shot_bubble', 'shot_beam', 'shot_spear', 'shot_orb', 'shot_ink'],

  npcs: [
    'npc_villager', 'npc_villager2', 'npc_fisher', 'npc_child', 'npc_elder',
    'npc_shopkeeper', 'npc_farore_0', 'npc_farore_1', 'npc_maku', 'npc_zelda',
    'npc_nereth',
  ],

  // ---- pack: sprites-enemies.js ----------------------------------------
  enemies: [
    ...seq('octorok_d', 2), ...seq('octorok_u', 2), ...seq('octorok_s', 2),
    ...seq('crab_', 2), ...seq('zol_', 2), ...seq('gel_', 2), ...seq('keese_', 2),
    ...seq('leever_', 2), ...seq('bubble_', 2), ...seq('beamos_', 2),
    ...seq('beetle_d', 2), ...seq('beetle_s', 2), ...seq('tektite_', 2),
    ...seq('wisp_', 2), ...seq('urchin_', 2),
    ...seq('moblin_d', 2), ...seq('moblin_u', 2), ...seq('moblin_s', 2),
    ...seq('stalfos_d', 2), ...seq('stalfos_s', 2),
    ...seq('darknut_d', 2), ...seq('darknut_s', 2),
    ...seq('wizzrobe_', 2), ...seq('anglerfry_', 2), ...seq('barnacle_', 2),
    ...seq('jellyfish_', 2), ...seq('siren_', 2), ...seq('pincer_', 2),
  ],

  // ---- pack: sprites-bosses.js -----------------------------------------
  // Bosses are 32x32 unless the name ends in _48 (48x48).
  bosses: [
    ...seq('boss_gohmaraq_', 3), 'boss_gohmaraq_hurt',
    ...seq('boss_anemos_', 3), 'boss_anemos_hurt',
    ...seq('boss_gloomtide_', 3), 'boss_gloomtide_hurt',
    ...seq('boss_wyverna_', 3), 'boss_wyverna_hurt',
    ...seq('boss_rootmaw_', 3), 'boss_rootmaw_hurt',
    ...seq('boss_brinehulk_', 3), 'boss_brinehulk_hurt',
    ...seq('boss_thalassor_', 3), 'boss_thalassor_hurt',
    ...seq('boss_nereth_', 4), 'boss_nereth_hurt',
  ],

  minibosses: [
    ...seq('mini_clawcrab_', 2), ...seq('mini_ironknight_', 2),
    ...seq('mini_bogmaw_', 2), ...seq('mini_gustharpy_', 2),
    ...seq('mini_thornvine_', 2), ...seq('mini_saltwraith_', 2),
    ...seq('mini_reefguard_', 2), ...seq('mini_tideshade_', 2),
  ],
};

/** Expected pixel size for a sprite name, used by the validator. */
export function expectedSize(name) {
  // The held-blade poses are the only Link frames that are not 16x16: the
  // source game draws the extended sword past the edge of his cell, and
  // cropping it back to 16x16 would remove the sword. The engine derives the
  // draw anchor from these dimensions (see Player.draw), so if the ripper's
  // crop changes, this must change with it — that is what the assert is for.
  if (name === 'link_hold_down') return [16, 30];
  if (name === 'link_hold_up') return [16, 28];
  if (name === 'link_hold_side') return [28, 16];
  if (REQUIRED_SPRITES.fxBig.includes(name)) return [32, 32];
  if (name.startsWith('boss_')) return name.endsWith('_48') ? [48, 48] : [32, 32];
  if (name.startsWith('mini_')) return [24, 24];
  if (name === 'o_raft') return [16, 16];      // drawn twice, mirrored, to make 32
  if (name === 'i_chain' || name === 'i_hookhead') return [8, 8];
  if (name.startsWith('shot')) return [8, 8];
  if (name.startsWith('hud_')) return [8, 8];
  if (name.startsWith('i_seed_')) return [8, 8];
  return [16, 16];
}

export function allRequired() {
  return Object.values(REQUIRED_SPRITES).flat();
}
