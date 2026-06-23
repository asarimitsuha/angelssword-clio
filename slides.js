// Slides database for Queri's Combat School (PC-98 Edition)
window.SLIDES = [
  // SECTION 1: INTRODUCTION
  {
    section: "Introduction",
    speaker: "Queri Lilibit",
    expression: "cheerful",
    background: "retro_classroom_bg.png",
    text: "Watch the introduction screen to get a preview of Lyrian Chronicles!",
    type: "video",
    videoSrc: "anime/Queri-Intro.mp4"
  },
  {
    section: "Introduction",
    speaker: "Queri Lilibit",
    expression: "normal",
    background: "retro_classroom_bg.png",
    text: "Greetings, cadet! I am **Queri Lilibit**, your Pixie Faerie combat tutor. Welcome to **Queri's Combat School**!",
    type: "dialogue"
  },
  {
    section: "Introduction",
    speaker: "Queri Lilibit",
    expression: "cheerful",
    background: "retro_classroom_bg.png",
    text: "This tutorial will teach you the basics of combat in **Lyrian Chronicles, Angel's Sword RPG**. Let's get you ready for action!",
    type: "dialogue"
  },

  // SECTION 2: ACTION POINTS (AP)
  {
    section: "Action Points",
    speaker: "Queri Lilibit",
    expression: "focused",
    background: "retro_classroom_bg.png",
    text: "Rule #1 of combat: **AP is your lifeblood**. By default, you receive **4 Action Points (AP)** at the start of your turn to spend on moves and strikes.",
    type: "dialogue"
  },
  {
    section: "Action Points",
    speaker: "Queri Lilibit",
    expression: "thoughtful",
    background: "retro_classroom_bg.png",
    text: "Every attack type has a different AP cost. Managing this budget is what separates a legendary fencer from dragon chow!",
    type: "dialogue"
  },

  // SECTION 3: ATTACK TYPES
  {
    section: "Attack Types",
    speaker: "Queri Lilibit",
    expression: "normal",
    background: "retro_classroom_bg.png",
    text: "There are **three types of basic attacks** available to every adventurer: **Light**, **Heavy**, and **Precise**.",
    type: "dialogue"
  },
  {
    section: "Attack Types",
    speaker: "Queri Lilibit",
    expression: "normal",
    background: "retro_classroom_bg.png",
    text: "Each attack interacts differently with stats and defenses. Let's look at them one by one!",
    type: "dialogue"
  },
  {
    section: "Attack Types",
    speaker: "Queri Lilibit",
    expression: "cheerful",
    background: "retro_classroom_bg.png",
    text: "First, the **Light Attack**. It costs only **1 AP**! It is exceptionally good against highly evasive or hybrid targets.",
    type: "dialogue",
    subtab: "Light Attack"
  },
  {
    section: "Attack Types",
    speaker: "Queri Lilibit",
    expression: "cheerful",
    background: "retro_classroom_bg.png",
    text: "Watch the video monitor to see a **Light Attack** demo! Press **PLAY** on the controls below.",
    type: "video",
    videoSrc: "anime/Queri-LightAttack.mp4"
  },
  {
    section: "Attack Types",
    speaker: "Queri Lilibit",
    expression: "focused",
    background: "retro_classroom_bg.png",
    text: "Because Light Attacks are cheap, they allow you to put constant pressure on low-HP targets.",
    type: "dialogue"
  },
  {
    section: "Attack Types",
    speaker: "Queri Lilibit",
    expression: "focused",
    background: "retro_classroom_bg.png",
    text: "You can chip away at their HP pool, forcing them to waste valuable defensive resources!",
    type: "dialogue"
  },
  {
    section: "Attack Types",
    speaker: "Queri Lilibit",
    expression: "focused",
    background: "retro_classroom_bg.png",
    text: "Next is the **Heavy Attack**. It costs **2 AP** and is your primary damage source.",
    type: "dialogue",
    subtab: "Heavy Attack"
  },
  {
    section: "Attack Types",
    speaker: "Queri Lilibit",
    expression: "focused",
    background: "retro_classroom_bg.png",
    text: "If a Heavy Attack connects, it deals the highest raw damage, making it highly efficient.",
    type: "dialogue"
  },
  {
    section: "Attack Types",
    speaker: "Queri Lilibit",
    expression: "thoughtful",
    background: "retro_classroom_bg.png",
    text: "Heavy attacks are designed to shatter armored targets with high **Guard**. However, their accuracy is standard, so they can miss evasive foes!",
    type: "dialogue"
  },
  {
    section: "Attack Types",
    speaker: "Queri Lilibit",
    expression: "thoughtful",
    background: "retro_classroom_bg.png",
    text: "Additionally, you can only make **two heavy attacks** in a single round... making each miss much more devastating!",
    type: "dialogue"
  },
  {
    section: "Attack Types",
    speaker: "Queri Lilibit",
    expression: "cheerful",
    background: "retro_classroom_bg.png",
    text: "Watch the video monitor to see a **Heavy Attack** demo! Press **PLAY** on the controls below.",
    type: "video",
    videoSrc: "anime/Queri-HeavyAttack.mp4"
  },
  {
    section: "Attack Types",
    speaker: "Queri Lilibit",
    expression: "normal",
    background: "retro_classroom_bg.png",
    text: "Finally, the **Precise Attack**. It costs **2 AP**. A tactical blend of both, utilizing pinpoint coordination to deal reliable damage.",
    type: "dialogue",
    subtab: "Precise Attack"
  },
  {
    section: "Attack Types",
    speaker: "Queri Lilibit",
    expression: "focused",
    background: "retro_classroom_bg.png",
    text: "By focusing your aim, Precise attacks hit super evasive targets. It features the **Pinpoint** mechanic to pierce defenses.",
    type: "dialogue"
  },
  {
    section: "Attack Types",
    speaker: "Queri Lilibit",
    expression: "thoughtful",
    background: "retro_classroom_bg.png",
    text: "You ignore target **Guard** equal to your **Focus** (down to 0). Use it to deal guaranteed chip damage when you absolutely must land a hit!",
    type: "dialogue"
  },
  {
    section: "Attack Types",
    speaker: "Queri Lilibit",
    expression: "cheerful",
    background: "retro_classroom_bg.png",
    text: "Watch the video monitor to see a **Precise Attack** demo! Press **PLAY** on the controls below.",
    type: "video",
    videoSrc: "anime/Queri-PreciseAttack.mp4"
  },

  // SECTION 4: COMBAT PRACTICE (INTERACTIVE)
  {
    section: "Combat Practice",
    speaker: "Queri Lilibit",
    expression: "focused",
    background: "retro_classroom_bg.png",
    text: "Let's review the mathematical details. Click the **Attack Cards** on the screen below to study their formulas and stat interactions!",
    type: "interactive",
    hotspots: [
      {
        id: "attack-light",
        label: "Light Attack",
        x: "15%",
        y: "20%",
        width: "22%",
        height: "60%",
        title: "LIGHT ATTACK (1 AP)",
        desc: "• AP Cost: 1\n• Hit Check: d20 + Focus vs Evasion (7 + Agility)\n• Damage Formula: 2d4 + Power\n• Best Against: High Evasion / Hybrid targets\n• Usage: Low cost lets you strike up to 4 times per turn, maximizing your chance to hit and chip down HP."
      },
      {
        id: "attack-heavy",
        label: "Heavy Attack",
        x: "41%",
        y: "20%",
        width: "22%",
        height: "60%",
        title: "HEAVY ATTACK (2 AP)",
        desc: "• AP Cost: 2\n• Hit Check: d20 + Focus vs Evasion\n• Damage Formula: 4d6 + (Power x 2) [Adds +1d6 if using a two-handed weapon]\n• Best Against: High Guard / Heavily armored targets\n• Usage: Maximum raw damage output. The multiplier on Power makes it perfect for crushing an enemy's Guard shield."
      },
      {
        id: "attack-precise",
        label: "Precise Attack",
        x: "67%",
        y: "20%",
        width: "22%",
        height: "60%",
        title: "PRECISE ATTACK (2 AP)",
        desc: "• AP Cost: 2\n• Hit Check: d20 + (Focus x 2) vs Evasion (Accuracy bonus from Focus is doubled!)\n• Damage Formula: 2d4 + Power\n• Special: Pinpoint Mechanic (ignores guard equal to Focus, down to 0)\n• Best Against: High Evasion & High Guard\n• Usage: Pierce target's Guard equal to Focus to deal guaranteed chip damage when you absolutely must land a hit."
      }
    ]
  },

  // SECTION 5: DEFENDING
  {
    section: "Defending",
    speaker: "Queri Lilibit",
    expression: "normal",
    background: "retro_classroom_bg.png",
    text: "Now that you understand how to strike, let's talk about **Defending**. Survival is just as important as striking!",
    type: "dialogue",
    subtab: "Defense Basics"
  },
  {
    section: "Defending",
    speaker: "Queri Lilibit",
    expression: "normal",
    background: "retro_classroom_bg.png",
    text: "There are three different resources for defending: **HP** (Health Points), **RP** (Reaction Points), and sometimes **MP** (Mana Points).",
    type: "dialogue"
  },
  {
    section: "Defending",
    speaker: "Queri Lilibit",
    expression: "thoughtful",
    background: "retro_classroom_bg.png",
    text: "For most characters, **HP** and **RP** will be your main defensive resources. Let's look at **HP** first.",
    type: "dialogue"
  },
  {
    section: "Defending",
    speaker: "Queri Lilibit",
    expression: "normal",
    background: "retro_classroom_bg.png",
    text: "In Lyrian Chronicles, **HP** reflects your ability to prevent serious damage. Thematically, HP damage is just scratches and bruises!",
    type: "dialogue",
    subtab: "Health (HP)"
  },
  {
    section: "Defending",
    speaker: "Queri Lilibit",
    expression: "focused",
    background: "retro_classroom_bg.png",
    text: "Your max HP is calculated as: **20 + (Toughness x 10)**. It's best to think of HP as a defensive resource rather than your body's integrity.",
    type: "dialogue"
  },
  {
    section: "Defending",
    speaker: "Queri Lilibit",
    expression: "thoughtful",
    background: "retro_classroom_bg.png",
    text: "When defending, you have the benefit of knowing the incoming attack's exact accuracy and damage before you choose how to respond.",
    type: "dialogue"
  },
  {
    section: "Defending",
    speaker: "Queri Lilibit",
    expression: "normal",
    background: "retro_classroom_bg.png",
    text: "In many cases, the best option is to just **take it on the chin** and let it hit your HP pool, saving your other resources.",
    type: "dialogue"
  },
  {
    section: "Defending",
    speaker: "Queri Lilibit",
    expression: "cheerful",
    background: "retro_classroom_bg.png",
    text: "Attacks that don't do much damage and don't apply dangerous status effects can usually be safely absorbed by your HP.",
    type: "dialogue"
  },
  {
    section: "Defending",
    speaker: "Queri Lilibit",
    expression: "cheerful",
    background: "retro_classroom_bg.png",
    text: "Watch the video monitor to see a demo of taking an attack directly to your HP! Press **PLAY** on the controls below.",
    type: "video",
    videoSrc: "anime/Queri-TakeHit.mp4"
  },
  {
    section: "Defending",
    speaker: "Queri Lilibit",
    expression: "focused",
    background: "retro_classroom_bg.png",
    text: "But beware! When your HP reaches **0**, you are truly wounded and **downed**, drastically reducing your combat effectiveness.",
    type: "dialogue"
  },
  {
    section: "Defending",
    speaker: "Queri Lilibit",
    expression: "normal",
    background: "retro_classroom_bg.png",
    text: "Next is **Reaction Points (RP)**. RP represents your stamina and your ability to act quickly in response to threats.",
    type: "dialogue",
    subtab: "Reaction (RP)"
  },
  {
    section: "Defending",
    speaker: "Queri Lilibit",
    expression: "focused",
    background: "retro_classroom_bg.png",
    text: "Your base RP is equal to **2 + Agility**, but it is reduced by wearing heavy armor and carrying certain heavy equipment.",
    type: "dialogue"
  },
  {
    section: "Defending",
    speaker: "Queri Lilibit",
    expression: "normal",
    background: "retro_classroom_bg.png",
    text: "You spend RP to execute basic defense actions: **Dodge** and **Block**, which confer massive bonuses against incoming strikes.",
    type: "dialogue"
  },
  {
    section: "Defending",
    speaker: "Queri Lilibit",
    expression: "focused",
    background: "retro_classroom_bg.png",
    text: "Your base **Evasion** is **Agility + 7**. If an attack is going to hit you, you can spend RP to **Dodge** to boost your Evasion by **+13**.",
    type: "dialogue"
  },
  {
    section: "Defending",
    speaker: "Queri Lilibit",
    expression: "focused",
    background: "retro_classroom_bg.png",
    text: "If your new Evasion is higher than their attack roll, the hit becomes a miss! Think of it as a reactive evasion boost.",
    type: "dialogue"
  },
  {
    section: "Defending",
    speaker: "Queri Lilibit",
    expression: "cheerful",
    background: "retro_classroom_bg.png",
    text: "Watch the video monitor to see a demo of Dodging an incoming attack! Press **PLAY** on the controls below.",
    type: "video",
    videoSrc: "anime/Queri-Dodge.mp4"
  },
  {
    section: "Defending",
    speaker: "Queri Lilibit",
    expression: "focused",
    background: "retro_classroom_bg.png",
    text: "**Guard** is your passive damage reduction. Normal attacks are reduced by Guard (down to 1). Guard equals **Equipment (Armor) + Toughness**.",
    type: "dialogue"
  },
  {
    section: "Defending",
    speaker: "Queri Lilibit",
    expression: "focused",
    background: "retro_classroom_bg.png",
    text: "Spending RP to **Block** increases your Guard to **(2 x Toughness) + Armor Block Value**. Your armor determines your block strength.",
    type: "dialogue"
  },
  {
    section: "Defending",
    speaker: "Queri Lilibit",
    expression: "thoughtful",
    background: "retro_classroom_bg.png",
    text: "When you Block, the attack **automatically hits** you regardless of accuracy, but you reduce its damage by your active Block value.",
    type: "dialogue"
  },
  {
    section: "Defending",
    speaker: "Queri Lilibit",
    expression: "cheerful",
    background: "retro_classroom_bg.png",
    text: "Watch the video monitor to see a demo of Blocking an incoming attack! Press **PLAY** on the controls below.",
    type: "video",
    videoSrc: "anime/Queri-Block.mp4"
  },
  {
    section: "Defending",
    speaker: "Queri Lilibit",
    expression: "normal",
    background: "retro_classroom_bg.png",
    text: "Heavier armor increases your passive and active Guard, but it also reduces your maximum RP stamina pool. Let's look at the builds!",
    type: "dialogue",
    subtab: "Armor Weight"
  },
  {
    section: "Defending",
    speaker: "Queri Lilibit",
    expression: "normal",
    background: "retro_classroom_bg.png",
    text: "**No/Light Armor** makes you evasive with a high Dodge, but even small strikes will hurt. Great against single, powerful strikes!",
    type: "dialogue"
  },
  {
    section: "Defending",
    speaker: "Queri Lilibit",
    expression: "cheerful",
    background: "retro_classroom_bg.png",
    text: "**Medium Armor** is balanced and versatile, offering a good mix of evasion and protection. It is recommended for new recruits!",
    type: "dialogue"
  },
  {
    section: "Defending",
    speaker: "Queri Lilibit",
    expression: "focused",
    background: "retro_classroom_bg.png",
    text: "**Heavy Armor** ignores small attacks completely (great for grunts!), but its low RP makes you vulnerable to massive boss strikes.",
    type: "dialogue"
  },
  {
    section: "Defending",
    speaker: "Queri Lilibit",
    expression: "thoughtful",
    background: "retro_classroom_bg.png",
    text: "Heavy armor really shines when you have a **support or healer** watching your back. Never adventure alone in plate armor!",
    type: "dialogue"
  },
  {
    section: "Defending",
    speaker: "Queri Lilibit",
    expression: "focused",
    background: "retro_classroom_bg.png",
    text: "In addition, actively Dodging or Blocking turns an incoming **Critical Hit** into a normal hit! Always manage your RP carefully.",
    type: "dialogue"
  },
  {
    section: "Defending",
    speaker: "Queri Lilibit",
    expression: "normal",
    background: "retro_classroom_bg.png",
    text: "Lastly, some classes have special defenses that spend Mana (like **Parry**)... but we will cover those in a future seminar!",
    type: "dialogue"
  },
  {
    section: "Defending",
    speaker: "Queri Lilibit",
    expression: "cheerful",
    background: "retro_classroom_bg.png",
    text: "Remember: you can **Dodge and Block at the same time**! If you Dodge but still get hit, you can spend a second RP to Block the blow.",
    type: "dialogue"
  },
  {
    section: "Defending",
    speaker: "Queri Lilibit",
    expression: "focused",
    background: "retro_classroom_bg.png",
    text: "You also have **Saves** to resist status effects. You roll **2d10 + Toughness**. This is only used against attacks that force you to make a save.",
    type: "dialogue",
    subtab: "Saves"
  },
  {
    section: "Defending",
    speaker: "Queri Lilibit",
    expression: "normal",
    background: "retro_classroom_bg.png",
    text: "In summary: a great fencer knows when to absorb a strike with **HP**, when to **Dodge** to avoid it, and when to **Block** to absorb it!",
    type: "dialogue"
  },

  // SECTION 6: DEFENSE PRACTICE (INTERACTIVE)
  {
    section: "Defense Practice",
    speaker: "Queri Lilibit",
    expression: "focused",
    background: "retro_classroom_bg.png",
    text: "Let's review the defensive statistics. Click the **Defense Cards** on the screen below to study their mechanics and calculations!",
    type: "interactive",
    hotspots: [
      {
        id: "defense-dodge",
        label: "Dodge",
        x: "15%",
        y: "20%",
        width: "22%",
        height: "60%",
        title: "DODGE (1 RP)",
        desc: "• RP Cost: 1\n• Hit Check: Avoid damage completely if Dodge succeeds\n• Evasion Bonus: +13 (New Evasion: Agility + 20)\n• Crit Protection: Turns a Critical Hit into a normal hit\n• Best Against: Powerful single strikes and highly accurate attacks\n• Mechanic: Declared as a reaction if you are going to get hit. Boosts your Evasion by +13. If your new Evasion is higher than the enemy's attack roll, the attack misses instead!"
      },
      {
        id: "defense-block",
        label: "Block",
        x: "41%",
        y: "20%",
        width: "22%",
        height: "60%",
        title: "BLOCK (1 RP)",
        desc: "• RP Cost: 1\n• Hit Check: Auto-hit (the attack hits you automatically)\n• Block Value: (2 x Toughness) + Armor Block Value\n• Crit Protection: Turns a Critical Hit into a normal hit\n• Best Against: Multi-strikes, quick attacks, or un-evadable blows\n• Mechanic: Automatically absorb the strike, reducing damage by your block value. Heavier armor dictates block strength."
      },
      {
        id: "defense-takehit",
        label: "Take the Hit",
        x: "67%",
        y: "20%",
        width: "22%",
        height: "60%",
        title: "TAKE THE HIT (0 RP)",
        desc: "• RP Cost: 0\n• Hit Check: Standard (only hits if attack accuracy meets your passive Evasion)\n• Damage Allocation: Subtracts directly from your HP pool\n• Best Against: Low-damage attacks or strikes without dangerous status effects\n• Usage: Saves your Reaction Points (RP). Conserve stamina for dodging critical boss strikes by taking safe attacks to HP."
      }
    ]
  },

  // SECTION 7: SUMMARY
  {
    section: "Summary",
    speaker: "Queri Lilibit",
    expression: "cheerful",
    background: "retro_classroom_bg.png",
    text: "Fantastic work, cadet! You now understand the basic attacks: **Light (1 AP)**, **Heavy (2 AP)**, and **Precise (2 AP)**.",
    type: "dialogue"
  },
  {
    section: "Summary",
    speaker: "Queri Lilibit",
    expression: "cheerful",
    background: "retro_classroom_bg.png",
    text: "You know how they interact with stats like Evasion, Guard, Power, and Focus. You're ready for actual combat!",
    type: "dialogue"
  },
  {
    section: "Summary",
    speaker: "Queri Lilibit",
    expression: "normal",
    background: "retro_classroom_bg.png",
    text: "Head over to **rpg.angelssword.com** to build your character sheet and review advanced combat disciplines. Good luck out there!",
    type: "dialogue"
  }
];
