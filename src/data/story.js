// Story data: cutscenes and NPC dialogue.
// See game/cutscene.js for the step format.
//
// The text box shows three short lines at a time, so no line runs much past 34
// characters without a '\n' or a space to break on.
//
// Every id in DIALOGUE is referenced from map data — see the `dialogue`,
// `waiting` and `after` options on `npc`, `sign` and `giver` entities. An id the
// map asks for and this file does not define shows an empty box, so the set
// below deliberately runs wider than what the overworld currently uses.

import { registerCutscenes } from '../game/cutscene.js';
import { registerTexts } from '../game/dialogue.js';

export const DIALOGUE = {
  // ---- Tidewatch Village -------------------------------------------------
  villager1: "The sea has gone mad since the Tide Bell\nshattered. One hour the bay is dry, the\nnext it swallows the pier.",
  villager2: 'Farore keeps the shrine on the headland.\nShe is the Oracle of Secrets, though she\ntells plenty of them.',
  villageChild: "I can hear a bell under the water.\nGrandad says that is just my ears.\nGrandad has never once been right.",
  shopkeeper: 'Shield, thirty rupees. No haggling.\nA man who argues over a shield is a man\nwho has never been hit by anything.',
  hearthWife: 'We built the doorstep three courses high\nafter the spring flood. Now the water\ncomes in through the floor instead.',
  hearthChild: 'When it is low I can walk to the reef.\nWhen it is high I can swim over the wall.\nI like high better. Mum likes low.',
  netMender: 'Nets rot from the top down, boy — from\nthe part that dries. It is the drying that\nkills them, not the sea.',
  sandpiper: 'Two houses on this row and one of them\nis shut. He went out at low water and\ncame back at nobody knows when.',

  // The village digger: the Ferryman's Coin after three Essences.
  diggerWait: 'I dig where the sea tells me to dig.\nLately it will not shut up, and it will\nnot say anything useful either.',
  digger: 'Three Essences. Then take the Coin. Throw\nit down and let the water turn. It pays\nthe ferryman, and the ferryman is patient.',
  diggerAfter: 'One coin, boy. Where you drop it is where\nthe next tide puts you. Choose the drop,\nnot the moment — the moment is not yours.',

  // The Maku Tree: the Resonance Rod after the first Essence, Master Sword after
// all five — the sixth is Nereth's own and there is no coming back to her for it.
  makuWait: 'Hoo. You are small and the sea is large.\nBring me one Essence of the Tide and I\nwill be awake enough to help.',
  makuTree: 'Hoo hoo! One Essence, and my roots feel\nthe Bell again. Take the Rod. Strike it and\nevery drowned bell in Tidemere answers.',
  makuAfter: 'Five Essences, Link. Five. Then the way\nto the Keep opens, and I go back to sleep\nfor a hundred years.',

  faroreHome: 'The Bell is not a thing, exactly.\nIt is an agreement between the moon and\nthe water. Nereth broke the agreement.',

  // ---- the coast and the Shallows ----------------------------------------
  coastFisher: 'Low water is a fisherman\'s friend.\nYou can walk clean out to the reef and\nback, if you are quick about it.',
  fisher1: 'Low water is a fisherman\'s friend.\nYou can walk clean out to the reef and\nback, if you are quick about it.',
  coastChild: 'I found a crab as big as a dog.\nThen it found me. I have been indoors\nsince, mostly.',
  wreckSurvivor: 'My boat is out there under six feet of\nsea that was not there on Tuesday.\nSound your shell. I will wait.',

  // ---- Coral Reef --------------------------------------------------------
  coralDiver: 'The spire drinks at high water and holds\nits breath at low. Time your climb by the\nwater, not by your nerve.',
  reefFisher: 'There are currents in the palace that run\none way and never the other.\nGo in with a plan for coming out.',

  // ---- Marsh, Cliffs, Wood ------------------------------------------------
  bogWitch: 'The sanctum current runs at middling\nwater and stops at the edges. Everything\nin the bog knows that. Now so do you.',
  stoneFisher: 'The cistern was built to hold the sea\nout. It holds it in now. Whoever built it\nis not around to explain.',
  woodChild: 'The trees in the wood drink when the water\ncomes up. One of them drinks people.\nI am not allowed to say which.',

  // ---- Salt Pans and the Abyssal approach ---------------------------------
  salterElder: 'Salt and water are old enemies who cannot\nleave each other alone. Remember that in\nthe Vault and you will do well enough.',

  // ---- signs and spares the maps may reach for ---------------------------
  signCoast: 'TIDEWATCH VILLAGE\nEast: the Shallows.\nMind the tide.',
  villager3: 'Sound the conch twice and you can reach\nanything in Thalassia. Sound it three\ntimes and you are back where you started.',
  elder1: 'I have seen the sea take this village\ntwice and give it back once.\nWe are owed, is what I am saying.',
  child1: 'Are you going to fight the Drowned King?\nCan I have your boots if you lose?',
  shopkeeper2: 'Buy something or stand somewhere else.\nThose are the two options and I am fond\nof both.',
  tradeStart: 'My kettle went out with the tide.\nBring it back and I will make it worth\nthe walk.',
  tradeMid: 'That is not my kettle, but I want it.\nTake this instead. Someone down the coast\nwill want that more than I do.',
  tradeEnd: 'My kettle! Where — no. Do not tell me.\nTake this. It has been in a drawer for\nforty years waiting for someone like you.',
};

