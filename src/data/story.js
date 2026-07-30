// Story data: cutscenes and NPC dialogue.
// See game/cutscene.js for the step format.

import { registerCutscenes } from '../game/cutscene.js';
import { registerTexts } from '../game/dialogue.js';

export const DIALOGUE = {
  villager1: "The sea has gone mad since the Tide Bell shattered.\nOne hour the bay is dry, the next it swallows the pier.",
  villager2: 'Farore keeps the shrine on the headland. She is the Oracle of Secrets, though she tells plenty of them.',
  fisher1: 'Low water is a fisherman\'s friend. You can walk clean out to the reef and back.',
};

const CUTSCENES = {
  intro: [
    { music: null },
    { fade: 'in' },
    { text: 'The Legend of Zelda\nOracle of Tides', frames: 150 },
    { text: 'Washed ashore on the coast of Thalassia, Link wakes to a sea that cannot decide where it belongs.', frames: 220 },
    { say: 'Farore: You are awake. Good. I am Farore, Oracle of Secrets, and I have very few left to give.' },
    { say: 'Farore: Nereth the Drowned King has broken the Tide Bell into eight Essences and scattered them through the drowned places of this land.' },
    { say: 'Farore: Without the Bell the sea rises and falls at his whim. Take this. It is a shard of the Bell itself.' },
    { give: { item: 'conch', level: 1 }, jingle: 'fanfare' },
    { say: 'Farore: The Moon Conch. Sound it and the tide will answer: LOW, then MID, then HIGH, and around again.' },
    { say: 'Farore: You will need a blade too. There is one in the village chest, and the village will be glad to be rid of it.' },
    { give: { item: 'sword', level: 1 } },
    { say: 'Farore: Go east to the Shallows. Sound the conch at low water and the sandbar will carry you to the reef.' },
    { flag: 'sawIntro' },
    { music: 'village' },
  ],

  essenceGeneric: [
    { music: null },
    { text: 'An Essence of the Tide joins the Bell.', frames: 160 },
    { say: 'The water in your ears goes quiet for a moment. One more piece of the Bell remembers its shape.' },
    { music: 'overworld' },
  ],
};

export function installStory() {
  registerCutscenes(CUTSCENES);
  registerTexts(DIALOGUE);
}

export { CUTSCENES as STORY_CUTSCENES };
