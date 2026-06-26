/* ══════════════════════════════════════════════════════════════════════
   Chronicles of Lyr — Adventure Engine
   Welcome screen, academy gates, VN intro, interactive library
   ══════════════════════════════════════════════════════════════════════ */

/* ─── Book Registry ───────────────────────────────────────────────── */
const BOOK_REGISTRY = {
  "light-novels": [
    { id: "wotk-ch1", file: "books/will-of-the-king-ch1.js", spineTitle: "Will of the King", spineColor: "book-color-red", width: 58 },
    { id: "aso-ch1", file: "books/angels-sword-origin-ch1.js", spineTitle: "Angel's Sword Origin", spineColor: "book-color-blue", width: 52 }
  ],
  "lore": [],
  "research": [
    { id: "on-fiends", file: "books/on-fiends.js", spineTitle: "On Fiends", spineColor: "book-color-green", width: 48 },
    { id: "nature-of-magic", file: "books/on-the-nature-of-magic.js", spineTitle: "On the Nature of Magic", spineColor: "book-color-gold", width: 54 }
  ],
  "field": []
};

/* ─── Map Registry ────────────────────────────────────────────────── */
const MAP_REGISTRY = [
  { id: "lyrian-peninsula", file: "map/LyrPSNewJpeg.jpg", title: "Map of the Lyr Peninsula" },
  { id: "houkaina", file: "map/Houkaina.PNG", title: "Map of Houkaina" },
  { id: "far-east-empire", file: "map/Map.jpg", title: "Map of The Far East Empire" },
  { id: "mirane-expedition", file: "map/Mirane.jpg", title: "Map of Mirane Expedition" }
];

/* ─── Relic Registry ──────────────────────────────────────────────── */
const RELIC_REGISTRY = {
  "fiend-relics": [
    {
      id: "gravity-fiend",
      title: "Gravity Fiend",
      image: "img/artifact/gravity.jpeg",
      crystalColor: "#4a1a6b",
      crystalGlow: "rgba(120, 40, 180, 0.6)",
      lore: {
        slainAt: "Corwood",
        year: "726",
        killedBy: "Mirane Expeditioner Alliance",
        captain: "Beetle Swallower",
        squad: ["Raoh", "Sable", "Dark Paladin", "Alaric"],
        ability: "Gravity Manipulation",
        type: "Exousiai",
        danger: "Very High",
        description: "Slain in Corwood in 726\u2014the gravity fiend was killed by an expedition from the Mirane Expeditioner Alliance. The party consisted of Captain \"Beetle Swallower\" and his squad: Raoh, Sable, Dark Paladin and Alaric.\n\nThe gravity fiend, like its name said had the ability to manipulate gravity.",
        appearance: "The Gravity Fiend manifested as a colossal, shapeless mass of swirling dark matter suspended above the forest canopy. Its body was a churning vortex of condensed gravitational force\u2014dense tendrils of violet-black energy cascading downward like an inverted maelstrom. Three concentric rings of distorted space orbited its core, bending light and debris into halos of destruction.\n\nWhere the fiend hovered, the earth beneath cracked and cratered under impossible weight. Trees were ripped from their roots and drawn upward into its spiraling form. Its lower body tapered into a single tendril that touched the ground like the finger of a wrathful god, leaving scorched, compressed earth in its wake.\n\nIt had no eyes, no mouth, no discernible features\u2014yet those who faced it reported an overwhelming sense of being watched, as though gravity itself had become aware. The air around it shimmered with gravitational lensing, making it appear to occupy more space than it physically did. Soldiers who drew near described their armor becoming impossibly heavy, their blood pooling in their extremities, and their vision tunneling as the fiend warped the very fabric of space around them."
      }
    }
  ]
};

/* ─── VN Dialogue Script ──────────────────────────────────────────── */
const VN_SCRIPT = [
  { speaker: "Philomel Lapis", text: "Oh! A visitor... Welcome to the Riannon Institute of Alchemy.", expression: "idea" },
  { speaker: "Philomel Lapis", text: "I'm Philomel — a researcher here. I help maintain the archives and special collections.", expression: "smile" },
  { speaker: "Philomel Lapis", text: "We have light novels, historical records, academy research notes, and field reports from adventurers across Lyr.", expression: "book" },
  { speaker: "Philomel Lapis", text: "Feel free to browse the shelves and pick up anything that catches your eye. I'll be here if you need help!", expression: "clasp" }
];

/* ─── Front Desk Dialogue ─────────────────────────────────────────── */
const DESK_DIALOGUE = [
  { text: "Hello.  I'm Philomel Lapis.  I've been a member of the academy for quite some time.", expression: "smile" },
  { text: "The Riannon Institute of Alchemy has been around for centuries and has a rich history.  Famous mages have graduated from here... including the World Famous Camielelileananu, Mirane and Chroma Lichtvog to name a few.", expression: "book" },
  { text: "Isn't alchemy amazing?  You can make so many useful things out of what others would consider weeds or junk.", expression: "happy" },
  { text: "My wife?  Ah... yeah... she's back at Sylvan.  I miss her.", expression: "sad" },
  { text: "Inter-racial procreation?  Ah... I see you're one of those...  I think theres a book by Dr. Mizi Marion somewhere...", expression: "puzzled" },
  { text: "The four swords war?  Ah... yes, I was a member of Ayra's party.  That Ayra, the holy maiden.  I was the airship's doctor onboard the Nadesico.", expression: "concerned" },
  { text: "Hazel Nutella?  I don't want to talk about her...", expression: "pout" },
  { text: "I think I consider myself a member of the Angel's Sword Guild.  I do find myself working there a lot.", expression: "clasp" },
  { text: "My favorite food?  Oh... I adore Nurenese Steak.  It's really the best.  Although prices have gone up significantly since the war...", expression: "joyful" },
  { text: "Are you considering enrolling as a student here?  I would make sure to brush up on the basics first!  It's not easy to get in.", expression: "idea" },
  { text: "You want a certain potion from me?  Oh... that... well...  can we not talk about that....", expression: "nervous" },
  { text: "What do slime cores taste like?  Why do people always ask that?!", expression: "pout" }
];

/* ─── Guard Dialogue (City Gates) ─────────────────────────────────── */
const GUARD_INTRO = [
  { text: "Hello.  Welcome to the Free Trade City of Mothergreen.", sprite: "1" },
  { text: "Let me know if I can help you with anything.", sprite: "2" }
];

const GUARD_DIALOGUE = [
  { text: "Don't try to start any trouble okay?", sprite: "6" },
  { text: "Mothergreen exists on the intersection of the Fayto and Signum Leylines.", sprite: "2" },
  { text: "Why are leylines important?  Well airships need them to travel... otherwise you're burning too much magical fuel.", sprite: "4" },
  { text: "The city is run by a Mercantile collective that has its own army.", sprite: "2" },
  { text: "Huh? Rabbitfolk? Why do you think I would dislike Rabbitfolk?", sprite: "3" },
  { text: "I miss going on vacation to Madeline, they have great restaurants there, but no chance I'm going there with the war and all.", sprite: "5" },
  { text: "I hope we don't get too involved in the Dacquoise war....", sprite: "5" },
  { text: "Lorenz Gang?  Bunch of ruffians...", sprite: "6" },
  { text: "The Riannon Institute of Alchemy?  Its world famous, only the Merlin Academy of Magic in Northi is even close.", sprite: "2" },
  { text: "My sword style?  Hah.  Aurora Blade Style obviously... Idris was a legend in Mothergreen!", sprite: "4" },
  { text: "Angel's Sword Guild?  Ugh... I don't want to talk about it... but they cause so many problems.", sprite: "3" }
];

/* ─── Queri Dialogue (Combat School) ──────────────────────────────── */
const QUERI_DIALOGUE = [
  { text: "Hi!  I'm Queri Lilibit. Alchemist, Transmuter, Fiend Researcher and Faerie Fencer!", sprite: "2" },
  { text: "I highly recommend the combat school if you're new here... it could save your life.", sprite: "1" },
  { text: "I also run an Alchemy Shop in town, you should come visit sometime!", sprite: "2" },
  { text: "My party members, Nia and Ashe are always doing crazy things... I'm always worried about them.", sprite: "5" },
  { text: "I'm a Fiend researcher, did you know that?  I graduated from the Riannon Institute of Alchemy.", sprite: "1" },
  { text: "No... I don't personally know Camielelileananu...  not every Alchemist is her friend you know.", sprite: "3" },
  { text: "Fiends are always evil, but people forget that...  a veteran expeditioner died recently because they forgot that...", sprite: "5" },
  { text: "Fiends just want to deceive you... but I heard some rumors of people who were fiends that regained their sanity and state of mind.", sprite: "4" },
  { text: "Is such a thing possible?  Its just stories from the east....", sprite: "4" },
  { text: "People who eat Astra Sporocarps can exhibit fiend-like abilities.  It changes you.", sprite: "1" },
  { text: "Don't forget to bring smoke flasks!  They're a lifesaver.", sprite: "2" },
  { text: "My favorite food?  I love meat stew with berries.  But lately I've been craving Chorpa Steaks.  Have you had it?", sprite: "2" },
  { text: "The director?  I've never met them... I don't think anyone even knows what they look like.", sprite: "4" }
];

