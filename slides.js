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
    expression: "thumbsup",
    background: "retro_classroom_bg.png",
    text: "Greetings, cadet! I am **Queri Lilibit**, your Pixie Faerie combat tutor. Welcome to **Queri's Combat School**!",
    type: "dialogue"
  },
  {
    section: "Introduction",
    speaker: "Queri Lilibit",
    expression: "thumbsup",
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
    expression: "surprised",
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
    text: "Let's review the mathematical details. Click the **Attack Cards** on the screen to study their formulas and stat interactions!",
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
    expression: "defeated",
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
    text: "Your base RP is equal to **2 + Agility**. Carrying certain heavy equipment can reduce it, but **wearing armor does not reduce your RP pool**!",
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
    text: "Heavier armor increases passive and active Guard, but it reduces your Evasion, Dodge, and Initiative. Let's look at the builds!",
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
    text: "**Heavy Armor** ignores small attacks (great for grunts!), but its high Evasion/Dodge and Initiative penalties make you easier to hit.",
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
    text: "Let's review the defensive statistics. Click the **Defense Cards** on the screen to study their mechanics and calculations!",
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

  // SECTION 7: ARMOR STUDY (INTERACTIVE)
  {
    section: "Armor Study",
    speaker: "Queri Lilibit",
    expression: "focused",
    background: "retro_classroom_bg.png",
    text: "Let's study the three main armor types. Click the **Armor Cards** on the screen to compare their benefits and penalties!",
    type: "interactive",
    hotspots: [
      {
        id: "armor-light",
        label: "Light Armor",
        x: "15%",
        y: "20%",
        width: "22%",
        height: "60%",
        title: "LIGHT ARMOR",
        desc: "• Guard: +1\n• Block Value: +4\n• Initiative: -1\n• Evasion: -2\n• Dodge: -2\n• Details: Offers minimal protection with almost no weight penalties, perfect for highly evasive skirmishers."
      },
      {
        id: "armor-medium",
        label: "Medium Armor",
        x: "41%",
        y: "20%",
        width: "22%",
        height: "60%",
        title: "MEDIUM ARMOR",
        desc: "• Guard: +2\n• Block Value: +8\n• Initiative: -2\n• Evasion: -4\n• Dodge: -4\n• Details: A balanced choice offering moderate protection. A standard for vanguard fighters who need both defense and mobility."
      },
      {
        id: "armor-heavy",
        label: "Heavy Armor",
        x: "67%",
        y: "20%",
        width: "22%",
        height: "60%",
        title: "HEAVY ARMOR",
        desc: "• Guard: +3\n• Block Value: +12\n• Initiative: -3\n• Evasion: -6\n• Dodge: -6\n• Details: Heavy plate armor that maximizes raw damage absorption, but severely hinders your reflexes and action speeds."
      }
    ]
  },
  {
    section: "Armor Study",
    speaker: "Queri Lilibit",
    expression: "cheerful",
    background: "retro_classroom_bg.png",
    text: "Note: there are **armor mods** that can modify these values! You can find details on these mods on the item entries in your **handbook**.",
    type: "dialogue"
  },

  // SECTION 8: MOVEMENT
  {
    section: "Movement",
    speaker: "Queri Lilibit",
    expression: "normal",
    background: "retro_classroom_bg.png",
    text: "Next up, let's talk about **Movement**. Navigating the battlefield is key to positioning your strikes!",
    type: "dialogue",
    subtab: "Movement Basics"
  },
  {
    section: "Movement",
    speaker: "Queri Lilibit",
    expression: "focused",
    background: "retro_classroom_bg.png",
    text: "Movement is simple: it costs **1 AP** to move up to your character's base speed, which is usually **20 feet**.",
    type: "dialogue"
  },
  {
    section: "Movement",
    speaker: "Queri Lilibit",
    expression: "thoughtful",
    background: "retro_classroom_bg.png",
    text: "However, some races move faster than others, and things like **mounts** and active **buffs** can change your speed.",
    type: "dialogue"
  },
  {
    section: "Movement",
    speaker: "Queri Lilibit",
    expression: "focused",
    background: "retro_classroom_bg.png",
    text: "You can spend anywhere from **1 to 4 AP** on movement per turn. You can do this as separate moves or a single larger movement.",
    type: "dialogue"
  },
  {
    section: "Movement",
    speaker: "Queri Lilibit",
    expression: "thoughtful",
    background: "retro_classroom_bg.png",
    text: "Unless you have a specific buff to exploit, it is generally better to chain **individual 1 AP movements** together.",
    type: "dialogue",
    subtab: "Interrupts"
  },
  {
    section: "Movement",
    speaker: "Queri Lilibit",
    expression: "surprised",
    background: "retro_classroom_bg.png",
    text: "Why? Because if your movement gets interrupted (like by an enemy reaction), it interrupts the **ENTIRE movement action**!",
    type: "dialogue"
  },
  {
    section: "Movement",
    speaker: "Queri Lilibit",
    expression: "normal",
    background: "retro_classroom_bg.png",
    text: "You can also break up your movement with other actions. Move for **1 AP**, attack, then move again if you have AP left!",
    type: "dialogue",
    subtab: "Tactics"
  },
  {
    section: "Movement",
    speaker: "Queri Lilibit",
    expression: "cheerful",
    background: "retro_classroom_bg.png",
    text: "Watch the video monitor to see a **Movement** tactics demo! Press **PLAY** on the controls below.",
    type: "video",
    videoSrc: "anime/Queri-Movement.mp4"
  },
  {
    section: "Movement",
    speaker: "Queri Lilibit",
    expression: "normal",
    background: "retro_classroom_bg.png",
    text: "Also, you **do not have to move your FULL speed** each action. You can choose to move any distance up to that speed for **1 AP**.",
    type: "dialogue"
  },
  {
    section: "Movement",
    speaker: "Queri Lilibit",
    expression: "focused",
    background: "retro_classroom_bg.png",
    text: "Note: some classes/races have **Line Movement**, meaning they must move in a straight line for each movement. This is common for mounts.",
    type: "dialogue",
    subtab: "Special Moves"
  },
  {
    section: "Movement",
    speaker: "Queri Lilibit",
    expression: "cheerful",
    background: "retro_classroom_bg.png",
    text: "Some airship mounts also have a **turning speed**... but that's an advanced topic we'll cover in a future class!",
    type: "dialogue"
  },

  // SECTION 9: REACTIONS
  {
    section: "Reactions",
    speaker: "Queri Lilibit",
    expression: "normal",
    background: "retro_classroom_bg.png",
    text: "Now let's cover **Reactions**, the flagship mechanic of Lyrian Chronicles. In this game, your turn never truly ends!",
    type: "dialogue",
    subtab: "Reaction Basics"
  },
  {
    section: "Reactions",
    speaker: "Queri Lilibit",
    expression: "focused",
    background: "retro_classroom_bg.png",
    text: "Any action using **Reaction Points (RP)** as a resource can be played outside of your turn. This is how you defend or strike back!",
    type: "dialogue"
  },
  {
    section: "Reactions",
    speaker: "Queri Lilibit",
    expression: "thoughtful",
    background: "retro_classroom_bg.png",
    text: "Reactions resolve on a **stack**—the latest reaction always resolves first! This allows for some very clever counter-plays.",
    type: "dialogue"
  },
  {
    section: "Reactions",
    speaker: "Queri Lilibit",
    expression: "normal",
    background: "retro_classroom_bg.png",
    text: "Let's talk about the most common reaction: the **Attack of Opportunity**. Understanding this is critical for battlefield control!",
    type: "dialogue",
    subtab: "Opportunity Attacks"
  },
  {
    section: "Reactions",
    speaker: "Queri Lilibit",
    expression: "focused",
    background: "retro_classroom_bg.png",
    text: "When an enemy leaves your threatened melee range (usually 5ft), you get an immediate free **Basic Light Attack** against them!",
    type: "dialogue"
  },
  {
    section: "Reactions",
    speaker: "Queri Lilibit",
    expression: "focused",
    background: "retro_classroom_bg.png",
    text: "This attack resolves *before* the movement does! If you down or incapacitate the target with your AoO, their movement is cancelled.",
    type: "dialogue"
  },
  {
    section: "Reactions",
    speaker: "Queri Lilibit",
    expression: "cheerful",
    background: "retro_classroom_bg.png",
    text: "Watch the video monitor to see an **Opportunity Attack** demo! Press **PLAY** on the controls below.",
    type: "video",
    videoSrc: "anime/Queri-Opportunity.mp4"
  },
  {
    section: "Reactions",
    speaker: "Queri Lilibit",
    expression: "focused",
    background: "retro_classroom_bg.png",
    text: "You can also spend **1 RP** to upgrade your Attack of Opportunity to a **Heavy Attack**. Great for pushing offensive advantages!",
    type: "dialogue"
  },
  {
    section: "Reactions",
    speaker: "Queri Lilibit",
    expression: "normal",
    background: "retro_classroom_bg.png",
    text: "Remember: simply moving *within* threatened range doesn't provoke. An AoO only triggers when an enemy leaves threatened range.",
    type: "dialogue"
  },
  {
    section: "Reactions",
    speaker: "Queri Lilibit",
    expression: "surprised",
    background: "retro_classroom_bg.png",
    text: "You also provoke if you cast a spell or shoot a ranged weapon while in melee threat range. Enemies get a free AoO for *every* cast!",
    type: "dialogue"
  },
  {
    section: "Reactions",
    speaker: "Queri Lilibit",
    expression: "thoughtful",
    background: "retro_classroom_bg.png",
    text: "Do note that not all abilities are spells, and some spells or ranged attacks have special properties that do not provoke an AoO.",
    type: "dialogue"
  },
  {
    section: "Reactions",
    speaker: "Queri Lilibit",
    expression: "focused",
    background: "retro_classroom_bg.png",
    text: "Let's review the common reaction-related actions. Click the **basic ability cards on the screen** to study how they work!",
    type: "interactive",
    hotspots: [
      {
        id: "reaction-aoo",
        label: "Opportunity Attack",
        x: "15%",
        y: "20%",
        width: "22%",
        height: "60%",
        title: "ATTACK OF OPPORTUNITY (FREE)",
        desc: "• Resource Cost: Free (0 RP)\n• Trigger: Enemy leaves threatened range (5ft), or casts/shoots within it.\n• Attack: Immediate Basic Light Attack.\n• Special: Occurs before the enemy's action resolves. If they are downed/killed, their move is cancelled."
      },
      {
        id: "reaction-heavy-aoo",
        label: "Heavy Opportunity",
        x: "41%",
        y: "20%",
        width: "22%",
        height: "60%",
        title: "HEAVY OPPORTUNITY ATTACK (1 RP)",
        desc: "• Resource Cost: 1 RP\n• Trigger: Same as standard Attack of Opportunity.\n• Attack: Upgrades standard AoO to a Heavy Attack.\n• Advice: Great for pushing offensive advantages, but save your RP for defense when things are neutral."
      },
      {
        id: "reaction-disengage",
        label: "Disengage",
        x: "67%",
        y: "20%",
        width: "22%",
        height: "60%",
        title: "DISENGAGE (2 AP)",
        desc: "• AP Cost: 2\n• Effect: Prevent your movement from provoking Attacks of Opportunity until your next turn.\n• Limitations: Does not prevent AoO triggered by your spells or ranged attacks.\n• Use Case: Perfect for kiting, escaping tanks, and trading action economy."
      }
    ]
  },
  {
    section: "Reactions",
    speaker: "Queri Lilibit",
    expression: "defeated",
    background: "retro_classroom_bg.png",
    text: "\"So if I'm ranged, I'm just screwed if they get close?\" No, you have options! Always carry a melee weapon like a dagger to draw fast.",
    type: "dialogue",
    subtab: "Disengage & Kiting"
  },
  {
    section: "Reactions",
    speaker: "Queri Lilibit",
    expression: "normal",
    background: "retro_classroom_bg.png",
    text: "Disengaging is a great tool. If you spend 3 AP to disengage and run, forcing 5 enemies to chase you... you traded 3 AP for 5 AP!",
    type: "dialogue"
  },
  {
    section: "Reactions",
    speaker: "Queri Lilibit",
    expression: "smug",
    background: "retro_classroom_bg.png",
    text: "Let's talk about the Reaction Stack. If an enemy attacks, react with **RP movement abilities** (like the class skill **Evasive Maneuver**)!Safe!",
    type: "dialogue",
    subtab: "Stack Tactics"
  },
  {
    section: "Reactions",
    speaker: "Queri Lilibit",
    expression: "smug",
    background: "retro_classroom_bg.png",
    text: "Because your reaction resolves first, you move 5ft away. Now they are out of range and their Heavy Attack fails! Devastating!",
    type: "dialogue"
  },
  {
    section: "Reactions",
    speaker: "Queri Lilibit",
    expression: "thumbsup",
    background: "retro_classroom_bg.png",
    text: "Mastering reaction stacking is what makes you a true legend in Lyrian Chronicles. We'll practice more stack combos in later classes!",
    type: "dialogue"
  },

  // SECTION 10: ADVANCED DEFENSES
  {
    section: "Advanced Defenses",
    speaker: "Queri Lilibit",
    expression: "normal",
    background: "retro_classroom_bg.png",
    text: "Let's cover **Advanced Defensive Play**, crucial tactics to survive dangerous situations and coordinate counterattacks!",
    type: "dialogue",
    subtab: "Tactical Defense"
  },
  {
    section: "Advanced Defenses",
    speaker: "Queri Lilibit",
    expression: "focused",
    background: "retro_classroom_bg.png",
    text: "Unmitigated ranged attackers are the **#1 killer** in Angel's Sword RPG. Left unchecked, they will coordinate and focus fire your team!",
    type: "dialogue"
  },
  {
    section: "Advanced Defenses",
    speaker: "Queri Lilibit",
    expression: "normal",
    background: "retro_classroom_bg.png",
    text: "Everyone has access to **Cover**. Hiding behind a barrier is the difference between becoming a pincushion or gaining ground.",
    type: "dialogue",
    subtab: "Cover Rules"
  },
  {
    section: "Advanced Defenses",
    speaker: "Queri Lilibit",
    expression: "cheerful",
    background: "retro_classroom_bg.png",
    text: "Watch the video monitor to see a **Cover** demonstration! Press **PLAY** on the controls below.",
    type: "video",
    videoSrc: "anime/Queri-Cover.mp4"
  },
  {
    section: "Advanced Defenses",
    speaker: "Queri Lilibit",
    expression: "focused",
    background: "retro_classroom_bg.png",
    text: "There are three types of cover on the battlefield. Click the **Cover Cards on the screen** to study their benefits!",
    type: "interactive",
    hotspots: [
      {
        id: "cover-low",
        label: "Low Cover",
        x: "15%",
        y: "20%",
        width: "22%",
        height: "60%",
        title: "LOW COVER",
        desc: "• Evasion Bonus: +4\n• Hunker Down (2 AP): Counts Low Cover as High Cover (+6 Evasion, +1 Guard) until the start of your next turn.\n• Examples: Chest-high walls, tree trunks, or peeking around a corner."
      },
      {
        id: "cover-high",
        label: "High Cover",
        x: "41%",
        y: "20%",
        width: "22%",
        height: "60%",
        title: "HIGH COVER",
        desc: "• Evasion Bonus: +6\n• Guard Bonus: +1\n• Examples: Arrow slits or magical shielding barriers.\n• Detail: Covers almost the entire body, making you extremely difficult to hit while offering solid passive damage reduction."
      },
      {
        id: "cover-full",
        label: "Full Cover",
        x: "67%",
        y: "20%",
        width: "22%",
        height: "60%",
        title: "FULL COVER",
        desc: "• Benefit: Cannot be targeted by direct attacks.\n• Requirement: No direct line of sight between you and the attacker.\n• Note: If the attack's point of origin creates LoS (like a fireball thrown behind your wall), Full Cover is negated."
      }
    ]
  },
  {
    section: "Advanced Defenses",
    speaker: "Queri Lilibit",
    expression: "surprised",
    background: "retro_classroom_bg.png",
    text: "Be careful! If an attack destroys the cover you are hiding behind, the cover bonus is completely nullified for that attack.",
    type: "dialogue"
  },
  {
    section: "Advanced Defenses",
    speaker: "Queri Lilibit",
    expression: "focused",
    background: "retro_classroom_bg.png",
    text: "For **2 AP**, you can use the **Hunker Down** action. This counts any Low Cover you have as High Cover until the start of your next turn!",
    type: "dialogue"
  },
  {
    section: "Advanced Defenses",
    speaker: "Queri Lilibit",
    expression: "normal",
    background: "retro_classroom_bg.png",
    text: "When firing from cover, you can **peek**—treating the attack as coming from a physically reachable space within 5 feet of the cover.",
    type: "dialogue",
    subtab: "Peeking & Line of Sight"
  },
  {
    section: "Advanced Defenses",
    speaker: "Queri Lilibit",
    expression: "surprised",
    background: "retro_classroom_bg.png",
    text: "If your peeking space is in an enemy's melee range, their ranged attack or spell will trigger an Attack of Opportunity against you!",
    type: "dialogue"
  },
  {
    section: "Advanced Defenses",
    speaker: "Queri Lilibit",
    expression: "thoughtful",
    background: "retro_classroom_bg.png",
    text: "Additionally, if you peek from High or Full Cover to shoot, your cover is downgraded to **Low Cover** during the attack.",
    type: "dialogue"
  },
  {
    section: "Advanced Defenses",
    speaker: "Queri Lilibit",
    expression: "cheerful",
    background: "retro_classroom_bg.png",
    text: "Watch the video monitor to see a **Peek From Cover** demonstration! Press **PLAY** on the controls below.",
    type: "video",
    videoSrc: "anime/Queri-PeekFromCover.mp4"
  },
  {
    section: "Advanced Defenses",
    speaker: "Queri Lilibit",
    expression: "normal",
    background: "retro_classroom_bg.png",
    text: "You can use Smoke Flasks or Mage skills like **Glittershards** to block line of sight. If enemies can't see you, they can't shoot!",
    type: "dialogue",
    subtab: "Slicing Sightlines"
  },
  {
    section: "Advanced Defenses",
    speaker: "Queri Lilibit",
    expression: "smug",
    background: "retro_classroom_bg.png",
    text: "A powerful tactic: throw a **Smoke Flask** right at your feet. Ranged attackers can't target you, though AoEs and melee attacks still hit!",
    type: "dialogue"
  },
  {
    section: "Advanced Defenses",
    speaker: "Queri Lilibit",
    expression: "cheerful",
    background: "retro_classroom_bg.png",
    text: "Watch the video monitor to see an **Advanced Smoke Bomb** demo! Press **PLAY** on the controls below.",
    type: "video",
    videoSrc: "anime/Queri-AdvSmokeBomb.mp4"
  },
  {
    section: "Advanced Defenses",
    speaker: "Queri Lilibit",
    expression: "cheerful",
    background: "retro_classroom_bg.png",
    text: "To shut down ranged foes completely, close in fast! Use skills like **Movement Burst** and **Fae Flash** to drag them into melee.",
    type: "dialogue",
    subtab: "Closing Melee"
  },
  {
    section: "Advanced Defenses",
    speaker: "Queri Lilibit",
    expression: "smug",
    background: "retro_classroom_bg.png",
    text: "Forcing a ranged attacker into melee removes their targeting freedom. Any ranged attacks or spells they try to cast will trigger your AoOs!",
    type: "dialogue"
  },
  {
    section: "Advanced Defenses",
    speaker: "Queri Lilibit",
    expression: "normal",
    background: "retro_classroom_bg.png",
    text: "Remember: **action economy is paramount**! Disengaging and running forces enemies to spend AP chasing you instead of attacking.",
    type: "dialogue",
    subtab: "Action Economy"
  },
  {
    section: "Advanced Defenses",
    speaker: "Queri Lilibit",
    expression: "defeated",
    background: "retro_classroom_bg.png",
    text: "Under severe pressure from a boss or ranged fire, you can use the **Defend** basic action. It is expensive at **3 AP**...",
    type: "dialogue"
  },
  {
    section: "Advanced Defenses",
    speaker: "Queri Lilibit",
    expression: "cheerful",
    background: "retro_classroom_bg.png",
    text: "...but it allows you to **Dodge or Block for 0 RP** until your next turn! A powerful way to last as long as possible under focus fire.",
    type: "dialogue"
  },

  // SECTION 11: PREPARED ACTION
  {
    section: "Prepared Action",
    speaker: "Queri Lilibit",
    expression: "normal",
    background: "retro_classroom_bg.png",
    text: "Lastly, let's study the **Prepared Action**—a powerful tactic that lets you act out of turn by preparing a specific trigger.",
    type: "dialogue",
    subtab: "Preparation Rules"
  },
  {
    section: "Prepared Action",
    speaker: "Queri Lilibit",
    expression: "focused",
    background: "retro_classroom_bg.png",
    text: "To **Prepare**, you spend **X AP** (the cost of the action) and end your turn, stating a trigger and an action with any targets involved.",
    type: "dialogue"
  },
  {
    section: "Prepared Action",
    speaker: "Queri Lilibit",
    expression: "normal",
    background: "retro_classroom_bg.png",
    text: "If the trigger occurs before your next turn starts, you immediately execute your action. But there are rules!",
    type: "dialogue"
  },
  {
    section: "Prepared Action",
    speaker: "Queri Lilibit",
    expression: "focused",
    background: "retro_classroom_bg.png",
    text: "You cannot prepare actions with a base AP cost of **0** or higher than **2 AP**. No preparing free moves or massive spells!",
    type: "dialogue"
  },
  {
    section: "Prepared Action",
    speaker: "Queri Lilibit",
    expression: "thoughtful",
    background: "retro_classroom_bg.png",
    text: "Additionally, your trigger cannot be one of your own **0 RP actions**, nor can it depend on a dice roll (like missing/hitting).",
    type: "dialogue"
  },
  {
    section: "Prepared Action",
    speaker: "Queri Lilibit",
    expression: "normal",
    background: "retro_classroom_bg.png",
    text: "Despite the caveats, it is incredibly versatile. You can use it to shoot at an enemy as they leave cover!",
    type: "dialogue",
    subtab: "Tactical Uses"
  },
  {
    section: "Prepared Action",
    speaker: "Queri Lilibit",
    expression: "focused",
    background: "retro_classroom_bg.png",
    text: "You can also use it to coordinate combination attacks with allies, or create powerful setups in dire circumstances.",
    type: "dialogue"
  },
  {
    section: "Prepared Action",
    speaker: "Queri Lilibit",
    expression: "cheerful",
    background: "retro_classroom_bg.png",
    text: "Let's look at a legendary combo: the **Kreman Lodi Special**. It's designed to counter hordes of ranged enemies!",
    type: "dialogue",
    subtab: "Kreman Lodi Special"
  },
  {
    section: "Prepared Action",
    speaker: "Queri Lilibit",
    expression: "focused",
    background: "retro_classroom_bg.png",
    text: "First, throw a **Smoke Flask** down at your feet to block line of sight. Ranged foes can't target you, so you are safe in cover.",
    type: "dialogue"
  },
  {
    section: "Prepared Action",
    speaker: "Queri Lilibit",
    expression: "normal",
    background: "retro_classroom_bg.png",
    text: "Next, spend your AP to prepare movement. Your trigger: **'When the person who moves right before me ends their turn.'**",
    type: "dialogue"
  },
  {
    section: "Prepared Action",
    speaker: "Queri Lilibit",
    expression: "smug",
    background: "retro_classroom_bg.png",
    text: "This lets you remain in cover, then blitz to the enemy *right before* your turn starts, giving you a full **4 AP** in their face!",
    type: "dialogue"
  },
  {
    section: "Prepared Action",
    speaker: "Queri Lilibit",
    expression: "surprised",
    background: "retro_classroom_bg.png",
    text: "Beware: conditions could change before you act, and enemies can use **Reaction** abilities to interrupt you. High risk, high reward!",
    type: "dialogue"
  },
  {
    section: "Prepared Action",
    speaker: "Queri Lilibit",
    expression: "cheerful",
    background: "retro_classroom_bg.png",
    text: "Watch the video monitor to see a **Kreman Lodi Special** demonstration! Press **PLAY** on the controls below.",
    type: "video",
    videoSrc: "anime/Queri-Kreman.mp4"
  },

  // SECTION 12: SUMMARY
  {
    section: "Summary",
    speaker: "Queri Lilibit",
    expression: "thumbsup",
    background: "retro_classroom_bg.png",
    text: "Incredible job, cadet! You have successfully completed the entire combat curriculum here at **Queri's Combat School**!",
    type: "dialogue"
  },
  {
    section: "Summary",
    speaker: "Queri Lilibit",
    expression: "focused",
    background: "retro_classroom_bg.png",
    text: "You've mastered **AP management** and the three basic attacks: fast **Light**, crushing **Heavy**, and piercing **Precise** strikes.",
    type: "dialogue"
  },
  {
    section: "Summary",
    speaker: "Queri Lilibit",
    expression: "normal",
    background: "retro_classroom_bg.png",
    text: "You know how to defend using **HP** and **RP**, reactively choosing to **Dodge** or **Block** based on your **Armor weight class**.",
    type: "dialogue"
  },
  {
    section: "Summary",
    speaker: "Queri Lilibit",
    expression: "normal",
    background: "retro_classroom_bg.png",
    text: "We covered strategic **Movement**, kiting, and utilizing **Attacks of Opportunity** to control melee spaces outside of your turn.",
    type: "dialogue"
  },
  {
    section: "Summary",
    speaker: "Queri Lilibit",
    expression: "thoughtful",
    background: "retro_classroom_bg.png",
    text: "You learned to slice sightlines with **Smoke Flasks**, peek from **Cover**, and spend 2 AP to **Hunker Down** for safety.",
    type: "dialogue"
  },
  {
    section: "Summary",
    speaker: "Queri Lilibit",
    expression: "cheerful",
    background: "retro_classroom_bg.png",
    text: "And finally, you know how to **Prepare** actions to execute complex combos, like the **Kreman Lodi Special** blitz.",
    type: "dialogue"
  },
  {
    section: "Summary",
    speaker: "Queri Lilibit",
    expression: "thumbsup",
    background: "retro_classroom_bg.png",
    text: "Now head over to **rpg.angelssword.com** to build your sheet and test these tactics. Good luck out there, hero!",
    type: "dialogue"
  }
];
