/* ══════════════════════════════════════════════════════════════════════
   Builder — VN-style phased wizard controller
   Flow: Race → (Subrace|Demon House|Human Bonus) → Main Stats → Sub Stats → Derived
   ══════════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  /* ─── State ───────────────────────────────────────────────────────── */
  let character = Character.createDefault();
  let selectedToken = null;
  let currentPhase = "race";
  let humanMainPick = null;
  let humanSubPick = null;

  /* API data */
  let allRaces = [];
  let allAncestries = [];

  const RACES_WITH_SUBRACES = ["Chimera", "Fae", "Youkai"];

  /* ─── Special Hybrid Race Definitions ──────────────────────────────── */
  const HYBRID_TYPES = [
    {
      id: "faerie-chimera",
      name: "Faerie-Chimera Hybrid",
      breakthroughId: "faerie-chimera-hybrid--race-",
      btCost: 200,
      description: "An extremely rare condition in which a Chimera parent and a Faerie parent produces a child with Chimera traits. The odds are said to be less than 1%.",
      primaryOptions: [
        { primaryRaceId: "fae", primaryRaceName: "Fae", subracePool: "Chimera", displayPrefix: "Half-Fae" },
        { primaryRaceId: "chimera", primaryRaceName: "Chimera", subracePool: "Fae", displayPrefix: "Half-Chimera" },
      ],
    },
    {
      id: "human-chimera",
      name: "Human-Chimera Hybrid",
      breakthroughId: "human-chimera-hybrid--race-",
      btCost: 200,
      description: "While most unions of Human and Chimera parents result in the offspring being fully Human or fully Chimera, there are rare instances in which the Chimera traits are still present in a human offspring. You keep Human base traits including Divine Providence, but do not get extra EXP or human adaptability.",
      primaryOptions: [
        { primaryRaceId: "human", primaryRaceName: "Human", subracePool: "Chimera", displayPrefix: "Half" },
      ],
    },
  ];

  /* ─── Demon Houses (names hardcoded, abilities fetched from API) ───── */
  const DEMON_HOUSES = [
    { id: "wi",   name: "Wi",   abilityId: "presence-concealment" },
    { id: "lir",  name: "Lir",  abilityId: "predict" },
    { id: "d",    name: "D'",   abilityId: "mana-burst" },
    { id: "ar",   name: "Ar",   abilityId: "mind-s-eye" },
    { id: "lu",   name: "Lu",   abilityId: "dense-mana" },
    { id: "ni",   name: "Ni",   abilityId: "emergency-maneuvers" },
    { id: "un",   name: "Un",   abilityId: "graceful-service" },
    { id: "vi",   name: "Vi",   abilityId: "first-response" },
    { id: "none", name: "None", abilityId: "instinct" },
  ];

  /* Token tracking */
  const mainTokenState = Character.MAIN_STAT_ARRAY.map((v) => ({
    value: v, used: false, assignedTo: null,
  }));
  const subTokenState = Character.SUB_STAT_ARRAY.map((v) => ({
    value: v, used: false, assignedTo: null,
  }));

  /* ─── DOM refs ────────────────────────────────────────────────────── */
  const phases = {
    "race":           document.getElementById("phase-race"),
    "subrace":        document.getElementById("phase-subrace"),
    "demon-house":    document.getElementById("phase-demon-house"),
    "human-bonus":    document.getElementById("phase-human-bonus"),
    "main-stats":     document.getElementById("phase-main-stats"),
    "sub-stats":      document.getElementById("phase-sub-stats"),
    "derived":        document.getElementById("phase-derived"),
    "breakthroughs":  document.getElementById("phase-breakthroughs"),
    "classes":        document.getElementById("phase-classes"),
    "skills":         document.getElementById("phase-skills"),
    "items":          document.getElementById("phase-items"),
    "review":         document.getElementById("phase-review"),
  };
  const uis = {
    "race":           document.getElementById("ui-race"),
    "subrace":        document.getElementById("ui-subrace"),
    "demon-house":    document.getElementById("ui-demon-house"),
    "human-bonus":    document.getElementById("ui-human-bonus"),
    "main-stats":     document.getElementById("ui-main-stats"),
    "sub-stats":      document.getElementById("ui-sub-stats"),
    "derived":        document.getElementById("ui-derived"),
    "breakthroughs":  document.getElementById("ui-breakthroughs"),
    "classes":        document.getElementById("ui-classes"),
    "skills":         document.getElementById("ui-skills"),
    "items":          document.getElementById("ui-items"),
    "review":         document.getElementById("ui-review"),
  };

  const mainTokenEls = document.querySelectorAll("#main-stat-tokens .stat-token");
  const subTokenEls  = document.querySelectorAll("#sub-stat-tokens .stat-token");
  const mainSlotEls  = document.querySelectorAll("#main-stat-slots .stat-slot");
  const subSlotEls   = document.querySelectorAll("#sub-stat-slots .stat-slot");

  const actionsEl = document.getElementById("builder-actions");
  const nextBtn   = document.getElementById("btn-next");
  const resetBtn  = document.getElementById("btn-reset");
  const backBtn   = document.getElementById("btn-back");

  /* ─── Dialogue ────────────────────────────────────────────────────── */
  const LINES = {
    raceIntro: [
      { text: "Welcome to the Expedition Registration Office!", sprite: "2" },
      { text: "First things first — what race are you? This will determine your natural abilities and proficiencies.", sprite: "1" },
    ],
    subraceIntro: [
      { text: "Great choice!  Now, what ancestry do you come from? Each has a unique trait.", sprite: "3" },
    ],
    humanBonusIntro: [
      { text: "Humans are the most versatile of all races.", sprite: "2" },
      { text: "Pick one main stat and one sub stat — each will receive a +1 bonus.", sprite: "1" },
    ],
    demonHouseIntro: [
      { text: "In Sorthen, every demon belongs to a house — or walks alone.", sprite: "2" },
      { text: "Your house name becomes your middle name and grants you a unique ability.  Which house do you hail from?", sprite: "1" },
    ],
    demonHouseSelected: (n, a) => ({ text: `House ${n} — ${a}.  A fine choice.`, sprite: "3" }),
    noSubrace: { text: "Alright — let's move on to your stats!", sprite: "1" },
    mainStatsIntro: [
      { text: "Now let's figure out your strengths.", sprite: "2" },
      { text: "You have four main stats — Power, Focus, Agility, and Toughness.  Select a number and assign it to a stat.  If you need to redo it, press Reset.", sprite: "1" },
    ],
    subStatsIntro: [
      { text: "Nice!  Now for your sub stats.", sprite: "3" },
      { text: "These determine your skill affinities — things like stealth, magic knowledge, and social presence.  Same idea — assign the numbers.", sprite: "2" },
    ],
    derivedIntro: [
      { text: "Here's what your stats look like all together.", sprite: "1" },
      { text: "These are your derived stats — calculated from your base stats plus your racial bonuses.  Take a look!", sprite: "2" },
    ],
    breakthroughsIntro: [
      { text: "Now for something exciting — Breakthroughs!", sprite: "3" },
      { text: "You start with 300 EXP to spend on breakthroughs.  These represent pivotal moments — hidden powers, special training, transformative events.", sprite: "2" },
      { text: "Some have requirements, so not all will be available.  Pick wisely — any unspent EXP is lost after this step!", sprite: "1" },
    ],
    classesIntro: [
      { text: "Time to pick your classes!  This is where your character's combat style takes shape.", sprite: "3" },
      { text: "You have 1000 EXP and 3 Interlude Points.  Unlocking a class costs 1 IP plus EXP based on its tier.  Then you can level up abilities for 100 EXP each.", sprite: "2" },
      { text: "Master a class by learning all its abilities — some advanced classes require mastered prerequisites.  Choose wisely!", sprite: "1" },
    ],
    classesHumanBonus: { text: "Oh, and because you chose Human, you get a bonus +100 EXP!  That's 1100 EXP total to work with.  Humans are resourceful like that!", sprite: "3" },
    skillsIntro: [
      { text: "Now let's handle your skills!  Skills represent what your character knows outside of combat.", sprite: "3" },
      { text: "We'll go through each source one at a time — your race, breakthroughs, classes, and then your personal picks.", sprite: "2" },
      { text: "You can also specialize with expertise — spend 1 skill point to get 2 points in a narrower field.  Click the arrow above any skill to add expertise!", sprite: "1" },
    ],
    itemsIntro: [
      { text: "Time to gear up!  Every adventurer starts with 3000 Clim to spend on equipment.", sprite: "3" },
      { text: "Click on any item to see its details.  If it's a weapon or armor, you can drag mods onto it to customize it!", sprite: "2" },
      { text: "Mods change the item's name and add to its cost.  A Silver Longsword hits different than a plain one, trust me.", sprite: "1" },
    ],
    raceSelected: {
      human: [
        { text: "A Human!  You know, nobody really knows where your kind came from.", sprite: "3" },
        { text: "But here's the thing — humans are blessed by providence, the divine light.  Born with a special attunement for it, no matter what you believe.", sprite: "2" },
        { text: "And you're quick learners.  Shorter lifespans, sure, but that haste drives you to adapt faster than anyone.", sprite: "1" },
      ],
      demon: [
        { text: "A Demon!  Descendants of the angels who rebelled against providence itself.", sprite: "3" },
        { text: "They lost their wings and the power to absorb divine light… so they learned to burn their own life force instead.  It's called Divine Release — terrifying and beautiful.", sprite: "2" },
        { text: "And the name 'demon'?  Humans meant it as a slur.  Your people wore it as a badge of honor.", sprite: "1" },
      ],
      chimera: [
        { text: "A Chimera!  Creatures born from raw magic twisting ordinary life into something extraordinary.", sprite: "3" },
        { text: "Every Chimera traces back to an area of intense magical concentration.  Somehow, the arcane patterned itself into sentience — nobody knows how.", sprite: "2" },
        { text: "From slimes to wolf-folk, you come in every shape imaginable.  Kanolith or zoalith — ears and tails, or full bestial features.  All Chimera at the core.", sprite: "1" },
      ],
      fae: [
        { text: "A Fae!  The first people of Lyra — born from the will of nature and the world itself.", sprite: "3" },
        { text: "Some of your kind use their ageless immortality to achieve great wisdom.  Others?  They use it to laze about and be merry.  I respect both, honestly.", sprite: "2" },
        { text: "Pointed ears, eyes in colors that shouldn't exist — the High Fae are the most common, but there's so much more beneath the surface.", sprite: "1" },
      ],
      youkai: [
        { text: "A Youkai!  The rarest race in all of Lyr.  Not many people have even met one.", sprite: "3" },
        { text: "Here's what makes you different from Chimera — Chimera are mutated lifeforms.  Youkai?  You were ambient magic that chose to become alive.", sprite: "2" },
        { text: "Born from the misty isle of Kirara, where magic itself takes form.  That's incredible.", sprite: "1" },
      ],
    },
    subraceSelected: {
      /* ── Chimera ── */
      "bearfolk":           [{ text: "Bearfolk!  Massive, powerful Chimera from the deep forests.", sprite: "3" }, { text: "Their strength is legendary — they can shrug off blows that would fell anyone else.  Don't arm-wrestle one.", sprite: "1" }],
      "bullfolk":           [{ text: "A Bullfolk!  Don't let the hulking frame fool you — they're nimble and some of the cleverest architects in Lyr.", sprite: "3" }, { text: "Their culture prizes bonds above all else.  Bonds between friends, family, and comrades.  Break that trust and you'll have a very large problem.", sprite: "1" }],
      "catfolk":            [{ text: "Catfolk!  The most common Chimera you'll find.  Agile, curious, and impossibly graceful.", sprite: "3" }, { text: "They say a Catfolk always lands on their feet.  From what I've seen?  That's not a myth.", sprite: "1" }],
      "centaur":            [{ text: "A Centaur!  Half humanoid, half horse — pure zoalith Chimera.", sprite: "3" }, { text: "They can cover ground faster than any mount and hit like a charging cavalry.  Having a Centaur ally changes the whole battlefield.", sprite: "1" }],
      "cowfolk":            [{ text: "A Cowfolk!  Technically the same sub-race as Bullfolk, but the dimorphism makes them look completely different.", sprite: "3" }, { text: "Short, curvy, and deceptively resilient — never mistake their dainty stature for weakness.  Their bonds of family and friendship run deeper than anyone's.", sprite: "1" }],
      "dogfolk":            [{ text: "Dogfolk!  Renowned across Lyr for their unwavering loyalty and honor.", sprite: "3" }, { text: "Sadly, that loyalty was exploited for generations before King Leo put a stop to it.  Now they stand as equals — and they've never forgotten who helped them.", sprite: "1" }],
      "foxfolk":            [{ text: "Foxfolk!  Sly, clever, and always three steps ahead.", sprite: "3" }, { text: "They have a reputation for mischief, but underestimate a Foxfolk's cunning and you'll regret it.", sprite: "1" }],
      "harpy":              [{ text: "A Harpy!  Chimera of the skies — wings instead of arms, talons that can rend steel.", sprite: "3" }, { text: "Born to fly.  They see the battlefield from angles nobody else can.  An aerial advantage is devastating.", sprite: "1" }],
      "horse-folk":         [{ text: "Horse-folk!  The kanolith counterpart to Centaurs — all the equine grace in a more compact form.", sprite: "3" }, { text: "Quick on their feet with an instinct for open terrain.  Don't underestimate them.", sprite: "1" }],
      "lamiafolk":          [{ text: "Lamiafolk!  A serpentine Chimera — humanoid torso atop a powerful snake body.", sprite: "3" }, { text: "Their constricting strength is unmatched, and they move through terrain others can't.  Beautiful and terrifying in equal measure.", sprite: "1" }],
      "lizardfolk":         [{ text: "Lizardfolk!  Scaled, tough, and ancient.  Some say they're the oldest of the Chimera lineages.", sprite: "3" }, { text: "Their natural armor and cold-blooded focus make them terrifyingly efficient in combat.", sprite: "1" }],
      "mothfolk":           [{ text: "Mothfolk…  One of the most fascinating Chimera.", sprite: "3" }, { text: "They live startlingly brief lives — rarely past forty.  Their society is built on beauty, memory, and motion.  Each generation burns brightly, not long.", sprite: "2" }, { text: "That's why they're eerily calm in the face of death.  They've already made peace with it.", sprite: "1" }],
      "phoenix":            [{ text: "A Phoenix Chimera!  Born from the most intense magical fires imaginable.", sprite: "3" }, { text: "They carry the spark of rebirth within them — flames that heal instead of harm.  A true miracle of arcane mutation.", sprite: "1" }],
      "rabbitfolk":         [{ text: "Rabbitfolk!  Don't let the cute ears fool you — they're lightning fast.", sprite: "3" }, { text: "Their reflexes are supernatural.  By the time you've drawn your sword, a Rabbitfolk has already repositioned twice.", sprite: "1" }],
      "ratfolk":            [{ text: "Ratfolk!  The most versatile Chimera — you'll find them in every walk of life across Lyr.", sprite: "3" }, { text: "Their prehensile tails give them unmatched dexterity.  Carpenters, adventurers, merchants — they do it all with a sense of purpose.", sprite: "1" }],
      "red-pandafolk":      [{ text: "Red Pandafolk!  Solitary wanderers who blend into any culture they encounter.", sprite: "3" }, { text: "They seem aloof and relaxed, but don't be fooled — their carefree attitude masks a deep competence.  And somehow they boost everyone's morale just by being around.", sprite: "1" }],
      "sheepfolk":          [{ text: "Sheepfolk!  Born with a natural sensitivity to magic — they can feel the leylines themselves.", sprite: "3" }, { text: "They helped sages map the invisible rivers of magical energy.  Airship captains consider it good luck to have one aboard.  Their sensitivity comes from spirit circuits linked to their hair — remarkable.", sprite: "1" }],
      "slimefolk":          [{ text: "Slimefolk!  One of the rarest Chimera — descended from the slime creatures found everywhere in Lyr.", sprite: "3" }, { text: "They have a humanoid form, but it's held together by willpower and magic.  Most learn glamour magic first just to blend in.  Adaptable doesn't even begin to describe them.", sprite: "1" }],
      "spiderfolk":         [{ text: "Spiderfolk!  Industrious Chimera with multiple arms and incredible dexterity.", sprite: "3" }, { text: "In Northi City, they build homes vertically on tiny plots — towering structures nobody else could construct.  Some even imbue their webs with mana for combat.", sprite: "1" }],
      "wolf-folk":          [{ text: "Wolf-folk!  The finest hunters in all of Lyr, born in the snowy peaks of Mt. Merlin.", sprite: "3" }, { text: "They hunt in packs, exploit every opening their allies create, and their pelts are the most prized trade goods in the realm.", sprite: "1" }],
      /* ── Fae ── */
      "anubis":             [{ text: "An Anubis!  Fae from southwestern Telsin — guardians of life, death, and the natural order.", sprite: "3" }, { text: "With their jackal ears and bronze skin, they hold a reverence for every mortal life.  To them, even brief lives are precious gifts to be treasured beyond death.", sprite: "1" }],
      "cait-sith":          [{ text: "A Cait Sith!  A rare Fae that most mistake for Catfolk at first glance.", sprite: "3" }, { text: "But here's their secret — they can transform into an actual cat.  Many spend most of their lives in that form, living quietly among humans.  Shapeshifters hiding in plain sight.", sprite: "1" }],
      "cu-sith":            [{ text: "A Cu Sith!  A rare Fae from the Sylvan lands of Easter.", sprite: "3" }, { text: "They look like dogfolk Fae, but their true form is an ordinary dog — indistinguishable from any other.  History is full of stories of beloved pets who were secretly Cu Sith all along.", sprite: "1" }],
      "dryad":              [{ text: "A Dryad!  Fae so deeply intertwined with nature that they rarely leave their forest homes.", sprite: "3" }, { text: "When a Dryad ventures into a city, you can tell — they find solace only in their work, longing for the woodlands.  Their existence is a blend of isolation and harmony.", sprite: "1" }],
      "dullahan":           [{ text: "A Dullahan…  Even other Fae shun them.", sprite: "3" }, { text: "They can subconsciously feel death — they're pulled toward it.  People fear them as harbingers, but death follows the Dullahan whether they cause it or not.", sprite: "2" }, { text: "A child Dullahan matures within a year.  They have little concept of family.  It's a lonely existence.", sprite: "1" }],
      "gnome":              [{ text: "A Gnome!  'Mine faeries' — reclusive Fae who master the earth's hidden treasures.", sprite: "3" }, { text: "They burrow through tunnels and caverns beneath Easter's mountains.  Some brave the depths of Mt. Merlin itself.  What they find down there… well, that's their secret.", sprite: "1" }],
      "high-fae":           [{ text: "A High Fae — the most common and iconic of all Fae.", sprite: "3" }, { text: "Youthful, ageless, with those striking pointed ears and eyes that come in impossible colors.  The original people of this world.", sprite: "1" }],
      "pixie":              [{ text: "A Pixie!  Tiny, winged Fae who craft their homes in hollowed-out ancient trees.", sprite: "3" }, { text: "Despite being physically fragile, their agility is unmatched — they dart through the air with a grace that makes archers weep.  Small, but never insignificant.", sprite: "1" }],
      "salamander":         [{ text: "A Salamander!  Proud, fiercely independent Fae with innate fire magic.", sprite: "3" }, { text: "They're artisans at heart — master crafters of metalwork, glassblowing, and enchanted items.  In Sorthen, their forged goods are considered works of art.", sprite: "1" }],
      "selkie":             [{ text: "A Selkie!  Mesmerizing aquatic Fae found off the shores of Houkaina.", sprite: "3" }, { text: "They've become prominent members of merfolk society.  Even those who venture inland always stay near water — rivers, lakes, anything.  The ocean never truly lets them go.", sprite: "1" }],
      "sylph":              [{ text: "A Sylph!  Fae blessed by the Wind itself — said to be born from the breeze that danced through Yggdrasil.", sprite: "3" }, { text: "Their villages are built high in the treetops of Easter with no ground access at all.  If you can't fly, you can't visit.  The sky holds all their joys and secrets.", sprite: "1" }],
      "unseelie":           [{ text: "An Unseelie…  Now that's a bold choice.", sprite: "3" }, { text: "They dwell in the darkest parts of the Eastern Forests where even other Fae won't go.  Masters of pain, infiltration, and doing the dirty work nobody else will.", sprite: "2" }, { text: "'Death is not punishment.  It is a mercy.'  That's their saying.", sprite: "1" }],
      "willo-wisp":         [{ text: "A Willo Wisp!  Mischievous faeries of light who lured countless adventurers to their doom.", sprite: "3" }, { text: "Their Faerie Light Eyes create illusions that ensnare the mind.  The old stories say if you see the blue glow in the forest at night… run.", sprite: "2" }, { text: "They love the fear, by the way.  They think the legends are hilarious.", sprite: "1" }],
      /* ── Youkai ── */
      "ancient-marionette": [{ text: "An Ancient Marionette!  One of the rarest beings alive.", sprite: "3" }, { text: "They were once parts of a colossal arcane superweapon — a Divine Arms.  Pulled from a shipwreck near Kirara, and the island's magic gave them new life.", sprite: "2" }, { text: "Ancient technology fused with a Youkai spirit.  You are literally a weapon that chose to become a person.", sprite: "1" }],
      "jiangshi":           [{ text: "A Jiangshi!  Youkai that inhabit and reanimate dead bodies.", sprite: "3" }, { text: "When born, an undeveloped spirit is placed into a corpse and a talisman anchors their existence.  The body won't decay, can be healed, and fights as if alive.", sprite: "2" }, { text: "It sounds dark, but they're fully sentient beings — just with a very unusual start to life.", sprite: "1" }],
      "kitsune":            [{ text: "A Kitsune!  Fox spirits of Kirara, woven from pure ambient magic.", sprite: "3" }, { text: "Masters of illusion and shapeshifting — the more tails a Kitsune has, the more powerful they are.  Never trust what you see around one.", sprite: "1" }],
      "nekomata":           [{ text: "A Nekomata!  Often mistaken for Catfolk, but those twin tails give them away.", sprite: "3" }, { text: "They're deeply associated with death in Youkai culture — folklore ties them to creating the first Jiangshi.  Most are solitary wanderers, rarely seen even in Kirara.", sprite: "1" }],
      "nio":                [{ text: "A Nio!  Guardian Youkai — massive, imposing, and fiercely protective.", sprite: "3" }, { text: "They were born from the magic that guards Kirara's sacred places.  If a Nio considers you under their protection, nothing gets through.", sprite: "1" }],
      "oni":                [{ text: "An Oni!  The war spirits of Kirara — raw magical fury given form.", sprite: "3" }, { text: "They're born from the violent, chaotic side of ambient magic.  Horns, incredible strength, and a temper to match.  Fearsome allies.", sprite: "1" }],
      "raijin":             [{ text: "A Raijin!  The essence of lightning crystallized into a living being.", sprite: "3" }, { text: "Their bodies are literal conduits of electricity — arcs of lightning coursing through them at all times.  They can catch and consume lightning to fuel their power.  Terrifyingly fast.", sprite: "1" }],
      "ryujin":             [{ text: "A Ryujin!  The dragon-blooded Youkai — regal, prideful, and commanding.", sprite: "3" }, { text: "They claim to be the only true descendants of mythical dragons.  Lizardfolk and Kobolds disagree, but Ryujin don't give 'lesser opinions' much thought.  A presence that silences rooms.", sprite: "1" }],
      "suryan":             [{ text: "A Suryan!  'Light given form' — their radiance is unmistakable.", sprite: "3" }, { text: "They build villages in high mountain valleys, as close to the sun as possible.  The warm glow each Suryan gives off makes even the most inhospitable peaks bloom with life.", sprite: "1" }],
      "tengu":              [{ text: "A Tengu!  Winged Youkai from the peaks of Mt. Merlin — right alongside the deadly Astra Line.", sprite: "3" }, { text: "Each Tengu can summon a supernatural mask that reflects their soul.  When worn, it suppresses their aura completely — making them invisible to magical detection.  Perfect stealth.", sprite: "1" }],
      "yuki-onna":          [{ text: "A Yuki-Onna!  An incredibly rare snow spirit — exclusively female, born from winter itself.", sprite: "3" }, { text: "Masters of cryomancy.  The legendary Mirane learned her ice magic from the Tsurara tribe of Yuki-Onna — and they helped seal a Fiend with the Eternal Mirane Cage.", sprite: "2" }, { text: "Most can't survive outside freezing climates.  The ones who can are exceptionally powerful.", sprite: "1" }],
    },
    humanBonusDone:    { text: "Great picks!  Let's move on to your base stats.", sprite: "1" },
    mainStatsDone:     { text: "All main stats assigned!  Hit Next when you're ready.", sprite: "1" },
    subStatsDone:      { text: "Sub stats all set!  Let's see how everything comes together.", sprite: "3" },
    reset:             { text: "No problem — let's start these over.", sprite: "4" },
    confirmed:         { text: "Stats locked in!  Next up we'll look at breakthroughs... but that's coming soon.", sprite: "1" },
    loading:           { text: "One moment, I'm pulling up the records...", sprite: "2" },
    loadError:         { text: "Hmm, I'm having trouble reaching the archives. Is the proxy running?", sprite: "4" },
  };

  /* ═══════════════════════════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════════════════════════ */
  document.addEventListener("DOMContentLoaded", () => {
    Aniela.init();
    bindTokens();
    bindSlots();
    bindActions();
    bindHumanBonusPicks();
    startPhase("race");
  });

  /* ═══════════════════════════════════════════════════════════════════
     PHASE MANAGEMENT
     ═══════════════════════════════════════════════════════════════════ */
  function startPhase(phase) {
    currentPhase = phase;

    // Clear header extras from previous phase (e.g. breakthroughs budget/search)
    clearBtHeaderExtras();

    Object.keys(phases).forEach((k) => {
      if (phases[k]) phases[k].classList.toggle("hidden", k !== phase);
    });

    actionsEl.style.display = "none";

    // ── Update fixed phase header ──
    const phaseHeaderEl = document.getElementById("phase-header");
    const phaseHeaderTitle = document.getElementById("phase-header-title");
    const titleMap = {
      "race":        "Choose Your Race",
      "subrace":     "", // dynamically set in loadSubraces
      "demon-house": "Demon House",
      "human-bonus": "Human Bonus Stats",
      "main-stats":  "Assign Main Stats",
      "sub-stats":   "Assign Sub Stats",
      "derived":       "Stat Summary",
      "breakthroughs": "Breakthroughs",
      "classes":       "Classes",
      "skills":        "Skills",
      "items":         "Equipment",
      "review":        "Character Sheet",
    };
    const title = titleMap[phase] || "";
    if (title) {
      phaseHeaderTitle.textContent = title;
      phaseHeaderEl.style.display = "block";
    } else if (phase !== "subrace") {
      phaseHeaderEl.style.display = "none";
    }

    // ── Update progress bar ──
    const stepMap = {
      "race": 1, "subrace": 1, "demon-house": 1, "human-bonus": 1,
      "main-stats": 2, "sub-stats": 2, "derived": 2,
      "breakthroughs": 3,
      "classes": 4,
      "skills": 5,
      "items": 6,
      "review": 7,
    };
    const stepNum = stepMap[phase] || 1;
    document.querySelectorAll(".step-pip").forEach((pip) => {
      const s = parseInt(pip.dataset.step);
      pip.classList.toggle("active", s === stepNum);
      pip.classList.toggle("completed", s < stepNum);
    });
    // Fill connectors for completed steps
    document.querySelectorAll(".step-connector").forEach((conn, i) => {
      conn.classList.toggle("completed", (i + 1) < stepNum);
    });

    // Scroll content area to top
    const contentEl = document.querySelector(".builder-scene-content");
    if (contentEl) contentEl.scrollTop = 0;

    const introMap = {
      "race": LINES.raceIntro,
      "subrace": LINES.subraceIntro,
      "demon-house": LINES.demonHouseIntro,
      "human-bonus": LINES.humanBonusIntro,
      "main-stats": LINES.mainStatsIntro,
      "sub-stats": LINES.subStatsIntro,
      "derived": LINES.derivedIntro,
      "breakthroughs": LINES.breakthroughsIntro,
      "classes":       (() => {
        const isHuman = character.race?.primaryRaceId === "human" ||
                        character.race?.primaryRaceName?.toLowerCase() === "human";
        const lines = [...LINES.classesIntro];
        if (isHuman) lines.push(LINES.classesHumanBonus);
        return lines;
      })(),
    };

    // Skills, items, and review load immediately (no click-through intro) so the UI
    // doesn't appear blank/unresponsive while waiting for Aniela dialogue.
    if (phase === "skills" || phase === "items" || phase === "review") {
      if (phase === "skills") {
        Aniela.say({ ...LINES.skillsIntro[0], dismissable: true });
      } else if (phase === "items") {
        Aniela.say({ ...LINES.itemsIntro[0], dismissable: true });
      } else {
        Aniela.say({ text: "Here's your completed character sheet!  Look it over and make sure everything is just right.", sprite: "1", dismissable: true });
      }
      revealPhaseUI(phase);
      return;
    }

    Aniela.playSequence(introMap[phase] || [], () => {
      revealPhaseUI(phase);
    });
  }

  function revealPhaseUI(phase) {
    const ui = uis[phase];
    if (ui) {
      ui.style.display = "block";
      ui.classList.add("phase-enter");
    }

    actionsEl.style.display = "flex";
    nextBtn.style.display = "none";
    resetBtn.style.display = "none";
    backBtn.style.display = phase === "race" ? "none" : "inline-flex";

    if (phase === "race") {
      loadRaces();
    } else if (phase === "subrace") {
      loadSubraces();
    } else if (phase === "demon-house") {
      renderDemonHouses();
    } else if (phase === "human-bonus") {
      // Reset picks visually
      humanMainPick = null;
      humanSubPick = null;
      document.querySelectorAll("#human-main-pick .bonus-pick").forEach((el) => el.classList.remove("selected"));
      document.querySelectorAll("#human-sub-pick .bonus-pick").forEach((el) => el.classList.remove("selected"));
    } else if (phase === "main-stats" || phase === "sub-stats") {
      resetBtn.style.display = "inline-flex";
      addRaceBonusBadges();
    } else if (phase === "derived") {
      buildStatSummary();
      updateDerived();
      resetBtn.style.display = "none";
      nextBtn.style.display = "inline-flex";
      nextBtn.innerHTML = '<span class="builder-btn-icon">✓</span> Confirm Stats';
    } else if (phase === "breakthroughs") {
      loadBreakthroughs();
      nextBtn.style.display = "inline-flex";
      nextBtn.innerHTML = 'Next <span class="builder-btn-icon">→</span>';
    } else if (phase === "classes") {
      loadClasses();
      nextBtn.style.display = "inline-flex";
      nextBtn.innerHTML = 'Next <span class="builder-btn-icon">→</span>';
    } else if (phase === "skills") {
      loadSkills();
      nextBtn.style.display = "inline-flex";
      nextBtn.innerHTML = 'Next <span class="builder-btn-icon">→</span>';
    } else if (phase === "items") {
      loadItems();
      nextBtn.style.display = "inline-flex";
      nextBtn.innerHTML = 'Next <span class="builder-btn-icon">→</span>';
    } else if (phase === "review") {
      loadReview();
      nextBtn.style.display = "none";
      resetBtn.style.display = "none";
    }

    // Safety: always ensure buttons are visible for non-race phases
    if (phase !== "race") {
      backBtn.style.display = "inline-flex";
    }
  }

  function transitionToPhase(newPhase) {
    const currentUI = uis[currentPhase];
    if (currentUI) {
      currentUI.classList.add("phase-exit");
      setTimeout(() => {
        currentUI.classList.remove("phase-exit", "phase-enter");
        currentUI.style.display = "none";
        startPhase(newPhase);
      }, 350);
    } else {
      startPhase(newPhase);
    }
  }

  /* ═══════════════════════════════════════════════════════════════════
     RACE SELECTION
     ═══════════════════════════════════════════════════════════════════ */
  async function loadRaces() {
    const grid = document.getElementById("race-grid");
    if (allRaces.length && grid.children.length) return;

    try {
      Aniela.say(LINES.loading);
      allRaces = await ApiClient.getPrimaryRaces();
      allAncestries = await ApiClient.getAncestries();
      renderRaceCards(grid, allRaces);
      // Inject the Special hybrid race card
      injectSpecialRaceCard(grid);
    } catch (err) {
      console.error("Failed to load races:", err);
      Aniela.say(LINES.loadError);
    }
  }

  function renderRaceCards(container, races) {
    container.innerHTML = "";
    races.forEach((race) => {
      const card = document.createElement("div");
      card.className = "race-card";
      card.dataset.raceId = race.primaryRaceId;

      const descText = stripHtml(race.description);
      const preview = descText.length > 120 ? descText.slice(0, 120) + "…" : descText;
      const hasSubraces = RACES_WITH_SUBRACES.includes(race.name);
      const subraceCount = hasSubraces
        ? allAncestries.filter((a) => a.primaryRace === race.name).length : 0;

      card.innerHTML = `
        <div class="race-card-img-wrap">
          <img src="${race.imageSmUrl}" alt="${race.name}" class="race-card-img" loading="lazy">
        </div>
        <div class="race-card-body">
          <h3 class="race-card-name">${race.name}</h3>
          <p class="race-card-attrs">${race.attributes}</p>
          <p class="race-card-desc">${preview}</p>
          ${subraceCount ? `<span class="race-card-subrace-badge">${subraceCount} ancestries</span>` : ""}
        </div>
      `;

      card.addEventListener("click", (e) => { e.stopPropagation(); selectRace(race); });
      container.appendChild(card);
    });
  }

  function injectSpecialRaceCard(container) {
    const card = document.createElement("div");
    card.className = "race-card race-card-special";
    card.dataset.raceId = "special";
    card.innerHTML = `
      <div class="race-card-img-wrap">
        <img src="img/race-special.jpg" alt="Special" class="race-card-img" loading="lazy">
      </div>
      <div class="race-card-body">
        <h3 class="race-card-name">Special</h3>
        <p class="race-card-attrs">Hybrid Races</p>
        <p class="race-card-desc">Rare hybrid races born of mixed heritage. Not for the faint of heart — these come at a cost.</p>
        <span class="race-card-subrace-badge">2 hybrid types</span>
      </div>
    `;
    card.addEventListener("click", (e) => { e.stopPropagation(); openHybridSelection(); });
    container.appendChild(card);
  }

  function openHybridSelection() {
    // Deselect any normal race card
    document.querySelectorAll(".race-card").forEach(c => c.classList.remove("selected"));
    document.querySelector('.race-card[data-race-id="special"]')?.classList.add("selected");

    Aniela.playSequence([
      { text: "A hybrid?! Those are incredibly rare. Less than 1% of mixed unions produce true hybrids.", sprite: "3" },
      { text: "Just so you know — choosing a hybrid race costs 200 of your starting Breakthrough Points. That's a big investment.", sprite: "4" },
      { text: "But if you're set on it, the results can be truly extraordinary. Choose your hybrid type below!", sprite: "1" },
    ], () => {});

    // Show hybrid selection in a modal overlay
    document.getElementById("hybrid-select-overlay")?.remove();
    const overlay = document.createElement("div");
    overlay.id = "hybrid-select-overlay";
    overlay.className = "hybrid-select-overlay";
    overlay.innerHTML = `
      <div class="hybrid-select-modal">
        <div class="hybrid-select-title">Choose Hybrid Type</div>
        <div class="hybrid-select-subtitle">⚠ Costs 200 Breakthrough Points</div>
        <div class="hybrid-select-grid" id="hybrid-type-grid"></div>
        <button class="hybrid-select-cancel" id="hybrid-cancel-btn">Cancel</button>
      </div>
    `;
    document.body.appendChild(overlay);

    const grid = document.getElementById("hybrid-type-grid");
    HYBRID_TYPES.forEach(ht => {
      const card = document.createElement("div");
      card.className = "hybrid-type-card";
      card.innerHTML = `
        <div class="hybrid-type-name">${ht.name}</div>
        <div class="hybrid-type-desc">${ht.description}</div>
        <div class="hybrid-type-cost">200 EXP from Breakthroughs</div>
      `;
      card.addEventListener("click", () => {
        overlay.remove();
        if (ht.primaryOptions.length === 1) {
          // Human-Chimera: only one option
          selectHybridRace(ht, ht.primaryOptions[0]);
        } else {
          // Faerie-Chimera: ask which is primary
          openHybridPrimaryPicker(ht);
        }
      });
      grid.appendChild(card);
    });

    document.getElementById("hybrid-cancel-btn").addEventListener("click", () => {
      overlay.remove();
      document.querySelector('.race-card[data-race-id="special"]')?.classList.remove("selected");
    });
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.remove();
        document.querySelector('.race-card[data-race-id="special"]')?.classList.remove("selected");
      }
    });
  }

  function openHybridPrimaryPicker(hybridType) {
    document.getElementById("hybrid-primary-overlay")?.remove();
    const overlay = document.createElement("div");
    overlay.id = "hybrid-primary-overlay";
    overlay.className = "hybrid-select-overlay";
    overlay.innerHTML = `
      <div class="hybrid-select-modal">
        <div class="hybrid-select-title">Choose Your Primary Race</div>
        <div class="hybrid-select-subtitle">Your primary race determines your base traits. You'll pick a subrace from the other race.</div>
        <div class="hybrid-select-grid" id="hybrid-primary-grid"></div>
        <button class="hybrid-select-cancel" id="hybrid-primary-cancel">Back</button>
      </div>
    `;
    document.body.appendChild(overlay);

    const grid = document.getElementById("hybrid-primary-grid");
    hybridType.primaryOptions.forEach(opt => {
      const card = document.createElement("div");
      card.className = "hybrid-type-card";
      card.innerHTML = `
        <div class="hybrid-type-name">${opt.primaryRaceName} (Primary)</div>
        <div class="hybrid-type-desc">
          Keep <strong>${opt.primaryRaceName}</strong> base traits.<br>
          Pick a <strong>${opt.subracePool}</strong> subrace.
          <br><small>Display: ${opt.displayPrefix} {Subrace Name}</small>
        </div>
      `;
      card.addEventListener("click", () => {
        overlay.remove();
        selectHybridRace(hybridType, opt);
      });
      grid.appendChild(card);
    });

    document.getElementById("hybrid-primary-cancel").addEventListener("click", () => {
      overlay.remove();
      openHybridSelection(); // go back to type selection
    });
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.remove();
    });
  }

  function selectHybridRace(hybridType, primaryOption) {
    // Find the real primary race data from API to get attributes/proficiencies
    const realRace = allRaces.find(r => r.primaryRaceId === primaryOption.primaryRaceId);
    
    // Set primary race data
    character.race.primaryRaceId = primaryOption.primaryRaceId;
    character.race.primaryRaceName = primaryOption.primaryRaceName;
    character.race.attributes = realRace?.attributes || "";
    character.race.proficiencies = realRace?.proficiencies || "";
    character.race.imageUrl = realRace?.imageSmUrl || "img/race-special.jpg";
    character.race.ancestryId = null;
    character.race.ancestryName = null;
    character.race.ancestryDescription = null;
    character.race.ancestryTrait = null;
    character.race.ancestryImageUrl = null;

    // Hybrid-specific metadata
    character.race.isHybrid = true;
    character.race.hybridType = hybridType.id;
    character.race.hybridBreakthroughId = hybridType.breakthroughId;
    character.race.hybridBtCost = hybridType.btCost;
    character.race.hybridSubracePool = primaryOption.subracePool;
    character.race.hybridDisplayPrefix = primaryOption.displayPrefix;
    character.race.hybridName = hybridType.name;

    // For Human-Chimera: mark no extra EXP bonus
    if (hybridType.id === "human-chimera") {
      character.race.noHumanBonus = true;
    }

    // Apply race bonuses from the primary race
    Character.applyRaceBonuses(character, primaryOption.primaryRaceId);

    // Update UI
    document.querySelectorAll(".race-card").forEach(c => {
      c.classList.toggle("selected", c.dataset.raceId === "special");
    });

    Aniela.say({ text: `${hybridType.name} — ${primaryOption.primaryRaceName} primary! You'll pick a ${primaryOption.subracePool} subrace next. Remember, this costs 200 Breakthrough Points.`, sprite: "1", dismissable: true });
    nextBtn.style.display = "inline-flex";
    nextBtn.innerHTML = 'Next <span class="builder-btn-icon">→</span>';
  }

  function selectRace(race) {
    document.querySelectorAll(".race-card").forEach((c) =>
      c.classList.toggle("selected", c.dataset.raceId === race.primaryRaceId)
    );

    // Record all race data for the final character sheet
    character.race.primaryRaceId = race.primaryRaceId;
    character.race.primaryRaceName = race.name;
    character.race.attributes = race.attributes;
    character.race.proficiencies = race.proficiencies;
    character.race.imageUrl = race.imageSmUrl;
    character.race.ancestryId = null;
    character.race.ancestryName = null;
    character.race.ancestryDescription = null;
    character.race.ancestryTrait = null;
    character.race.ancestryImageUrl = null;

    // Clear any hybrid flags from a previous selection
    character.race.isHybrid = false;
    character.race.hybridType = null;
    character.race.hybridBreakthroughId = null;
    character.race.hybridBtCost = null;
    character.race.hybridSubracePool = null;
    character.race.hybridDisplayPrefix = null;
    character.race.hybridName = null;
    character.race.noHumanBonus = false;

    // Apply fixed race bonuses (Human left empty for now)
    Character.applyRaceBonuses(character, race.primaryRaceId);

    // Aniela gives race-specific lore
    const raceId = race.primaryRaceId;
    const lines = LINES.raceSelected[raceId] || [{ text: `${race.name}? Interesting!`, sprite: "3" }];
    Aniela.playSequence(lines, () => {});
    nextBtn.style.display = "inline-flex";
    nextBtn.innerHTML = 'Next <span class="builder-btn-icon">→</span>';
  }

  /* ═══════════════════════════════════════════════════════════════════
     SUBRACE SELECTION
     ═══════════════════════════════════════════════════════════════════ */
  function loadSubraces() {
    const grid = document.getElementById("subrace-grid");
    const titleEl = document.getElementById("subrace-title");
    const phaseHeaderEl = document.getElementById("phase-header");
    const phaseHeaderTitle = document.getElementById("phase-header-title");

    let subraces;
    if (character.race.isHybrid) {
      // Hybrid: show subraces from the OTHER race pool
      const pool = character.race.hybridSubracePool;
      titleEl.textContent = `${pool} Ancestries (Hybrid)`;
      phaseHeaderTitle.textContent = `Choose Your ${pool} Ancestry`;
      subraces = allAncestries.filter((a) => a.primaryRace === pool);
    } else {
      const raceName = character.race.primaryRaceName;
      titleEl.textContent = `${raceName} Ancestries`;
      phaseHeaderTitle.textContent = `${raceName} Ancestries`;
      subraces = allAncestries.filter((a) => a.primaryRace === character.race.primaryRaceName);
    }

    phaseHeaderEl.style.display = "block";
    renderSubraceCards(grid, subraces);
  }

  function renderSubraceCards(container, subraces) {
    container.innerHTML = "";
    subraces.forEach((sub) => {
      const card = document.createElement("div");
      card.className = "race-card subrace-card";
      card.dataset.ancestryId = sub.ancestryId;

      const descText = stripHtml(sub.description);
      const preview = descText.length > 100 ? descText.slice(0, 100) + "…" : descText;

      card.innerHTML = `
        <div class="race-card-img-wrap">
          <img src="${sub.imageSmUrl}" alt="${sub.name}" class="race-card-img" loading="lazy">
        </div>
        <div class="race-card-body">
          <h3 class="race-card-name">${sub.name}</h3>
          <p class="race-card-desc">${preview}</p>
        </div>
      `;

      card.addEventListener("click", (e) => { e.stopPropagation(); selectSubrace(sub); });
      container.appendChild(card);
    });
  }

  function selectSubrace(sub) {
    document.querySelectorAll(".subrace-card").forEach((c) =>
      c.classList.toggle("selected", c.dataset.ancestryId === sub.ancestryId)
    );

    // Record all ancestry data for the final character sheet
    character.race.ancestryId = sub.ancestryId;
    character.race.ancestryName = sub.name;
    character.race.ancestryDescription = stripHtml(sub.description);
    character.race.ancestryTrait = sub.trait1;
    character.race.ancestryImageUrl = sub.imageSmUrl;

    // Set elemental mastery from race
    // Only ancestries whose racial trait ability explicitly grants "Elemental Mastery: X" in the API
    // Verified via: true-abilities with description containing "Elemental Mastery"
    //   elemental-mastery--fire → Salamander, elemental-mastery--wind → Sylph,
    //   elemental-mastery--lightning → Raijin, elemental-mastery--holy → Suryan,
    //   elemental-mastery--dark → Unseelie, aquatic-fae → Selkie (Water),
    //   chilling-cold → Yuki-Onna (Frost→Ice)
    //   ryujin-s-mastery → Ryujin (player choice, handled separately)
    const RACE_ELEMENTAL_MAP = {
      "salamander": "fire",
      "selkie":     "water",
      "sylph":      "wind",
      "raijin":     "lightning",
      "yuki-onna":  "ice",
      "suryan":     "holy",
      "unseelie":   "dark",
      "phoenix":    "fire",
    };
    const ancestryKey = sub.ancestryId.toLowerCase();
    character.race.elementalMastery = RACE_ELEMENTAL_MAP[ancestryKey] || null;

    // Aniela gives ancestry-specific lore
    const subId = sub.ancestryId;
    const lines = LINES.subraceSelected[subId] || [{ text: `A ${sub.name}!  Love it.`, sprite: "1" }];
    Aniela.playSequence(lines, () => {});
    nextBtn.style.display = "inline-flex";
    nextBtn.innerHTML = 'Next <span class="builder-btn-icon">→</span>';
  }

  /* ═══════════════════════════════════════════════════════════════════
     DEMON HOUSE SELECTION
     ═══════════════════════════════════════════════════════════════════ */
  async function renderDemonHouses() {
    const grid = document.getElementById("house-grid");
    if (grid.children.length) return; // already rendered

    // Fetch ability details from the API
    const abilityIds = DEMON_HOUSES.map((h) => h.abilityId);
    let abilities = [];
    try {
      abilities = await ApiClient.getTrueAbilitiesByIds(abilityIds);
    } catch (err) {
      console.warn("Could not fetch demon house abilities:", err);
    }

    const abilityMap = {};
    abilities.forEach((a) => { abilityMap[a.trueAbilityId] = a; });

    grid.innerHTML = "";
    DEMON_HOUSES.forEach((house) => {
      const ability = abilityMap[house.abilityId];
      const abilityName = ability ? ability.name : house.abilityId;
      const abilityDesc = ability ? stripHtml(ability.description) : "";
      const preview = abilityDesc.length > 120 ? abilityDesc.slice(0, 120) + "…" : abilityDesc;

      const card = document.createElement("div");
      card.className = "house-card";
      card.dataset.houseId = house.id;

      card.innerHTML = `
        <div class="house-card-header">
          <span class="house-card-name">${house.name === "None" ? "Houseless" : "House " + house.name}</span>
          <span class="house-card-ability">${abilityName}</span>
        </div>
        <p class="house-card-desc">${preview}</p>
      `;

      card.addEventListener("click", (e) => {
        e.stopPropagation();
        selectDemonHouse(house, abilityName, abilityDesc);
      });
      grid.appendChild(card);
    });
  }

  function selectDemonHouse(house, abilityName, fullDesc) {
    document.querySelectorAll(".house-card").forEach((c) =>
      c.classList.toggle("selected", c.dataset.houseId === house.id)
    );

    // Record for final character sheet
    character.race.demonHouseId = house.id;
    character.race.demonHouseName = house.name;
    character.race.demonHouseAbilityId = house.abilityId;
    character.race.demonHouseAbilityName = abilityName;

    // Aniela explains the full ability
    const houseLine = house.name === "None"
      ? { text: `Going houseless? Bold. Your ability is ${abilityName}.`, sprite: "3" }
      : { text: `House ${house.name} — their ability is ${abilityName}.`, sprite: "3" };
    const descLine = { text: fullDesc || "No description available.", sprite: "1" };

    Aniela.playSequence([houseLine, descLine], () => {});
    nextBtn.style.display = "inline-flex";
    nextBtn.innerHTML = 'Next <span class="builder-btn-icon">→</span>';
  }

  /* ═══════════════════════════════════════════════════════════════════
     HUMAN BONUS PICK
     ═══════════════════════════════════════════════════════════════════ */
  function bindHumanBonusPicks() {
    // Main stat picks
    document.querySelectorAll("#human-main-pick .bonus-pick").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        document.querySelectorAll("#human-main-pick .bonus-pick").forEach((c) => c.classList.remove("selected"));
        el.classList.add("selected");
        humanMainPick = el.dataset.stat;
        checkHumanBonusDone();
      });
    });

    // Sub stat picks
    document.querySelectorAll("#human-sub-pick .bonus-pick").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        document.querySelectorAll("#human-sub-pick .bonus-pick").forEach((c) => c.classList.remove("selected"));
        el.classList.add("selected");
        humanSubPick = el.dataset.stat;
        checkHumanBonusDone();
      });
    });
  }

  function checkHumanBonusDone() {
    if (humanMainPick && humanSubPick) {
      // Apply to character
      character.raceBonuses = {
        mainStat: humanMainPick,
        mainVal: 1,
        subStat: humanSubPick,
        subVal: 1,
      };
      Aniela.say(LINES.humanBonusDone);
      nextBtn.style.display = "inline-flex";
      nextBtn.innerHTML = 'Next <span class="builder-btn-icon">→</span>';
    }
  }

  /* ═══════════════════════════════════════════════════════════════════
     STAT TOKENS & SLOTS (click + drag-and-drop)
     ═══════════════════════════════════════════════════════════════════ */
  let dragData = null; // { el, index, value, group }

  function bindTokens() {
    mainTokenEls.forEach((el, i) => {
      el.setAttribute("draggable", "true");
      el.addEventListener("click", (e) => { e.stopPropagation(); handleTokenClick(el, i, "main"); });
      el.addEventListener("dragstart", (e) => { handleDragStart(e, el, i, "main"); });
      el.addEventListener("dragend", () => { handleDragEnd(); });
    });
    subTokenEls.forEach((el, i) => {
      el.setAttribute("draggable", "true");
      el.addEventListener("click", (e) => { e.stopPropagation(); handleTokenClick(el, i, "sub"); });
      el.addEventListener("dragstart", (e) => { handleDragStart(e, el, i, "sub"); });
      el.addEventListener("dragend", () => { handleDragEnd(); });
    });
  }

  function handleTokenClick(el, index, group) {
    const state = group === "main" ? mainTokenState : subTokenState;
    const tokenEls = group === "main" ? mainTokenEls : subTokenEls;
    if (state[index].used) return;
    tokenEls.forEach((t) => t.classList.remove("selected"));
    if (selectedToken && selectedToken.el === el) { selectedToken = null; clearSlotHighlights(); return; }
    el.classList.add("selected");
    selectedToken = { el, index, value: state[index].value, group };
    highlightSlots(group);
  }

  function handleDragStart(e, el, index, group) {
    const state = group === "main" ? mainTokenState : subTokenState;
    if (state[index].used) { e.preventDefault(); return; }

    dragData = { el, index, value: state[index].value, group };
    el.classList.add("dragging");

    // Ghost image — use the token itself
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", ""); // required for Firefox
    }

    // Highlight valid slots
    highlightSlots(group);
  }

  function handleDragEnd() {
    if (dragData) {
      dragData.el.classList.remove("dragging");
      dragData = null;
    }
    clearSlotHighlights();
    clearDropTargets();
  }

  function clearDropTargets() {
    document.querySelectorAll(".stat-slot").forEach((s) => s.classList.remove("drop-target"));
  }

  function bindSlots() {
    mainSlotEls.forEach((el) => {
      el.addEventListener("click", (e) => { e.stopPropagation(); handleSlotClick(el, "main"); });
      // Drag-and-drop
      el.addEventListener("dragover", (e) => { handleDragOver(e, el, "main"); });
      el.addEventListener("dragleave", () => { el.classList.remove("drop-target"); });
      el.addEventListener("drop", (e) => { handleDrop(e, el, "main"); });
    });
    subSlotEls.forEach((el) => {
      el.addEventListener("click", (e) => { e.stopPropagation(); handleSlotClick(el, "sub"); });
      // Drag-and-drop
      el.addEventListener("dragover", (e) => { handleDragOver(e, el, "sub"); });
      el.addEventListener("dragleave", () => { el.classList.remove("drop-target"); });
      el.addEventListener("drop", (e) => { handleDrop(e, el, "sub"); });
    });
  }

  function handleDragOver(e, slotEl, group) {
    if (!dragData || dragData.group !== group) return;
    if (slotEl.classList.contains("assigned")) return;
    e.preventDefault(); // allow drop
    e.dataTransfer.dropEffect = "move";
    slotEl.classList.add("drop-target");
  }

  function handleDrop(e, slotEl, group) {
    e.preventDefault();
    slotEl.classList.remove("drop-target");
    if (!dragData || dragData.group !== group) return;
    if (slotEl.classList.contains("assigned")) return;

    // Reuse existing assignment logic
    const statKey = slotEl.dataset.stat;
    const stats = group === "main" ? character.mainStats : character.subStats;
    const tokenState = group === "main" ? mainTokenState : subTokenState;
    const tokenIdx = dragData.index;

    stats[statKey] = dragData.value;
    tokenState[tokenIdx].used = true;
    tokenState[tokenIdx].assignedTo = statKey;
    dragData.el.classList.add("used");
    dragData.el.classList.remove("selected", "dragging");

    const valueEl = slotEl.querySelector(".slot-value");
    valueEl.textContent = dragData.value;
    slotEl.classList.add("assigned");
    slotEl.dataset.tokenIndex = tokenIdx;
    valueEl.classList.add("stat-pop");
    setTimeout(() => valueEl.classList.remove("stat-pop"), 450);

    dragData = null;
    clearSlotHighlights();
    clearDropTargets();
    checkPhaseCompletion(group);
  }

  function handleSlotClick(slotEl, group) {
    const statKey = slotEl.dataset.stat;
    const stats = group === "main" ? character.mainStats : character.subStats;
    const tokenState = group === "main" ? mainTokenState : subTokenState;

    if (slotEl.classList.contains("assigned")) { unassignSlot(slotEl, statKey, group); return; }
    if (!selectedToken || selectedToken.group !== group) return;

    const tokenIdx = selectedToken.index;
    stats[statKey] = selectedToken.value;
    tokenState[tokenIdx].used = true;
    tokenState[tokenIdx].assignedTo = statKey;
    selectedToken.el.classList.add("used");
    selectedToken.el.classList.remove("selected");

    const valueEl = slotEl.querySelector(".slot-value");
    valueEl.textContent = selectedToken.value;
    slotEl.classList.add("assigned");
    slotEl.dataset.tokenIndex = tokenIdx;
    valueEl.classList.add("stat-pop");
    setTimeout(() => valueEl.classList.remove("stat-pop"), 450);

    selectedToken = null;
    clearSlotHighlights();
    checkPhaseCompletion(group);
  }

  function unassignSlot(slotEl, statKey, group) {
    const stats = group === "main" ? character.mainStats : character.subStats;
    const tokenState = group === "main" ? mainTokenState : subTokenState;
    const tokenEls = group === "main" ? mainTokenEls : subTokenEls;
    const tokenIdx = parseInt(slotEl.dataset.tokenIndex);
    if (isNaN(tokenIdx)) return;

    stats[statKey] = 0;
    tokenState[tokenIdx].used = false;
    tokenState[tokenIdx].assignedTo = null;
    tokenEls[tokenIdx].classList.remove("used");
    slotEl.querySelector(".slot-value").textContent = "—";
    slotEl.classList.remove("assigned");
    delete slotEl.dataset.tokenIndex;

    if (selectedToken) { selectedToken.el.classList.remove("selected"); selectedToken = null; }
    clearSlotHighlights();
    nextBtn.style.display = "none";
  }

  function highlightSlots(group) {
    const slotEls = group === "main" ? mainSlotEls : subSlotEls;
    slotEls.forEach((el) => { if (!el.classList.contains("assigned")) el.classList.add("highlight"); });
    (group === "main" ? subSlotEls : mainSlotEls).forEach((el) => el.classList.remove("highlight"));
  }

  function clearSlotHighlights() {
    mainSlotEls.forEach((el) => el.classList.remove("highlight"));
    subSlotEls.forEach((el) => el.classList.remove("highlight"));
  }

  function checkPhaseCompletion(group) {
    const state = group === "main" ? mainTokenState : subTokenState;
    if (state.every((t) => t.used)) {
      nextBtn.style.display = "inline-flex";
      nextBtn.innerHTML = 'Next <span class="builder-btn-icon">→</span>';
      Aniela.say(group === "main" ? LINES.mainStatsDone : LINES.subStatsDone);
    }
  }

  /* ─── Debug: "\" key auto-fills stats ────────────────────────────── */
  document.addEventListener("keydown", function (e) {
    if (e.key !== "\\") return;
    if (currentPhase !== "main-stats" && currentPhase !== "sub-stats") return;

    const group = currentPhase === "main-stats" ? "main" : "sub";
    const stats = group === "main" ? character.mainStats : character.subStats;
    const tokenState = group === "main" ? mainTokenState : subTokenState;
    const tokenEls = group === "main" ? mainTokenEls : subTokenEls;
    const slotEls = group === "main" ? mainSlotEls : subSlotEls;

    // Assign each token to the corresponding slot in order
    slotEls.forEach((slotEl, idx) => {
      if (idx >= tokenState.length) return;
      if (slotEl.classList.contains("assigned")) return;

      const statKey = slotEl.dataset.stat;
      const value = tokenState[idx].value;

      stats[statKey] = value;
      tokenState[idx].used = true;
      tokenState[idx].assignedTo = statKey;
      tokenEls[idx].classList.add("used");
      tokenEls[idx].classList.remove("selected");

      const valueEl = slotEl.querySelector(".slot-value");
      valueEl.textContent = value;
      slotEl.classList.add("assigned");
      slotEl.dataset.tokenIndex = idx;
    });

    selectedToken = null;
    clearSlotHighlights();
    checkPhaseCompletion(group);
    Character.save(character);
    console.log("[DEBUG] Auto-filled " + group + " stats via \\ key");
  });

  /* ═══════════════════════════════════════════════════════════════════
     DERIVED STATS + STAT SUMMARY
     ═══════════════════════════════════════════════════════════════════ */

  /** Build the stat summary rows showing base + green bonus */
  function buildStatSummary() {
    const mainRow = document.getElementById("summary-main-stats");
    const subRow = document.getElementById("summary-sub-stats");

    mainRow.innerHTML = "";
    subRow.innerHTML = "";

    // Main stats
    Character.MAIN_STAT_KEYS.forEach((key) => {
      const base = character.mainStats[key];
      const bonus = (character.raceBonuses.mainStat === key) ? character.raceBonuses.mainVal : 0;
      const total = base + bonus;
      const name = Character.MAIN_STAT_NAMES[key];

      mainRow.appendChild(createSummaryItem(name, base, bonus, total));
    });

    // Sub stats
    Character.SUB_STAT_KEYS.forEach((key) => {
      const base = character.subStats[key];
      const bonus = (character.raceBonuses.subStat === key) ? character.raceBonuses.subVal : 0;
      const total = base + bonus;
      const name = Character.SUB_STAT_NAMES[key];

      subRow.appendChild(createSummaryItem(name, base, bonus, total));
    });
  }

  function createSummaryItem(name, base, bonus, total) {
    const el = document.createElement("div");
    el.className = "stat-summary-item";

    el.innerHTML = `
      <span class="stat-summary-label">${name}</span>
      <span class="stat-summary-value">
        <span class="stat-summary-total">${total}</span>
        ${bonus > 0 ? `<span class="stat-bonus">(+${bonus})</span>` : ""}
      </span>
    `;
    return el;
  }

  /** Show green (+1) race bonus badge on the stat slots during assignment */
  function addRaceBonusBadges() {
    // Clear old badges
    document.querySelectorAll(".race-bonus-badge").forEach((b) => b.remove());

    const rb = character.raceBonuses;

    // Main stat slots
    if (rb.mainStat && rb.mainVal) {
      mainSlotEls.forEach((el) => {
        if (el.dataset.stat === rb.mainStat) {
          const badge = document.createElement("span");
          badge.className = "race-bonus-badge";
          badge.textContent = `+${rb.mainVal} Race`;
          el.appendChild(badge);
        }
      });
    }

    // Sub stat slots
    if (rb.subStat && rb.subVal) {
      subSlotEls.forEach((el) => {
        if (el.dataset.stat === rb.subStat) {
          const badge = document.createElement("span");
          badge.className = "race-bonus-badge";
          badge.textContent = `+${rb.subVal} Race`;
          el.appendChild(badge);
        }
      });
    }
  }

  function updateDerived() {
    const d = Character.getDerived(character);
    [
      { id: "derived-hp",         val: d.hp },
      { id: "derived-mana",       val: d.mana },
      { id: "derived-rp",         val: d.rp },
      { id: "derived-evasion",    val: d.evasion },
      { id: "derived-potency",    val: d.potency },
      { id: "derived-guard",      val: d.guard },
      { id: "derived-initiative", val: d.initiative },
      { id: "derived-save",       val: d.savebonus },
    ].forEach(({ id, val }) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = String(val);
      el.classList.add("stat-pop");
      setTimeout(() => el.classList.remove("stat-pop"), 450);
    });
  }

  /* ═══════════════════════════════════════════════════════════════════
     BREAKTHROUGHS  (delegated to shared BreakthroughBrowser module)
     ═══════════════════════════════════════════════════════════════════ */
  let btBrowserInstance = null;

  async function loadBreakthroughs() {
    const container = document.getElementById("bt-browser-container");

    // Destroy previous instance if any
    if (btBrowserInstance) {
      btBrowserInstance.destroy();
      btBrowserInstance = null;
    }

    btBrowserInstance = BreakthroughBrowser.create({
      containerEl: container,
      character: character,
      mode: "creation",
      budget: 300,
      idPrefix: "bt",
      showCart: true,
      hybridBreakthroughId: character.race?.isHybrid ? character.race.hybridBreakthroughId : null,
      apiClient: ApiClient,
      stripHtml: function (s) { return Utils.stripHtml(s); },
      characterModule: Character,
      onSync: function () {
        // Module already syncs character.breakthroughs internally
        nextBtn.style.display = "inline-flex";
      },
      onMessage: function (text) {
        if (text) Aniela.say({ text: text, sprite: "4", dismissable: true });
      },
    });

    // Init loads BT data and renders
    await btBrowserInstance.init();
  }

  function clearBtHeaderExtras() {
    if (btBrowserInstance) {
      btBrowserInstance.destroy();
      btBrowserInstance = null;
    }
  }

    /* ═══════════════════════════════════════════════════════════════════
     CLASSES
     ═══════════════════════════════════════════════════════════════════ */
  const CLS_BUDGET_BASE = 1000;
  const CLS_HUMAN_BONUS = 100;
  function getClsBudget() {
    const isHuman = character.race?.primaryRaceId === "human" ||
                    character.race?.primaryRaceName?.toLowerCase() === "human";
    const noBonus = character.race?.noHumanBonus === true; // Human-Chimera hybrid
    let interludeExp = 0;
    if (clsInterludeActions) {
      for (const actionId of clsInterludeActions) {
        const def = INTERLUDE_ACTIONS.find(a => a.id === actionId);
        if (def && def.exp) interludeExp += def.exp;
      }
    }
    return CLS_BUDGET_BASE + (isHuman && !noBonus ? CLS_HUMAN_BONUS : 0) + interludeExp;
  }
  const CLS_IP_MAX = 3;
  let allClassesData = [];
  const keyAbilityHpMap = {}; // classId -> HP bonus from key ability
  let clsSelected = new Map(); // classId → { levels: 1-8, data: classObj }
  let clsDetailCls = null;
  let clsOverrideMode = false;
  let clsMiraneMode = true;
  let clsAvailableOnly = false;
  const clsMiraneBanList = ["angelblooded", "shinigami-eyes", "vampire", "vampire-lord", "true-shinigami-eyes"];

  /* ─── Free Class Grants (race/house/ancestry → class) ────────────── */
  // Hardcoded until the API encodes these. Each entry:
  //   match: { race?, demonHouseId?, ancestryId? } — all specified fields must match
  //   classId: the class to grant free
  //   level: the starting level (1 unless specified otherwise)
  //   source: display label for where the grant comes from
  const FREE_CLASS_GRANTS = [
    // Demon Houses
    { match: { race: "demon", demonHouseId: "wi"  }, classId: "saboteur",                  level: 1, source: "House Wi" },
    { match: { race: "demon", demonHouseId: "un"  }, classId: "maid",                      level: 1, source: "House Un" },
    { match: { race: "demon", demonHouseId: "vi"  }, classId: "medic",                     level: 1, source: "House Vi" },
    // Fae Ancestries
    { match: { race: "fae",   ancestryId: "gnome"  }, classId: "miner",                    level: 1, source: "Gnome" },
    { match: { race: "fae",   ancestryId: "selkie" }, classId: "hydromancer",               level: 2, source: "Selkie" },
    // Youkai Ancestries
    { match: { race: "youkai", ancestryId: "raijin" }, classId: "flash-star-blade-style-",  level: 1, source: "Raijin" },
  ];
  let clsFreeClasses = new Set(); // classIds that were granted free

  /** Check which free class grants apply to this character and auto-add them */
  function applyFreeClassGrants() {
    const race = (character.race?.primaryRaceName || "").toLowerCase();
    const houseId = (character.race?.demonHouseId || "").toLowerCase();
    const ancestryId = (character.race?.ancestryId || "").toLowerCase();

    for (const grant of FREE_CLASS_GRANTS) {
      const m = grant.match;
      if (m.race && m.race !== race) continue;
      if (m.demonHouseId && m.demonHouseId !== houseId) continue;
      if (m.ancestryId && m.ancestryId !== ancestryId) continue;

      // This grant applies
      const clsData = allClassesData.find(c => c.classId === grant.classId);
      if (!clsData) {
        console.warn(`[freeClass] grant for ${grant.classId} (${grant.source}): class not found in data`);
        continue;
      }
      clsFreeClasses.add(grant.classId);
      if (!clsSelected.has(grant.classId)) {
        clsSelected.set(grant.classId, { levels: grant.level, data: clsData });
        console.log(`[freeClass] auto-granted ${clsData.name} Lv.${grant.level} from ${grant.source}`);
      }
    }
  }

  /* ─── Interlude Actions (unused IP spending) ─────────────────────── */
  const INTERLUDE_ACTIONS = [
    { id: "job",   label: "Job",   desc: "+300 CLIM",  clim: 300, exp: 0   },
    { id: "train", label: "Train", desc: "+25 EXP",    clim: 0,   exp: 25  },
    { id: "other", label: "Other", desc: "Manual",      clim: 0,   exp: 0   },
  ];
  let clsInterludeActions = []; // array of action ids, each costs 1 IP

  /* ─── Progression level definitions ──────────────────────────────── */
  const CLS_LEVELS = [
    { key: "keyAbilityName",       label: "Key Ability" },
    { key: "ability1Name",         label: "Ability 1" },
    { key: "skills",               label: "Skills" },
    { key: "ability2Name",         label: "Ability 2" },
    { key: "heart",                label: "Heart" },
    { key: "ability3Name",         label: "Ability 3" },
    { key: "soul",                 label: "Soul" },
    { key: "ultimateAbilityName",  label: "Ultimate" },
  ];

  async function loadClasses() {
    const grid = document.getElementById("cls-grid");
    setupClsHeaderExtras();

    if (allClassesData.length === 0) {
      grid.innerHTML = '<div class="bt-empty-state">Loading classes...</div>';
      try {
        const rawData = await ApiClient.getClassesFull();
        console.log("[loadClasses] raw data type:", typeof rawData, "isArray:", Array.isArray(rawData), "length:", rawData?.length);
        if (Array.isArray(rawData)) {
          allClassesData = rawData;
        } else if (rawData && typeof rawData === "object") {
          // Maybe wrapped in an object?
          allClassesData = Object.values(rawData).flat().filter(c => c && c.classId);
          console.log("[loadClasses] extracted from object, count:", allClassesData.length);
        } else {
          throw new Error("Unexpected data format: " + typeof rawData);
        }
        allClassesData.sort((a, b) => (a.tier || 0) - (b.tier || 0) || (a.name || "").localeCompare(b.name || ""));
        console.log("[loadClasses] loaded", allClassesData.length, "classes");

        // Preload key ability HP bonuses
        try {
          const keyAbilities = await ApiClient.getKeyAbilities();
          for (const cls of allClassesData) {
            keyAbilityHpMap[cls.classId] = 0;
            if (cls.keyAbilityId) {
              const ka = keyAbilities.find(a => a.indexId === cls.keyAbilityId);
              if (ka) {
                for (const key of ["benefit1", "benefit2", "benefit3", "benefit4"]) {
                  const txt = ka[key];
                  if (txt) {
                    const m = txt.match(/\+(\d+)\s*HP/i);
                    if (m) {
                      keyAbilityHpMap[cls.classId] += parseInt(m[1]);
                    }
                  }
                }
              }
            }
          }
          console.log("[loadClasses] keyAbilityHpMap:", keyAbilityHpMap);
        } catch (e) {
          console.warn("[loadClasses] Could not preload key ability HP bonuses:", e);
        }
      } catch (err) {
        grid.innerHTML = `<div class="bt-empty-state">Failed to load classes: ${err.message}</div>`;
        console.error("Class load error:", err);
        return;
      }
    }

    // Restore previous selections
    if (character.classes && character.classes.length && clsSelected.size === 0) {
      character.classes.forEach((c) => {
        const data = allClassesData.find((d) => d.classId === c.classId);
        if (data) clsSelected.set(c.classId, { levels: c.levels, data });
      });
    }

    if (character.interludeActions && character.interludeActions.length && clsInterludeActions.length === 0) {
      clsInterludeActions = [...character.interludeActions];
    }

    // Apply free class grants from race/house/ancestry
    applyFreeClassGrants();

    renderClassCards(allClassesData);
    updateClsBudget();
    updateClsCart();
    bindClsDetailModal();
  }

  /* ─── Header Extras (budget, IP, search, filters, toggles) ───────── */
  function setupClsHeaderExtras() {
    const extras = document.getElementById("phase-header-extras");
    extras.innerHTML = `
      <div class="bt-budget-bar">
        <span class="bt-budget-label">EXP Budget</span>
        <div class="bt-budget-meter">
          <div class="bt-budget-fill" id="cls-budget-fill"></div>
        </div>
        <span class="bt-budget-value" id="cls-budget-value">${getClsBudget()} / ${getClsBudget()}</span>
        <span class="cls-ip-display" id="cls-ip-display">
          IP: <strong id="cls-ip-value">0 / 3</strong>
        </span>
        <button class="bt-override-btn" id="cls-override-btn">
          <span class="bt-override-indicator"></span>
          <span class="bt-override-label">Override</span>
        </button>
        <button class="cls-mirane-btn" id="cls-mirane-btn">
          <span class="cls-mirane-indicator"></span>
          <span class="cls-mirane-label">Mirane</span>
        </button>
      </div>
      <div class="bt-search-wrap">
        <span class="bt-search-icon">🔍</span>
        <input type="text" id="cls-search" class="bt-search-input" placeholder="Search classes by name, role, or requirement..." autocomplete="off">
      </div>
      <div class="cls-filter-bar">
        <select id="cls-filter-tier" class="cls-filter-select">
          <option value="">All Tiers</option>
          <option value="1">Tier 1</option>
          <option value="2">Tier 2</option>
          <option value="3">Tier 3</option>
        </select>
        <select id="cls-filter-diff" class="cls-filter-select">
          <option value="">All Difficulty</option>
          <option value="1">★</option>
          <option value="2">★★</option>
          <option value="3">★★★</option>
          <option value="4">★★★★</option>
        </select>
        <select id="cls-filter-role" class="cls-filter-select">
          <option value="">All Roles</option>
          <option value="Striker">Striker</option>
          <option value="Defender">Defender</option>
          <option value="Healer">Healer</option>
          <option value="Support">Support</option>
          <option value="Controller">Controller</option>
          <option value="Utility">Utility</option>
          <option value="Specialist">Specialist</option>
          <option value="Artisan">Artisan</option>
          <option value="Gatherer">Gatherer</option>
        </select>
        <button class="cls-mirane-btn" id="cls-available-btn">
          <span class="cls-mirane-indicator"></span>
          <span>Available Only</span>
        </button>
      </div>
    `;

    // Override toggle
    const overrideBtn = document.getElementById("cls-override-btn");
    if (clsOverrideMode) overrideBtn.classList.add("active");
    overrideBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      clsOverrideMode = !clsOverrideMode;
      overrideBtn.classList.toggle("active", clsOverrideMode);
      updateClsBudget();
      applyClsFilters();
    });

    // Mirane toggle
    const miraneBtn = document.getElementById("cls-mirane-btn");
    if (clsMiraneMode) miraneBtn.classList.add("active");
    miraneBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      clsMiraneMode = !clsMiraneMode;
      miraneBtn.classList.toggle("active", clsMiraneMode);
      applyClsFilters();
    });

    // Search
    const searchInput = document.getElementById("cls-search");
    searchInput.oninput = () => applyClsFilters();

    // Available Only toggle
    const availBtn = document.getElementById("cls-available-btn");
    if (clsAvailableOnly) availBtn.classList.add("active");
    availBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      clsAvailableOnly = !clsAvailableOnly;
      availBtn.classList.toggle("active", clsAvailableOnly);
      applyClsFilters();
    });

    // Filters
    document.getElementById("cls-filter-tier").onchange = () => applyClsFilters();
    document.getElementById("cls-filter-diff").onchange = () => applyClsFilters();
    document.getElementById("cls-filter-role").onchange = () => applyClsFilters();
  }

  function applyClsFilters() {
    const q = (document.getElementById("cls-search")?.value || "").toLowerCase().trim();
    const tier = document.getElementById("cls-filter-tier")?.value || "";
    const diff = document.getElementById("cls-filter-diff")?.value || "";
    const role = document.getElementById("cls-filter-role")?.value || "";

    let filtered = allClassesData;

    if (q) {
      filtered = filtered.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.role1.toLowerCase().includes(q) ||
        (c.role2 && c.role2.toLowerCase().includes(q)) ||
        c.requirements.toLowerCase().includes(q) ||
        stripHtml(c.description).toLowerCase().includes(q)
      );
    }
    if (tier) filtered = filtered.filter((c) => String(c.tier) === tier);
    if (diff) filtered = filtered.filter((c) => String(c.difficulty) === diff);
    if (role) filtered = filtered.filter((c) => c.role1 === role || c.role2 === role);

    // Available Only: hide classes with unmet requirements or mirane-banned
    if (clsAvailableOnly && !clsOverrideMode) {
      filtered = filtered.filter((c) => {
        if (clsMiraneMode && clsMiraneBanList.includes(c.classId)) return false;
        return checkClassRequirement(c).met;
      });
    }

    renderClassCards(filtered);
  }

  /* ─── Card Rendering ─────────────────────────────────────────────── */
  function renderClassCards(list) {
    const grid = document.getElementById("cls-grid");
    grid.innerHTML = "";

    if (list.length === 0) {
      grid.innerHTML = '<div class="bt-empty-state">No classes match your filters.</div>';
      return;
    }

    list.forEach((cls) => {
      const card = document.createElement("div");
      card.className = "cls-card";
      card.dataset.clsId = cls.classId;

      const sel = clsSelected.get(cls.classId);
      const isFreeClass = clsFreeClasses.has(cls.classId);
      if (sel) {
        card.classList.add("selected");
        if (sel.levels >= 8) card.classList.add("mastered");
      }
      if (isFreeClass) card.classList.add("cls-free-granted");

      const isBanned = clsMiraneMode && clsMiraneBanList.includes(cls.classId);
      if (isBanned) card.classList.add("mirane-banned");

      // Requirement check
      const reqCheck = checkClassRequirement(cls);
      if (!reqCheck.met && !clsOverrideMode) card.classList.add("req-unmet");

      // Difficulty dots
      const diffDots = Array.from({ length: 5 }, (_, i) =>
        i < cls.difficulty ? "●" : "○"
      ).join("");

      // Level badge
      let levelBadge = "";
      if (sel) {
        levelBadge = sel.levels >= 8
          ? '<span class="cls-mastered-badge">★ MASTERED</span>'
          : `<span class="cls-level-badge">Lv. ${sel.levels}</span>`;
      }

      card.innerHTML = `
        <div class="cls-card-img-wrap">
          <img class="cls-card-img" src="${cls.imageSmUrl}" alt="${cls.name}" loading="lazy">
          ${levelBadge}
          ${isFreeClass ? '<span class="cls-free-badge">FREE</span>' : ''}
        </div>
        <div class="cls-card-body">
          <div class="cls-card-header">
            <span class="cls-card-name">${cls.name}</span>
            <span class="cls-tier-badge tier-${cls.tier}">T${cls.tier}</span>
          </div>
          <div class="cls-card-meta">
            <span class="cls-diff-badge">${diffDots}</span>
            <span class="cls-role-tag role-${cls.role1.toLowerCase()}">${cls.role1}</span>
            ${cls.role2 ? `<span class="cls-role-tag role-${cls.role2.toLowerCase()}">${cls.role2}</span>` : ""}
          </div>
          ${cls.requirements && cls.requirements !== "None" && cls.requirements !== "None." ? `<div class="cls-card-req">${cls.requirements}</div>` : ""}
          <div class="cls-card-desc">${stripHtml(cls.description)}</div>
        </div>
      `;

      card.addEventListener("click", (e) => {
        e.stopPropagation();
        if (isBanned) {
          Aniela.say({ text: `${cls.name} is banned under Mirane Expedition rules.  Turn off the Mirane filter to select it.`, sprite: "4" });
          return;
        }
        openClsDetail(cls);
      });

      grid.appendChild(card);
    });
  }

  /* ─── Budget & IP ────────────────────────────────────────────────── */
  function getClsSpentExp() {
    let total = 0;
    clsSelected.forEach(({ levels, data }, classId) => {
      if (clsFreeClasses.has(classId)) return; // free classes don't cost EXP
      total += data.tier * 100; // unlock cost
      total += (levels - 1) * 100; // ability levels
    });
    return total;
  }

  function getClsUsedIP() {
    // Free classes don't consume IP
    let paidClasses = 0;
    clsSelected.forEach((_, classId) => {
      if (!clsFreeClasses.has(classId)) paidClasses++;
    });
    return paidClasses + clsInterludeActions.length;
  }

  function updateClsBudget() {
    const spent = getClsSpentExp();
    const remaining = getClsBudget() - spent;
    const pct = Math.max(0, Math.min(100, (remaining / getClsBudget()) * 100));
    const ip = getClsUsedIP();

    const fillEl = document.getElementById("cls-budget-fill");
    const valEl = document.getElementById("cls-budget-value");
    const ipEl = document.getElementById("cls-ip-value");
    if (!fillEl || !valEl) return;

    fillEl.style.width = clsOverrideMode ? "100%" : pct + "%";
    valEl.textContent = clsOverrideMode ? "∞" : `${remaining} / ${getClsBudget()}`;
    valEl.classList.toggle("over-budget", !clsOverrideMode && remaining < 0);
    if (ipEl) ipEl.textContent = `${ip} / ${CLS_IP_MAX}`;

    // Also update cart IP
    const cartIpEl = document.getElementById("cls-cart-ip-used");
    if (cartIpEl) cartIpEl.textContent = `${ip} / ${CLS_IP_MAX}`;

    // Show/hide interlude actions section
    renderInterludeActions();
  }

  /* ─── Interlude Actions UI ───────────────────────────────────────── */
  function renderInterludeActions() {
    const cart = document.getElementById("cls-cart");
    if (!cart) return;

    // Remove any existing interlude section
    const existing = cart.querySelector(".cls-interlude-section");
    if (existing) existing.remove();

    const ip = getClsUsedIP();
    const unusedIP = CLS_IP_MAX - ip;

    // Only show when not in override mode and there's spare IP
    if (clsOverrideMode || unusedIP <= 0) return;

    const section = document.createElement("div");
    section.className = "cls-interlude-section";
    section.innerHTML = `
      <div class="cls-interlude-header">
        <span>Interlude Actions</span>
        <small>${unusedIP} IP remaining</small>
      </div>
    `;

    const btnRow = document.createElement("div");
    btnRow.className = "cls-interlude-btns";

    for (const action of INTERLUDE_ACTIONS) {
      const btn = document.createElement("button");
      btn.className = "cls-interlude-btn";
      btn.innerHTML = `<strong>${action.label}</strong><br><small>${action.desc}</small>`;
      btn.addEventListener("click", () => {
        if (getClsUsedIP() >= CLS_IP_MAX) return;
        clsInterludeActions.push(action.id);
        updateClsBudget();
        updateClsCart();
      });
      btnRow.appendChild(btn);
    }

    section.appendChild(btnRow);
    cart.appendChild(section);
  }

  /* ─── Cart ───────────────────────────────────────────────────────── */
  function updateClsCart() {
    const itemsEl = document.getElementById("cls-cart-items");
    const countEl = document.getElementById("cls-cart-count");
    const totalEl = document.getElementById("cls-cart-total-cost");
    if (!itemsEl) return;

    const count = clsSelected.size;
    countEl.textContent = count;
    totalEl.textContent = `${getClsSpentExp()} EXP`;

    if (count === 0 && clsInterludeActions.length === 0) {
      itemsEl.innerHTML = '<div class="bt-cart-empty">No classes selected</div>';
      return;
    }

    itemsEl.innerHTML = "";
    clsSelected.forEach(({ levels, data }, classId) => {
      const isFree = clsFreeClasses.has(classId);
      const cost = isFree ? 0 : data.tier * 100 + (levels - 1) * 100;
      const isMastered = levels >= 8;
      const freeGrant = FREE_CLASS_GRANTS.find(g => g.classId === classId);
      const freeLabel = isFree && freeGrant ? `<small class="cls-cart-free-badge">FREE (${freeGrant.source})</small>` : '';
      const freeMinLevel = isFree && freeGrant ? freeGrant.level : 0;
      const canLevelDown = !isFree || levels > freeMinLevel;
      const item = document.createElement("div");
      item.className = `bt-cart-item cls-cart-item${isFree ? ' cls-cart-free' : ''}`;
      item.innerHTML = `
        <span class="bt-cart-item-name" title="${data.name}">
          ${data.name}
          <small class="cls-cart-level">${isMastered ? "★ Mastered" : `Lv. ${levels}`}</small>
          ${freeLabel}
        </span>
        <span class="bt-cart-item-cost">${isFree ? 'FREE' : cost}</span>
        ${canLevelDown ? '<button class="bt-cart-item-remove" title="Remove Level">−</button>' : ''}
      `;
      if (canLevelDown) {
        item.querySelector(".bt-cart-item-remove").addEventListener("click", (e) => {
          e.stopPropagation();
          levelDownClass(data);
        });
      }
      // Click to open detail
      item.querySelector(".bt-cart-item-name").addEventListener("click", (e) => {
        e.stopPropagation();
        openClsDetail(data);
      });
      itemsEl.appendChild(item);
    });

    // Show interlude actions in cart
    if (clsInterludeActions.length > 0) {
      const ilHeader = document.createElement("div");
      ilHeader.className = "bt-cart-item cls-cart-il-header";
      ilHeader.innerHTML = `<span class="bt-cart-item-name" style="font-style:italic;">Interlude Actions</span>`;
      itemsEl.appendChild(ilHeader);

      clsInterludeActions.forEach((actionId, idx) => {
        const def = INTERLUDE_ACTIONS.find((a) => a.id === actionId);
        if (!def) return;
        const ilItem = document.createElement("div");
        ilItem.className = "bt-cart-item cls-cart-item";
        ilItem.innerHTML = `
          <span class="bt-cart-item-name">
            ${def.label}
            <small class="cls-cart-level">${def.desc}</small>
          </span>
          <span class="bt-cart-item-cost">1 IP</span>
          <button class="bt-cart-item-remove" title="Remove">✕</button>
        `;
        ilItem.querySelector(".bt-cart-item-remove").addEventListener("click", (e) => {
          e.stopPropagation();
          clsInterludeActions.splice(idx, 1);
          updateClsBudget();
          updateClsCart();
        });
        itemsEl.appendChild(ilItem);
      });
    }
  }

  function syncClassesToCharacter() {
    character.classes = [];
    clsSelected.forEach(({ levels, data }, classId) => {
      const hpBonus = keyAbilityHpMap[data.classId] || 0;
      character.classes.push({
        classId: data.classId,
        name: data.name,
        tier: data.tier,
        levels,
        mastered: levels >= 8,
        keyAbilityHpBonus: hpBonus || undefined,
      });
    });
    Character.save(character);
  }

  /* ─── Selection Logic ────────────────────────────────────────────── */
  /** Close the detail modal and flash Aniela's dialogue box to draw attention */
  function dismissAndFlash() {
    closeClsDetail();
    const box = document.getElementById("builder-dialogue-box");
    if (box) {
      box.classList.remove("aniela-flash");
      void box.offsetWidth;           // force reflow to restart animation
      box.classList.add("aniela-flash");
      box.addEventListener("animationend", () => box.classList.remove("aniela-flash"), { once: true });
    }
  }

  function unlockClass(cls) {
    if (clsSelected.has(cls.classId)) return;

    const unlockCost = cls.tier * 100;
    const spent = getClsSpentExp();
    const ip = getClsUsedIP();

    if (!clsOverrideMode) {
      if (ip >= CLS_IP_MAX) {
        Aniela.say({ text: "You've used all 3 Interlude Points!  Remove an interlude action or enable Override to unlock more classes.", sprite: "4", dismissable: true });
        dismissAndFlash();
        return;
      }
      if (spent + unlockCost > getClsBudget()) {
        Aniela.say({ text: `Not enough EXP!  You need ${unlockCost} but only have ${getClsBudget() - spent} remaining.`, sprite: "4", dismissable: true });
        dismissAndFlash();
        return;
      }
    }

    // Requirement warning (soft)
    const reqCheck = checkClassRequirement(cls);
    if (!reqCheck.met && !clsOverrideMode) {
      Aniela.say({ text: `Warning — ${cls.name} requires: ${cls.requirements}.  ${reqCheck.reason}  Enable Override to bypass.`, sprite: "4", dismissable: true });
      dismissAndFlash();
      return;
    }

    clsSelected.set(cls.classId, { levels: 1, data: cls });
    updateClsBudget();
    updateClsCart();
    syncClassesToCharacter();
    renderClassCards(getFilteredClasses());
    updateClsDetailBtns();
    updateClsProgression();
    nextBtn.style.display = "inline-flex";

    Aniela.say({ text: `${cls.name} unlocked!  You gain the key ability: ${cls.keyAbilityName || "—"}.`, sprite: "3", dismissable: true });
  }

  function levelUpClass(cls) {
    const sel = clsSelected.get(cls.classId);
    if (!sel || sel.levels >= 8) return;

    const spent = getClsSpentExp();
    if (!clsOverrideMode && spent + 100 > getClsBudget()) {
      Aniela.say({ text: `Not enough EXP for the next level!  You need 100 but only have ${getClsBudget() - spent} remaining.`, sprite: "4", dismissable: true });
      return;
    }

    const reqCheck = checkClassRequirement(cls);
    if (!reqCheck.met && !clsOverrideMode) {
      Aniela.say({ text: `You do not meet the requirements for this class.`, sprite: "4", dismissable: true });
      return;
    }

    const newLevel = sel.levels + 1;

    // Level 5 = Heart (sub stat), Level 7 = Soul (main stat)
    if (newLevel === 5 || newLevel === 7) {
      const isHeart = newLevel === 5;
      const text = isHeart ? cls.heart : cls.soul;
      const statType = isHeart ? "sub" : "main";
      const statChoices = parseStatChoices(text, statType);

      if (statChoices.length > 0) {
        showStatPickModal(cls, sel, newLevel, isHeart, statChoices, text);
        return; // Don't level up yet — wait for pick
      }
    }

    // Normal level up (no stat pick needed)
    applyLevelUp(cls, sel);
  }

  /* ─── Parse stat choices from heart/soul text ───────────────────── */
  function parseStatChoices(text, statType) {
    if (!text) return [];
    const allNames = statType === "main"
      ? Object.values(Character.MAIN_STAT_NAMES)
      : Object.values(Character.SUB_STAT_NAMES);
    const allKeys = statType === "main"
      ? Character.MAIN_STAT_KEYS
      : Character.SUB_STAT_KEYS;
    const nameToKey = {};
    allKeys.forEach((k, i) => { nameToKey[allNames[i].toLowerCase()] = k; });

    const found = [];
    for (const name of allNames) {
      if (text.toLowerCase().includes(name.toLowerCase())) {
        found.push({ key: nameToKey[name.toLowerCase()], name });
      }
    }
    return found;
  }

  /* ─── Show the stat pick modal ──────────────────────────────────── */
  function showStatPickModal(cls, sel, newLevel, isHeart, choices, rawText) {
    const overlay = document.getElementById("stat-pick-overlay");
    const titleEl = document.getElementById("stat-pick-title");
    const descEl = document.getElementById("stat-pick-desc");
    const optionsEl = document.getElementById("stat-pick-options");

    // Temporarily hide the class detail overlay so the stat pick isn't trapped behind it
    const clsOverlay = document.getElementById("cls-detail-overlay");
    if (clsOverlay) clsOverlay.style.display = "none";

    const label = isHeart ? "Heart" : "Soul";
    titleEl.textContent = `${cls.name} — ${label} (Level ${newLevel})`;
    descEl.textContent = rawText;
    optionsEl.innerHTML = "";

    for (const choice of choices) {
      const btn = document.createElement("button");
      btn.className = "stat-pick-btn";
      btn.textContent = `+1 ${choice.name}`;
      btn.addEventListener("click", () => {
        // Apply stat increase
        if (isHeart) {
          character.subStats[choice.key] = (character.subStats[choice.key] || 0) + 1;
        } else {
          character.mainStats[choice.key] = (character.mainStats[choice.key] || 0) + 1;
        }

        // Track source
        if (!character.statSources) character.statSources = {};
        if (!character.statSources[choice.key]) character.statSources[choice.key] = [];
        character.statSources[choice.key].push({
          source: isHeart ? "Heart" : "Soul",
          label: cls.name,
          amount: 1,
        });

        // Close stat pick and restore class detail (clear inline override so CSS .open class controls visibility)
        overlay.classList.remove("open");
        if (clsOverlay) clsOverlay.style.removeProperty("display");

        applyLevelUp(cls, sel);
        Character.save(character);
      });
      optionsEl.appendChild(btn);
    }

    overlay.classList.add("open");
  }

  function applyLevelUp(cls, sel) {
    sel.levels++;

    updateClsBudget();
    updateClsCart();
    syncClassesToCharacter();
    renderClassCards(getFilteredClasses());
    updateClsDetailBtns();
    updateClsProgression();

    if (sel.levels >= 8) {
      Aniela.say({ text: `${cls.name} MASTERED!  ${cls.ultimateAbilityName ? `You learn the ultimate ability: ${cls.ultimateAbilityName}!` : "Incredible!"}`, sprite: "3", dismissable: true });
    } else {
      const levelDef = CLS_LEVELS[sel.levels - 1];
      const gained = cls[levelDef.key] || "—";
      Aniela.say({ text: `Level ${sel.levels}!  ${levelDef.label}: ${typeof gained === "string" && gained.length > 60 ? gained.substring(0, 57) + "..." : gained}`, sprite: "1", dismissable: true });
    }
  }

  function levelDownClass(cls) {
    const sel = clsSelected.get(cls.classId);
    if (!sel) return;

    // Prevent removal of free-granted classes below their grant level
    if (clsFreeClasses.has(cls.classId)) {
      const grant = FREE_CLASS_GRANTS.find(g => g.classId === cls.classId);
      const minLevel = grant?.level || 1;
      if (sel.levels <= minLevel) {
        Aniela.say({ text: `${cls.name} was granted free from ${grant?.source || 'your race'}. It cannot be removed below Lv. ${minLevel}.`, sprite: "4", dismissable: true });
        return;
      }
    }

    const removingLevel = sel.levels;

    // Undo stat boost if removing Heart (L5) or Soul (L7)
    if ((removingLevel === 5 || removingLevel === 7) && character.statSources) {
      const sourceLabel = cls.name;
      const sourceType = removingLevel === 5 ? "Heart" : "Soul";
      for (const key of Object.keys(character.statSources)) {
        const idx = character.statSources[key].findIndex(s => s.label === sourceLabel && s.source === sourceType);
        if (idx !== -1) {
          const r = character.statSources[key][idx];
          if (r.source === "Heart") {
            character.subStats[key] = Math.max(0, (character.subStats[key] || 0) - r.amount);
          } else if (r.source === "Soul") {
            character.mainStats[key] = Math.max(0, (character.mainStats[key] || 0) - r.amount);
          }
          character.statSources[key].splice(idx, 1);
          if (character.statSources[key].length === 0) {
            delete character.statSources[key];
          }
          break; // Only remove one stat source per level-down
        }
      }
      Character.save(character);
    }

    if (sel.levels <= 1) {
      // At level 1 → remove the class entirely
      clsSelected.delete(cls.classId);
      Aniela.say({ text: `${cls.name} removed.`, sprite: "2", dismissable: true });
    } else {
      sel.levels--;
      Aniela.say({ text: `${cls.name} reduced to Lv. ${sel.levels}.`, sprite: "2", dismissable: true });
    }

    updateClsBudget();
    updateClsCart();
    syncClassesToCharacter();
    renderClassCards(getFilteredClasses());
    if (clsDetailCls && clsDetailCls.classId === cls.classId) {
      updateClsDetailBtns();
      updateClsProgression();
    }
  }

  function getFilteredClasses() {
    const q = (document.getElementById("cls-search")?.value || "").toLowerCase().trim();
    const tier = document.getElementById("cls-filter-tier")?.value || "";
    const diff = document.getElementById("cls-filter-diff")?.value || "";
    const role = document.getElementById("cls-filter-role")?.value || "";

    let filtered = allClassesData;
    if (q) {
      filtered = filtered.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.role1.toLowerCase().includes(q) ||
        (c.role2 && c.role2.toLowerCase().includes(q)) ||
        c.requirements.toLowerCase().includes(q) ||
        stripHtml(c.description).toLowerCase().includes(q)
      );
    }
    if (tier) filtered = filtered.filter((c) => String(c.tier) === tier);
    if (diff) filtered = filtered.filter((c) => String(c.difficulty) === diff);
    if (role) filtered = filtered.filter((c) => c.role1 === role || c.role2 === role);
    return filtered;
  }

  /* ─── Requirement Checking ───────────────────────────────────────── */

  // Classes known to grant at least 1 spell when unlocked
  const SPELL_GRANTING_CLASSES = new Set([
    "mage", "sorcerer", "acolyte", "pyromancer", "hydromancer", "cryomancer",
    "electromancer", "aeromancer", "mycomancer", "sage", "archsage",
    "battle-mage", "mage-knight", "aerial-mage", "warding-mage",
    "abjurer", "sanctioner", "elementalist", "phosphomancer",
    "spellblade", "spell-blademaster", "starcaller", "daionmyoji",
    "high-priest", "onmyoji", "necromancer", "necromaster",
    "pyromaster", "aeromaster", "shadow-thief", "shadowbringer",
    "windbringer", "zephyr-warder", "venomancer",
  ]);

  function checkClassRequirement(cls) {
    const req = (cls.requirements || "").trim();
    if (!req || req === "None" || req === "None.") return { met: true, reason: "" };

    const reqLower = req.toLowerCase();
    const results = []; // collect all sub-checks; ALL must pass

    // ─── Race gate ───────────────────────────────────────────────────
    const raceChecks = [
      { pattern: /\bhuman\b/i,      raceId: "human" },
      { pattern: /\bfae\b/i,        raceId: "fae" },
      { pattern: /\bdemon\b/i,      raceId: "demon" },
      { pattern: /\bchimera\b/i,    raceId: "chimera" },
      { pattern: /\byoukai\b/i,     raceId: "youkai" },
      { pattern: /\brabbitfolk\b/i,  raceId: "rabbitfolk" },
      { pattern: /\boni\b/i,        raceId: "oni" },       // Oni is a Youkai subrace, check ancestryId
      { pattern: /\bjiangshi\b/i,   raceId: "jiangshi" },  // Jiangshi is a Youkai subrace
    ];
    for (const rc of raceChecks) {
      if (rc.pattern.test(req)) {
        const playerRace = (character.race?.primaryRaceId || "").toLowerCase();
        const playerAncestry = (character.race?.ancestryId || "").toLowerCase();
        const hybridPool = (character.race?.hybridSubracePool || "").toLowerCase(); // hybrids count as both races
        const isRace = playerRace === rc.raceId || playerAncestry === rc.raceId || hybridPool === rc.raceId;

        // Check if the race word is directly part of an "or" alternative
        // by testing proximity: race word must be within 30 chars of an "or"
        const raceMatch = rc.pattern.exec(reqLower);
        const racePos = raceMatch ? raceMatch.index : -1;
        const orPositions = [];
        const orRegex = /\bor\b/gi;
        let orMatch;
        while ((orMatch = orRegex.exec(reqLower)) !== null) orPositions.push(orMatch.index);
        const raceHasOr = orPositions.some((pos) => Math.abs(racePos - pos) < 30);

        if (raceHasOr && reqLower.includes("mastered")) {
          // "Be a rabbitfolk or have Rogue mastered" — soft OR: race or class mastered
          if (isRace) return { met: true, reason: "" };
          // Don't fail — fall through to mastered check
        } else if (raceHasOr && !reqLower.includes("mastered")) {
          // "... or be a Jiangshi" — soft OR without mastered
          if (isRace) return { met: true, reason: "" };
        } else {
          // Hard race gate: "Human." / "Fae only." / "Demon plus ..."
          if (!isRace) {
            return { met: false, reason: `Requires ${rc.raceId.charAt(0).toUpperCase() + rc.raceId.slice(1)} race.` };
          }
        }
        break;
      }
    }

    // ─── Breakthrough gate ───────────────────────────────────────────
    const breakthroughPatterns = [
      { regex: /must have the (.+?) breakthrough/i },
      { regex: /have the (.+?) breakthrough/i },
    ];
    for (const bp of breakthroughPatterns) {
      const match = req.match(bp.regex);
      if (match) {
        const needed = match[1].toLowerCase().trim();
        const has = character.breakthroughs?.some((b) => {
          const bName = (b.name || "").toLowerCase();
          const bId = (b.breakthroughId || "").toLowerCase();
          return bName.includes(needed) || bId.includes(needed.replace(/\s+/g, "-"));
        });
        if (!has) {
          return { met: false, reason: `Requires the "${match[1]}" breakthrough.` };
        }
      }
    }

    // ─── "Touched by Death" special ──────────────────────────────────
    if (reqLower.includes("touched by death")) {
      const has = character.breakthroughs?.some((b) =>
        (b.name || "").toLowerCase().includes("touched by death") ||
        (b.breakthroughId || "") === "touched-by-death"
      );
      if (!has) {
        return { met: false, reason: 'Requires the "Touched by Death" breakthrough.' };
      }
    }

    // ─── Spell gate ──────────────────────────────────────────────────
    if (reqLower.includes("at least 1 spell") || reqLower.includes("at least one spell") || reqLower.includes("possess at least 1 spell")) {
      const hasSpellClass = Array.from(clsSelected.keys()).some((id) => SPELL_GRANTING_CLASSES.has(id));
      if (!hasSpellClass) {
        results.push({ met: false, reason: "Requires at least 1 spell (unlock a caster class like Mage, Sorcerer, or Acolyte)." });
      }
    }

    // ─── Elemental mastery check (standalone, scans full text) ─────────
    // Must run BEFORE class-mastered checks so "X mastered or Element mastery"
    // OR conditions work correctly (elemental path satisfies the whole req)
    const ELEMENT_NAMES = ["fire", "water", "wind", "earth", "lightning", "ice", "frost", "dark", "holy"];
    const normalizeElement = (s) => s.replace("frost", "ice");
    const elementRegex = /(?:^|or\s+)(?:have\s+)?(\w+)(?:\s+element)?\s+(?:mastery|mastered)/gi;
    let elementMatch;
    let hasElementalReq = false;
    let elementalSatisfied = false;

    while ((elementMatch = elementRegex.exec(reqLower)) !== null) {
      const rawElement = elementMatch[1].trim();
      if (!ELEMENT_NAMES.includes(rawElement)) continue;
      hasElementalReq = true;

      const normalizedEl = normalizeElement(rawElement);
      // Check race elemental mastery
      const raceElement = (character.race?.elementalMastery || "").toLowerCase();
      if (raceElement && (raceElement === normalizedEl)) {
        elementalSatisfied = true;
        break;
      }
      // Check breakthroughs
      const hasBT = character.breakthroughs?.some((b) => {
        const bName = (b.name || "").toLowerCase();
        return bName.includes(normalizedEl) || bName.includes(rawElement);
      });
      if (hasBT) {
        elementalSatisfied = true;
        break;
      }
    }

    // "Have one element mastered" (any element, from race/BT)
    if (reqLower.includes("one element mastered") || (reqLower.includes("element mastered") && !hasElementalReq)) {
      hasElementalReq = true;
      const raceElement = (character.race?.elementalMastery || "");
      const hasElementBT = character.breakthroughs?.some((b) => {
        const bName = (b.name || "").toLowerCase();
        return ELEMENT_NAMES.some((el) => bName.includes(el));
      });
      if (raceElement || hasElementBT) {
        elementalSatisfied = true;
      }
    }

    // If elemental OR path is satisfied, skip all class-mastered checks
    // (covers "Any class mastered OR Wind mastered", "Mage mastered OR Fire mastery")
    if (!(hasElementalReq && elementalSatisfied)) {

      // ─── "Two classes mastered" ──────────────────────────────────────
      if (reqLower.includes("two classes mastered")) {
        const masteredCount = Array.from(clsSelected.values()).filter((s) => s.levels >= 8).length;
        if (masteredCount < 2) {
          results.push({ met: false, reason: "Requires two classes mastered." });
        }
      }

      // ─── "{ClassName} mastered" or "{ClassA} or {ClassB} mastered" ───
      const masteredMatch = reqLower.match(/(.+)\s+mastered/);
      const hasAnyClassReq = reqLower.includes("any class mastered") || reqLower.includes("at least 1 class mastered") || reqLower.includes("any mastered class");

      // Check specific class mastered (always runs if masteredMatch found)
      let specificClassMet = false;
      if (masteredMatch && !reqLower.includes("two classes mastered")) {
        // Split by comma, "or", or period+space; strip "mastered" from each part
        const classNames = masteredMatch[1]
          .split(/[,.]\s*|\s+or\s+/i)
          .map((n) => n.trim()
            .replace(/\s*mastered\s*/g, "")
            .replace(/^(?:be\s+a\s+|have\s+|be\s+|a\s+)/i, "")
            .trim().toLowerCase()
          )
          .filter((n) => {
            if (!n) return false;
            const skip = ["any class", "any tier 2 class", "any", "two classes",
              "human", "fae", "demon", "chimera", "youkai", "oni", "rabbitfolk", "jiangshi"];
            return !skip.includes(n);
          });

        specificClassMet = classNames.some((cn) => {
          return Array.from(clsSelected.values()).some((s) =>
            s.data.name.toLowerCase() === cn && s.levels >= 8
          );
        });
      }

      // Check "any class mastered"
      let anyClassMet = false;
      if (hasAnyClassReq) {
        anyClassMet = Array.from(clsSelected.values()).some((s) => s.levels >= 8);
        const hasEarlyAscension = character.breakthroughs?.some((b) =>
          b.breakthroughId === "early-ascension" || b.name?.toLowerCase() === "early ascension"
        );
        if (hasEarlyAscension) anyClassMet = true;
      }

      // Evaluate: if requirement has both specific + any class, either path passing is enough
      const hasMasteredGate = (masteredMatch && !reqLower.includes("two classes mastered")) || hasAnyClassReq;
      if (hasMasteredGate) {
        const masteredGatePassed = specificClassMet || (hasAnyClassReq && anyClassMet);

        // If the req has an elemental OR path, that can also satisfy the gate
        if (hasElementalReq) {
          if (!masteredGatePassed && !elementalSatisfied) {
            results.push({ met: false, reason: `Requires: ${req}` });
          }
        } else {
          if (!masteredGatePassed) {
            results.push({ met: false, reason: `Requires: ${req}` });
          }
        }
      }

      // If requirement ONLY has elemental mastery (no class mastered part)
      if (hasElementalReq && !reqLower.includes("mastered")) {
        if (!elementalSatisfied) {
          results.push({ met: false, reason: `Requires: ${req}` });
        }
      }
    } // end elemental-not-satisfied block

    // ─── "learned" requirements (soft pass — can't fully validate) ───
    // e.g. "Arcane Barrier learned"
    // We let these through since ability tracking isn't implemented yet

    // ─── Return combined result ──────────────────────────────────────
    const failed = results.filter((r) => !r.met);
    if (failed.length > 0) {
      return { met: false, reason: failed.map((f) => f.reason).join(" ") };
    }
    return { met: true, reason: "" };
  }

  /* ─── Detail Modal ───────────────────────────────────────────────── */
  function bindClsDetailModal() {
    const overlay = document.getElementById("cls-detail-overlay");
    const closeBtn = document.getElementById("cls-detail-close");
    const unlockBtn = document.getElementById("cls-detail-unlock-btn");
    const levelBtn = document.getElementById("cls-detail-level-btn");

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeClsDetail();
    });

    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeClsDetail();
    });

    // Unlock & Level buttons are handled via .onclick in updateClsDetailBtns()

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeClsDetail();
    });
  }

  function openClsDetail(cls) {
    clsDetailCls = cls;
    const overlay = document.getElementById("cls-detail-overlay");

    // Image
    const imgEl = document.getElementById("cls-detail-img");
    imgEl.src = cls.imageSmUrl || "";
    imgEl.alt = cls.name;

    // Header info
    document.getElementById("cls-detail-name").textContent = cls.name;

    const tierEl = document.getElementById("cls-detail-tier");
    tierEl.textContent = `Tier ${cls.tier}`;
    tierEl.className = `cls-tier-badge tier-${cls.tier}`;

    const diffDots = Array.from({ length: 5 }, (_, i) => i < cls.difficulty ? "●" : "○").join("");
    document.getElementById("cls-detail-diff").textContent = diffDots;

    document.getElementById("cls-detail-role1").textContent = cls.role1;
    document.getElementById("cls-detail-role1").className = `cls-role-tag role-${cls.role1.toLowerCase()}`;

    const role2El = document.getElementById("cls-detail-role2");
    if (cls.role2) {
      role2El.textContent = cls.role2;
      role2El.className = `cls-role-tag role-${cls.role2.toLowerCase()}`;
      role2El.style.display = "";
    } else {
      role2El.style.display = "none";
    }

    // Requirements
    const reqEl = document.getElementById("cls-detail-req");
    const reqText = cls.requirements && cls.requirements !== "None" && cls.requirements !== "None." ? cls.requirements : "";
    reqEl.textContent = reqText ? `⚠ ${reqText}` : "";
    reqEl.style.display = reqText ? "block" : "none";

    // Description
    document.getElementById("cls-detail-desc").innerHTML = cls.description || "";

    // Progression
    updateClsProgression();

    // Guide
    const guideEl = document.getElementById("cls-detail-guide");
    guideEl.innerHTML = cls.guide || "";
    guideEl.style.display = cls.guide ? "block" : "none";

    // Action buttons
    updateClsDetailBtns();

    overlay.classList.add("open");
  }

  function updateClsProgression() {
    if (!clsDetailCls) return;
    const cls = clsDetailCls;
    const table = document.getElementById("cls-progression-table");
    const sel = clsSelected.get(cls.classId);
    const currentLevel = sel ? sel.levels : 0;

    table.innerHTML = "";
    CLS_LEVELS.forEach((def, i) => {
      const lvl = i + 1;
      const value = cls[def.key] || "—";
      const row = document.createElement("div");
      row.className = "cls-prog-row";
      if (lvl <= currentLevel) row.classList.add("unlocked");
      if (lvl === currentLevel + 1) row.classList.add("current");
      if (lvl > currentLevel + 1) row.classList.add("locked");

      row.innerHTML = `
        <div class="cls-prog-label">
          <span class="cls-prog-level">Lv. ${lvl}</span>
          <span class="cls-prog-type">${def.label}</span>
        </div>
        <div class="cls-prog-content">${value}</div>
      `;
      table.appendChild(row);
    });
  }

  function closeClsDetail() {
    clsDetailCls = null;
    document.getElementById("cls-detail-overlay").classList.remove("open");
  }

  function updateClsDetailBtns() {
    if (!clsDetailCls) return;
    const cls = clsDetailCls;
    const unlockBtn = document.getElementById("cls-detail-unlock-btn");
    const levelBtn = document.getElementById("cls-detail-level-btn");
    const sel = clsSelected.get(cls.classId);

    // Reset all handlers to prevent stale state
    unlockBtn.onclick = null;
    levelBtn.onclick = null;

    if (!sel) {
      // Not unlocked yet
      unlockBtn.style.display = "inline-flex";
      unlockBtn.textContent = `Unlock (T${cls.tier} = ${cls.tier * 100} EXP + 1 IP)`;
      unlockBtn.disabled = false;
      unlockBtn.className = "cls-detail-unlock-btn";
      unlockBtn.onclick = (e) => { e.stopPropagation(); unlockClass(cls); };
      levelBtn.style.display = "none";
      levelBtn.disabled = true;
    } else if (sel.levels < 8) {
      // Unlocked, can level up
      const isFreeAtMin = clsFreeClasses.has(cls.classId) && sel.levels <= (FREE_CLASS_GRANTS.find(g => g.classId === cls.classId)?.level || 1);
      unlockBtn.style.display = "inline-flex";
      unlockBtn.textContent = sel.levels <= 1 ? "Remove Class" : `Remove Level (Lv. ${sel.levels} → ${sel.levels - 1})`;
      unlockBtn.className = "cls-detail-unlock-btn is-remove";
      unlockBtn.disabled = isFreeAtMin;
      unlockBtn.onclick = isFreeAtMin ? null : (e) => { e.stopPropagation(); levelDownClass(cls); };
      levelBtn.style.display = "inline-flex";
      levelBtn.textContent = `Level Up → Lv. ${sel.levels + 1} (100 EXP)`;
      levelBtn.disabled = false;
      levelBtn.className = "cls-detail-level-btn";
      levelBtn.onclick = (e) => { e.stopPropagation(); levelUpClass(cls); };
    } else {
      // Mastered!
      unlockBtn.style.display = "inline-flex";
      unlockBtn.textContent = `Remove Level (Lv. 8 → 7)`;
      unlockBtn.className = "cls-detail-unlock-btn is-remove";
      unlockBtn.disabled = false;
      unlockBtn.onclick = (e) => { e.stopPropagation(); levelDownClass(cls); };
      levelBtn.style.display = "inline-flex";
      levelBtn.textContent = "★ MASTERED ★";
      levelBtn.disabled = true;
      levelBtn.className = "cls-detail-level-btn mastered";
    }
  }


  /* ═══════════════════════════════════════════════════════════════════
     ACTIONS
     ═══════════════════════════════════════════════════════════════════ */
  function bindActions() {
    nextBtn.addEventListener("click", (e) => { e.stopPropagation(); handleNext(); });
    resetBtn.addEventListener("click", (e) => { e.stopPropagation(); handleReset(); });
    backBtn.addEventListener("click", (e) => { e.stopPropagation(); handleBack(); });
  }

  function handleNext() {

    if (currentPhase === "race") {
      character.completedStep = 1;
      Character.save(character);

      if (character.race.isHybrid) {
        // All hybrids go to subrace selection (cross-race pool)
        transitionToPhase("subrace");
      } else {
        const hasSubraces = RACES_WITH_SUBRACES.includes(character.race.primaryRaceName);
        const isHuman = character.race.primaryRaceId === "human";

        if (hasSubraces) {
          transitionToPhase("subrace");
        } else if (isHuman) {
          transitionToPhase("human-bonus");
        } else {
          // Demon — go to house selection
          transitionToPhase("demon-house");
        }
      }
    } else if (currentPhase === "subrace") {
      character.completedStep = 2;
      Character.save(character);
      transitionToPhase("main-stats");
    } else if (currentPhase === "human-bonus") {
      character.completedStep = 2;
      Character.save(character);
      transitionToPhase("main-stats");
    } else if (currentPhase === "demon-house") {
      character.completedStep = 2;
      Character.save(character);
      transitionToPhase("main-stats");
    } else if (currentPhase === "main-stats") {
      character.completedStep = 3;
      Character.save(character);
      transitionToPhase("sub-stats");
    } else if (currentPhase === "sub-stats") {
      character.completedStep = 4;
      Character.save(character);
      transitionToPhase("derived");
    } else if (currentPhase === "derived") {
      // Snapshot all effective + derived stats for the final sheet
      Character.snapshotStats(character);
      character.completedStep = 5;
      Character.save(character);
      transitionToPhase("breakthroughs");
    } else if (currentPhase === "breakthroughs") {
      character.completedStep = 6;
      Character.save(character);
      transitionToPhase("classes");
    } else if (currentPhase === "classes") {
      // Check for unspent EXP
      const clsSpent = getClsSpentExp();
      if (!clsOverrideMode && clsSpent < getClsBudget() && !character._clsConfirmed) {
        const remaining = getClsBudget() - clsSpent;
        Aniela.say({ text: `Are you sure?  You still have ${remaining} EXP remaining.  That's enough for more class levels!`, sprite: "4", dismissable: true });

        // Hide original buttons, add temporary confirm buttons
        nextBtn.style.display = "none";
        resetBtn.style.display = "none";
        backBtn.style.display = "none";
        actionsEl.style.display = "flex";

        const noBtn = document.createElement("button");
        noBtn.className = "builder-btn builder-btn-reset";
        noBtn.innerHTML = '<span class="builder-btn-icon">←</span> No, go back';

        const yesBtn = document.createElement("button");
        yesBtn.className = "builder-btn builder-btn-next";
        yesBtn.innerHTML = 'Yes, continue <span class="builder-btn-icon">→</span>';

        actionsEl.appendChild(noBtn);
        actionsEl.appendChild(yesBtn);

        noBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          noBtn.remove();
          yesBtn.remove();
          nextBtn.style.display = "inline-flex";
          backBtn.style.display = "inline-flex";
          Aniela.say({ text: "Take your time — spend that EXP wisely!", sprite: "1", dismissable: true });
        });
        yesBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          noBtn.remove();
          yesBtn.remove();
          nextBtn.style.display = "inline-flex";
          backBtn.style.display = "inline-flex";
          character._clsConfirmed = true;
          handleNext(); // re-enter to proceed
        });
        return;
      }
      character._clsConfirmed = false; // reset for next time

      // Apply interlude action bonuses
      let bonusClim = 0;
      for (const actionId of clsInterludeActions) {
        const def = INTERLUDE_ACTIONS.find((a) => a.id === actionId);
        if (def && def.clim) {
          bonusClim += def.clim;
        }
      }
      character.resources = character.resources || {};
      character.resources.clim = 3000 + bonusClim;
      character.resources.classExp = getClsBudget();
      character.interludeActions = [...clsInterludeActions];

      character.completedStep = 7;
      Character.save(character);
      transitionToPhase("skills");
    } else if (currentPhase === "skills") {
      character.completedStep = 8;
      Character.save(character);
      transitionToPhase("items");
    } else if (currentPhase === "items") {
      character.completedStep = 9;
      Character.save(character);
      transitionToPhase("review");
    }
  }

  function handleBack() {
    // Map each phase to the phase that comes before it
    const backMap = {
      "subrace":       "race",
      "demon-house":   "race",
      "human-bonus":   "race",
      "main-stats":    null, // determined by race type
      "sub-stats":     "main-stats",
      "derived":       "sub-stats",
      "breakthroughs": "derived",
      "classes":       "breakthroughs",
      "skills":        "classes",
      "items":         "skills",
      "review":        "items",
    };

    let prevPhase = backMap[currentPhase];

    // main-stats → depends on what race step was
    if (currentPhase === "main-stats") {
      if (character.race.isHybrid) {
        prevPhase = "subrace";
      } else {
        const hasSubraces = RACES_WITH_SUBRACES.includes(character.race.primaryRaceName);
        const isHuman = character.race.primaryRaceId === "human";
        if (hasSubraces) prevPhase = "subrace";
        else if (isHuman) prevPhase = "human-bonus";
        else prevPhase = "demon-house";
      }
    }

    if (!prevPhase) return; // already at start

    transitionToPhase(prevPhase);
    Aniela.say({ text: "Going back — take your time!", sprite: "1", dismissable: true });
  }

  function handleReset() {
    const group = currentPhase === "main-stats" ? "main" : "sub";
    const statKeys = group === "main" ? Character.MAIN_STAT_KEYS : Character.SUB_STAT_KEYS;
    const stats = group === "main" ? character.mainStats : character.subStats;
    const tokenState = group === "main" ? mainTokenState : subTokenState;
    const tokenEls = group === "main" ? mainTokenEls : subTokenEls;
    const slotEls = group === "main" ? mainSlotEls : subSlotEls;

    statKeys.forEach((k) => (stats[k] = 0));
    tokenState.forEach((t) => { t.used = false; t.assignedTo = null; });
    tokenEls.forEach((el) => el.classList.remove("used", "selected"));
    slotEls.forEach((el) => {
      el.classList.remove("assigned", "highlight");
      el.querySelector(".slot-value").textContent = "—";
      delete el.dataset.tokenIndex;
    });
    selectedToken = null;
    nextBtn.style.display = "none";
    Aniela.say(LINES.reset);
  }

  /* ─── Utility ─────────────────────────────────────────────────────── */
  function stripHtml(html) {
    return Utils.stripHtml(html);
  }

  /* ═══════════════════════════════════════════════════════════════════
     SKILLS
     ═══════════════════════════════════════════════════════════════════ */

  /* ─── Skill Definitions (from shared SkillParser module) ──────────── */
  const SKILL_CAP = SkillParser.SKILL_CAP;
  const EXPERTISE_CAP = SkillParser.EXPERTISE_CAP;
  const ARTISAN_SKILL_CAP = SkillParser.ARTISAN_SKILL_CAP;
  const ARTISAN_EXPERTISE_CAP = SkillParser.ARTISAN_EXPERTISE_CAP;
  const SKILL_CATEGORIES = SkillParser.SKILL_CATEGORIES;
  const ALL_SKILL_NAMES = SkillParser.ALL_SKILL_NAMES;
  const ARTISAN_SKILLS = SkillParser.ARTISAN_SKILLS;
  const GATHERING_SKILLS = SkillParser.GATHERING_SKILLS;

  /* ─── Skills State ────────────────────────────────────────────────── */
  let skillSources = [];       // array of { name, points, remaining, allowedSkills, isArtisan }
  let currentSourceIdx = 0;    // which source the player is currently spending from
  // skill allocations: skillId → { total, perSource: { sourceIdx: count }, expertise: [{ name, points }] }
  let skillAllocations = {};

  /* ─── Skill Source Parser (delegates to shared module) ──────────── */
  function parseClassSkillGrant(skillsText, className) {
    return SkillParser.parseClassSkillGrant(skillsText, className);
  }

  /* ─── Build Sources ───────────────────────────────────────────────── */
  function buildSkillSources() {
    const sources = [];

    // 1. Race skills
    const raceName = character.race?.primaryRaceName || "";
    if (raceName === "Demon") {
      sources.push({
        name: `Demon Clan Skills`,
        points: 5,
        remaining: 5,
        allowedSkills: [...ALL_SKILL_NAMES], // "a skill relating to your demon clan" — player choice
        isArtisan: false,
      });
    }

    // 2. Breakthroughs that grant skills
    if (character.breakthroughs && character.breakthroughs.length > 0) {
      for (const bt of character.breakthroughs) {
        const bName = (bt.name || "").toLowerCase();
        if (bName.includes("skill training")) {
          sources.push({
            name: "Skill Training",
            points: 1,
            remaining: 1,
            allowedSkills: [...ALL_SKILL_NAMES],
            isArtisan: false,
          });
        } else if (bName.includes("universal training")) {
          sources.push({
            name: "Universal Training",
            points: 5,
            remaining: 5,
            allowedSkills: [...ALL_SKILL_NAMES],
            isArtisan: false,
          });
        }
      }
    }

    // 3. Class skills (from classes at level >= 3)
    if (clsSelected && clsSelected.size > 0) {
      for (const [classId, entry] of clsSelected) {
        if (entry.levels >= 3 && entry.data && entry.data.skills) {
          const className = entry.data.name || classId;
          const grants = parseClassSkillGrant(entry.data.skills, className);
          sources.push(...grants);
        }
      }
    }

    // 4. Personal skills (always last)
    sources.push({
      name: "Personal Skills",
      points: 10,
      remaining: 10,
      allowedSkills: [...ALL_SKILL_NAMES],
      isArtisan: false,
    });

    return sources;
  }

  /* ─── Init Skills State ───────────────────────────────────────────── */
  function initSkillAllocations() {
    skillAllocations = {};
    const allSkills = [...ALL_SKILL_NAMES, ...ARTISAN_SKILLS];
    for (const name of allSkills) {
      skillAllocations[name] = {
        total: 0,
        perSource: {},  // sourceIdx → count
        expertise: [],  // [{ name: string, points: number, sourceIdx: number }]
      };
    }
  }

  /* ─── Load Skills Phase ───────────────────────────────────────────── */
  function loadSkills() {
    try {
      const newSources = buildSkillSources();

      // Bug 1 fix: Preserve existing allocations if sources haven't changed
      // (e.g. when navigating back from Equipment → Skills).
      const hasExistingAllocations = Object.keys(skillAllocations).length > 0 &&
        Object.values(skillAllocations).some((a) => a.total > 0);
      const sourcesMatch = hasExistingAllocations &&
        skillSources.length === newSources.length &&
        newSources.every((ns, i) =>
          skillSources[i] &&
          skillSources[i].name === ns.name &&
          skillSources[i].points === ns.points
        );

      skillSources = newSources;

      if (!sourcesMatch) {
        // Sources changed or no prior data — full reinit
        currentSourceIdx = 0;
        initSkillAllocations();
      } else {
        // Sources match — rebuild remaining counts from allocations
        for (let i = 0; i < skillSources.length; i++) {
          let spent = 0;
          for (const alloc of Object.values(skillAllocations)) {
            spent += (alloc.perSource[i] || 0);
          }
          skillSources[i].remaining = skillSources[i].points - spent;
        }
      }

      renderSkillGrid();
      renderCurrentSource();
      updateSkillSummary();
    } catch (err) {
      console.error("[loadSkills] Error:", err);
      Aniela.say({ text: "Something went wrong loading skills. Check the console for details.", sprite: "4", dismissable: true });
    }
  }

  /* ─── Render Skill Grid ───────────────────────────────────────────── */
  function renderSkillGrid() {
    const grid = document.getElementById("skill-grid");
    grid.innerHTML = "";

    // Check if current source has artisan skills
    const src = skillSources[currentSourceIdx];
    const showArtisan = src && src.isArtisan;

    // Render normal skill categories
    for (const cat of SKILL_CATEGORIES) {
      const catEl = document.createElement("div");
      catEl.className = "skill-category";

      const header = document.createElement("div");
      header.className = "skill-category-header";
      header.textContent = cat.stat;
      catEl.appendChild(header);

      const row = document.createElement("div");
      row.className = "skill-category-items";
      for (const skillName of cat.skills) {
        row.appendChild(createSkillButton(skillName, false));
      }
      catEl.appendChild(row);

      grid.appendChild(catEl);
    }

    // Add artisan category if relevant
    if (showArtisan) {
      const artCat = document.createElement("div");
      artCat.className = "skill-category";

      const artHeader = document.createElement("div");
      artHeader.className = "skill-category-header";
      artHeader.textContent = "Artisan";
      artCat.appendChild(artHeader);

      const artRow = document.createElement("div");
      artRow.className = "skill-category-items";
      for (const artSkill of src.allowedSkills.filter((s) => ARTISAN_SKILLS.includes(s))) {
        artRow.appendChild(createSkillButton(artSkill, true));
      }
      artCat.appendChild(artRow);

      grid.appendChild(artCat);
    }
  }

  function createSkillButton(skillName, isArtisan) {
    const src = skillSources[currentSourceIdx];
    const isAllowed = src && src.allowedSkills.map((s) => s.toLowerCase()).includes(skillName.toLowerCase());
    const alloc = skillAllocations[skillName] || { total: 0, expertise: [] };
    const cap = isArtisan ? ARTISAN_SKILL_CAP : SKILL_CAP;

    const btn = document.createElement("div");
    btn.className = "skill-btn";
    if (!isAllowed) btn.classList.add("disabled");
    if (alloc.total > 0) btn.classList.add("has-points");
    btn.dataset.skill = skillName;

    btn.innerHTML = `
      <div class="skill-expertise-arrow" title="Add Expertise">▲</div>
      <button class="skill-minus" ${alloc.total === 0 ? "disabled" : ""}>−</button>
      <div class="skill-center">
        <span class="skill-name">${skillName}</span>
        <span class="skill-value">${alloc.total}</span>
      </div>
      <button class="skill-plus" ${!isAllowed || alloc.total >= cap ? "disabled" : ""}>+</button>
    `;

    // ── Click to expand / collapse ──
    btn.addEventListener("click", (e) => {
      // Don't toggle if clicking a control inside
      if (e.target.closest(".skill-minus, .skill-plus, .skill-expertise-arrow")) return;
      if (btn.classList.contains("disabled")) return;

      const wasExpanded = btn.classList.contains("expanded");
      // Collapse all others
      document.querySelectorAll(".skill-btn.expanded").forEach((el) => el.classList.remove("expanded"));
      // Toggle this one
      if (!wasExpanded) {
        btn.classList.add("expanded");
      }
    });

    // Expertise arrow — only show on expanded + hover
    const arrow = btn.querySelector(".skill-expertise-arrow");

    // Arrow click → open expertise popup
    arrow.addEventListener("click", (e) => {
      e.stopPropagation();
      openExpertisePopup(skillName, isArtisan);
    });

    // Minus button
    btn.querySelector(".skill-minus").addEventListener("click", (e) => {
      e.stopPropagation();
      removeSkillPoint(skillName);
    });

    // Plus button
    btn.querySelector(".skill-plus").addEventListener("click", (e) => {
      e.stopPropagation();
      addSkillPoint(skillName);
    });

    return btn;
  }

  // ── Click-off listener to collapse expanded skill buttons ──
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".skill-btn")) {
      document.querySelectorAll(".skill-btn.expanded").forEach((el) => el.classList.remove("expanded"));
    }
  });

  /* ─── Add / Remove Skill Points ───────────────────────────────────── */
  function addSkillPoint(skillName) {
    const src = skillSources[currentSourceIdx];
    if (!src || src.remaining <= 0) return;

    const alloc = skillAllocations[skillName];
    const isArtisan = ARTISAN_SKILLS.includes(skillName);
    const cap = isArtisan ? ARTISAN_SKILL_CAP : SKILL_CAP;
    if (alloc.total >= cap) return;

    alloc.total++;
    alloc.perSource[currentSourceIdx] = (alloc.perSource[currentSourceIdx] || 0) + 1;
    src.remaining--;

    refreshSkillButton(skillName);
    renderCurrentSource();
    updateSkillSummary();
    syncSkillsToCharacter();
  }

  function removeSkillPoint(skillName) {
    const alloc = skillAllocations[skillName];
    if (!alloc || alloc.total <= 0) return;

    // Remove from current source first, or find a source that has points
    const src = skillSources[currentSourceIdx];
    if (alloc.perSource[currentSourceIdx] && alloc.perSource[currentSourceIdx] > 0) {
      alloc.perSource[currentSourceIdx]--;
      alloc.total--;
      src.remaining++;
    } else {
      // Find any source that has points for this skill
      for (let i = skillSources.length - 1; i >= 0; i--) {
        if (alloc.perSource[i] && alloc.perSource[i] > 0) {
          alloc.perSource[i]--;
          alloc.total--;
          skillSources[i].remaining++;
          break;
        }
      }
    }

    refreshSkillButton(skillName);
    renderCurrentSource();
    updateSkillSummary();
    syncSkillsToCharacter();
  }

  function refreshSkillButton(skillName) {
    const btn = document.querySelector(`.skill-btn[data-skill="${skillName}"]`);
    if (!btn) return;

    const src = skillSources[currentSourceIdx];
    const alloc = skillAllocations[skillName] || { total: 0 };
    const isArtisan = ARTISAN_SKILLS.includes(skillName);
    const cap = isArtisan ? ARTISAN_SKILL_CAP : SKILL_CAP;
    const isAllowed = src && src.allowedSkills.map((s) => s.toLowerCase()).includes(skillName.toLowerCase());

    btn.classList.toggle("has-points", alloc.total > 0);
    btn.querySelector(".skill-value").textContent = alloc.total;
    btn.querySelector(".skill-minus").disabled = alloc.total <= 0;
    btn.querySelector(".skill-plus").disabled = !isAllowed || alloc.total >= cap || src.remaining <= 0;
  }

  /* ─── Source Navigation ───────────────────────────────────────────── */
  function renderCurrentSource() {
    const src = skillSources[currentSourceIdx];
    if (!src) return;

    const nameEl = document.getElementById("skill-source-name");
    const pointsEl = document.getElementById("skill-points-remaining");

    nameEl.textContent = `${src.name} (${currentSourceIdx + 1}/${skillSources.length})`;
    pointsEl.textContent = src.remaining;
    pointsEl.classList.toggle("empty", src.remaining <= 0);

    // Update button states for new source
    document.querySelectorAll(".skill-btn").forEach((btn) => {
      const skillName = btn.dataset.skill;
      const isAllowed = src.allowedSkills.map((s) => s.toLowerCase()).includes(skillName.toLowerCase());
      const alloc = skillAllocations[skillName] || { total: 0 };
      const isArtisan = ARTISAN_SKILLS.includes(skillName);
      const cap = isArtisan ? ARTISAN_SKILL_CAP : SKILL_CAP;

      btn.classList.toggle("disabled", !isAllowed);
      btn.querySelector(".skill-plus").disabled = !isAllowed || alloc.total >= cap || src.remaining <= 0;
    });

    // Show/hide next source button in the source box
    const sourceBox = document.getElementById("skill-source-box");
    // Remove old nav buttons
    sourceBox.querySelectorAll(".skill-source-nav").forEach((el) => el.remove());

    if (skillSources.length > 1) {
      const nav = document.createElement("div");
      nav.className = "skill-source-nav";
      nav.innerHTML = `
        <button class="skill-source-prev" ${currentSourceIdx === 0 ? "disabled" : ""}>← Prev Source</button>
        <button class="skill-source-next" ${currentSourceIdx === skillSources.length - 1 ? "disabled" : ""}>Next Source →</button>
      `;
      nav.querySelector(".skill-source-prev").addEventListener("click", (e) => {
        e.stopPropagation();
        if (currentSourceIdx > 0) {
          currentSourceIdx--;
          renderSkillGrid();
          renderCurrentSource();
        }
      });
      nav.querySelector(".skill-source-next").addEventListener("click", (e) => {
        e.stopPropagation();
        if (currentSourceIdx < skillSources.length - 1) {
          currentSourceIdx++;
          renderSkillGrid();
          renderCurrentSource();
        }
      });
      sourceBox.appendChild(nav);
    }
  }

  /* ─── Expertise Popup ─────────────────────────────────────────────── */
  function openExpertisePopup(skillName, isArtisan) {
    // Remove any existing popup
    const existing = document.getElementById("expertise-popup-overlay");
    if (existing) existing.remove();

    const alloc = skillAllocations[skillName];
    const expCap = isArtisan ? ARTISAN_EXPERTISE_CAP : EXPERTISE_CAP;
    const src = skillSources[currentSourceIdx];
    const isAllowed = src && src.allowedSkills.map((s) => s.toLowerCase()).includes(skillName.toLowerCase());

    const overlay = document.createElement("div");
    overlay.id = "expertise-popup-overlay";
    overlay.className = "expertise-popup-overlay";

    const popup = document.createElement("div");
    popup.className = "expertise-popup";

    function renderPopupContent() {
      popup.innerHTML = `
        <div class="expertise-popup-header">
          <h3 class="expertise-popup-title">Expertise: ${skillName}</h3>
          <button class="expertise-popup-close">✕</button>
        </div>
        <p class="expertise-popup-desc">Each skill point spent on expertise grants <strong>2 expertise points</strong>.</p>
        <div class="expertise-entries" id="expertise-entries">
          ${alloc.expertise.length === 0 ? '<div class="expertise-empty">No expertise added yet.</div>' : ""}
          ${alloc.expertise.map((exp, i) => `
            <div class="expertise-entry" data-idx="${i}">
              <span class="expertise-entry-name">${exp.name}</span>
              <span class="expertise-entry-pts">${exp.points} pts</span>
              <button class="expertise-minus" data-idx="${i}">−</button>
              <button class="expertise-plus" data-idx="${i}" ${exp.points >= expCap ? "disabled" : ""}>+</button>
              <button class="expertise-entry-remove" data-idx="${i}" title="Remove">✕</button>
            </div>
          `).join("")}
        </div>
        <div class="expertise-add-row">
          <input type="text" class="expertise-name-input" placeholder="New expertise name..." maxlength="60">
          <button class="expertise-add-btn" ${!isAllowed || (src && src.remaining <= 0) ? "disabled" : ""}>Add (+2 pts)</button>
        </div>
        <div class="expertise-source-info">
          Source: ${src ? src.name : "—"} | Remaining: ${src ? src.remaining : 0} pts
        </div>
      `;

      // Bind close
      popup.querySelector(".expertise-popup-close").addEventListener("click", close);

      // Bind add
      const addBtn = popup.querySelector(".expertise-add-btn");
      const addInput = popup.querySelector(".expertise-name-input");
      addBtn.addEventListener("click", () => {
        const name = addInput.value.trim();
        if (!name || !src || src.remaining <= 0) return;

        alloc.expertise.push({ name: name, points: 2, sourceIdx: currentSourceIdx });
        src.remaining--; // 1 skill point spent on expertise
        renderPopupContent();
        refreshSkillButton(skillName);
        renderCurrentSource();
        updateSkillSummary();
        syncSkillsToCharacter();
      });

      addInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") addBtn.click();
      });

      // Bind existing expertise +/-/remove
      popup.querySelectorAll(".expertise-plus").forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = parseInt(btn.dataset.idx);
          const exp = alloc.expertise[idx];
          if (!exp || !src || src.remaining <= 0 || exp.points >= expCap) return;
          exp.points += 2; // 1 skill point → 2 expertise points
          src.remaining--;
          renderPopupContent();
          refreshSkillButton(skillName);
          renderCurrentSource();
          updateSkillSummary();
          syncSkillsToCharacter();
        });
      });

      popup.querySelectorAll(".expertise-minus").forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = parseInt(btn.dataset.idx);
          const exp = alloc.expertise[idx];
          if (!exp || exp.points <= 0) return;
          exp.points -= 2;
          // Refund to the source the expertise was created from, or current
          const refundIdx = exp.sourceIdx !== undefined ? exp.sourceIdx : currentSourceIdx;
          skillSources[refundIdx].remaining++;
          if (exp.points <= 0) {
            alloc.expertise.splice(idx, 1);
          }
          renderPopupContent();
          refreshSkillButton(skillName);
          renderCurrentSource();
          updateSkillSummary();
          syncSkillsToCharacter();
        });
      });

      popup.querySelectorAll(".expertise-entry-remove").forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = parseInt(btn.dataset.idx);
          const exp = alloc.expertise[idx];
          if (!exp) return;
          const refundPoints = exp.points / 2; // 2 expertise points = 1 skill point
          const refundIdx = exp.sourceIdx !== undefined ? exp.sourceIdx : currentSourceIdx;
          skillSources[refundIdx].remaining += refundPoints;
          alloc.expertise.splice(idx, 1);
          renderPopupContent();
          refreshSkillButton(skillName);
          renderCurrentSource();
          updateSkillSummary();
          syncSkillsToCharacter();
        });
      });
    }

    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add("open"));

    const close = () => {
      overlay.classList.remove("open");
      setTimeout(() => overlay.remove(), 200);
    };
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });

    renderPopupContent();
  }

  /* ─── Skill Summary Sidebar ───────────────────────────────────────── */
  function updateSkillSummary() {
    const itemsEl = document.getElementById("skill-summary-items");
    if (!itemsEl) return;

    const allocated = Object.entries(skillAllocations).filter(([, a]) => a.total > 0 || a.expertise.length > 0);

    if (allocated.length === 0) {
      itemsEl.innerHTML = '<div class="bt-cart-empty">No skills allocated</div>';
      return;
    }

    itemsEl.innerHTML = "";
    for (const [name, alloc] of allocated) {
      const item = document.createElement("div");
      item.className = "skill-summary-item";

      let expText = "";
      if (alloc.expertise.length > 0) {
        expText = alloc.expertise.map((e) => `<div class="skill-summary-row" style="padding-left:12px;font-size:0.78rem;">↳ ${e.name}: <span class="skill-summary-pts">${e.points}</span></div>`).join("");
      }

      item.innerHTML = `
        <div class="skill-summary-row">
          <span class="skill-summary-name">${name}</span>
          <span class="skill-summary-pts">${alloc.total}</span>
        </div>
        ${expText}
      `;
      itemsEl.appendChild(item);
    }
  }

  /* ─── Sync Skills to Character ─────────────────────────────────────── */
  function syncSkillsToCharacter() {
    character.skills = {};
    for (const [name, alloc] of Object.entries(skillAllocations)) {
      if (alloc.total > 0 || alloc.expertise.length > 0) {
        character.skills[name] = {
          points: alloc.total,
          expertise: alloc.expertise.map((e) => ({ name: e.name, points: e.points })),
        };
      }
    }
    Character.save(character);
  }

  /* ═══════════════════════════════════════════════════════════════════
     ITEMS / EQUIPMENT PHASE
     ═══════════════════════════════════════════════════════════════════ */

  const STARTING_CLIM = 3000;
  function getStartingClim() {
    let bonus = 0;
    if (character.interludeActions) {
      for (const actionId of character.interludeActions) {
        const def = INTERLUDE_ACTIONS.find(a => a.id === actionId);
        if (def && def.clim) bonus += def.clim;
      }
    }
    return STARTING_CLIM + bonus;
  }
  let allItems = [];
  let itemModsData = {}; // loaded from items-mods.json: { itemId: [{n,t,p,s,pt?,pc?}] }
  let itemCart = []; // { uid, item, mods: [], displayName, totalCost }
  let itemCartUid = 0;
  let currentDetailItem = null;
  let currentDetailMods = []; // [ {n,t,p,s,...} ]

  /* ─── Cost Parsing ───────────────────────────────────────────────── */
  function parseItemCost(costStr) {
    if (!costStr || costStr === "-") return 0;
    const match = costStr.match(/(\d[\d,]*)/);
    return match ? parseInt(match[1].replace(/,/g, ""), 10) : 0;
  }

  /* ─── Category Mapping ──────────────────────────────────────────── */
  function getItemFilterCategory(item) {
    const st = (item.subType || "").toLowerCase();
    const t = (item.type || "").toLowerCase();
    if (st.includes("weapon") || st === "channeling weapon" || st === "specialized weapon" || st === "artisan weapon") return "Weapon";
    if (st === "armor" || st === "accessory") return "Armor";
    if (t === "alchemy") return "Alchemy";
    if (t === "artifice") return "Artifice";
    if (t === "crafting") return "Crafting";
    if (t === "mount") return "Mount";
    if (t === "adventuring essentials") return "Adventuring";
    return "Adventuring";
  }

  function getModsForItem(item) {
    return itemModsData[item.itemId] || [];
  }

  /* ─── Load Items ─────────────────────────────────────────────────── */
  async function loadItems() {
    const grid = document.getElementById("item-grid");
    if (allItems.length && grid.children.length) return;

    try {
      Aniela.say(LINES.loading);
      const [items, mods] = await Promise.all([
        ApiClient.getItems(),
        ApiClient.getItemMods(),
      ]);
      allItems = items.filter((i) => i.subType !== "Mods");
      itemModsData = mods;
      console.log(`[items] loaded ${allItems.length} items, ${Object.keys(itemModsData).length} with mods`);
      renderItemGrid("all");
      bindItemTabs();
      bindItemCartEvents();
      updateItemBudget();
    } catch (err) {
      console.error("Failed to load items:", err);
      Aniela.say(LINES.loadError);
    }
  }

  /* ─── Render Item Grid ───────────────────────────────────────────── */
  function renderItemGrid(category) {
    const grid = document.getElementById("item-grid");
    grid.innerHTML = "";

    const filtered = category === "all"
      ? allItems
      : allItems.filter((i) => getItemFilterCategory(i) === category);

    if (filtered.length === 0) {
      grid.innerHTML = '<div class="item-grid-empty">No items in this category</div>';
      return;
    }

    for (const item of filtered) {
      const cost = parseItemCost(item.cost);
      const inCart = itemCart.some((c) => c.item.itemId === item.itemId);
      const modsAvail = getModsForItem(item);

      const card = document.createElement("div");
      card.className = "item-card";
      if (inCart) card.classList.add("in-cart");
      card.dataset.itemId = item.itemId;

      const imgSrc = item.imageSmUrl || "";
      const modBadge = modsAvail.length > 0
        ? `<span class="item-card-mod-count" title="${modsAvail.length} mods available">🔧${modsAvail.length}</span>`
        : "";
      card.innerHTML = `
        <div class="item-card-img">
          ${imgSrc ? `<img src="${imgSrc}" alt="${item.name}" loading="lazy">` : '<div class="item-card-img-placeholder">⚔</div>'}
          ${modBadge}
        </div>
        <div class="item-card-body">
          <div class="item-card-name">${item.name}</div>
          <div class="item-card-meta">
            <span class="item-card-type">${item.subType || item.type}</span>
            <span class="item-card-cost">${cost > 0 ? cost + " Clim" : "Free"}</span>
          </div>
        </div>
      `;

      card.addEventListener("click", () => openItemDetail(item));
      grid.appendChild(card);
    }
  }

  /* ─── Category Tabs ──────────────────────────────────────────────── */
  function bindItemTabs() {
    const tabs = document.querySelectorAll(".item-tab");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        renderItemGrid(tab.dataset.category);
      });
    });
  }

  /* ─── Item Detail Modal ──────────────────────────────────────────── */
  function openItemDetail(item) {
    currentDetailItem = item;
    currentDetailMods = [];

    const overlay = document.getElementById("item-detail-overlay");
    const nameEl = document.getElementById("item-detail-name");
    const imgEl = document.getElementById("item-detail-img");
    const typeEl = document.getElementById("item-detail-type");
    const costEl = document.getElementById("item-detail-cost");
    const modsSection = document.getElementById("item-detail-mods-section");
    const modsList = document.getElementById("item-detail-mods-list");
    const imgZone = document.getElementById("item-detail-img-zone");

    nameEl.textContent = item.name;
    imgEl.src = item.imageSmUrl || "";
    imgEl.alt = item.name;
    typeEl.textContent = `${item.type} — ${item.subType || "General"}`;

    const baseCost = parseItemCost(item.cost);
    costEl.textContent = baseCost > 0 ? `${baseCost} Clim` : "Free";

    imgZone.querySelectorAll(".item-mod-badge").forEach((b) => b.remove());

    const availMods = getModsForItem(item);
    if (availMods.length > 0) {
      modsSection.style.display = "block";
      modsList.innerHTML = "";

      // Group: specific first, then universal
      const specificMods = availMods.filter((m) => m.s === "s");
      const universalMods = availMods.filter((m) => m.s === "u");

      if (specificMods.length > 0) {
        const header = document.createElement("div");
        header.className = "mod-group-header";
        header.textContent = "Item Mods";
        modsList.appendChild(header);
        for (const mod of specificMods) renderModChip(mod, modsList);
      }

      if (universalMods.length > 0) {
        const header = document.createElement("div");
        header.className = "mod-group-header";
        header.textContent = "Universal Mods";
        modsList.appendChild(header);
        for (const mod of universalMods) renderModChip(mod, modsList);
      }
    } else {
      modsSection.style.display = "none";
    }

    imgZone.addEventListener("dragover", itemModDragOver);
    imgZone.addEventListener("dragleave", itemModDragLeave);
    imgZone.addEventListener("drop", itemModDrop);

    overlay.classList.add("open");
    updateDetailDisplay();
  }

  function renderModChip(mod, container) {
    const chip = document.createElement("div");
    chip.className = "mod-chip";
    chip.draggable = true;
    chip.dataset.modName = mod.n;
    chip.dataset.modTier = mod.t;

    const tierClass = mod.t === "B" ? "tier-b" : mod.t === "F" ? "tier-f" : "tier-a";
    const polarityTag = mod.pt
      ? `<span class="mod-chip-polarity" title="${mod.pc} ${mod.pt} Polarity required">⚡</span>`
      : "";

    chip.innerHTML = `
      <span class="mod-chip-tier ${tierClass}">${mod.t}</span>
      <span class="mod-chip-name">${mod.n}</span>
      <span class="mod-chip-cost">${mod.p} pts</span>
      ${polarityTag}
    `;

    chip.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", mod.n);
      chip.classList.add("dragging");
    });
    chip.addEventListener("dragend", () => {
      chip.classList.remove("dragging");
    });
    chip.addEventListener("click", () => {
      toggleDetailMod(mod);
    });

    container.appendChild(chip);
  }

  function itemModDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add("drag-over");
  }

  function itemModDragLeave(e) {
    e.currentTarget.classList.remove("drag-over");
  }

  function itemModDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");
    const modName = e.dataTransfer.getData("text/plain");
    const availMods = getModsForItem(currentDetailItem);
    const mod = availMods.find((m) => m.n === modName);
    if (mod) {
      // Don't add if already applied
      if (currentDetailMods.find((m) => m.n === modName)) return;
      // Enforce 1-per-tier: remove existing mod of the same tier first
      const existingIdx = currentDetailMods.findIndex((m) => m.t === mod.t);
      if (existingIdx >= 0) {
        currentDetailMods.splice(existingIdx, 1);
      }
      currentDetailMods.push(mod);
      updateDetailDisplay();
    }
  }

  function toggleDetailMod(mod) {
    const idx = currentDetailMods.findIndex((m) => m.n === mod.n);
    if (idx >= 0) {
      // Remove if already applied
      currentDetailMods.splice(idx, 1);
    } else {
      // Enforce 1-per-tier: remove existing mod of the same tier first
      const existingIdx = currentDetailMods.findIndex((m) => m.t === mod.t);
      if (existingIdx >= 0) {
        currentDetailMods.splice(existingIdx, 1);
      }
      currentDetailMods.push(mod);
    }
    updateDetailDisplay();
  }

  function updateDetailDisplay() {
    const nameEl = document.getElementById("item-detail-name");
    const costEl = document.getElementById("item-detail-cost");
    const imgZone = document.getElementById("item-detail-img-zone");
    const modsList = document.getElementById("item-detail-mods-list");

    // Build display name
    const modNames = currentDetailMods.map((m) => m.n);
    let displayName = currentDetailItem.name;
    if (modNames.length > 0) {
      displayName = currentDetailItem.name + " (" + modNames.join(", ") + ")";
    }
    nameEl.textContent = displayName;

    // Update cost — mods add 25 Clim per mod point (250 per 10)
    const baseCost = parseItemCost(currentDetailItem.cost);
    const modPts = currentDetailMods.reduce((sum, m) => sum + m.p, 0);
    const modClim = modPts * 25;
    const totalClim = baseCost + modClim;
    if (currentDetailMods.length > 0) {
      costEl.innerHTML = `${totalClim} Clim <span style="opacity:0.5;font-size:0.8em">(base ${baseCost} + ${modClim} mods)</span>`;
    } else {
      costEl.textContent = baseCost > 0 ? `${baseCost} Clim` : "Free";
    }

    // Update mod badges on image
    imgZone.querySelectorAll(".item-mod-badge").forEach((b) => b.remove());
    currentDetailMods.forEach((mod, i) => {
      const badge = document.createElement("div");
      badge.className = "item-mod-badge";
      badge.textContent = mod.n;
      badge.style.top = `${8 + i * 28}px`;
      badge.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleDetailMod(mod);
      });
      imgZone.appendChild(badge);
    });

    // Update mod chip states
    if (modsList) {
      const appliedTiers = new Set(currentDetailMods.map((m) => m.t));
      modsList.querySelectorAll(".mod-chip").forEach((chip) => {
        const modName = chip.dataset.modName;
        const modTier = chip.dataset.modTier;
        const isApplied = currentDetailMods.some((m) => m.n === modName);
        const tierTaken = !isApplied && appliedTiers.has(modTier);
        chip.classList.toggle("applied", isApplied);
        chip.classList.toggle("tier-taken", tierTaken);
      });
    }
  }

  /* ─── Cart Events ────────────────────────────────────────────────── */
  function bindItemCartEvents() {
    // Close modal
    document.getElementById("item-detail-close").addEventListener("click", closeItemDetail);
    document.getElementById("item-detail-overlay").addEventListener("click", (e) => {
      if (e.target.id === "item-detail-overlay") closeItemDetail();
    });

    // Add to cart
    document.getElementById("item-add-to-cart-btn").addEventListener("click", () => {
      if (!currentDetailItem) return;
      addToCart(currentDetailItem, [...currentDetailMods]);
      closeItemDetail();
    });
  }

  function closeItemDetail() {
    const overlay = document.getElementById("item-detail-overlay");
    const imgZone = document.getElementById("item-detail-img-zone");
    overlay.classList.remove("open");
    imgZone.removeEventListener("dragover", itemModDragOver);
    imgZone.removeEventListener("dragleave", itemModDragLeave);
    imgZone.removeEventListener("drop", itemModDrop);
    currentDetailItem = null;
    currentDetailMods = [];
  }

  /* ─── Cart Management ────────────────────────────────────────────── */
  function addToCart(item, mods) {
    const baseCost = parseItemCost(item.cost);
    const modPts = mods.reduce((sum, m) => sum + m.p, 0);
    const modClim = modPts * 25; // 250 Clim per 10 mod points
    const modNames = mods.map((m) => m.n);
    const displayName = modNames.length > 0
      ? item.name + " (" + modNames.join(", ") + ")"
      : item.name;

    itemCart.push({
      uid: ++itemCartUid,
      item: item,
      mods: mods,
      displayName: displayName,
      totalCost: baseCost + modClim,
    });

    renderItemCart();
    updateItemBudget();
    const activeTab = document.querySelector(".item-tab.active");
    renderItemGrid(activeTab ? activeTab.dataset.category : "all");
    syncEquipmentToCharacter();
  }

  function removeFromCart(uid) {
    itemCart = itemCart.filter((c) => c.uid !== uid);
    renderItemCart();
    updateItemBudget();
    const activeTab = document.querySelector(".item-tab.active");
    renderItemGrid(activeTab ? activeTab.dataset.category : "all");
    syncEquipmentToCharacter();
  }

  function renderItemCart() {
    const container = document.getElementById("item-cart-items");
    const totalEl = document.getElementById("item-cart-total-amount");

    if (itemCart.length === 0) {
      container.innerHTML = '<div class="item-cart-empty">No items purchased</div>';
      totalEl.textContent = "0 Clim";
      return;
    }

    container.innerHTML = "";
    let total = 0;

    for (const entry of itemCart) {
      total += entry.totalCost;
      const row = document.createElement("div");
      row.className = "item-cart-entry";

      const modsText = entry.mods.length > 0
        ? `<div class="item-cart-entry-mods">${entry.mods.map((m) => m.n).join(", ")}</div>`
        : "";

      row.innerHTML = `
        <div class="item-cart-entry-info">
          <div class="item-cart-entry-name">${entry.displayName}</div>
          ${modsText}
        </div>
        <div class="item-cart-entry-right">
          <span class="item-cart-entry-cost">${entry.totalCost} Clim</span>
          <button class="item-cart-entry-remove" title="Remove">✕</button>
        </div>
      `;

      row.querySelector(".item-cart-entry-remove").addEventListener("click", () => {
        removeFromCart(entry.uid);
      });

      container.appendChild(row);
    }

    totalEl.textContent = `${total} Clim`;
  }

  function updateItemBudget() {
    const spent = itemCart.reduce((sum, c) => sum + c.totalCost, 0);
    const remaining = getStartingClim() - spent;
    const budgetEl = document.getElementById("item-budget-amount");
    if (budgetEl) {
      budgetEl.textContent = remaining;
      budgetEl.classList.toggle("over-budget", remaining < 0);
    }
  }

  /* ─── Sync Equipment to Character ────────────────────────────────── */
  function syncEquipmentToCharacter() {
    character.equipment = itemCart.map((entry) => ({
      itemId: entry.item.itemId,
      name: entry.displayName,
      baseName: entry.item.name,
      mods: entry.mods.map((m) => m.n),
      cost: entry.totalCost,
    }));
    const spent = itemCart.reduce((sum, c) => sum + c.totalCost, 0);
    character.resources = character.resources || {};
    character.resources.clim = getStartingClim() - spent;
    Character.save(character);
  }

  /* ═══════════════════════════════════════════════════════════════════
     CHARACTER SHEET / REVIEW PHASE
     ═══════════════════════════════════════════════════════════════════ */

  // ── Portrait State ──
  let portraitImg = null;
  let portraitZoom = 1;
  let portraitPanX = 0;
  let portraitPanY = 0;
  let portraitDragging = false;
  let portraitLastX = 0;
  let portraitLastY = 0;

  let reviewBound = false;

  function loadReview() {
    // Always snapshot stats to ensure classes and equipment bonuses are captured
    Character.snapshotStats(character);
    Character.save(character);

    populateIdentity();
    populateMainStats();
    populateSubStats();
    populateDerived();
    populateSCExp();
    populateClasses();
    populateBreakthroughs();
    populateSkills();
    populateEquipment();

    // Only bind event listeners once to prevent leaks
    if (!reviewBound) {
      bindPortraitEvents();
      bindTooltipEvents();

      // Complete Character button
      document.getElementById("cs-complete-btn").addEventListener("click", completeCharacter);

      // Name input
      const nameInput = document.getElementById("cs-char-name");
      nameInput.addEventListener("input", () => {
        character.name = nameInput.value;
        Character.save(character);
      });

      // Gender selector
      const genderBtns = document.querySelectorAll(".cs-gender-btn");
      genderBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          genderBtns.forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          character.gender = btn.dataset.gender;
          Character.save(character);
        });
      });

      reviewBound = true;
    }

    // Restore name and gender state (always runs)
    const nameInput = document.getElementById("cs-char-name");
    if (character.name) nameInput.value = character.name;

    const genderBtns = document.querySelectorAll(".cs-gender-btn");
    genderBtns.forEach((btn) => {
      if (character.gender === btn.dataset.gender) btn.classList.add("active");
      else btn.classList.remove("active");
    });
  }

  /* ─── Identity ──────────────────────────────────────────────────── */
  function populateIdentity() {
    const raceEl = document.getElementById("cs-race-line");
    if (character.race.isHybrid) {
      // Format: "Half-Fae Catfolk" or "Half-Chimera Willo Wisp" or "Half Catfolk"
      const prefix = character.race.hybridDisplayPrefix || "Hybrid";
      const subrace = character.race.ancestryName || "";
      raceEl.textContent = `${prefix} ${subrace}`.trim();
    } else {
      const parts = [];
      if (character.race.primaryRaceName) parts.push(character.race.primaryRaceName);
      if (character.race.ancestryName) parts.push(character.race.ancestryName);
      if (character.race.demonHouseName) parts.push(`House ${character.race.demonHouseName}`);
      if (character.race.elementalMastery) parts.push(`${character.race.elementalMastery} Element`);
      raceEl.textContent = parts.join("  ·  ");
    }
  }

  /* ─── Main Stats ────────────────────────────────────────────────── */
  function populateMainStats() {
    const container = document.getElementById("cs-main-stats");
    container.innerHTML = "";
    const stats = character.effectiveMainStats || character.mainStats;
    for (const key of Character.MAIN_STAT_KEYS) {
      const val = stats[key] || 0;
      const hasBonus = character.raceBonuses.mainStat === key;
      const block = document.createElement("div");
      block.className = "cs-stat-block" + (hasBonus ? " has-bonus" : "");
      block.innerHTML = `
        <div class="cs-stat-value">${val}</div>
        <div class="cs-stat-label">${Character.MAIN_STAT_NAMES[key]}</div>
      `;
      block.addEventListener("mouseenter", (e) => showStatSourceHover(e, key, "main"));
      block.addEventListener("mouseleave", hideStatSourceHover);
      container.appendChild(block);
    }
  }

  /* ─── Sub Stats ─────────────────────────────────────────────────── */
  function populateSubStats() {
    const container = document.getElementById("cs-sub-stats");
    container.innerHTML = "";
    const stats = character.effectiveSubStats || character.subStats;
    for (const key of Character.SUB_STAT_KEYS) {
      const val = stats[key] || 0;
      const hasBonus = character.raceBonuses.subStat === key;
      const block = document.createElement("div");
      block.className = "cs-stat-block" + (hasBonus ? " has-bonus" : "");
      block.innerHTML = `
        <div class="cs-stat-value">${val}</div>
        <div class="cs-stat-label">${Character.SUB_STAT_NAMES[key]}</div>
      `;
      block.addEventListener("mouseenter", (e) => showStatSourceHover(e, key, "sub"));
      block.addEventListener("mouseleave", hideStatSourceHover);
      container.appendChild(block);
    }
  }

  /* ─── Stat Source Hover Tooltip ──────────────────────────────────── */
  let statSourcePopup = null;

  function showStatSourceHover(e, key, type) {
    hideStatSourceHover();
    const nameMap = type === "main" ? Character.MAIN_STAT_NAMES : Character.SUB_STAT_NAMES;
    const stats = type === "main"
      ? (character.effectiveMainStats || character.mainStats)
      : (character.effectiveSubStats || character.subStats);
    const totalVal = stats[key] || 0;

    // Gather sources
    const lines = [];
    lines.push(`${nameMap[key]} ${totalVal}`);

    // Race bonus
    if ((type === "main" && character.raceBonuses.mainStat === key) ||
        (type === "sub" && character.raceBonuses.subStat === key)) {
      const raceName = character.race.primaryRaceName || "Race";
      lines.push(`  Race: ${raceName} +1`);
    }

    // Heart/Soul sources
    const sources = character.statSources?.[key] || [];
    for (const s of sources) {
      lines.push(`  ${s.source}: ${s.label} ${s.amount > 0 ? "+" : ""}${s.amount}`);
    }

    // Base allocation (remainder)
    const bonusTotal = ((type === "main" && character.raceBonuses.mainStat === key) ||
                        (type === "sub" && character.raceBonuses.subStat === key) ? 1 : 0)
                       + sources.reduce((sum, s) => sum + s.amount, 0);
    const baseAlloc = totalVal - bonusTotal;
    if (baseAlloc > 0) {
      lines.push(`  Base: Allocated +${baseAlloc}`);
    }

    statSourcePopup = document.createElement("div");
    statSourcePopup.className = "cs-stat-source-popup";
    statSourcePopup.innerHTML = lines.map(l => `<div class="cs-stat-source-line">${l}</div>`).join("");
    document.body.appendChild(statSourcePopup);

    const rect = e.currentTarget.getBoundingClientRect();
    statSourcePopup.style.left = (rect.left + rect.width / 2) + "px";
    statSourcePopup.style.top = (rect.bottom + 6) + "px";
  }

  function hideStatSourceHover() {
    if (statSourcePopup) {
      statSourcePopup.remove();
      statSourcePopup = null;
    }
  }

  /* ─── Derived Stats ─────────────────────────────────────────────── */
  function populateDerived() {
    const bar = document.getElementById("cs-derived-bar");
    bar.innerHTML = "";
    const d = character.derivedStats || Character.getDerived(character);
    const rows = [
      [
        { icon: "❤️", label: "HP", value: d.hp },
        { icon: "💧", label: "Mana", value: d.mana },
        { icon: "⚡", label: "RP", value: d.rp },
        { icon: "✦", label: "AP", value: d.ap },
      ],
      [
        { icon: "🛡️", label: "Evasion", value: d.evasion },
        { icon: "🔰", label: "Guard", value: d.guard },
        { icon: "🛡️", label: "Save", value: d.savebonus },
        { icon: "⚔️", label: "Initiative", value: d.initiative },
      ],
      [
        { icon: "🎯", label: "Potency", value: d.potency },
        { icon: "👟", label: "Speed", value: d.speed },
      ],
    ];
    for (const row of rows) {
      const rowEl = document.createElement("div");
      rowEl.className = "cs-derived-row";
      for (const e of row) {
        const chip = document.createElement("div");
        chip.className = "cs-derived-stat";
        chip.innerHTML = `
          <span class="cs-derived-icon">${e.icon}</span>
          <span class="cs-derived-value">${e.value}</span>
          <span class="cs-derived-label">${e.label}</span>
        `;
        rowEl.appendChild(chip);
      }
      bar.appendChild(rowEl);
    }
  }

  /* ─── Soul Core + EXP ──────────────────────────────────────────── */
  function populateSCExp() {
    const bar = document.getElementById("cs-sc-exp-bar");
    if (!bar) return;
    const sc = Character.calculateSC(character);
    const totalExp = character.totalExp || Character.calculateStartingExp(character);
    const unspent = totalExp - sc;

    bar.innerHTML = `
      <div class="cs-sc-block">
        <div class="cs-sc-icon">✦</div>
        <div class="cs-sc-value">${sc}</div>
        <div class="cs-sc-label">Soul Core</div>
      </div>
      <div class="cs-exp-info">
        <span class="cs-exp-item"><span class="cs-exp-item-label">Total EXP</span> <span class="cs-exp-item-value">${totalExp}</span></span>
        <span class="cs-exp-divider">·</span>
        <span class="cs-exp-item"><span class="cs-exp-item-label">Spent</span> <span class="cs-exp-item-value">${sc}</span></span>
        <span class="cs-exp-divider">·</span>
        <span class="cs-exp-item"><span class="cs-exp-item-label">Unspent</span> <span class="cs-exp-item-value">${unspent}</span></span>
      </div>
    `;
  }

  /* ─── Classes ───────────────────────────────────────────────────── */
  function populateClasses() {
    const list = document.getElementById("cs-classes-list");
    list.innerHTML = "";
    if (!character.classes || character.classes.length === 0) {
      list.innerHTML = '<div class="cs-empty">No classes selected</div>';
      return;
    }
    for (const cls of character.classes) {
      const item = document.createElement("div");
      item.className = "cs-list-item";
      item.dataset.type = "class";
      item.dataset.id = cls.classId;
      const masteredBadge = cls.mastered ? ' <span class="cs-mastered-badge">★ Mastered</span>' : "";
      item.innerHTML = `
        <span class="cs-list-item-name">${cls.name}${masteredBadge}</span>
        <span class="cs-list-item-meta">Tier ${cls.tier} · Lv ${cls.levels}</span>
      `;
      list.appendChild(item);
    }
  }

  /* ─── Breakthroughs ─────────────────────────────────────────────── */
  function populateBreakthroughs() {
    const list = document.getElementById("cs-breakthroughs-list");
    list.innerHTML = "";
    if (!character.breakthroughs || character.breakthroughs.length === 0) {
      list.innerHTML = '<div class="cs-empty">No breakthroughs selected</div>';
      return;
    }
    for (const bt of character.breakthroughs) {
      const item = document.createElement("div");
      item.className = "cs-list-item";
      item.dataset.type = "breakthrough";
      item.dataset.id = bt.breakthroughId;
      item.innerHTML = `
        <span class="cs-list-item-name">${bt.name}</span>
        <span class="cs-list-item-meta">${bt.cost} EXP</span>
      `;
      list.appendChild(item);
    }
  }

  /* ─── Skills ────────────────────────────────────────────────────── */
  function populateSkills() {
    const grid = document.getElementById("cs-skills-grid");
    grid.innerHTML = "";
    const skills = character.skills || {};
    const entries = Object.entries(skills).filter(([, v]) => v.points > 0 || v.expertise.length > 0);
    if (entries.length === 0) {
      grid.innerHTML = '<div class="cs-empty">No skills allocated</div>';
      return;
    }
    // Sort alphabetically
    entries.sort((a, b) => a[0].localeCompare(b[0]));
    for (const [name, data] of entries) {
      const cell = document.createElement("div");
      cell.className = "cs-skill-cell";
      cell.dataset.type = "skill";
      cell.dataset.id = name;
      let expHtml = "";
      if (data.expertise && data.expertise.length > 0) {
        expHtml = '<div class="cs-skill-expertise">' +
          data.expertise.map(e => `<span class="cs-expertise-tag">${e.name} ${e.points}</span>`).join("") +
          '</div>';
      }
      cell.innerHTML = `
        <div class="cs-skill-header">
          <span class="cs-skill-name">${name}</span>
          <span class="cs-skill-value">${data.points}</span>
        </div>
        ${expHtml}
      `;
      grid.appendChild(cell);
    }
  }

  /* ─── Equipment ─────────────────────────────────────────────────── */
  function populateEquipment() {
    const list = document.getElementById("cs-equip-list");
    const climTag = document.getElementById("cs-clim-remaining");
    list.innerHTML = "";
    const equip = character.equipment || [];
    const remaining = character.resources?.clim ?? STARTING_CLIM;
    climTag.textContent = `${remaining} Clim remaining`;

    if (equip.length === 0) {
      list.innerHTML = '<div class="cs-empty">No equipment purchased</div>';
      return;
    }
    for (const eq of equip) {
      const row = document.createElement("div");
      row.className = "cs-equip-item";
      row.dataset.type = "equipment";
      row.dataset.id = eq.itemId;
      const modsText = eq.mods && eq.mods.length > 0
        ? `<span class="cs-equip-mods">${eq.mods.join(", ")}</span>`
        : "";
      row.innerHTML = `
        <div class="cs-equip-name-col">
          <span class="cs-equip-name">${eq.name}</span>
          ${modsText}
        </div>
        <span class="cs-equip-cost">${eq.cost} Clim</span>
      `;
      list.appendChild(row);
    }
  }

  /* ─── Portrait Upload & Zoom/Pan ────────────────────────────────── */
  function bindPortraitEvents() {
    const canvas = document.getElementById("cs-portrait-canvas");
    const ctx = canvas.getContext("2d");
    const area = document.getElementById("cs-portrait-area");
    const placeholder = document.getElementById("cs-portrait-placeholder");
    const controls = document.getElementById("cs-portrait-controls");
    const fileInput = document.getElementById("cs-portrait-input");

    // Click placeholder or canvas (when empty) to upload
    placeholder.addEventListener("click", () => fileInput.click());
    canvas.addEventListener("click", () => { if (!portraitImg) fileInput.click(); });
    document.getElementById("cs-portrait-change").addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          portraitImg = img;
          portraitZoom = 1;
          portraitPanX = 0;
          portraitPanY = 0;
          // Auto-fit: scale to cover the canvas
          const scaleX = canvas.width / img.width;
          const scaleY = canvas.height / img.height;
          portraitZoom = Math.max(scaleX, scaleY);
          portraitPanX = (canvas.width - img.width * portraitZoom) / 2;
          portraitPanY = (canvas.height - img.height * portraitZoom) / 2;
          drawPortrait();
          placeholder.style.display = "none";
          controls.style.display = "flex";
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });

    // Zoom buttons
    document.getElementById("cs-zoom-in").addEventListener("click", () => {
      if (!portraitImg) return;
      portraitZoom *= 1.15;
      // Re-center after zoom
      portraitPanX = (canvas.width - portraitImg.width * portraitZoom) / 2;
      portraitPanY = (canvas.height - portraitImg.height * portraitZoom) / 2;
      drawPortrait();
    });
    document.getElementById("cs-zoom-out").addEventListener("click", () => {
      if (!portraitImg) return;
      portraitZoom *= 0.87;
      portraitPanX = (canvas.width - portraitImg.width * portraitZoom) / 2;
      portraitPanY = (canvas.height - portraitImg.height * portraitZoom) / 2;
      drawPortrait();
    });
    document.getElementById("cs-portrait-reset").addEventListener("click", () => {
      if (!portraitImg) return;
      const scaleX = canvas.width / portraitImg.width;
      const scaleY = canvas.height / portraitImg.height;
      portraitZoom = Math.max(scaleX, scaleY);
      portraitPanX = (canvas.width - portraitImg.width * portraitZoom) / 2;
      portraitPanY = (canvas.height - portraitImg.height * portraitZoom) / 2;
      drawPortrait();
    });

    // Mouse wheel zoom
    canvas.addEventListener("wheel", (e) => {
      if (!portraitImg) return;
      e.preventDefault();
      const oldZoom = portraitZoom;
      portraitZoom *= e.deltaY < 0 ? 1.1 : 0.91;
      // Zoom toward cursor
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      portraitPanX = mx - (mx - portraitPanX) * (portraitZoom / oldZoom);
      portraitPanY = my - (my - portraitPanY) * (portraitZoom / oldZoom);
      drawPortrait();
    });

    // Drag to pan
    canvas.addEventListener("mousedown", (e) => {
      if (!portraitImg) return;
      portraitDragging = true;
      portraitLastX = e.clientX;
      portraitLastY = e.clientY;
      canvas.style.cursor = "grabbing";
    });
    window.addEventListener("mousemove", (e) => {
      if (!portraitDragging) return;
      portraitPanX += e.clientX - portraitLastX;
      portraitPanY += e.clientY - portraitLastY;
      portraitLastX = e.clientX;
      portraitLastY = e.clientY;
      drawPortrait();
    });
    window.addEventListener("mouseup", () => {
      portraitDragging = false;
      canvas.style.cursor = "grab";
    });

    // Touch support
    canvas.addEventListener("touchstart", (e) => {
      if (!portraitImg || e.touches.length !== 1) return;
      portraitDragging = true;
      portraitLastX = e.touches[0].clientX;
      portraitLastY = e.touches[0].clientY;
    }, { passive: true });
    canvas.addEventListener("touchmove", (e) => {
      if (!portraitDragging || e.touches.length !== 1) return;
      e.preventDefault();
      portraitPanX += e.touches[0].clientX - portraitLastX;
      portraitPanY += e.touches[0].clientY - portraitLastY;
      portraitLastX = e.touches[0].clientX;
      portraitLastY = e.touches[0].clientY;
      drawPortrait();
    }, { passive: false });
    canvas.addEventListener("touchend", () => { portraitDragging = false; });

    // Commit / Lock portrait
    let portraitLocked = false;
    document.getElementById("cs-portrait-commit").addEventListener("click", () => {
      portraitLocked = true;
      controls.style.display = "none";
      document.getElementById("cs-portrait-locked").style.display = "flex";
      canvas.style.cursor = "default";
      // Save portrait data URL
      character.portraitData = canvas.toDataURL("image/png");
      Character.save(character);
    });
    document.getElementById("cs-portrait-edit").addEventListener("click", () => {
      portraitLocked = false;
      controls.style.display = "flex";
      document.getElementById("cs-portrait-locked").style.display = "none";
      canvas.style.cursor = "grab";
    });

    // Override drag/zoom when locked
    const origMousedown = canvas.onmousedown;
    canvas.addEventListener("mousedown", (e) => {
      if (portraitLocked) { e.stopImmediatePropagation(); return; }
    }, true);
    canvas.addEventListener("wheel", (e) => {
      if (portraitLocked) { e.stopImmediatePropagation(); return; }
    }, true);

    // Restore saved portrait
    if (character.portraitData) {
      const img = new Image();
      img.onload = () => {
        portraitImg = img;
        const scaleX = canvas.width / img.width;
        const scaleY = canvas.height / img.height;
        portraitZoom = Math.max(scaleX, scaleY);
        portraitPanX = (canvas.width - img.width * portraitZoom) / 2;
        portraitPanY = (canvas.height - img.height * portraitZoom) / 2;
        drawPortrait();
        placeholder.style.display = "none";
        // Show as locked by default
        portraitLocked = true;
        controls.style.display = "none";
        document.getElementById("cs-portrait-locked").style.display = "flex";
        canvas.style.cursor = "default";
      };
      img.src = character.portraitData;
    }
  }

  function drawPortrait() {
    const canvas = document.getElementById("cs-portrait-canvas");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!portraitImg) return;
    ctx.drawImage(
      portraitImg,
      portraitPanX, portraitPanY,
      portraitImg.width * portraitZoom,
      portraitImg.height * portraitZoom
    );
  }

  /* ─── Tooltip Overlay ───────────────────────────────────────────── */
  function bindTooltipEvents() {
    const overlay = document.getElementById("cs-tooltip-overlay");
    const titleEl = document.getElementById("cs-tooltip-title");
    const bodyEl = document.getElementById("cs-tooltip-body");
    const closeBtn = document.getElementById("cs-tooltip-close");

    closeBtn.addEventListener("click", () => overlay.classList.remove("open"));
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.classList.remove("open");
    });

    // Delegate clicks on list items
    document.getElementById("ui-review").addEventListener("click", (e) => {
      const item = e.target.closest(".cs-list-item, .cs-equip-item, .cs-skill-cell");
      if (!item) return;

      const type = item.dataset.type;
      const id = item.dataset.id;

      if (type === "class") {
        showClassDetail(id, titleEl, bodyEl, overlay);
      } else if (type === "breakthrough") {
        const bt = character.breakthroughs.find(b => b.breakthroughId === id);
        if (bt) {
          titleEl.textContent = bt.name;
          bodyEl.innerHTML = `
            <div class="cs-tip-row"><strong>Cost:</strong> ${bt.cost} EXP</div>
            ${bt.requirements ? `<div class="cs-tip-row"><strong>Requirements:</strong> ${bt.requirements}</div>` : ""}
            ${bt.description ? `<div class="cs-tip-row cs-tip-desc">${bt.description}</div>` : ""}
          `;
          overlay.classList.add("open");
        }
      } else if (type === "skill") {
        const skillData = character.skills[id];
        if (skillData) {
          titleEl.textContent = id;
          let body = `<div class="cs-tip-row"><strong>Points:</strong> ${skillData.points}</div>`;
          if (skillData.expertise && skillData.expertise.length > 0) {
            body += '<div class="cs-tip-row"><strong>Expertise:</strong></div>';
            for (const exp of skillData.expertise) {
              body += `<div class="cs-tip-row cs-tip-indent">• ${exp.name}: ${exp.points} pts</div>`;
            }
          }
          bodyEl.innerHTML = body;
          overlay.classList.add("open");
        }
      } else if (type === "equipment") {
        showEquipDetail(id, titleEl, bodyEl, overlay);
      }
    });
  }

  /* ─── Rich Class Detail (API-driven) ────────────────────────────── */
  async function showClassDetail(classId, titleEl, bodyEl, overlay) {
    const charCls = character.classes.find(c => c.classId === classId);
    if (!charCls) return;

    titleEl.textContent = charCls.name;
    bodyEl.innerHTML = '<div class="cs-tip-loading">Loading class data…</div>';
    overlay.classList.add("open");

    try {
      const allClasses = await ApiClient.getClassesFull();
      const cls = allClasses.find(c => c.classId === classId);
      if (!cls) {
        bodyEl.innerHTML = `
          <div class="cs-tip-row"><strong>Tier:</strong> ${charCls.tier}</div>
          <div class="cs-tip-row"><strong>Levels:</strong> ${charCls.levels}</div>
          <div class="cs-tip-row"><strong>Mastered:</strong> ${charCls.mastered ? "Yes ★" : "No"}</div>
        `;
        return;
      }

      const diffDots = Array.from({ length: 5 }, (_, i) => i < cls.difficulty ? "●" : "○").join("");
      let html = "";

      // Image
      if (cls.imageSmUrl) {
        html += `<img class="cs-tip-class-img" src="${cls.imageSmUrl}" alt="${cls.name}">`;
      }

      // Meta row
      html += `<div class="cs-tip-meta-row">`;
      html += `<span class="cls-tier-badge tier-${cls.tier}">Tier ${cls.tier}</span>`;
      html += `<span class="cls-role-tag role-${(cls.role1 || "").toLowerCase()}">${cls.role1 || ""}</span>`;
      if (cls.role2) html += `<span class="cls-role-tag role-${cls.role2.toLowerCase()}">${cls.role2}</span>`;
      html += `<span class="cs-tip-diff">${diffDots}</span>`;
      html += `</div>`;

      // Your level
      html += `<div class="cs-tip-row"><strong>Your Level:</strong> ${charCls.levels} / 8${charCls.mastered ? " ★ Mastered" : ""}</div>`;

      // Requirements
      const reqText = cls.requirements && cls.requirements !== "None" && cls.requirements !== "None." ? cls.requirements : "";
      if (reqText) html += `<div class="cs-tip-row cs-tip-req">⚠ ${reqText}</div>`;

      // Description
      if (cls.description) {
        html += `<div class="cs-tip-row cs-tip-desc">${cls.description}</div>`;
      }

      // Progression table
      html += `<div class="cs-tip-prog-title">Progression</div>`;
      html += `<div class="cs-tip-prog">`;
      const levels = [
        { key: "keyAbilityName", label: "Key Ability" },
        { key: "ability1Name", label: "Ability 1" },
        { key: "skills", label: "Skills" },
        { key: "ability2Name", label: "Ability 2" },
        { key: "heart", label: "Heart" },
        { key: "ability3Name", label: "Ability 3" },
        { key: "soul", label: "Soul" },
        { key: "ultimateAbilityName", label: "Ultimate" },
      ];
      levels.forEach((def, i) => {
        const lvl = i + 1;
        const value = cls[def.key] || "—";
        const unlocked = lvl <= charCls.levels;
        html += `
          <div class="cs-tip-prog-row ${unlocked ? "unlocked" : "locked"}">
            <span class="cs-tip-prog-lv">Lv.${lvl}</span>
            <span class="cs-tip-prog-label">${def.label}</span>
            <span class="cs-tip-prog-value">${value}</span>
          </div>
        `;
      });
      html += `</div>`;

      bodyEl.innerHTML = html;
    } catch (err) {
      console.warn("Failed to load class detail:", err);
      bodyEl.innerHTML = `
        <div class="cs-tip-row"><strong>Tier:</strong> ${charCls.tier}</div>
        <div class="cs-tip-row"><strong>Levels:</strong> ${charCls.levels}</div>
      `;
    }
  }

  /* ─── Rich Equipment Detail (API-driven) ────────────────────────── */
  async function showEquipDetail(itemId, titleEl, bodyEl, overlay) {
    const eq = character.equipment.find(e => e.itemId === itemId);
    if (!eq) return;

    titleEl.textContent = eq.name;
    bodyEl.innerHTML = '<div class="cs-tip-loading">Loading item data…</div>';
    overlay.classList.add("open");

    try {
      const itemData = await ApiClient.getItemDetail(itemId);
      let html = "";

      // Image
      if (itemData.imageSmUrl) {
        html += `<img class="cs-tip-item-img" src="${itemData.imageSmUrl}" alt="${itemData.name}">`;
      }

      // Meta
      if (itemData.category) html += `<div class="cs-tip-row"><strong>Category:</strong> ${itemData.category}</div>`;
      if (itemData.slot) html += `<div class="cs-tip-row"><strong>Slot:</strong> ${itemData.slot}</div>`;
      html += `<div class="cs-tip-row"><strong>Base Cost:</strong> ${itemData.cost || "Free"}</div>`;
      html += `<div class="cs-tip-row"><strong>Your Cost:</strong> ${eq.cost} Clim</div>`;

      // Mods applied
      if (eq.mods && eq.mods.length > 0) {
        html += `<div class="cs-tip-row"><strong>Mods Applied:</strong> ${eq.mods.join(", ")}</div>`;
      }

      // Description
      if (itemData.description) {
        html += `<div class="cs-tip-row cs-tip-desc">${itemData.description}</div>`;
      }

      // Stats/properties from the item
      if (itemData.damage) html += `<div class="cs-tip-row"><strong>Damage:</strong> ${itemData.damage}</div>`;
      if (itemData.range) html += `<div class="cs-tip-row"><strong>Range:</strong> ${itemData.range}</div>`;
      if (itemData.guard) html += `<div class="cs-tip-row"><strong>Guard:</strong> +${itemData.guard}</div>`;
      if (itemData.penalty) html += `<div class="cs-tip-row"><strong>Penalty:</strong> ${itemData.penalty}</div>`;

      bodyEl.innerHTML = html;
    } catch (err) {
      console.warn("Failed to load item detail:", err);
      bodyEl.innerHTML = `
        <div class="cs-tip-row"><strong>Base:</strong> ${eq.baseName}</div>
        <div class="cs-tip-row"><strong>Cost:</strong> ${eq.cost} Clim</div>
        ${eq.mods && eq.mods.length > 0 ? `<div class="cs-tip-row"><strong>Mods:</strong> ${eq.mods.join(", ")}</div>` : ""}
      `;
    }
  }

  /* ─── Complete Character (Save to Vault) ─────────────────────────── */
  function completeCharacter() {
    // Save portrait as data URL if not already saved
    if (!character.portraitData && portraitImg) {
      const canvas = document.getElementById("cs-portrait-canvas");
      character.portraitData = canvas.toDataURL("image/png");
    }
    character.completedStep = 10;
    character.completedAt = new Date().toISOString();

    // Calculate and store SC + total EXP
    character.soulCore = Character.calculateSC(character);
    if (!character.totalExp) {
      character.totalExp = Character.calculateStartingExp(character);
    }

    // Recalculate snapshot to ensure final stats are locked in
    Character.snapshotStats(character);
    Character.save(character);

    // Save to vault
    const VAULT_KEY = "angelssword_vault";
    let vault = [];
    try {
      const raw = localStorage.getItem(VAULT_KEY);
      if (raw) vault = JSON.parse(raw);
    } catch (e) { /* ignore */ }

    // Check if character already exists in vault (by timestamp or generate new id)
    if (!character.vaultId) {
      character.vaultId = "char_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
    }
    // Remove old version if re-completing
    vault = vault.filter(c => c.vaultId !== character.vaultId);
    vault.push(JSON.parse(JSON.stringify(character)));
    localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
    Character.save(character);

    Aniela.say({ text: "Your character is complete!  They've been saved to My Characters.  May your journey be legendary!", sprite: "3", dismissable: true });

    // Show completion message
    const sheet = document.querySelector(".cs-sheet");
    // Remove existing complete banner if any
    const existingBanner = sheet.querySelector(".cs-complete-banner");
    if (existingBanner) existingBanner.remove();

    const banner = document.createElement("div");
    banner.className = "cs-complete-banner";
    banner.innerHTML = `
      <span class="cs-complete-icon">✦</span>
      <span class="cs-complete-text">Character Saved to Vault!</span>
    `;
    sheet.prepend(banner);
  }


  document.addEventListener("click", (e) => {
    if (selectedToken && !e.target.closest(".stat-token") && !e.target.closest(".stat-slot")) {
      selectedToken.el.classList.remove("selected");
      selectedToken = null;
      clearSlotHighlights();
    }
  });
})();