/* ─── Nix Ni Arlan Dialogue (Airship Docks) ───────────────────────── */
const NIX_INTRO = [
  { text: "Heya!  I'm Nix Ni Arlan, airship pilot and navigator for the Angel's Sword Guild.", sprite: "2" },
  { text: "I'm off today, but I'm trying to make some money so... I'll take you anywhere you want.", sprite: "1" }
];

const NIX_DIALOGUE = [
  { text: "I love that feeling of the wind in your hair.  Airships are the best way to travel.", sprite: "2" },
  { text: "Obviously we would have to use leylines.... Magical Fuel Prices these days....", sprite: "5" },
  { text: "Our airship has upgraded engines from Sorthen, the best!", sprite: "4" },
  { text: "Never skimp out and buy Northi engines...", sprite: "3" },
  { text: "Oh! You noticed my name, \"Ni Arlan\".  My family is famous for airship engineers and helmsman.", sprite: "2" },
  { text: "The funny thing though... my mom is a Cannoneer!  She fought in the battle of Sorthen.", sprite: "4" },
  { text: "Why do I need money? Hmm... let's just say... I have very pricey expenses.", sprite: "1" },
  { text: "What? No!  I'm not buying Frixie Dust... geez....", sprite: "6" },
  { text: "My sister Mix is such a gearhead.  She always comes home covered in dirt and oil.", sprite: "2" },
  { text: "I'm not really much of a fighter, but my sister can really defend herself.", sprite: "1" },
  { text: "She's got a Divine Arms... and its quite strong.", sprite: "4" },
  { text: "I was supposed to take over the family engineering business but... I was a bit of a failure lets just say.", sprite: "5" },
  { text: "Yeah I fought in the four swords war.  I pulled some pretty crazy maneuvers then...", sprite: "4" },
  { text: "One time... I dove an airship straight into the mouth of a fiend to blast it with the buster cannon!  True story!", sprite: "6" },
  { text: "Airships are romantic... they can take you anywhere you want to go...", sprite: "1" },
  { text: "Leaflit?  Oh she's my best friend, we've been friends for a while.", sprite: "2" }
];

/* ─── Mirrime Wolkensang Dialogue (Mirane) ────────────────────────── */
const MIRRIME_INTRO = [
  { text: "Hey.  You look new around here!", sprite: "2" },
  { text: "Do you need help?", sprite: "1" }
];

const MIRRIME_DIALOGUE = [
  { text: "I'm Mirrime Wolkensang!  Goblin warrior!  I won't lose to anyone!", sprite: "4" },
  { text: "I'm following the path of Eisen!", sprite: "4" },
  { text: "I arrived here in Mirane a little bit over a year ago. We've been through a lot...", sprite: "1" },
  { text: "Dragon Claw War... I'll never forgive them.  I'll never forgive the cultists...", sprite: "3" },
  { text: "When Sebo and Tereval died in that battle... I didn't know what to do...", sprite: "5" },
  { text: "Thats what this is here... the statue of Mirane.  The namesake of this town.", sprite: "1" },
  { text: "When an expeditioner dies, their most important item is left here at the statue.  Its so we always remember them...", sprite: "5" },
  { text: "Jerry?  Gah... he's so annoying man!", sprite: "6" },
  { text: "When you get settled, lets go on an expedition together! Ehehehe!", sprite: "2" },
  { text: "Why am I in Mirane?  I hope to find an Astra Relic that will heal my people.", sprite: "1" },
  { text: "Goblins and Orcs are the same race... Orcs have a disease.  Our people have traded health for power for generations.", sprite: "5" },
  { text: "Our people are disadvantaged in many ways... but we won't let that stop us.  It just means when we do well it means so much more!", sprite: "4" },
  { text: "Dr. Ziggy?  Yeah I know about him... I heard he tried to create a virus to kill all life in Lyr.  I hear he's out here somewhere...", sprite: "3" },
  { text: "Oh those drinks... yeah I don't want to drink any Gobbo Fuel.  Those were made by Dr. Ziggy you know...", sprite: "6" },
  { text: "Astra poisoning feels awful... it feels like when you've stayed up for two days in a row and haven't slept.", sprite: "5" },
  { text: "My favorite food?  Chorpa Ribeye!", sprite: "2" },
  { text: "I heard in the Heartwood theres a really good restaurant.  It's ran by the crows.", sprite: "1" },
  { text: "Helvetica?  I know a lot of Miraners are hunting her down.", sprite: "3" },
  { text: "A void crow told me that there was a large temple to Eisen in the Lightning Wastes... when I get strong enough I'll go.", sprite: "4" },
  { text: "Whatever you do avoid Malignance Rift...", sprite: "3" },
  { text: "Be careful around Thousand Lakes, I got attacked once by a group calling themselves, \"Silica Wraiths\"", sprite: "3" }
];

/* ─── Aniela Dialogue (MEA HQ) ────────────────────────────────────── */
const ANIELA_INTRO = [
  { text: "Hello there.  Welcome to the Mirane Expedition Alliance.", sprite: "1" },
  { text: "We coordinate and manage the expeditions into the Astra Line.", sprite: "2" },
  { text: "I'm Aniela.  How can I help you?", sprite: "1" }
];

const ANIELA_DIALOGUE = [
  { text: "The MEA is the official administrative body for the Town of Mirane and the Mirane Expedition, we've grown a lot in the last year.", sprite: "2" },
  { text: "People come here from all over... for various reasons.  We have researchers, treasure hunters.... explorers... all sorts of people.", sprite: "1" },
  { text: "The Astra Line is a dangerous place... always be prepared with enough food and supplies.", sprite: "2" },
  { text: "I've been working here since the beginning... 'roped into it' you could say.  But I'm glad to be useful.", sprite: "3" },
  { text: "My favorite food?  Honestly anything imported... I'm tired of Chorpa Steaks... although I could really do for some Sorthenese Stew...", sprite: "3" },
  { text: "Me? Go on expeditions?  Ah... I don't think I'm quite cut out for that.", sprite: "4" },
  { text: "The Director?  Ah... I owe them a lot.  I'm just happy to have a home here.", sprite: "1" },
  { text: "Don't try anything funny... last year someone tried a terrorist attack and they were executed instantly... the director has 'ways'...", sprite: "6" },
  { text: "M.E.A. Staff?  Ah theres not too many of us but we're growing,  Theres me, Ravas and Karin among others.", sprite: "2" },
  { text: "The staff are a bunch of misfits to be honest... but everyone does their best.", sprite: "1" },
  { text: "Karin?  Ah.  She's nice.  Don't get between her and Mylene though.", sprite: "3" },
  { text: "If you need any supplies you can ask Pecorine or any of the other merchants in town to try to procure it for you.", sprite: "2" },
  { text: "If you need something smithed you should ask Fidget Tangan.  Hard to say if she has time though.", sprite: "3" },
  { text: "Crimson?  How do you know about her?", sprite: "4" },
  { text: "Last year we had the world famous Alchemist, Camielelileananu in town... it was quite a treat.  She's so cool.", sprite: "2" },
  { text: "My eyes?  Ah... it's just like this.  Don't worry too much about it.", sprite: "1" },
  { text: "Don't forget to drink lots of water and get a lot of rest.", sprite: "2" },
  { text: "If you remember anything... just remember to be safe.  Come back home to me, okay?", sprite: "5" },
  { text: "Everytime an expeditioner dies... it really breaks my heart.  I wish the director would do more to prevent it.", sprite: "5" },
  { text: "I respect the director's wishes but... I disagree on the methodology.", sprite: "6" },
  { text: "I think it would be great for morale if we hosted a big concert like the Starlight Festival, but not just for idols.", sprite: "2" },
  { text: "Princess Cherry of Madeline is always helping us out so much.  I don't mind the propaganda.", sprite: "1" }
];

/* ─── Scene Music Map ─────────────────────────────────────────────── */
const DEFAULT_BGM = "../mu/Swords and Spells ~ Riannon Institute of Alchemy.mp3";
const SCENE_MUSIC = {
  "city-gates-overlay": "../mu/Apples and Steel - Theme of Mothergreen (2022 - Loop).mp3",
  "airship-docks-overlay": "../mu/Fiona's Heist ~ Theft of Valkyria (2022 - Loop).mp3",
  "mirane-overlay": "../mu/Snow And Steel ~ The Theme of Mirane (Loop).mp3",
  "combat-school-overlay": "../mu/Snow And Steel ~ The Theme of Mirane (Loop).mp3",
  "mea-hq-overlay": "../mu/Snow And Steel ~ The Theme of Mirane (Loop).mp3"
};

/* ─── State ───────────────────────────────────────────────────────── */
let currentBook = null;

/* Room Navigation State */
let currentRoom = "front-desk";
let libraryHasBeenOpened = false;

/* Video State */
let combatSchoolVideoEnded = false;

/* DialogueEngine instances — initialized in DOMContentLoaded */
let guardEngine, queriEngine, nixEngine, mirrimeEngine, anielaEngine, vnEngine, deskEngine;

