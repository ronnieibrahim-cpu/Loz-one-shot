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

  sandpiper: 'Two houses on this row and one of them\nis shut. He went out at low water and\ncame back at nobody knows when.',

  // The peoples of Thalassia. Four hoods, four coasts — the Brinekin hold the
  // bay, the Salters the pans, the Kelpers the wet wood, the Reefkin the reef.
  // Nobody says so outright; they say it the way people do, by complaining
  // about the others.
  shoreSalter: 'Salter, up from the pans. You people\nlive in your water. We live off what it\nleaves behind when it goes.',
  timberSalter: 'Wood comes ashore, we cut it, the sea\ntakes the chips back. A tidy arrangement,\nif you do not think about it too long.',
  sandpiperKid: 'Mum says I am not to go past the fence.\nThe fence is under water twice a day.\nSo I am not to go anywhere, really.',

  // The village digger: the Ferryman's Coin after three Essences.
  diggerWait: 'I dig where the sea tells me to dig.\nLately it will not shut up, and it will\nnot say anything useful either.',
  digger: 'Three Essences. Then take the Coin. Throw\nit down and let the water turn. It pays\nthe ferryman, and the ferryman is patient.',
  diggerAfter: 'One coin, boy. Where you drop it is where\nthe next tide puts you. Choose the drop,\nnot the moment — the moment is not yours.',

  // The Maku Tree, the last link of the Coastwise Chain: the Resonance Rod for
  // the Tide Bell's own rope, once one Essence has woken her enough to work.
  // Master Sword after all five — the sixth is Nereth's own and there is no
  // coming back to her for it.
  makuWait: 'Hoo. You are small and the sea is large.\nBring me one Essence of the Tide, and\nbring me something of the Bell\'s.',
  makuBlocked: 'The Bell\'s rope. I know it by the salt.\nBut my roots are still asleep, child.\nOne Essence of the Tide first. Then this.',
  makuTree: 'Hoo hoo! The Bell\'s own rope, and the salt\nstill in it. Hold still. — There: the\nResonance Rod. Every drowned bell answers.',
  makuAfter: 'Five Essences, Link. Five. Then the way\nto the Keep opens, and I go back to sleep\nfor a hundred years.',
  // Said on every visit after the road is open. The tree has done its part and
  // says so; the seal on the Abyss Stair is already split by the time the
  // player walks back out to it.
  makuOpened: 'The road is open and my roots ache.\nGo down, and do not dawdle — I am asleep\nthe moment you are out of sight.',


  // ---- the Coastwise Chain -------------------------------------------------
  //
  // Eleven links, and every one of them is somebody who was left holding a
  // thing the sea took off somebody else. Each trader keeps the flavour line
  // they had before the chain existed — it is what they say when it is not
  // their turn — so the coast sounds the same to a player who never starts it.
  //
  // The register is the source games': dry, short, three lines, and nobody
  // explains themselves. Nobody says "quest" and nobody thanks you twice.

  // 1 and 11. Ossa, in the net-mender's house. She opens the chain and she
  // closes it, because the thing the chain is really carrying round the coast
  // is her kettle.
  ossaStart: 'My kettle went out with the tide.\nBring it back and I will make it worth\nthe walk. Take that float — it is cracked.',
  ossaWait: 'That is not my kettle. Keep walking.\nIt is out there in somebody\'s hands and\nthey do not know whose it is.',
  ossaEnd: 'My kettle! Where — no. Do not tell me.\nTake this. It has been in a drawer for\nforty years waiting for someone like you.',
  ossaAfter: 'That is the rope off the old Tide Bell.\nMy grandmother rang it. Give it to the\ntree. The tree will know what it is.',

  // 2. Pell, on the village shore. A float that sinks is not a float; it is a
  // sinker, which is the whole chain in one object.
  pellTrade: 'A float with a crack in it! That sinks!\nThat is what my crab line has wanted all\nsummer. You have the claw. I have had it.',
  pellAfter: 'The line goes straight down now.\nI can feel the bottom. There is a lot\nof bottom.',

  // 3. Hulla, cutting driftwood on the strand.
  hullaTrade: 'A claw? Give it here. A rake tine bends\nand a claw does not. Take a brick of salt\nfor it. We have a shed of them.',
  hullaAfter: 'The claw rakes better than the rake did.\nDo not tell the man who sold me the rake.',

  // 4. Mirren, working the coast east of the village.
  mirrenTrade: 'Salt! I have been walking my catch to\nthe reef and losing half of it on the way.\nTake the eel. Smoked. It will keep.',
  mirrenAfter: 'Salted, boxed, and none of it wasted.\nFirst honest week I have had since the\nBell went.',

  // 5. Dov, beside the wreck he is waiting on.
  dovTrade: 'Is that an eel? I have eaten sand for\nthree days. Take the sounding lead. It is\nall I got off her and I cannot eat it.',
  dovAfter: 'She is still down there. But I am not\nhungry, which is a different problem\nfrom the one I had.',

  // 6. Sennit, on Sandpiper Row, who wants to settle an argument.
  sennitTrade: 'A lead line! Now I can prove how deep\nthe pool is and Mum can stop guessing.\nTake the whelk. It only rings when wet.',
  sennitAfter: 'Nine feet at high. One at low.\nI wrote it on the fence. The fence will\nbe under water again by supper.',

  // 7. Corriwig, diving the coral hollow.
  corriwigTrade: 'A shell that rings under water? Tie that\nto my line and I will hear where my line\nis. Take a pearl. The reef gave me three.',
  corriwigAfter: 'I can hear my own line in the murk now.\nSmall thing. Also the reason I will come\nback up.',

  // 8. Wick, in the heart of the drowned wood. The wood takes payment.
  wickTrade: 'A slackwater pearl. The wood takes\npayment and it does not take promises.\nHere. A cup, cut from a tree that drinks.',
  wickAfter: 'The tree has been paid. It is not\ngrateful. It is just not thirsty.',

  // 9. Yarrow, in the witch's hollow.
  yarrowTrade: 'Bogwood. Nothing dissolves in bogwood,\nwhich is more than my last cup managed.\nTake the jar. It is bait. Keep it shut.',
  yarrowAfter: 'The cup holds. Forty years of brine and\nit holds. I may live for ever now, which\nwas not the plan.',

  // 10. Teel, fishing off the stones — and the man who hooked the kettle.
  teelTrade: 'Brine-jelly. Every fish on this coast\nwants it and every one of them is wrong.\nTake the kettle. It came up on my line.',
  teelAfter: 'Full of sea, that kettle was.\nWhoever lost it has been waiting a while,\nI would say.',

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
  // Ossa's old line, from before she opened the Coastwise Chain. Kept because
  // it is the best thing anyone says about nets and it belongs to whoever gets
  // a net next; her three chain lines say who she is now.
  netMender: 'Nets rot from the top down, boy — from\nthe part that dries. It is the drying that\nkills them, not the sea.',
  elder1: 'I have seen the sea take this village\ntwice and give it back once.\nWe are owed, is what I am saying.',
  child1: 'Are you going to fight the Drowned King?\nCan I have your boots if you lose?',
  shopkeeper2: 'Buy something or stand somewhere else.\nThose are the two options and I am fond\nof both.',

  // ---- second states -----------------------------------------------------
  //
  // Every ordinary townsperson now has two lines: the one they have always
  // had, and one keyed to a number of Essences a person in that town could
  // plausibly have noticed. NOBODY EXPLAINS THE PLOT. They notice the weather
  // and complain about it, which is the register the first lines established
  // and the only register the four peoples of Thalassia have.
  //
  // Four of these are not new text at all: `child1`, `elder1`, `netMender` and
  // `shopkeeper2` were written for villagers who were never placed, and are
  // reused here as later lines for villagers who were. `T49` says do not add
  // NPCs to hang lines on — so these got hung on the ones already standing.
  //
  // The beats are spread 1..5 on purpose. Talking to a whole town at once and
  // hearing every line turn over together would read as a switch being thrown.
  villager2After: 'Farore has stopped coming down to the\nshrine steps. Says she is busy.\nShe has never once been busy before.',
  hearthWifeAfter: 'The floor has been dry a whole week.\nI do not trust it. A dry floor in this\nhouse has always been the sea thinking.',
  hearthChildAfter: 'The sea does what it is told now.\nMum says not to say that outdoors.\nI do not see who else would hear me.',
  shoreSalterAfter: 'The pans are filling right again.\nDo not expect thanks for it. A salter\ndoes not thank the weather.',
  faroreHomeAfter: 'The agreement is nearly written again.\nI could tell you what the last of it\ncosts. You would go anyway.',
  fisher1After: 'You have made the sea punctual.\nA punctual sea is no use to me at all.\nWe had the old one worked out.',
  reefFisherAfter: 'The palace currents run both ways now.\nThat is worse. Before, at least, you\nknew which way you were going to drown.',
  salterElderAfter: 'Salt is winning again up at the pans.\nI would not call that good news.\nI would not call anything good news.',
};

