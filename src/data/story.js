// Story data: cutscenes and NPC dialogue.
// See game/cutscene.js for the step format.
//
// The text box shows three short lines at a time and wraps on spaces by
// itself (gfx/font.js paginate), so a line needs no '\n' of its own.
//
// HOW PEOPLE TALK (the S202 dialogue pass, measured against both cartridges'
// own text in oracles-disasm). A Seasons or Ages townsperson says about 11
// words; ours said about 22 before S202. So: one fact or one feeling per
// line, everyday words, exclamation marks, and a hint that names the place,
// the direction or the tide (LOW/MID/HIGH in capitals, the way the cartridges
// colour a key word red). Jokes are one quick beat, not an aphorism with a
// twist at the end. A hint stays a hint and a story beat keeps its facts.
//
// Every id in DIALOGUE is referenced from map data — see the `dialogue`,
// `waiting` and `after` options on `npc`, `sign` and `giver` entities. An id the
// map asks for and this file does not define shows an empty box, so the set
// below deliberately runs wider than what the overworld currently uses.

import { registerCutscenes } from '../game/cutscene.js';
import { registerTexts } from '../game/dialogue.js';

export const DIALOGUE = {
  // ---- Tidewatch Village -------------------------------------------------
  villager1: 'Ever since the Tide Bell broke, the sea comes and goes whenever it likes! Yesterday it ate the pier!',
  villager2: 'Farore lives in the shrine on Tern Point, down the south shore. She\'s the Oracle of Secrets!',
  villageChild: 'I can hear a bell under the sea! Grandad says I\'m hearing things.',
  shopkeeper: 'A shield is 30 Rupees. It stops things that get thrown at you. You\'ll want one!',
  hearthWife: 'We built our doorstep up high after the last flood. Now the sea comes in through the floor instead!',
  hearthChild: 'At LOW tide I can walk to the reef! At HIGH tide I can swim over the wall. HIGH is more fun!',

  sandpiper: 'Two houses on this row, and my neighbour\'s is locked up. He went out at LOW tide and never came back...',

  // The peoples of Thalassia. Four hoods, four coasts — the Brinekin hold the
  // bay, the Salters the pans, the Kelpers the wet wood, the Reefkin the reef.
  // Nobody says so outright; they say it the way people do, by complaining
  // about the others.
  shoreSalter: 'I\'m a Salter, down from the pans. We make salt out of whatever the sea leaves behind.',
  timberSalter: 'Wood washes up, I cut it, and the sea takes the chips back. Fair\'s fair!',
  sandpiperKid: 'Mum says I can\'t go past the fence. But the fence is underwater twice a day!',

  // The village digger: the Ferryman's Coin after three Essences.
  diggerWait: 'The sea\'s too wild to dig in right now. Come back with three Essences and I\'ll have something for you.',
  digger: 'Three Essences! The sea finally makes sense. Here, take this Coin! Throw it, then change the tide. You\'ll end up where it landed!',
  // The quarryman in the Cliffs of Kell (S195): the bigger bomb bag.
  quarryman: 'Blew the wall in to get here too, huh? Take this bag. It holds twice as many Bombs as yours!',
  quarrymanAfter: 'The sea cuts this cliff slowly. I cut it fast! One day the Kell will be flat.',

  diggerAfter: 'Throw the Coin first, then sound your conch. The tide carries you to wherever it fell!',

  // The Maku Tree, the last link of the Coastwise Chain: the Resonance Rod for
  // the Tide Bell's own rope, once one Essence has woken her enough to work.
  // Master Sword after all five — the sixth is Nereth's own and there is no
  // coming back to her for it.
  makuWait: 'Hoo... You\'re small, and the sea is big. Bring me an Essence of the Tide, and something that belonged to the old Bell.',
  makuBlocked: 'That\'s the Bell\'s own rope! But my roots are still asleep... Bring me one Essence of the Tide first.',
  makuTree: 'Hoo hoo! The Bell\'s own rope! Hold still... There! The Resonance Rod. Ring it, and every sunken bell will answer.',
  makuAfter: 'Bring me five Essences, Link. Then I\'ll open the road to the Keep and go back to sleep.',
  // Said on every visit after the road is open. The tree has done its part and
  // says so; the seal on the Abyss Stair is already split by the time the
  // player walks back out to it.
  makuOpened: 'The road to the Keep is open. Hurry along! I\'m going back to sleep.',


  // ---- the Coastwise Chain -------------------------------------------------
  //
  // Eleven links, and every one of them is somebody who was left holding a
  // thing the sea took off somebody else. Each trader keeps the flavour line
  // they had before the chain existed — it is what they say when it is not
  // their turn — so the coast sounds the same to a player who never starts it.
  //
  // Short and plain, like the source games' own trading sequence ("Smart
  // boy! Here! Take this fine Iron Pot!"): name the thing, say why you want
  // it, hand over the next one. Nobody says "quest".

  // 1 and 11. Ossa, in the net-mender's house. She opens the chain and she
  // closes it, because the thing the chain is really carrying round the coast
  // is her kettle.
  ossaStart: 'The tide took my kettle! Bring it back and I\'ll make it worth your while. Here, take this float. It\'s cracked.',
  ossaWait: 'That\'s not my kettle. Someone out on the coast has it, and they don\'t know it\'s mine.',
  ossaEnd: 'My kettle! No, don\'t tell me where it\'s been. Take this. It\'s sat in a drawer for forty years.',
  ossaAfter: 'That\'s the rope from the old Tide Bell! My grandmother rang it. Take it to the Maku Tree.',

  // 2. Pell, on the village shore. A float that sinks is not a float; it is a
  // sinker, which is the whole chain in one object.
  pellTrade: 'A cracked float! It sinks! That\'s just what my crab line needs. Here, have this Crab Claw!',
  pellAfter: 'My line goes straight to the bottom now. There\'s a lot of bottom!',

  // 3. Hulla, cutting driftwood on the strand.
  hullaTrade: 'A claw? It\'ll make a great rake! Here, take a Salt Brick. We\'ve got a whole shed of them.',
  hullaAfter: 'The claw rakes better than my old rake ever did!',

  // 4. Mirren, working the coast east of the village.
  mirrenTrade: 'Salt! Now my catch won\'t spoil on the way to the reef. Here, have a Smoked Eel. It keeps!',
  mirrenAfter: 'Salted and boxed! Best week I\'ve had since the Bell broke.',

  // 5. Dov, beside the wreck he is waiting on.
  dovTrade: 'Is that an eel?! I\'ve eaten nothing but sand for three days! Take this Sounding Lead. I can\'t eat it.',
  dovAfter: 'My boat\'s still down there. But at least I\'m not hungry anymore!',

  // 6. Sennit, on Sandpiper Row, who wants to settle an argument.
  sennitTrade: 'A lead line! Now I can find out how deep the pool really is! Take this Whelk. It only rings when it\'s wet.',
  sennitAfter: 'Nine feet at HIGH tide. One foot at LOW! I wrote it on the fence.',

  // 7. Corriwig, diving the coral hollow.
  corriwigTrade: 'A shell that rings underwater? I\'ll tie it to my line so I can hear where it is! Take a Pearl.',
  corriwigAfter: 'Now I can hear my line down in the murk. Handy!',

  // 8. Wick, in the heart of the drowned wood. The wood takes payment.
  wickTrade: 'A Slackwater Pearl! The wood wants paying for what I take, and this will do. Here, a cup carved from a tree that drinks.',
  wickAfter: 'The tree\'s been paid. It\'s not thirsty anymore.',

  // 9. Yarrow, in the witch's hollow.
  yarrowTrade: 'Bogwood! Nothing melts in a bogwood cup. My last one wasn\'t so lucky... Take this jar. It\'s bait, so keep the lid on!',
  yarrowAfter: 'This cup holds anything! I might live forever now. Hee hee!',

  // 10. Teel, fishing off the stones — and the man who hooked the kettle.
  teelTrade: 'Brine-jelly! Every fish on the coast goes crazy for it. Here, take this kettle. It came up on my line.',
  teelAfter: 'That kettle was full of sea. I bet somebody\'s missing it.',

  faroreHome: 'The Tide Bell kept the sea on time, like a clock. Nereth broke it, and now the sea does what he wants.',

  // ---- the coast and the Shallows ----------------------------------------
  coastFisher: 'At LOW tide you can walk right out to the reef! Just get back before the water does.',
  fisher1: 'The reef\'s a road at LOW tide. Best fishing on the coast, if you\'re quick!',
  coastChild: 'I found a crab as big as a dog! Then it found me. I\'ve stayed indoors ever since.',
  wreckSurvivor: 'My boat\'s out there, under six feet of sea that wasn\'t there last week! Maybe your shell can move it?',

  // ---- Coral Reef --------------------------------------------------------
  coralDiver: 'In the Coral Spire, rising water carries you up, and falling water shows you the way. Look before you change the tide!',
  reefFisher: 'The whirlpools in the sunken palace only take you down. Find the stairs if you want to come back up!',

  // ---- Marsh, Cliffs, Wood ------------------------------------------------
  bogWitch: 'The currents in the Sanctum push any swimmer back. Down on the bottom, nothing pushes you at all!',
  stoneFisher: 'The Cistern up on the Kell was built to keep the sea out. Now it\'s full of it!',
  woodChild: 'The trees here drink when the water comes up. One of them drinks people! Don\'t say I told you.',

  // ---- Salt Pans and the Abyssal approach ---------------------------------
  salterElder: 'It\'s too damp down in the Vault to strike a fire. Light it in the dry kiln up top, then carry it down!',

  // ---- signs and spares the maps may reach for ---------------------------
  // Ossa's old line, from before she opened the Coastwise Chain. Kept because
  // it is the best thing anyone says about nets and it belongs to whoever gets
  // a net next; her three chain lines say who she is now.
  netMender: 'Nets rot from the top down, where they dry out. It\'s the drying that does it, not the sea.',
  elder1: 'I\'ve seen the sea take this village twice and only give it back once. It owes us!',
  child1: 'Are you going to fight the Drowned King? Can I have your boots if you lose?',
  // The townsfolk's errands (S155 side content). Each person says `...Ask`
  // until their thing comes home, then `...Thanks` as they pay for it.
  diveAsk: 'My cargo sank with my boat, into the deep pool behind it. Five casks! Bring all five up in one breath. Come up short and you\'ll drop the lot!',
  diveThanks: 'All five casks, and dry inside! I was saving this for the day they came back. Here!',
  raceAsk: 'Race you to Pip on the sandbar past the Fishing Stones! The sand path only shows at LOW tide. Ready? GO!',
  raceBusy: 'Why are you still here? RUN!',
  raceWin: 'You made it! Nobody beats the tide like that. Here, you earned it!',
  raceLose: 'Too slow! The tide would\'ve had you. Come back and try again.',
  // The bell-buoy echo (S201), Sunken Cove.
  buoyAsk: 'Each buoy rings its own note. I\'ll play a tune, and you ring it back with your Rod. Careful, it rings every buoy near you!',
  buoyNoRod: 'These buoys play a tune when you strike them. Come back with something metal that rings.',
  buoyTurn: 'Your turn. Ring it back.',
  buoySour: 'Sour note! Talk to me and we\'ll try that one again.',
  buoyNext1: 'Good ear! Now four notes. Some only reach at LOW tide.',
  buoyNext2: 'Last one! It ends with the whole bay ringing at once.',
  buoyWin: 'That\'s the old tune, every note! Have my spare seed bag. It holds twice as many.',
  buoyWinAgain: 'Still in tune. Here, for your trouble.',
  raceGoalWait: 'This is the finish! Talk to my friend on South Bluff to start the race.',
  ledgerAsk: 'The wind blew my ledger out the window! Every debt on the coast is in it. Try the South Sands.',
  ledgerThanks: 'My ledger! Wet, but I can still read it. Here. Now I owe you, and that\'s written down too!',
  kiteAsk: 'My kite\'s stuck up a tree in the hollow past the bluff! It\'s too high to reach. You\'d need a big gust of wind.',
  kiteThanks: 'My kite! I found this under the doorstep after the flood. You have it!',
  bogwaterAsk: 'My husband left a jar filling at the spring up at Bog Head, and forgot it! Nets last twice as long tanned in bog water.',
  bogwaterThanks: 'That\'s the colour! Tea-brown. The nets go in tonight. Here, take this for the walk!',
  // THE DARK LIGHTHOUSE (S200). The keeper asks for the lamp's three parts
  // (`keeperAsk`, then `keeperPartial` once one is home), takes them all at
  // once (`keeperThanks`), and sends you up the stair with fire.
  keeperAsk: [
    'This light kept ships off the Abyss for forty years. Then the sea went strange, and a wave smashed the lamp to pieces.',
    'The lens is in the shallows of the East Strand, past your village. A line could drag it up while the sea covers it.',
    'The reflector is in the kelp at the World\'s Edge, too far out to cut. You\'d need something to stand on out there.',
    'And the oil cask washed into a salt-walled hollow on the East Crust of the pans. Bring me all three!',
  ],
  keeperPartial: 'Good! But I need all three, the lens, the reflector and the oil, before I can fit any of them.',
  keeperThanks: [
    'Lens, reflector, oil... all three, and not a crack in the glass!',
    'There, she\'s fitted. My hands shake too much to light her now. Take a flame up the stairs for me.',
  ],
  keeperLight: 'The lamp\'s ready. Take a flame up the stairs. That shell of yours burns, doesn\'t it?',
  keeperAfter: 'Look at her shine! When the beam crosses the cliff south of here, you can see an old cove. It\'s all yours.',
  lampLit: 'The lamp lights! Its beam sweeps out over the Drowned Shore and away to sea.',
  shopkeeper2: 'Buy something or stand somewhere else. Either\'s fine by me!',

  // ---- second states -----------------------------------------------------
  //
  // Every ordinary townsperson now has two lines: the one they have always
  // had, and one keyed to a number of Essences a person in that town could
  // plausibly have noticed. Nobody explains the plot: they notice the sea
  // behaving and say so, the way Lynna's townsfolk notice the Queen.
  //
  // Four of these are not new text at all: `child1`, `elder1`, `netMender` and
  // `shopkeeper2` were written for villagers who were never placed, and are
  // reused here as later lines for villagers who were. `T49` says do not add
  // NPCs to hang lines on — so these got hung on the ones already standing.
  //
  // The beats are spread 1..5 on purpose. Talking to a whole town at once and
  // hearing every line turn over together would read as a switch being thrown.
  villager2After: 'Farore hasn\'t come down to the shrine steps lately. She says she\'s busy. She\'s never busy!',
  hearthWifeAfter: 'The floor\'s been dry all week! I don\'t trust it one bit.',
  hearthChildAfter: 'The sea does what it\'s told now! Mum says not to say that outside.',
  shoreSalterAfter: 'The salt pans are filling right again. Don\'t expect a Salter to say thanks, though.',
  faroreHomeAfter: 'The Bell is nearly whole. The last piece won\'t come cheap... but you\'ll go anyway, won\'t you?',
  fisher1After: 'The sea comes and goes right on time now. Funny... I\'d gotten used to the old one!',
  reefFisherAfter: 'The reef\'s been calmer lately. The fish are back where they belong!',
  salterElderAfter: 'Salt\'s winning again up at the pans. Not that I\'d call that good news. I don\'t call anything good news.',
};