/* BGM State */
let bgm = null;
let bgmVolume = 0.15;
let bgmIsMuted = false;
let currentBGMTrack = null;

/* Voice Audio Player */
let voiceAudio = new Audio();

/* ─── Init ────────────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  // Register Begin button FIRST so it's always available
  const beginBtn = document.getElementById("welcome-begin-btn");
  if (beginBtn) {
    beginBtn.addEventListener("click", () => {
      showAcademyGates();
    });
  }

  // Initialize DialogueEngine instances for each NPC
  initDialogueEngines();

  // Library-themed particles: fewer, smaller, subtler dust motes
  initParticles({
    count: 40,
    sizeMin: 0.5,
    sizeMax: 2.5,
    glowMultiplier: 5,
    speedX: 0.2,
    speedY: 0.15,
    colors: [
      { r: 223, g: 184, b: 88 },   // Gold
      { r: 200, g: 180, b: 140 },   // Warm dust
      { r: 91, g: 155, b: 213 },    // Alchemy blue
      { r: 180, g: 200, b: 220 },   // Soft silver
    ]
  });
  initMobileNav();
  initImageLightbox();
  startAdventure();
  initBGM();
  initRoomNavigation();
  initSceneNavigation();

  // Handle ?scene= URL parameter for direct scene navigation
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const targetScene = urlParams.get("scene");
    if (targetScene) {
      const sceneChains = {
        "mea-hq": ["city-gates-overlay", "airship-docks-overlay", "mirane-overlay", "mea-hq-overlay"],
        "mirane": ["city-gates-overlay", "airship-docks-overlay", "mirane-overlay"],
        "airship-docks": ["city-gates-overlay", "airship-docks-overlay"],
        "city-gates": ["city-gates-overlay"],
        "combat-school": ["city-gates-overlay", "airship-docks-overlay", "mirane-overlay", "combat-school-overlay"],
      };
      const chain = sceneChains[targetScene];
      if (chain) {
        // Remove welcome screen immediately
        const welcomeOverlay = document.getElementById("welcome-overlay");
        if (welcomeOverlay) welcomeOverlay.remove();
        // Hide all scene overlays
        document.querySelectorAll(".scene-overlay").forEach(el => el.classList.add("hidden"));
        // Show the target scene
        const finalOverlay = document.getElementById(chain[chain.length - 1]);
        if (finalOverlay) {
          finalOverlay.classList.remove("hidden");
          if (targetScene === "mea-hq" && anielaEngine && !anielaEngine.introComplete) {
            startAnielaIntro();
          } else if (targetScene === "mirane" && mirrimeEngine && !mirrimeEngine.introComplete) {
            startMirrimeIntro();
          }
          switchBGMForScene(chain[chain.length - 1]);
        }
        // Clean the URL so back/refresh works normally
        window.history.replaceState(null, "", window.location.pathname);
      }
    }
  } catch (e) {
    console.log("Scene param handler error:", e);
  }
});

function initDialogueEngines() {
  guardEngine = new DialogueEngine({
    id: 'guard',
    textEl: document.getElementById('guard-text'),
    indicatorEl: document.getElementById('guard-next-indicator'),
    spriteEl: document.getElementById('guard-sprite'),
    speakerNameEl: document.getElementById('guard-speaker-name'),
    dialogueBox: document.getElementById('guard-dialogue-box'),
    talkBtn: document.getElementById('btn-guard-talk'),
    actionsEl: document.getElementById('guard-actions'),
    introLines: GUARD_INTRO,
    talkLines: GUARD_DIALOGUE,
    voiceSrcFn: (type, index) => `assets/voice/guard_${type}_${index}.mp3`,
    spriteSrcFn: (line) => line.sprite ? `../img/chara/mguard/mguard${line.sprite}.png` : null,
    voiceVolume: 0.8,
    typeSpeed: 30,
    btnIconClass: 'city-gates-btn-icon',
    voiceAudio: voiceAudio,
    onIntroComplete: () => showGuardActions(),
  });

  queriEngine = new DialogueEngine({
    id: 'queri',
    textEl: document.getElementById('combat-text'),
    indicatorEl: document.getElementById('combat-next-indicator'),
    spriteEl: document.getElementById('combat-sprite'),
    dialogueBox: document.getElementById('combat-dialogue-box'),
    talkBtn: document.getElementById('btn-queri-talk'),
    talkLines: QUERI_DIALOGUE,
    voiceSrcFn: (type, index) => `assets/voice/queri_talk_${index}.mp3`,
    spriteSrcFn: (line) => line.sprite ? `../img/chara/queri/queri${line.sprite}.png` : null,
    voiceVolume: 0.8,
    btnIconClass: 'scene-btn-icon',
    voiceAudio: voiceAudio,
  });

  nixEngine = new DialogueEngine({
    id: 'nix',
    textEl: document.getElementById('airship-text'),
    indicatorEl: document.getElementById('airship-next-indicator'),
    spriteEl: document.getElementById('airship-sprite'),
    actionsEl: document.getElementById('airship-actions'),
    introLines: NIX_INTRO,
    talkLines: NIX_DIALOGUE,
    voiceSrcFn: (type, index) => `assets/voice/nix_${type}_${index}.mp3`,
    spriteSrcFn: (line) => line.sprite ? `../img/chara/nix/nix${line.sprite}.png` : null,
    voiceVolume: 0.8,
    btnIconClass: 'scene-btn-icon',
    voiceAudio: voiceAudio,
    talkBtn: document.getElementById('btn-nix-talk'),
  });

  mirrimeEngine = new DialogueEngine({
    id: 'mirrime',
    textEl: document.getElementById('mirane-text'),
    indicatorEl: document.getElementById('mirane-next-indicator'),
    spriteEl: document.getElementById('mirane-sprite'),
    actionsEl: document.getElementById('mirane-actions'),
    introLines: MIRRIME_INTRO,
    talkLines: MIRRIME_DIALOGUE,
    voiceSrcFn: (type, index) => `assets/voice/mirrime_${type}_${index}.mp3`,
    spriteSrcFn: (line) => line.sprite ? `../img/chara/mirime/mirime${line.sprite}.png` : null,
    voiceVolume: 1.0,
    btnIconClass: 'scene-btn-icon',
    voiceAudio: voiceAudio,
    talkBtn: document.getElementById('btn-mirrime-talk'),
  });

  anielaEngine = new DialogueEngine({
    id: 'aniela',
    textEl: document.getElementById('mea-hq-text'),
    indicatorEl: document.getElementById('mea-hq-next-indicator'),
    spriteEl: document.getElementById('mea-hq-sprite'),
    speakerNameEl: document.getElementById('mea-hq-speaker-name'),
    actionsEl: document.getElementById('mea-hq-actions'),
    introLines: ANIELA_INTRO,
    talkLines: ANIELA_DIALOGUE,
    voiceSrcFn: (type, index) => `assets/voice/aniela_${type}_${index}.mp3`,
    spriteSrcFn: (line) => line.sprite ? `../img/chara/aniela/aniela${line.sprite}.png` : null,
    voiceVolume: 0.8,
    btnIconClass: 'scene-btn-icon',
    voiceAudio: voiceAudio,
    talkBtn: document.getElementById('btn-aniela-talk'),
  });

  vnEngine = new DialogueEngine({
    id: 'vn',
    textEl: document.getElementById('vn-text'),
    indicatorEl: document.getElementById('vn-next-indicator'),
    spriteEl: document.getElementById('vn-sprite'),
    speakerNameEl: document.getElementById('vn-speaker-name'),
    talkLines: VN_SCRIPT, // VN uses talkLines for its sequential script
    voiceSrcFn: (type, index) => `assets/voice/vn_${index}.mp3`,
    spriteSrcFn: (line) => line.expression ? `img/philomel/philomel_${line.expression}.png` : null,
    voiceVolume: 0.8,
    typeSpeed: 30,
    voiceAudio: voiceAudio,
  });

  deskEngine = new DialogueEngine({
    id: 'desk',
    textEl: document.getElementById('desk-text'),
    indicatorEl: document.getElementById('desk-next-indicator'),
    spriteEl: document.getElementById('desk-sprite'),
    dialogueBox: document.getElementById('desk-dialogue-box'),
    talkBtn: document.getElementById('btn-talk-philomel'),
    talkLines: DESK_DIALOGUE,
    voiceSrcFn: (type, index) => `assets/voice/desk_${index}.mp3`,
    spriteSrcFn: (line) => line.expression ? `img/philomel/philomel_${line.expression}.png` : null,
    voiceVolume: 0.8,
    btnIconClass: 'desk-btn-icon',
    voiceAudio: voiceAudio,
  });
}

/* ═══════════════════════════════════════════════════════════════════
   ADVENTURE WELCOME & GATES
   ═══════════════════════════════════════════════════════════════════ */
function startAdventure() {
  const welcomeOverlay = document.getElementById("welcome-overlay");

  // If returning from library via #gates, skip welcome and go straight to gates
  if (window.location.hash === "#gates") {
    if (welcomeOverlay) welcomeOverlay.remove();
    showAcademyGates();
    window.history.replaceState(null, "", window.location.pathname);
    return;
  }
}