const CUTSCENES = {
  intro: [
    { music: null },
    { fade: 'in' },
    { text: 'The Legend of Zelda\nOracle of Tides', frames: 150 },
    { text: 'Washed ashore on the coast of Thalassia, Link wakes to a sea that cannot decide where it belongs.', frames: 220 },
    { say: 'Farore: You are awake. Good. I am Farore, Oracle of Secrets, and I have very few left to give.' },
    { say: 'Farore: Nereth the Drowned King has broken the Tide Bell into six Essences and scattered them through the drowned places of this land.' },
    { say: 'Farore: Without the Bell the sea rises and falls at his whim. Take this. It is a shard of the Bell itself.' },
    { give: { item: 'conch', level: 1 }, jingle: 'fanfare' },
    { say: 'Farore: The Moon Conch. Sound it and the tide will answer: LOW, then MID, then HIGH, and around again.' },
    { say: 'Farore: You will need a blade too. There is one in the village chest, and the village will be glad to be rid of it.' },
    { give: { item: 'sword', level: 1 } },
    { say: 'Farore: Go east to the Shallows. Sound the conch at low water and the sandbar will carry you to the reef.' },
    { flag: 'sawIntro' },
    { music: 'village' },
  ],

  // Fallback for any essence index without its own scene.
  essenceGeneric: [
    { music: null },
    { text: 'An Essence of the Tide joins the Bell.', frames: 160 },
    { say: 'The water in your ears goes quiet for a moment. One more piece of the Bell remembers its shape.' },
    { music: 'overworld' },
  ],

  // ---- one scene per Essence, each moving the story on --------------------
  essence1: [
    { music: null },
    { text: 'Essence of the Tide\nI — the Shallow Bell', frames: 150 },
    { say: 'The shard settles against the conch and the two of them hum at each other like old friends.' },
    { say: 'Somewhere inland, a tree that has been asleep for a hundred years opens one eye.' },
    { say: 'Farore: One. Go and see the Maku Tree — it will have felt that, and it will want to give you something.' },
    { music: 'overworld' },
  ],
  essence2: [
    { music: null },
    { text: 'Essence of the Tide\nII — the Coral Bell', frames: 150 },
    { say: 'The reef goes quiet. Every fish in the spire turns to face the same direction at once, and holds it.' },
    { shake: [2, 30] },
    { say: 'Far out past the shelf, something very large notices that it is being taken apart.' },
    { say: 'Nereth: ...a shard. Two shards. The little wading thing has hands.' },
    { music: 'overworld' },
  ],
  essence3: [
    { music: null },
    { text: 'Essence of the Tide\nIII — the Bog Bell', frames: 150 },
    { say: 'The marsh drains a finger\'s width and stays there. It has not held still in a year.' },
    { say: 'Farore: Three. The sea is starting to remember which way is down. Keep going.' },
    { music: 'overworld' },
  ],
  essence4: [
    { music: null },
    { text: 'Essence of the Tide\nIV — the Cliff Bell', frames: 150 },
    { say: 'Half the Bell now. The conch has gone warm and it does not cool down again.' },
    { shake: [3, 40] },
    { say: 'Nereth: Half. HALF. Come to the Keep, then, and bring my Bell with you. I will take it back at the door.' },
    { say: 'Farore: He is frightened. That is new, and it is not necessarily good news.' },
    { music: 'overworld' },
  ],
  essence5: [
    { music: null },
    { text: 'Essence of the Tide\nV — the Drowned Bell', frames: 150 },
    { say: 'The flooded wood lets out a breath it has been holding since before the village had a name.' },
    { shake: [4, 60] },
    { say: 'Every whirlpool between here and the abyss turns over and begins to spin the other way.' },
    { say: 'Farore: Five. One left, and it is in his hands. Go and see the Maku Tree first. Go on. Humour an old plant.' },
    { music: 'overworld' },
  ],
  essence6: [
    { music: null },
    { text: 'Essence of the Tide\nVI — the Drowned King\'s Bell', frames: 170 },
    { say: 'The last shard comes away from Nereth\'s crown and the six of them find each other in your hands.' },
    { say: 'The Tide Bell is whole. It is much smaller than the stories, and much heavier.' },
    { music: 'overworld' },
  ],

  // ---- the Maku Tree beats ------------------------------------------------
  makuSatchel: [
    { say: 'Maku Tree: Hoo hoo! One Essence and my roots can feel the Bell again.' },
    { say: 'Maku Tree: Take the Rod. It was cut from the Bell that used to keep the tide honest.' },
    { give: { item: 'rod', level: 1 }, jingle: 'fanfare' },
    { say: 'Maku Tree: Bring me five, Link, and I will open the road to the Abyssal Keep. Then I am going back to sleep.' },
  ],
  makuMaster: [
    { music: null },
    { say: 'Maku Tree: Five, and the sixth is in his crown. You did it wet through, which I respect.' },
    { shake: [3, 50] },
    { say: 'Maku Tree: The roots under this village go all the way down to the Keep. I have been growing them for a century, waiting for a reason.' },
    { say: 'Maku Tree: Take this with you. It was left here a long time ago by someone who also thought they would be back.' },
    { give: { item: 'sword', level: 3 }, jingle: 'fanfare' },
    { say: 'Maku Tree: Go down, Link. And come back up. That second part is the one people forget.' },
    { flag: 'makuOpenedKeep' },
    { music: 'overworld' },
  ],

  // ---- the final fight ----------------------------------------------------
  nerethIntro: [
    { music: null },
    { fade: 'out' },
    { fade: 'in' },
    { text: 'The Abyssal Keep\nthe throne under the sea', frames: 160 },
    { say: 'Nereth: You came down. Everything comes down eventually. That is the only law I have ever needed.' },
    { say: 'Nereth: I did not break the Bell to be cruel, wader. I broke it because the sea was told what to do for a thousand years and never once asked.' },
    { say: 'Nereth: Now it does as it likes. Now it does as I like. The difference is small and it is mine.' },
    { shake: [4, 60] },
    { say: 'Nereth: Sound your little shell, then. Let us see whose sea it is.' },
    { music: 'finalBoss' },
  ],
  ending: [
    { music: null },
    { fade: 'out' },
    { text: 'The Tide Bell is whole.', frames: 170 },
    { fade: 'in' },
    { music: 'ending' },
    { say: 'The Bell rings once, under the water, in a note too low to hear and too large to miss.' },
    { tide: 1 },
    { say: 'The sea goes out to where it should be. Then it comes back to where it should be. Then out again, on time.' },
    { say: 'Farore: Listen to that. Boring, isn\'t it. It took six drowned places and a drowned king to make the sea boring again.' },
    { say: 'Farore: The village is already arguing about where to put the new pier. That is how you know it worked.' },
    { say: 'Farore: I am the Oracle of Secrets, Link, and I am out of them. Go home. Take the boat at low water.' },
    { text: 'Thalassia keeps its shape.\nThe pier goes back where the pier goes.\nThe Maku Tree sleeps.', frames: 260 },
    { text: 'The Legend of Zelda\nOracle of Tides\n\nTHE END', frames: 320 },
    { flag: 'finishedGame' },
  ],

  // ---- the trading sidequest ----------------------------------------------
  tradeKettle: [
    { say: 'You are handed a kettle full of seawater, which is not what a kettle is for.' },
    { say: 'Someone further along the coast will want it more than you do. That is how these things go.' },
  ],
};

export function installStory() {
  registerCutscenes(CUTSCENES);
  registerTexts(DIALOGUE);
}

export { CUTSCENES as STORY_CUTSCENES };
