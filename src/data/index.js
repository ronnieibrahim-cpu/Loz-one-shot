// Single entry point that installs every data pack into the engine registries.
// Both the game and the offline validator call installData(), so anything that
// validates here is guaranteed to be what the game actually loads.

import { installCoreTiles, CORE_TILE_ART } from './tiles-core.js';
import { installLegends } from './legends.js';
import { installOverworld } from './overworld.js';
import { installCaves } from './caves.js';
import { installEnemies } from './enemies.js';
import { installStory } from './story.js';
import { installAudio } from './audio.js';

export const ART_PACKS = {
  core: CORE_TILE_ART,
};

export const SPRITE_PACKS = {};

let installed = false;

export function installData() {
  if (installed) return;
  installed = true;
  // Order matters: tiles and legends before any map that references them.
  installCoreTiles();
  installLegends();
  installEnemies();
  installOverworld();
  installCaves();
  installStory();
  installAudio();
}