function showAcademyGates() {
  const welcomeOverlay = document.getElementById("welcome-overlay");
  const gatesOverlay = document.getElementById("city-gates-overlay");

  // Fade out welcome (if it still exists)
  if (welcomeOverlay) {
    welcomeOverlay.classList.add("hidden");
    setTimeout(() => {
      welcomeOverlay.remove();
    }, 1000);
  }

  // Show city gates
  gatesOverlay.classList.remove("hidden");

  // Animate guard sprite entrance
  const spriteContainer = document.getElementById("guard-sprite-container");
  setTimeout(() => {
    spriteContainer.classList.add("visible");
  }, 500);

  // Show dialogue box
  const dialogueBox = document.getElementById("guard-dialogue-box");
  setTimeout(() => {
    dialogueBox.classList.add("visible");
  }, 800);

  // Start guard intro via engine
  setTimeout(() => {
    guardEngine.speakerNameEl.textContent = "Guard";
    guardEngine.startIntro();
  }, 1200);

}

function handleGuardIntroClick(e) {
  // Don't advance if clicking buttons
  if (e.target.closest(".city-gates-actions")) return;
  if (e.target.closest(".scene-btn")) return;

  if (!guardEngine.introComplete) {
    guardEngine.advanceIntro();
  } else {
    // After intro — clicking dialogue box advances talk
    guardEngine.talk();
  }
}

function showGuardActions() {
  const actionsEl = document.getElementById("guard-actions");

  actionsEl.style.display = "flex";
  requestAnimationFrame(() => {
    actionsEl.classList.add("visible");
  });
}

function enterEtoileLibrary() {
  const gatesOverlay = document.getElementById("city-gates-overlay");
  const vnOverlay = document.getElementById("vn-overlay");
  const libraryMain = document.getElementById("library-main");
  const footer = document.getElementById("site-footer");

  // Pause guard voiceover
  voiceAudio.pause();
  voiceAudio.src = "";

  playSFX("footsteps");

  // Switch to library music (default)
  switchBGMForScene("library");

  // Fade out city gates
  gatesOverlay.classList.add("hidden");

  // If the library main has already been opened, skip the intro VN overlay and go straight to the library
  if (libraryHasBeenOpened) {
    libraryMain.style.display = "block";
    if (footer) footer.style.display = "block";
    setTimeout(() => {
      libraryMain.classList.add("visible");
      navigateToRoom("front-desk");
    }, 50);
  } else {
    // Show VN overlay and start the VN scene
    vnOverlay.classList.remove("hidden");
    startVNScene();
  }
}

/* ═══════════════════════════════════════════════════════════════════
   SCENE NAVIGATION SYSTEM — Generic Overlay Transitions
   ═══════════════════════════════════════════════════════════════════ */
function navigateToScene(fromOverlayId, toOverlayId) {
  const fromOverlay = document.getElementById(fromOverlayId);
  const toOverlay = document.getElementById(toOverlayId);

  // Pause active voiceover
  voiceAudio.pause();
  voiceAudio.src = "";

  playSFX("footsteps");

  // Switch BGM if the target scene has different music
  switchBGMForScene(toOverlayId);

  // Pause video and restore BGM if leaving combat school
  if (fromOverlayId === "combat-school-overlay") {
    const video = document.getElementById("combat-school-video");
    if (video) {
      video.pause();
      video.muted = true;
    }
    // Restore BGM
    if (bgm && !bgmIsMuted) {
      bgm.volume = bgmVolume;
    }
  }

  // Fade out current overlay
  fromOverlay.classList.add("hidden");

  // After fade, show target overlay
  setTimeout(() => {
    toOverlay.classList.remove("hidden");

    // Handle combat school entry
    if (toOverlayId === "combat-school-overlay") {
      if (combatSchoolVideoEnded) {
        // Already seen the video — show Queri directly
        document.getElementById("combat-school-video-container").style.display = "none";
        document.getElementById("combat-sprite-container").style.display = "block";
        document.getElementById("combat-dialogue-box").style.display = "block";
        document.getElementById("combat-actions").style.display = "flex";
      } else {
        // First visit — play video with audio, mute BGM
        document.getElementById("combat-school-overlay").classList.add("video-playing");
        if (bgm) {
          bgm.volume = 0;
        }
        const video = document.getElementById("combat-school-video");
        if (video) {
          video.muted = false;
          video.volume = 0.8;
          video.currentTime = 0;
          video.play().catch(err => console.log("Video autoplay blocked:", err));
        }
      }
    }

    // Handle city gates entry
    if (toOverlayId === "city-gates-overlay") {
      if (guardEngine.introComplete) {
        document.getElementById("guard-actions").style.display = "flex";
        document.getElementById("guard-actions").classList.add("visible");
      } else {
        // Ensure sprite and dialogue box are visible
        const spriteContainer = document.getElementById("guard-sprite-container");
        if (spriteContainer) spriteContainer.classList.add("visible");
        const dialogueBox = document.getElementById("guard-dialogue-box");
        if (dialogueBox) dialogueBox.classList.add("visible");
        guardEngine.speakerNameEl.textContent = "Guard";
        guardEngine.startIntro();
      }
    }

    // Handle airship docks entry
    if (toOverlayId === "airship-docks-overlay") {
      if (nixEngine.introComplete) {
        // Already seen intro — show actions directly
        document.getElementById("airship-actions").style.display = "flex";
      } else {
        // First visit — start Nix intro
        startNixIntro();
      }
    }

    // Handle mirane entry
    if (toOverlayId === "mirane-overlay") {
      if (mirrimeEngine.introComplete) {
        document.getElementById("mirane-actions").style.display = "flex";
      } else {
        startMirrimeIntro();
      }
    }

    // Handle MEA HQ entry
    if (toOverlayId === "mea-hq-overlay") {
      if (anielaEngine.introComplete) {
        document.getElementById("mea-hq-actions").style.display = "flex";
      } else {
        startAnielaIntro();
      }
    }
  }, 600);
}