const CUTSCENES = {
  intro: [
    { music: null },
    { fade: 'in' },
    { text: 'The Legend of Zelda\nOracle of Tides', frames: 150 },
    { text: 'Washed ashore on the coast of Thalassia, Link wakes to a sea that cannot decide where it belongs.', frames: 220 },
    // SHE IS NOT IN THE ROOM. Farore lives in the Maku Tree's hollow behind a
    // five-Essence gate, so the game's opening — eight speeches, sixty-four
    // seconds — was delivered by a voice with no body on screen, over a static
    // village square. This is the beat that gives her one, and it is the same
    // beat `nerethIntro` already uses to put the Drowned King on his own card.
    { show: { art: ['npc_farore_0', 'npc_farore_1'], scale: 3 }, frames: 130 },
    { say: 'Farore: You are awake. Good. I am Farore, Oracle of Secrets, and I have very few left to give.' },
    { say: 'Farore: Nereth the Drowned King has broken the Tide Bell into six Essences and scattered them through the drowned places of this land.' },
    { say: 'Farore: Without the Bell the sea rises and falls at his whim. Take this. It is a shard of the Bell itself.' },
    { give: { item: 'conch', level: 1 }, jingle: 'fanfare' },
    { show: { art: 'title_conch', scale: 2 }, frames: 130 },
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
    { show: { art: ['p_tidebell_0', 'p_tidebell_1'], scale: 3, pal: 'essence' },
      text: 'An Essence of the Tide joins the Bell.', frames: 160 },
    { say: 'The water in your ears goes quiet for a moment. One more piece of the Bell remembers its shape.' },
    { music: 'overworld' },
  ],

  // ---- one scene per Essence, each moving the story on --------------------
  essence1: [
    { music: null },
    { show: { art: ['p_essence1_0', 'p_essence1_1'], scale: 3, pal: 'essence' }, text: 'Essence of the Tide\nI — the Shallow Bell', frames: 150 },
    { say: 'The shard settles against the conch and the two of them hum at each other like old friends.' },
    { say: 'Somewhere inland, a tree that has been asleep for a hundred years opens one eye.' },
    { say: 'Farore: One. Go and see the Maku Tree — it will have felt that, and it will want to give you something.' },
    { music: 'overworld' },
  ],
  essence2: [
    { music: null },
    { show: { art: ['p_essence2_0', 'p_essence2_1'], scale: 3, pal: 'essence' }, text: 'Essence of the Tide\nII — the Coral Bell', frames: 150 },
    { say: 'The reef goes quiet. Every fish in the spire turns to face the same direction at once, and holds it.' },
    { shake: [2, 30] },
    { say: 'Far out past the shelf, something very large notices that it is being taken apart.' },
    { say: 'Nereth: ...a shard. Two shards. The little wading thing has hands.' },
    { music: 'overworld' },
  ],
  essence3: [
    { music: null },
    { show: { art: ['p_essence3_0', 'p_essence3_1'], scale: 3, pal: 'essence' }, text: 'Essence of the Tide\nIII — the Bog Bell', frames: 150 },
    { say: 'The marsh drains a finger\'s width and stays there. It has not held still in a year.' },
    { say: 'Farore: Three. The sea is starting to remember which way is down. Keep going.' },
    { music: 'overworld' },
  ],
  essence4: [
    { music: null },
    { show: { art: ['p_essence4_0', 'p_essence4_1'], scale: 3, pal: 'essence' }, text: 'Essence of the Tide\nIV — the Cliff Bell', frames: 150 },
    { say: 'Half the Bell now. The conch has gone warm and it does not cool down again.' },
    { shake: [3, 40] },
    { say: 'Nereth: Half. HALF. Come to the Keep, then, and bring my Bell with you. I will take it back at the door.' },
    { say: 'Farore: He is frightened. That is new, and it is not necessarily good news.' },
    { music: 'overworld' },
  ],
  essence5: [
    { music: null },
    { show: { art: ['p_essence5_0', 'p_essence5_1'], scale: 3, pal: 'essence' }, text: 'Essence of the Tide\nV — the Drowned Bell', frames: 150 },
    { say: 'The flooded wood lets out a breath it has been holding since before the village had a name.' },
    { shake: [4, 60] },
    { say: 'Every whirlpool between here and the abyss turns over and begins to spin the other way.' },
    { say: 'Farore: Five. One left, and it is in his hands. Go and see the Maku Tree first. Go on. Humour an old plant.' },
    { music: 'overworld' },
  ],
  essence6: [
    { music: null },
    { show: { art: ['p_essence6_0', 'p_essence6_1'], scale: 3, pal: 'essence' }, text: 'Essence of the Tide\nVI — the Drowned King\'s Bell', frames: 170 },
    { say: 'The last shard comes away from Nereth\'s crown and the six of them find each other in your hands.' },
    { say: 'The Tide Bell is whole. It is much smaller than the stories, and much heavier.' },
    { music: 'overworld' },
  ],

  // ---- the Maku Tree beats ------------------------------------------------
  makuSatchel: [
    { say: 'Maku Tree: Hoo hoo! One Essence and my roots can feel the Bell again.' },
    { say: 'Maku Tree: Take the Rod. It was cut from the Bell that used to keep the tide honest.' },
    { give: { item: 'rod', level: 1 }, jingle: 'fanfare' },
    // The intro holds the conch up when Farore hands it over. These two did
    // not, so the game's second and third item handovers — the Resonance Rod
    // and the master sword — were a fanfare and a text box with nothing to
    // look at.
    { show: { art: 'i_rod', scale: 3 }, frames: 130 },
    { say: 'Maku Tree: Bring me five, Link, and I will open the road to the Abyssal Keep. Then I am going back to sleep.' },
  ],
  makuMaster: [
    { music: null },
    { say: 'Maku Tree: Five, and the sixth is in his crown. You did it wet through, which I respect.' },
    { shake: [3, 50] },
    { say: 'Maku Tree: The roots under this village go all the way down to the Keep. I have been growing them for a century, waiting for a reason.' },
    { say: 'Maku Tree: Take this with you. It was left here a long time ago by someone who also thought they would be back.' },
    { give: { item: 'sword', level: 3 }, jingle: 'fanfare' },
    { show: { art: 'i_sword3', scale: 3 }, frames: 130 },
    { say: 'Maku Tree: Go down, Link. And come back up. That second part is the one people forget.' },
    { flag: 'makuOpenedKeep' },
    { music: 'overworld' },
  ],

  // ---- the final fight ----------------------------------------------------
  nerethIntro: [
    { music: null },
    { fade: 'out' },
    { fade: 'in' },
    { show: { art: 'boss_nereth_0', scale: 2, rise: false, pal: 'abyss' },
      text: 'The Abyssal Keep\nthe throne under the sea', frames: 160 },
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
    { show: { art: ['p_tidebell_0', 'p_tidebell_1'], scale: 4, pal: 'essence' },
      text: 'The Tide Bell is whole.', frames: 170 },
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
