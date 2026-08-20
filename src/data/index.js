// Single entry point that installs every data pack into the engine registries.
// Both the game and the offline validator call installData(), so anything that
// validates here is guaranteed to be what the game actually loads.

import { installCoreTiles, CORE_TILE_ART } from './tiles-core.js';
import { installLegends } from './legends.js';
import { installOverworld } from './overworld.js';
import { installCaves } from './caves.js';
import { installEnemies } from './enemies.js';
import { installBosses } from './bosses.js';
import { installDungeonsA } from './dungeons-a.js';
import { installDungeonsB } from './dungeons-b.js';
import { installStory } from './story.js';
import { installAudio } from './audio.js';
import { installLinkSprites, LINK_ART, FX_ART, FX_BIG_ART, UI_ART } from './sprites-link.js';
import { installPlayerSprites, PLAYER_ART } from './sprites-player.js';
import { installNpcSprites, NPC_ART as NPC_RIPPED_ART } from './sprites-npcs.js';
import { installRaceSprites, RACE_ART } from './sprites-races.js';
import { installWorldSprites, PICKUP_ART, OBJECT_ART, SHOT_ART, NPC_ART } from './sprites-world.js';
import { installEnemySprites, ENEMY_ART } from './sprites-enemies.js';
import { installBossSprites, BOSS_ART, MINIBOSS_ART } from './sprites-bosses.js';
import { installHudSprites, HUD_ART } from './sprites-hud.js';
import { installGearSprites, GEAR_ART } from './sprites-gear.js';
import { installTitleSprites, TITLE_ART } from './sprites-title.js';

// Background tile art: validated at 16x16.
export const ART_PACKS = {
  core: CORE_TILE_ART,
};

// Sprite art: validated against the sizes in sprite-manifest.js.
export const SPRITE_PACKS = {
  link: LINK_ART,
  player: PLAYER_ART,
  npcsRipped: NPC_RIPPED_ART,
  races: RACE_ART,
  fx: FX_ART,
  fxBig: FX_BIG_ART,
  ui: UI_ART,
  pickups: PICKUP_ART,
  objects: OBJECT_ART,
  shots: SHOT_ART,
  npcs: NPC_ART,
  enemies: ENEMY_ART,
  bosses: BOSS_ART,
  minibosses: MINIBOSS_ART,
  hudRipped: HUD_ART,
  gear: GEAR_ART,
  title: TITLE_ART,
};

let installed = false;

export function installData() {
  if (installed) return;
  installed = true;
  // Order matters: tiles and legends before any map that references them.
  installCoreTiles();
  installLegends();
  installLinkSprites();
  // After sprites-link.js, so the on-model Link art overrides the earlier pass.
  installPlayerSprites();
  installWorldSprites();
  // After sprites-world.js, so extracted NPC art overrides the placeholders.
  installNpcSprites();
  // The peoples of Thalassia, off a sheet nothing else has touched.
  installRaceSprites();
  installEnemySprites();
  installBossSprites();
  // After sprites-link.js, so the extracted HUD and gear icons override the
  // hand-drawn ones for the items Oracle of Seasons actually has.
  installHudSprites();
  // Drawn to match the extracted icons, for the gear Seasons does not have.
  installGearSprites();
  installTitleSprites();
  installEnemies();
  installBosses();
  installOverworld();
  installCaves();
  installDungeonsA();
  installDungeonsB();
  installStory();
  installAudio();
}