function initSceneNavigation() {
  // City Gates — Click dialogue box or overlay to advance guard intro/talk
  const guardDialogueBox = document.getElementById("guard-dialogue-box");
  if (guardDialogueBox) {
    guardDialogueBox.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!guardEngine.introComplete) {
        guardEngine.advanceIntro();
      } else {
        guardEngine.talk();
      }
    });
  }
  const cityGatesOverlay = document.getElementById("city-gates-overlay");
  if (cityGatesOverlay) {
    cityGatesOverlay.addEventListener("click", (e) => {
      if (e.target.closest(".city-gates-actions")) return;
      if (e.target.closest(".scene-btn")) return;
      if (e.target.closest(".scene-actions")) return;
      if (!guardEngine.introComplete) {
        guardEngine.advanceIntro();
      }
    });
  }

  // City Gates — Guard action buttons
  const guardTalkBtn = document.getElementById("btn-guard-talk");
  if (guardTalkBtn) {
    guardTalkBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      guardEngine.talk();
    });
  }
  const enterRiannonBtn = document.getElementById("btn-enter-riannon");
  if (enterRiannonBtn) {
    enterRiannonBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      enterEtoileLibrary();
    });
  }
  const enterAirshipBtn = document.getElementById("btn-enter-airship-docks");
  if (enterAirshipBtn) {
    enterAirshipBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      navigateToScene("city-gates-overlay", "airship-docks-overlay");
    });
  }
  const gatesBackBtn = document.getElementById("btn-gates-back");
  if (gatesBackBtn) {
    gatesBackBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      window.location.href = window.location.pathname;
    });
  }

  // Airship Docks → Mirane
  const travelMiraneBtn = document.getElementById("btn-travel-mirane");
  if (travelMiraneBtn) {
    travelMiraneBtn.addEventListener("click", () => {
      navigateToScene("airship-docks-overlay", "mirane-overlay");
    });
  }

  // Airship Docks → Back to City Square
  const airshipBackBtn = document.getElementById("btn-airship-back");
  if (airshipBackBtn) {
    airshipBackBtn.addEventListener("click", () => {
      navigateToScene("airship-docks-overlay", "city-gates-overlay");
    });
  }

  // Mirane → Combat School
  const enterCombatBtn = document.getElementById("btn-enter-combat-school");
  if (enterCombatBtn) {
    enterCombatBtn.addEventListener("click", () => {
      navigateToScene("mirane-overlay", "combat-school-overlay");
    });
  }

  // Mirane → Back to Airship Docks
  const miraneBackBtn = document.getElementById("btn-mirane-back");
  if (miraneBackBtn) {
    miraneBackBtn.addEventListener("click", () => {
      navigateToScene("mirane-overlay", "airship-docks-overlay");
    });
  }

  // Combat School → Back to Mirane
  const combatBackBtn = document.getElementById("btn-combat-back");
  if (combatBackBtn) {
    combatBackBtn.addEventListener("click", () => {
      navigateToScene("combat-school-overlay", "mirane-overlay");
    });
  }

  // Combat School — Video ended handler
  const combatVideo = document.getElementById("combat-school-video");
  if (combatVideo) {
    combatVideo.addEventListener("ended", handleCombatVideoEnded);
  }

  // Combat School — Talk to Queri button
  const queriTalkBtn = document.getElementById("btn-queri-talk");
  if (queriTalkBtn) {
    queriTalkBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      queriEngine.talk();
    });
  }

  // Combat School — Click dialogue to advance talk
  const combatDialogueBox = document.getElementById("combat-dialogue-box");
  if (combatDialogueBox) {
    combatDialogueBox.addEventListener("click", (e) => {
      e.stopPropagation();
      queriEngine.talk();
    });
  }


  // Combat School — Replay Video button
  const replayBtn = document.getElementById("btn-replay-video");
  if (replayBtn) {
    replayBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      replayCombatVideo();
    });
  }

  // Combat School — Skip Video button
  const skipBtn = document.getElementById("btn-skip-video");
  if (skipBtn) {
    skipBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const video = document.getElementById("combat-school-video");
      if (video) {
        video.pause();
        video.muted = true;
      }
      handleCombatVideoEnded();
    });
  }

  // Airship Docks — Talk to Nix button
  const nixTalkBtn = document.getElementById("btn-nix-talk");
  if (nixTalkBtn) {
    nixTalkBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      nixEngine.talk();
    });
  }

  // Airship Docks — Click dialogue to advance intro or talk
  const airshipDialogueBox = document.getElementById("airship-dialogue-box");
  if (airshipDialogueBox) {
    airshipDialogueBox.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!nixEngine.introComplete) {
        advanceNixIntro();
      } else {
        nixEngine.talk();
      }
    });
  }

  // Mirane — Talk to Mirrime button
  const mirrimeTalkBtn = document.getElementById("btn-mirrime-talk");
  if (mirrimeTalkBtn) {
    mirrimeTalkBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      mirrimeEngine.talk();
    });
  }

  // Mirane — Click dialogue to advance intro or talk
  const miraneDialogueBox = document.getElementById("mirane-dialogue-box");
  if (miraneDialogueBox) {
    miraneDialogueBox.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!mirrimeEngine.introComplete) {
        advanceMirrimeIntro();
      } else {
        mirrimeEngine.talk();
      }
    });
  }

  // Mirane → MEA HQ
  const enterMeaHqBtn = document.getElementById("btn-enter-mea-hq");
  if (enterMeaHqBtn) {
    enterMeaHqBtn.addEventListener("click", () => {
      navigateToScene("mirane-overlay", "mea-hq-overlay");
    });
  }

  // MEA HQ → Back to Mirane
  const meaHqBackBtn = document.getElementById("btn-mea-hq-back");
  if (meaHqBackBtn) {
    meaHqBackBtn.addEventListener("click", () => {
      navigateToScene("mea-hq-overlay", "mirane-overlay");
    });
  }

  // MEA HQ → Strategy Room (navigates to separate page)
  const enterStrategyBtn = document.getElementById("btn-enter-strategy-room");
  if (enterStrategyBtn) {
    enterStrategyBtn.addEventListener("click", () => {
      playSFX("footsteps");
      window.open("../strategy-room/index.html", "_blank");
    });
  }

  // MEA HQ — Talk to Aniela button
  const anielaTalkBtn = document.getElementById("btn-aniela-talk");
  if (anielaTalkBtn) {
    anielaTalkBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      anielaEngine.talk();
    });
  }

  // MEA HQ — Click dialogue to advance intro or talk
  const meaHqDialogueBox = document.getElementById("mea-hq-dialogue-box");
  if (meaHqDialogueBox) {
    meaHqDialogueBox.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!anielaEngine.introComplete) {
        advanceAnielaIntro();
      } else {
        anielaEngine.talk();
      }
    });
  }
}

/* ═══════════════════════════════════════════════════════════════════
   QUERI LILIBIT — Combat School Dialogue System
   ═══════════════════════════════════════════════════════════════════ */
function handleCombatVideoEnded() {
  const videoContainer = document.getElementById("combat-school-video-container");
  const spriteContainer = document.getElementById("combat-sprite-container");
  const dialogueBox = document.getElementById("combat-dialogue-box");
  const actionsEl = document.getElementById("combat-actions");

  // Restore BGM since video is done
  if (bgm && !bgmIsMuted) {
    bgm.volume = bgmVolume;
  }

  // Hide video, show Queri
  document.getElementById("combat-school-overlay").classList.remove("video-playing");
  videoContainer.style.display = "none";
  spriteContainer.style.display = "block";
  dialogueBox.style.display = "block";
  actionsEl.style.display = "flex";

  combatSchoolVideoEnded = true;

  // Start first line via engine, then mark talk active so next click advances
  queriEngine.showLine(QUERI_DIALOGUE[0], 'talk', 0);
  queriEngine._talkActive = true;
  queriEngine._talkIndex = 1;
}

function replayCombatVideo() {
  const videoContainer = document.getElementById("combat-school-video-container");
  const spriteContainer = document.getElementById("combat-sprite-container");
  const dialogueBox = document.getElementById("combat-dialogue-box");
  const actionsEl = document.getElementById("combat-actions");
  const video = document.getElementById("combat-school-video");

  // Pause any active voiceover
  voiceAudio.pause();
  voiceAudio.src = "";

  // Hide Queri, show video
  document.getElementById("combat-school-overlay").classList.add("video-playing");
  spriteContainer.style.display = "none";
  dialogueBox.style.display = "none";
  actionsEl.style.display = "none";
  videoContainer.style.display = "block";

  // Mute BGM, play video with audio
  if (bgm) bgm.volume = 0;
  video.muted = false;
  video.volume = 0.8;
  video.currentTime = 0;
  video.play().catch(err => console.log("Video replay blocked:", err));
}

/* ═══════════════════════════════════════════════════════════════════
   NIX NI ARLAN — Airship Docks Dialogue System
   ═══════════════════════════════════════════════════════════════════ */
function startNixIntro() {
  nixEngine.startIntro();
}

function advanceNixIntro() {
  nixEngine.advanceIntro();
}

/* ═══════════════════════════════════════════════════════════════════
   MIRRIME WOLKENSANG — Mirane Dialogue System
   ═══════════════════════════════════════════════════════════════════ */
function startMirrimeIntro() {
  mirrimeEngine.startIntro();
}

function advanceMirrimeIntro() {
  mirrimeEngine.advanceIntro();
}

/* ═══════════════════════════════════════════════════════════════════
   ANIELA — MEA HQ Dialogue System
   ═══════════════════════════════════════════════════════════════════ */
function startAnielaIntro() {
  anielaEngine.startIntro();
}

function advanceAnielaIntro() {
  anielaEngine.advanceIntro();
}

function returnToGates() {
  const gatesOverlay = document.getElementById("city-gates-overlay");
  const libraryMain = document.getElementById("library-main");
  const footer = document.getElementById("site-footer");

  // Pause active voiceover
  voiceAudio.pause();
  voiceAudio.src = "";

  playSFX("footsteps");

  // Switch back to Mothergreen music
  switchBGMForScene("city-gates-overlay");

  // Hide library main view
  libraryMain.classList.remove("visible");
  setTimeout(() => {
    libraryMain.style.display = "none";
    if (footer) footer.style.display = "none";

    // Show city gates overlay
    gatesOverlay.classList.remove("hidden");
  }, 800); // Allow library fade out transition to complete
}

/* ═══════════════════════════════════════════════════════════════════
   VISUAL NOVEL SCENE
   ═══════════════════════════════════════════════════════════════════ */
function startVNScene() {
  const spriteContainer = document.getElementById("vn-sprite-container");
  const dialogueBox = document.getElementById("vn-dialogue-box");

  // Reset VN dialogue tracking
  vnEngine._talkIndex = 0;

  // Animate sprite entrance
  setTimeout(() => {
    spriteContainer.classList.add("visible");
  }, 500);

  // Animate dialogue box entrance
  setTimeout(() => {
    dialogueBox.classList.add("visible");
  }, 800);

  // Start first dialogue via engine
  setTimeout(() => {
    vnEngine.showLine(VN_SCRIPT[0], 'talk', 0);
  }, 1200);

  // Click to advance dialogue
  const overlay = document.getElementById("vn-overlay");
  overlay.addEventListener("click", handleVNClick);
}

function handleVNClick(e) {
  // Don't advance if clicking buttons
  if (e.target.closest(".vn-actions")) return;

  if (vnEngine.isTyping) {
    vnEngine.completeTyping();
  } else {
    vnEngine._talkIndex++;
    if (vnEngine._talkIndex < VN_SCRIPT.length) {
      vnEngine.showLine(VN_SCRIPT[vnEngine._talkIndex], 'talk', vnEngine._talkIndex);
    } else {
      showVNActions();
    }
  }
}

function showVNActions() {
  const actionsEl = document.getElementById("vn-actions");
  actionsEl.style.display = "flex";
  // Trigger reflow for transition
  requestAnimationFrame(() => {
    actionsEl.classList.add("visible");
  });

  // Enter Library button
  document.getElementById("vn-enter-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    enterLibrary();
  });
}