const CUTSCENES = {
  // THE OPENING (S158). Link washes up with nothing, the way Seasons opens
  // on him lying in the grass with nothing: no voice hands him a conch and a
  // sword over a black screen any more. The sword is in the Shipwright's
  // Hollow on Gull Sands (a Wenna hint), the Barnacle Key from the Maku Tree,
  // and the Moon Conch from Farore herself, in her shrine on Tern Point —
  // the Oracle met in person, as Din and Nayru are.
  intro: [
    { music: null },
    { fade: 'in' },
    { text: 'The Legend of Zelda\nOracle of Tides', frames: 150 },
    { text: 'Link washes up on the coast of Thalassia, where the sea can\'t decide where it belongs.', frames: 220 },
    { flag: 'sawIntro' },
    { music: 'overworld' },
  ],

  // The fisherman on the Fishing Stones, the first person spoken to.
  wakeBeach: [
    { say: 'Whoa, easy there! The tide washed you up on my stones with the driftwood. You\'re the first piece that ever sat up!' },
    { say: 'This is Thalassia. Tidewatch Village is up the path. For a year now, the sea\'s been coming and going as it pleases.' },
    { say: 'And you\'ve got nothing on you! Go up to the village and find old Wenna by the palisade. If there\'s a blade anywhere on this coast, she\'ll know.' },
    { flag: 'metFisher' },
  ],

  // Wenna at the palisade: where the first blade is.
  bladeHint: [
    { say: 'Washed up, are you? You\'ve got that look.' },
    { say: 'A blade... My grandfather built boats. When the sea went strange, he hid his best blade in a hollow under the bluff at Gull Sands, and walled it up.' },
    { say: 'Take the shore road past the Fishing Stones, then go east along the sand. His door is stubborn. Push on it till it moves!' },
    { flag: 'heardBlade' },
  ],

  // Farore, in her shrine on Tern Point: the Moon Conch.
  faroreConch: [
    { say: 'There you are! I watched the tide bring you in. I\'m Farore, the Oracle of Secrets... though I don\'t have many left.' },
    { say: 'Nereth, the Drowned King, broke the Tide Bell into six Essences and hid them in the drowned places of this land. Without the Bell, the sea rises and falls as he likes.' },
    { say: 'When the Bell broke, this washed up on my steps. It hasn\'t stopped humming since. I think it was waiting for you.' },
    { present: { item: 'conch', level: 1 } },
    { say: 'Sound it and the tide will answer: LOW, then MID, then HIGH, and around again. Try it outside, where the sea can hear it.' },
    { say: 'The Tidewash Grotto is east, out on the Shallows. The Maku Tree keeps its key, in her hollow at the top of the village square. Go and see her!' },
    { flag: 'gotConch' },
  ],

  // Fallback for any essence index without its own scene.
  essenceGeneric: [
    { music: null },
    { show: { art: ['p_tidebell_0', 'p_tidebell_1'], scale: 3, pal: 'essence' },
      text: 'An Essence of the Tide joins the Bell.', frames: 160 },
    { say: 'The roar of the sea goes quiet for a moment. One more piece of the Bell is home.' },
    { music: 'overworld' },
  ],

  // ---- one scene per Essence, each moving the story on --------------------
  essence1: [
    { music: null },
    { show: { art: ['p_essence1_0', 'p_essence1_1'], scale: 3, pal: 'essence1' }, text: 'Essence of the Tide\nI — the Shallow Bell', frames: 150 },
    { say: 'The Essence settles against the conch. The two of them hum together, like old friends.' },
    { say: 'Back in the village, the Maku Tree opens one eye.' },
    { say: 'The conch hums, and Farore\'s voice comes out of it.' },
    { say: 'That\'s one! The fisherman at Sandpiper Row knows the reef better than anyone. Go and see him.' },
    { music: 'overworld' },
  ],
  essence2: [
    { music: null },
    { show: { art: ['p_essence2_0', 'p_essence2_1'], scale: 3, pal: 'essence2' }, text: 'Essence of the Tide\nII — the Coral Bell', frames: 150 },
    { say: 'The reef goes quiet. Every fish in the Spire turns to face the same way, all at once.' },
    { shake: 30 },
    { say: 'Far out at sea, the Drowned King notices he\'s being taken apart.' },
    { say: '...Two shards. The little wader has busy hands.' },
    { say: 'The conch hums, and Farore\'s voice comes out of it.' },
    { say: 'That\'s two! The Sanctum in the marsh is next, but it\'s locked. The old man in the village square was there when they locked it. Ask him!' },
    { music: 'overworld' },
  ],
  essence3: [
    { music: null },
    { show: { art: ['p_essence3_0', 'p_essence3_1'], scale: 3, pal: 'essence3' }, text: 'Essence of the Tide\nIII — the Bog Bell', frames: 150 },
    { say: 'The marsh drains a little, and stays put. It hasn\'t held still in a year.' },
    { say: 'The conch hums, and Farore\'s voice comes out of it.' },
    { say: 'That\'s three! The sea is starting to behave. Keep going!' },
    { say: 'The Cistern up on the Kell is locked too. The Salters got their water from it. Ask the Salter down by the village well.' },
    { music: 'overworld' },
  ],
  essence4: [
    { music: null },
    { show: { art: ['p_essence4_0', 'p_essence4_1'], scale: 3, pal: 'essence4' }, text: 'Essence of the Tide\nIV — the Cliff Bell', frames: 150 },
    { say: 'That\'s half the Bell. The conch has gone warm, and it stays warm.' },
    { shake: 40 },
    { say: 'Half?! HALF?! Then come to the Keep, wader, and bring my Bell. I\'ll take it back at the door.' },
    { say: 'The conch hums, and Farore\'s voice comes out of it.' },
    { say: 'He\'s scared. That\'s new... and it might not be good news.' },
    { say: 'The digger in the village square has been itching to dig for a week. Go and see him!' },
    { music: 'overworld' },
  ],
  essence5: [
    { music: null },
    { show: { art: ['p_essence5_0', 'p_essence5_1'], scale: 3, pal: 'essence5' }, text: 'Essence of the Tide\nV — the Drowned Bell', frames: 150 },
    { say: 'The flooded wood lets out a long breath, as if it had held it for a hundred years.' },
    { shake: 60 },
    { say: 'Every whirlpool between here and the Abyss stops, and starts spinning the other way.' },
    { say: 'The conch hums, and Farore\'s voice comes out of it.' },
    { say: 'That\'s five! The last one is in Nereth\'s hands. Go and see the Maku Tree first. Humour an old plant!' },
    { music: 'overworld' },
  ],
  essence6: [
    { music: null },
    { show: { art: ['p_essence6_0', 'p_essence6_1'], scale: 3, pal: 'essence6' }, text: 'Essence of the Tide\nVI — the Drowned King\'s Bell', frames: 170 },
    { say: 'The last Essence falls from Nereth\'s crown. All six come together in your hands.' },
    { say: 'The Tide Bell is whole again. It\'s smaller than in the stories, and much heavier.' },
    { music: 'overworld' },
  ],

  // ---- the dungeon keys (S154), one story beat each -----------------------
  // THE CORAL KEY: Sandpiper Row's fisherman, once the first Essence is in.
  coralKey: [
    { say: 'You made it out of the Grotto! And dry, too. Nobody stays dry this year.' },
    { say: 'My father used to dive in the Coral Spire. When the sea went strange, the divers locked it up, and he kept the key in his tackle box.' },
    { say: 'The reef\'s north of here, past the gap. Take the key. The sea listens to you now!' },
    { do: (g) => g.presentKey('d2') },
  ],

  // THE PEAT KEY: the old man in the village square, at two Essences.
  peatKey: [
    { say: 'Two Essences, and you\'ve still got all your fingers! Sit down a moment. No, stand. You\'re wet.' },
    { say: 'When the bog rose over the Sanctum, we locked its door to keep the marsh out of the village. I turned the key myself.' },
    { say: 'Head west, past the cracked cliff. You can walk the bog at LOW tide. Here, take the key!' },
    { do: (g) => g.presentKey('d3') },
  ],

  // THE CISTERN KEY: the Salter on Village Shore, at three Essences.
  cisternKey: [
    { say: 'Three Essences! The pans felt that. The brine ran the right way for a whole hour!' },
    { say: 'Our water used to come from the Cistern on the Kell. When the sea got into it, we locked the gate and kept the key.' },
    { say: 'Go north through the Deep Cut, then west along the cliffs. Here\'s the key. Bring our water back if you can!' },
    { do: (g) => g.presentKey('d4') },
  ],

  // THE MOSS KEY: the village digger, at four Essences.
  mossKey: [
    { say: 'Four Essences! The sea finally told me where to dig. Right here!' },
    { shake: 30, sfx: 'rumble' },
    { say: 'A key, all grown over with moss! It must be for the Shrine in the Drowned Wood. Take the wood road north of the village.' },
    { do: (g) => g.presentKey('d5') },
  ],

  // ---- the Maku Tree beats ------------------------------------------------
  // THE FIRST MEETING (S154): the Barnacle Key, the Gnarled Key's role. The
  // tree's `beat` plays this the first time she is spoken to; the last step
  // hands the key over the way every item is handed over, held overhead.
  makuKey: [
    { say: 'Hoo... hoo? A boy with a blade on his back! I\'ve been asleep a long time, child. Something in the sea woke me up.' },
    { say: 'When the sea went wrong, the village locked up the Tidewash Grotto and gave me the key to keep. Here, you take it.' },
    { key: 'd1' },
    { say: 'The Grotto is east, out on the Shallows. But the key\'s no use while the sea covers the sandbar. Farore has a piece of the Bell, in her shrine on Tern Point, down the south shore. Go and see her!' },
  ],

  makuSatchel: [
    { say: 'Hoo hoo! One Essence, and my roots can feel the Bell again!' },
    { say: 'Take this Rod. It was cut from the Tide Bell itself.' },
    // Held overhead to Seasons' item jingle, as every other handover is.
    { present: { item: 'rod', level: 1 } },
    { say: 'Bring me five Essences, Link, and I\'ll open the road to the Abyssal Keep. Then I\'m going back to sleep!' },
  ],
  makuMaster: [
    { music: null },
    { say: 'Five Essences! The sixth is in Nereth\'s crown. And you\'re soaked through. I like that!' },
    { shake: 50 },
    { say: 'My roots reach all the way down to the Keep. I\'ve been growing them for a hundred years, just for this.' },
    { say: 'Take this with you. Someone left it here long ago. They thought they\'d be back for it, too.' },
    { present: { item: 'sword', level: 3 } },
    // THE SIXTH KEY (S154). The seal on the road down the Kell is a keyhole,
    // and this is what fits it.
    { say: 'And this! When Nereth broke the Bell, its clapper rolled into my roots. He never came looking for it.' },
    { say: 'The seal on the road down the Kell was made with the Bell. It\'ll open for the clapper. Go on down, Link. And come back up! People always forget that part.' },
    { flag: 'makuOpenedKeep' },
    { flag: 'keyD6' },
    { music: 'overworld' },
    { do: (g) => g.presentKey('d6') },
  ],

  // ---- the final fight ----------------------------------------------------
  nerethIntro: [
    { music: null },
    { fade: 'out' },
    { fade: 'in' },
    { show: { art: 'boss_nereth_0', scale: 2, rise: false },
      text: 'The Abyssal Keep\nthe throne under the sea', frames: 160 },
    { say: 'So you came down. Everything sinks in the end.' },
    { say: 'I didn\'t break the Bell to be cruel, wader. For a thousand years the sea was told what to do. Nobody ever asked it.' },
    { say: 'Now it does as it likes. Which means, as I like!' },
    { shake: 60 },
    { say: 'Go on, blow your little shell. Let\'s see whose sea this is!' },
    { music: 'finalBoss' },
  ],
  ending: [
    { music: null },
    { fade: 'out' },
    { show: { art: ['p_tidebell_0', 'p_tidebell_1'], scale: 4, pal: 'essence' },
      text: 'The Tide Bell is whole.', frames: 170 },
    { fade: 'in' },
    { music: 'ending' },
    { say: 'The Bell rings once, deep under the water. You can\'t hear it, but you can feel it.' },
    { tide: 1 },
    { say: 'The sea goes out. Then it comes back in. Then out again, right on time.' },
    { say: 'The conch hums, and Farore\'s voice comes out of it.' },
    { say: 'Listen to that. Boring, isn\'t it? It took six Essences and a Drowned King to make the sea boring again!' },
    { say: 'The village is already arguing about where to build the new pier. That\'s how you know it worked!' },
    { say: 'I\'m the Oracle of Secrets, Link, and I\'m all out. Go home. Take the boat at LOW tide.' },
    { text: 'Thalassia keeps its shape.\nThe pier goes back where the pier goes.\nThe Maku Tree sleeps.', frames: 260 },
    { flag: 'finishedGame' },
    // THE GAME DOES NOT RESUME AFTER THE END. It used to: the scene let go,
    // the mode went back to 'play', and Link stood in the throne room again
    // with whatever Nereth had summoned still swinging at him. The source
    // games hold THE END until a button, and then it is the title screen.
    // Since S213 the staff roll comes first (src/game/credits.js), as in
    // Seasons, and THE END is the cartridge's own sunset.
    { do: (g) => { g._theEnd = true; } },
  ],

  // ---- the trading sidequest ----------------------------------------------
  tradeKettle: [
    { say: 'You got a kettle full of seawater. That\'s not what kettles are for...' },
    { say: 'Someone along the coast must want it more than you do.' },
  ],
};

export function installStory() {
  registerCutscenes(CUTSCENES);
  registerTexts(DIALOGUE);
}

export { CUTSCENES as STORY_CUTSCENES };