function enterLibrary() {
  const overlay = document.getElementById("vn-overlay");
  const libraryMain = document.getElementById("library-main");
  const footer = document.getElementById("site-footer");

  // Pause active voiceover
  voiceAudio.pause();
  voiceAudio.src = "";

  playSFX("footsteps");

  overlay.classList.add("hidden");
  libraryMain.style.display = "block";
  footer.style.display = "block";

  libraryHasBeenOpened = true;
  setTimeout(() => {
    libraryMain.classList.add("visible");
    // Show front desk room by default
    navigateToRoom("front-desk", false);
  }, 100);

  // Remove overlay from DOM after transition
  setTimeout(() => {
    overlay.remove();
  }, 1000);
}

/* ═══════════════════════════════════════════════════════════════════
   BOOKSHELVES
   ═══════════════════════════════════════════════════════════════════ */
function renderBookshelves() {
  Object.keys(BOOK_REGISTRY).forEach(shelfKey => {
    const books = BOOK_REGISTRY[shelfKey];
    const container = document.getElementById(`books-${shelfKey}`);
    if (!container || books.length === 0) return;

    // Clear any placeholder
    container.innerHTML = "";

    books.forEach(book => {
      const spine = document.createElement("div");
      spine.className = `book-spine ${book.spineColor}`;
      spine.style.width = `${book.width || 56}px`;
      spine.dataset.bookId = book.id;
      spine.dataset.bookFile = book.file;
      spine.title = book.spineTitle;

      spine.innerHTML = `
        <div class="book-spine-decoration"></div>
        <span class="book-spine-title">${book.spineTitle}</span>
      `;

      spine.addEventListener("click", () => openBook(book));
      container.appendChild(spine);
    });
  });
}

function initShelfReveal() {
  const shelves = document.querySelectorAll(".bookshelf");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add("revealed");
        }, i * 150);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  shelves.forEach(shelf => observer.observe(shelf));
}

/* ═══════════════════════════════════════════════════════════════════
   BOOK READER
   ═══════════════════════════════════════════════════════════════════ */
function loadBookScript(file) {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    const existingScript = document.querySelector(`script[src="${file}"]`);
    if (existingScript) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = file;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script ${file}`));
    document.head.appendChild(script);
  });
}

async function openBook(bookMeta) {
  const readerEl = document.getElementById("book-reader");
  readerEl.style.display = "flex";

  try {
    // Load the book script dynamically (bypasses CORS on file:// protocol)
    await loadBookScript(bookMeta.file);

    if (!window.BOOKS || !window.BOOKS[bookMeta.id]) {
      throw new Error(`Book data for "${bookMeta.id}" not found in window.BOOKS.`);
    }

    currentBook = window.BOOKS[bookMeta.id];

    playSFX("book_open");

    // Set book titles
    document.getElementById("reader-book-title").textContent = currentBook.title;
    document.getElementById("reader-page-num").textContent =
      `Section 1 of ${currentBook.pages.length}`;

    renderBookContent();
    renderTableOfContents();
    initReaderControls();

    // Show with animation
    requestAnimationFrame(() => {
      readerEl.classList.add("visible");
      
      // Focus the content area so keyboard scrolling works immediately
      const contentArea = document.querySelector(".reader-content-area");
      contentArea.setAttribute("tabindex", "0");
      contentArea.focus();
    });

  } catch (err) {
    console.error("Failed to load book:", err);
    readerEl.style.display = "none";
    alert(`Could not open the book: ${err.message}`);
  }
}

function initReaderControls() {
  // Bind close
  document.getElementById("reader-close").onclick = closeBook;

  // ToC toggle
  const tocBtn = document.getElementById("reader-toc-btn");
  const tocPanel = document.getElementById("reader-toc-panel");
  const tocClose = document.getElementById("reader-toc-close");

  if (tocBtn) {
    tocBtn.onclick = () => {
      const isOpen = tocPanel.style.display !== "none";
      tocPanel.style.display = isOpen ? "none" : "block";
      tocBtn.classList.toggle("active", !isOpen);
    };
  }
  if (tocClose) {
    tocClose.onclick = () => {
      tocPanel.style.display = "none";
      if (tocBtn) tocBtn.classList.remove("active");
    };
  }

  // Scroll listener for progress bar + section tracking
  const contentArea = document.querySelector(".reader-content-area");
  const onScroll = () => {
    const maxScroll = contentArea.scrollHeight - contentArea.clientHeight;
    const progress = maxScroll > 0 ? (contentArea.scrollTop / maxScroll) * 100 : 0;
    document.getElementById("reader-progress-bar").style.width = `${progress}%`;

    // Track current section
    updateCurrentSection(contentArea);
  };
  contentArea.addEventListener("scroll", onScroll);
  window.activeReaderScrollListener = onScroll;

  // Keyboard nav
  document.addEventListener("keydown", readerKeyHandler);
}

function closeBook() {
  const readerEl = document.getElementById("book-reader");
  readerEl.classList.remove("visible");

  playSFX("book_close");

  // Close ToC panel
  const tocPanel = document.getElementById("reader-toc-panel");
  if (tocPanel) tocPanel.style.display = "none";
  const tocBtn = document.getElementById("reader-toc-btn");
  if (tocBtn) tocBtn.classList.remove("active");

  const contentArea = document.querySelector(".reader-content-area");
  if (window.activeReaderScrollListener) {
    contentArea.removeEventListener("scroll", window.activeReaderScrollListener);
    window.activeReaderScrollListener = null;
  }

  setTimeout(() => {
    readerEl.style.display = "none";
    currentBook = null;
  }, 400);
  document.removeEventListener("keydown", readerKeyHandler);
}

function renderBookContent() {
  if (!currentBook) return;

  const pageEl = document.getElementById("reader-page");
  const progressBar = document.getElementById("reader-progress-bar");
  const hasChapters = currentBook.chapters && currentBook.chapters.length > 0;

  let html = "";
  let lastChapter = null;

  currentBook.pages.forEach((page, index) => {
    const pageChapter = page.chapter || 1;

    // Insert chapter heading when entering a new chapter
    if (hasChapters && pageChapter !== lastChapter) {
      const chapterInfo = currentBook.chapters.find(c => c.num === pageChapter);
      if (chapterInfo) {
        html += `
          <div class="chapter-heading" id="chapter-${pageChapter}" data-chapter="${pageChapter}">
            <div class="chapter-heading-num">Chapter ${chapterInfo.num}</div>
            <div class="chapter-heading-title">${chapterInfo.title}</div>
            <div class="chapter-heading-ornament">✦ ━━━━ ✦</div>
          </div>
        `;
      }
      lastChapter = pageChapter;
    }

    let divider = "";
    if (index > 0 && pageChapter === (currentBook.pages[index - 1]?.chapter || 1)) {
      divider = `<div class="scene-break"></div>`;
    }
    
    html += `
      <div class="reader-page-section" data-page-index="${index}" data-chapter="${pageChapter}">
        ${divider}
        ${page.content}
      </div>
    `;
  });

  pageEl.innerHTML = html;
  progressBar.style.width = "0%";
  
  // Scroll to top of content
  document.querySelector(".reader-content-area").scrollTop = 0;
}

function renderTableOfContents() {
  if (!currentBook) return;

  const tocList = document.getElementById("reader-toc-list");
  if (!tocList) return;

  const hasChapters = currentBook.chapters && currentBook.chapters.length > 0;

  if (!hasChapters) {
    // For books without chapters, show a simple section list
    tocList.innerHTML = `<div class="reader-toc-item active" data-page="0">
      <span class="reader-toc-chapter-title">${currentBook.title}</span>
      <span class="reader-toc-sections">${currentBook.pages.length} sections</span>
    </div>`;
    return;
  }

  let html = "";
  currentBook.chapters.forEach(ch => {
    // Count sections in this chapter
    const sectionCount = currentBook.pages.filter(p => (p.chapter || 1) === ch.num).length;
    html += `
      <div class="reader-toc-item" data-chapter="${ch.num}" data-page="${ch.startPage}">
        <span class="reader-toc-chapter-num">Ch ${ch.num}</span>
        <span class="reader-toc-chapter-title">${ch.title}</span>
        <span class="reader-toc-sections">${sectionCount} sec</span>
      </div>
    `;
  });

  tocList.innerHTML = html;

  // Add click handlers for chapter jumping
  tocList.querySelectorAll(".reader-toc-item").forEach(item => {
    item.addEventListener("click", () => {
      const chapterNum = parseInt(item.dataset.chapter);
      jumpToChapter(chapterNum);

      // Close ToC panel
      document.getElementById("reader-toc-panel").style.display = "none";
      const tocBtn = document.getElementById("reader-toc-btn");
      if (tocBtn) tocBtn.classList.remove("active");
    });
  });
}

function jumpToChapter(chapterNum) {
  const chapterHeading = document.getElementById(`chapter-${chapterNum}`);
  if (chapterHeading) {
    const contentArea = document.querySelector(".reader-content-area");
    const offset = chapterHeading.offsetTop - contentArea.offsetTop;
    contentArea.scrollTo({ top: offset, behavior: "smooth" });
  }
}

function updateCurrentSection(contentArea) {
  if (!currentBook) return;

  const sections = contentArea.querySelectorAll(".reader-page-section");
  const scrollTop = contentArea.scrollTop + 100; // Offset for header

  let currentIndex = 0;
  let currentChapter = 1;

  for (let i = sections.length - 1; i >= 0; i--) {
    if (sections[i].offsetTop <= scrollTop) {
      currentIndex = parseInt(sections[i].dataset.pageIndex);
      currentChapter = parseInt(sections[i].dataset.chapter) || 1;
      break;
    }
  }

  // Update page indicator
  const pageNum = document.getElementById("reader-page-num");
  const hasChapters = currentBook.chapters && currentBook.chapters.length > 0;
  
  if (hasChapters) {
    const chapterInfo = currentBook.chapters.find(c => c.num === currentChapter);
    const chapterTitle = chapterInfo ? chapterInfo.title : "";
    pageNum.textContent = `Section ${currentIndex + 1} of ${currentBook.pages.length} · Ch ${currentChapter}: ${chapterTitle}`;
  } else {
    pageNum.textContent = `Section ${currentIndex + 1} of ${currentBook.pages.length}`;
  }

  // Update ToC active state
  const tocItems = document.querySelectorAll(".reader-toc-item");
  tocItems.forEach(item => {
    const itemChapter = parseInt(item.dataset.chapter);
    item.classList.toggle("active", itemChapter === currentChapter);
  });
}

function readerKeyHandler(e) {
  if (e.key === "Escape") {
    closeBook();
  }
}

/* ═══════════════════════════════════════════════════════════════════
   ROOM NAVIGATION SYSTEM
   ═══════════════════════════════════════════════════════════════════ */
const ROOM_NAMES = {
  "front-desk": "Front Desk",
  "stacks": "Library Shelves",
  "artifacts": "Artifacts",
  "maps": "Maps",
  "relics": "Fiend Relics"
};

function initRoomNavigation() {
  // Wire up the "Back to Mothergreen Hub" button in the library header
  const backToGatesBtn = document.getElementById("btn-back-to-gates");
  if (backToGatesBtn) {
    backToGatesBtn.addEventListener("click", () => {
      returnToGates();
    });
  }

  // Wire up the "Back to Gates" button at the Front Desk counter actions
  const libraryBackBtn = document.getElementById("btn-library-back");
  if (libraryBackBtn) {
    libraryBackBtn.addEventListener("click", () => {
      returnToGates();
    });
  }

  // Enter the Stacks button
  const enterStacksBtn = document.getElementById("btn-enter-stacks");
  if (enterStacksBtn) {
    enterStacksBtn.addEventListener("click", () => {
      navigateToRoom("stacks");
    });
  }

  // Back to Front Desk button
  const backToDeskBtn = document.getElementById("btn-back-to-desk");
  if (backToDeskBtn) {
    backToDeskBtn.addEventListener("click", () => {
      navigateToRoom("front-desk");
    });
  }

  // Enter Artifacts button
  const enterArtifactsBtn = document.getElementById("btn-enter-artifacts");
  if (enterArtifactsBtn) {
    enterArtifactsBtn.addEventListener("click", () => {
      navigateToRoom("artifacts");
    });
  }

  // Back from Artifacts to Front Desk
  const artifactsBackBtn = document.getElementById("btn-artifacts-back");
  if (artifactsBackBtn) {
    artifactsBackBtn.addEventListener("click", () => {
      navigateToRoom("front-desk");
    });
  }

  // Maps card click
  const mapsCard = document.getElementById("artifact-maps-card");
  if (mapsCard) {
    mapsCard.addEventListener("click", () => {
      navigateToRoom("maps");
    });
  }

  // Back from Maps to Artifacts
  const mapsBackBtn = document.getElementById("btn-maps-back");
  if (mapsBackBtn) {
    mapsBackBtn.addEventListener("click", () => {
      navigateToRoom("artifacts");
    });
  }

  // Relics card click
  const relicsCard = document.getElementById("artifact-relics-card");
  if (relicsCard) {
    relicsCard.addEventListener("click", () => {
      navigateToRoom("relics");
    });
  }

  // Back from Relics to Artifacts
  const relicsBackBtn = document.getElementById("btn-relics-back");
  if (relicsBackBtn) {
    relicsBackBtn.addEventListener("click", () => {
      navigateToRoom("artifacts");
    });
  }

  // Talk to Philomel button
  const talkBtn = document.getElementById("btn-talk-philomel");
  if (talkBtn) {
    talkBtn.addEventListener("click", () => {
      deskEngine.talk();
    });
  }

  // Philomel — Click dialogue to advance talk
  const deskDialogueBox = document.getElementById("desk-dialogue-box");
  if (deskDialogueBox) {
    deskDialogueBox.addEventListener("click", (e) => {
      e.stopPropagation();
      deskEngine.talk();
    });
  }
}

function navigateToRoom(roomId, animate = true) {
  const rooms = document.querySelectorAll(".room");
  const breadcrumb = document.getElementById("breadcrumb-text");

  // Pause active voiceover
  voiceAudio.pause();
  voiceAudio.src = "";

  if (animate) {
    playSFX("footsteps");
  }

  // Hide all rooms
  rooms.forEach(room => {
    room.classList.remove("active");
    if (animate) {
      room.style.opacity = "0";
      room.style.transform = "translateY(15px)";
    }
    setTimeout(() => {
      if (!room.classList.contains("active")) {
        room.style.display = "none";
      }
    }, animate ? 400 : 0);
  });

  // Show target room
  const targetRoom = document.getElementById(`room-${roomId}`);
  if (targetRoom) {
    const showDelay = animate ? 300 : 0;
    setTimeout(() => {
      targetRoom.style.display = "block";
      // Force reflow
      void targetRoom.offsetHeight;
      requestAnimationFrame(() => {
        targetRoom.classList.add("active");
        targetRoom.style.opacity = "1";
        targetRoom.style.transform = "translateY(0)";
      });

      // Room-specific init
      if (roomId === "stacks") {
        renderBookshelves();
        initShelfReveal();
      }
      if (roomId === "maps") {
        renderMapShelf();
        initShelfReveal();
      }
      if (roomId === "relics") {
        renderRelicShelf();
      }
    }, showDelay);
  }

  // Update breadcrumb
  if (breadcrumb) {
    breadcrumb.textContent = ROOM_NAMES[roomId] || roomId;
  }

  currentRoom = roomId;
  window.scrollTo({ top: 0, behavior: animate ? "smooth" : "auto" });
}

/* (Desk dialogue is now handled by deskEngine — see initDialogueEngines) */

/* (Particles and Mobile Nav now loaded from ../js/shared.js) */

/* ─── Image Lightbox Modal ────────────────────────────────────────── */
function initImageLightbox() {
  const modal = document.getElementById("image-modal");
  const modalImg = document.getElementById("image-modal-img");
  const captionText = document.getElementById("image-modal-caption");
  const closeBtn = document.getElementById("image-modal-close");
  
  if (!modal || !modalImg || !captionText) return;

  // Listen for clicks inside the reader content area
  const contentArea = document.querySelector(".reader-content-area");
  if (contentArea) {
    contentArea.addEventListener("click", (e) => {
      const img = e.target.closest(".book-image, .book-cover-img");
      if (!img) return;
      
      modal.style.display = "flex";
      modalImg.src = img.src;
      captionText.textContent = img.alt || "";
      
      // Trigger reflow and show animation
      requestAnimationFrame(() => {
        modal.classList.add("visible");
      });
    });
  }
  
  // Close modal function
  const closeModal = () => {
    modal.classList.remove("visible");
    setTimeout(() => {
      modal.style.display = "none";
    }, 300);
  };
  
  closeBtn.onclick = closeModal;
  modal.onclick = (e) => {
    if (e.target === modal || e.target === closeBtn) {
      closeModal();
    }
  };
  
  // Close on Escape key if lightbox is open
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.style.display === "flex") {
      closeModal();
    }
  });
}

/* ═══════════════════════════════════════════════════════════════════
   RELIC VIEWER SYSTEM
   ═══════════════════════════════════════════════════════════════════ */
function renderRelicShelf() {
  const container = document.getElementById("relics-shelf");
  if (!container) return;
  container.innerHTML = "";

  const relics = RELIC_REGISTRY["fiend-relics"] || [];

  relics.forEach(relic => {
    const jar = document.createElement("div");
    jar.className = "relic-jar";
    jar.dataset.relicId = relic.id;
    jar.title = relic.title;
    jar.innerHTML = `
      <div class="relic-jar-glass">
        <div class="relic-jar-lid"></div>
        <div class="relic-jar-body">
          <div class="relic-jar-crystal" style="--crystal-color: ${relic.crystalColor}; --crystal-glow: ${relic.crystalGlow};"></div>
          <div class="relic-jar-shimmer"></div>
        </div>
        <div class="relic-jar-base"></div>
      </div>
      <div class="relic-jar-lock">🔒</div>
      <div class="relic-jar-label">${relic.title}</div>
      <div class="relic-jar-warning">⚠ Sealed Artifact</div>
    `;
    jar.addEventListener("click", () => openRelic(relic));
    container.appendChild(jar);
  });
}

function openRelic(relic) {
  const viewer = document.getElementById("relic-viewer");
  const body = document.getElementById("relic-viewer-body");
  const title = document.getElementById("relic-viewer-title");

  playSFX("jar_pickup");

  title.textContent = relic.title;

  // Build the parchment-style content
  const squadList = relic.lore.squad.map(s => `<li>${s}</li>`).join("");
  const descParagraphs = relic.lore.description.split("\n\n").map(p => `<p>${p}</p>`).join("");
  const appearanceParagraphs = relic.lore.appearance.split("\n\n").map(p => `<p>${p}</p>`).join("");

  body.innerHTML = `
    <div class="relic-parchment">
      <div class="relic-illustration-frame">
        <img src="${relic.image}" alt="${relic.title}" class="relic-illustration">
        <div class="relic-illustration-caption">Sketch by field illustrator — Mirane Expeditioner Alliance archives</div>
      </div>

      <div class="relic-lore-content">
        <h2 class="relic-lore-title">${relic.title}</h2>
        <div class="relic-lore-divider">✦ ━━━━━━ ✦</div>

        <div class="relic-lore-section">
          <h3 class="relic-section-heading">Classification</h3>
          <div class="relic-detail-grid">
            <div class="relic-detail-item">
              <span class="relic-detail-label">Type</span>
              <span class="relic-detail-value">${relic.lore.type}</span>
            </div>
            <div class="relic-detail-item relic-detail-danger">
              <span class="relic-detail-label">Danger</span>
              <span class="relic-detail-value relic-danger-value">${relic.lore.danger}</span>
            </div>
          </div>
        </div>

        <div class="relic-lore-section">
          <h3 class="relic-section-heading">Record</h3>
          ${descParagraphs}
        </div>

        <div class="relic-lore-section">
          <h3 class="relic-section-heading">Expedition Details</h3>
          <div class="relic-detail-grid">
            <div class="relic-detail-item">
              <span class="relic-detail-label">Location</span>
              <span class="relic-detail-value">${relic.lore.slainAt}</span>
            </div>
            <div class="relic-detail-item">
              <span class="relic-detail-label">Year</span>
              <span class="relic-detail-value">${relic.lore.year}</span>
            </div>
            <div class="relic-detail-item">
              <span class="relic-detail-label">Organization</span>
              <span class="relic-detail-value">${relic.lore.killedBy}</span>
            </div>
            <div class="relic-detail-item">
              <span class="relic-detail-label">Captain</span>
              <span class="relic-detail-value">${relic.lore.captain}</span>
            </div>
          </div>
          <div class="relic-squad-section">
            <span class="relic-detail-label">Squad Members</span>
            <ul class="relic-squad-list">${squadList}</ul>
          </div>
        </div>

        <div class="relic-lore-section">
          <h3 class="relic-section-heading">Ability</h3>
          <div class="relic-ability-badge">${relic.lore.ability}</div>
        </div>

        <div class="relic-lore-section">
          <h3 class="relic-section-heading">Appearance</h3>
          ${appearanceParagraphs}
        </div>

        <div class="relic-lore-divider">✦ ━━━━━━ ✦</div>
        <div class="relic-lore-footer">
          <em>This artifact is sealed under Artifice Protocol 7. Unauthorized handling is punishable under Mothergreen Mercantile Law.</em>
        </div>
      </div>
    </div>
  `;

  viewer.style.display = "flex";
  requestAnimationFrame(() => {
    viewer.classList.add("visible");
  });

  // Close button
  document.getElementById("relic-viewer-close").onclick = () => closeRelic();

  // Close on clicking outside
  viewer.onclick = (e) => {
    if (e.target === viewer) closeRelic();
  };

  // Close on Escape
  document.addEventListener("keydown", relicEscHandler);
}

function relicEscHandler(e) {
  if (e.key === "Escape") closeRelic();
}

function closeRelic() {
  const viewer = document.getElementById("relic-viewer");
  playSFX("jar_putback");
  viewer.classList.remove("visible");
  setTimeout(() => {
    viewer.style.display = "none";
  }, 400);
  document.removeEventListener("keydown", relicEscHandler);
}

/* ═══════════════════════════════════════════════════════════════════
   MAP VIEWER SYSTEM
   ═══════════════════════════════════════════════════════════════════ */
function renderMapShelf() {
  const container = document.getElementById("maps-shelf");
  if (!container) return;
  container.innerHTML = "";

  MAP_REGISTRY.forEach(map => {
    const scroll = document.createElement("div");
    scroll.className = "scroll-tube";
    scroll.dataset.mapId = map.id;
    scroll.title = map.title;
    scroll.innerHTML = `
      <div class="scroll-tube-endcap scroll-tube-endcap-top"></div>
      <div class="scroll-tube-body">
        <span class="scroll-tube-label">${map.title}</span>
      </div>
      <div class="scroll-tube-endcap scroll-tube-endcap-bottom"></div>
    `;
    scroll.addEventListener("click", () => openMap(map));
    container.appendChild(scroll);
  });
}

function openMap(map) {
  const viewer = document.getElementById("map-viewer");
  const img = document.getElementById("map-viewer-img");
  const title = document.getElementById("map-viewer-title");

  playSFX("scroll_open");

  title.textContent = map.title;
  img.alt = map.title;

  // Hide image until new source loads to prevent stale image flash
  img.style.opacity = "0";
  img.src = map.file;
  img.onload = () => {
    img.style.opacity = "1";
  };

  viewer.style.display = "flex";
  requestAnimationFrame(() => {
    viewer.classList.add("visible");
  });

  // Close button
  const closeBtn = document.getElementById("map-viewer-close");
  closeBtn.onclick = () => closeMap();

  // Close on clicking outside the map
  viewer.onclick = (e) => {
    if (e.target === viewer) closeMap();
  };

  // Close on Escape
  document.addEventListener("keydown", mapEscHandler);
}

function mapEscHandler(e) {
  if (e.key === "Escape") closeMap();
}

function closeMap() {
  const viewer = document.getElementById("map-viewer");
  playSFX("scroll_close");
  viewer.classList.remove("visible");
  setTimeout(() => {
    viewer.style.display = "none";
  }, 400);
  document.removeEventListener("keydown", mapEscHandler);
}

/* ═══════════════════════════════════════════════════════════════════
   BGM MUSIC PLAYER
   ═══════════════════════════════════════════════════════════════════ */
function initBGM() {
  currentBGMTrack = SCENE_MUSIC["city-gates-overlay"] || DEFAULT_BGM;
  bgm = new Audio(currentBGMTrack);
  bgm.loop = true;
  bgm.volume = bgmVolume;

  // Start audio on first user click or interaction anywhere on the document (autoplay bypass)
  const startAudio = () => {
    bgm.play().then(() => {
      document.removeEventListener("click", startAudio);
      document.removeEventListener("keydown", startAudio);
    }).catch(err => {
      console.log("Autoplay blocked, waiting for user interaction:", err);
    });
  };
  document.addEventListener("click", startAudio);
  document.addEventListener("keydown", startAudio);

  // Unified volume slider handlers — all sliders use .bgm-slider class
  document.querySelectorAll(".bgm-slider").forEach(slider => {
    slider.value = bgmVolume;
    slider.addEventListener("input", (e) => {
      bgmVolume = parseFloat(e.target.value);
      if (!bgmIsMuted) {
        bgm.volume = bgmVolume;
      }
      syncBGMControls();
    });
  });

  // Unified mute button handlers — all mute buttons use .bgm-mute-btn class
  document.querySelectorAll(".bgm-mute-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMute();
    });
  });
}

function toggleMute() {
  bgmIsMuted = !bgmIsMuted;
  if (bgm) {
    bgm.volume = bgmIsMuted ? 0 : bgmVolume;
  }
  syncBGMControls();
}

function syncBGMControls() {
  // Sync all mute button icons
  document.querySelectorAll(".bgm-mute-btn").forEach(btn => {
    const iconEl = btn.querySelector(".bgm-btn-icon");
    if (!iconEl) return;
    if (bgmIsMuted || bgmVolume === 0) {
      iconEl.textContent = "🔇";
    } else if (bgmVolume < 0.3) {
      iconEl.textContent = "🔈";
    } else if (bgmVolume < 0.7) {
      iconEl.textContent = "🔉";
    } else {
      iconEl.textContent = "🔊";
    }
  });

  // Sync all volume sliders
  const displayVolume = (bgmIsMuted || bgmVolume === 0) ? 0 : bgmVolume;
  document.querySelectorAll(".bgm-slider").forEach(slider => {
    slider.value = displayVolume;
  });
}

function playSFX(sfxName) {
  const sfx = new Audio(`assets/sfx/${sfxName}.mp3`);
  sfx.volume = 1.0;
  sfx.play().catch(err => console.log(`SFX ${sfxName} blocked or missing:`, err));
}

function switchBGMForScene(sceneId) {
  const newTrack = SCENE_MUSIC[sceneId] || DEFAULT_BGM;
  if (newTrack === currentBGMTrack) return; // Same music — don't change

  currentBGMTrack = newTrack;
  const wasPlaying = bgm && !bgm.paused;

  bgm.pause();
  bgm.src = newTrack;
  bgm.loop = true;
  bgm.volume = bgmIsMuted ? 0 : bgmVolume;

  if (wasPlaying) {
    bgm.play().catch(err => console.log("BGM switch blocked:", err));
  }
}
