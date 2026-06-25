// Lyrian Chronicles Monster Autostat System Logic

// State variables
let currentMonster = null;

// Base stats mapping for Astra Level 2
const STAT_BANDS = {
  grunt: {
    stat: {
      'very-low': [1, 2],
      'low': [2, 3],
      'average': [3, 4],
      'high': [4, 5],
      'very-high': [6, 6]
    },
    hp: {
      'very-low': [2, 4],
      'low': [18, 22],
      'average': [23, 27],
      'high': [38, 42],
      'very-high': [50, 60]
    }
  },
  heroic: {
    stat: {
      'very-low': [1, 2],
      'low': [3, 4],
      'average': [4, 5],
      'high': [5, 6],
      'very-high': [7, 8]
    },
    hp: {
      'very-low': [20, 29],
      'low': [40, 50],
      'average': [55, 65],
      'high': [70, 80],
      'very-high': [90, 110]
    }
  },
  boss: {
    stat: {
      'very-low': [1, 2],
      'low': [4, 5],
      'average': [5, 6],
      'high': [6, 7],
      'very-high': [8, 10]
    },
    hp: {
      'very-low': [100, 149],
      'low': [160, 199],
      'average': [200, 220],
      'high': [240, 270],
      'very-high': [300, 350]
    }
  }
};

// Elements cache
const els = {
  monsterName: document.getElementById('monsterName'),
  monsterRank: document.getElementById('monsterRank'),
  astraLevel: document.getElementById('astraLevel'),
  levelVal: document.getElementById('levelVal'),
  isFiend: document.getElementById('isFiend'),
  fiendRankGroup: document.getElementById('fiendRankGroup'),
  fiendRank: document.getElementById('fiendRank'),
  
  statHP: document.getElementById('statHP'),
  statFocus: document.getElementById('statFocus'),
  statPower: document.getElementById('statPower'),
  statAgility: document.getElementById('statAgility'),
  statToughness: document.getElementById('statToughness'),
  
  variance: document.getElementById('variance'),
  varianceVal: document.getElementById('varianceVal'),
  
  creatureDesc: document.getElementById('creatureDesc'),
  useGeminiApi: document.getElementById('useGeminiApi'),
  apiGroup: document.getElementById('apiGroup'),
  geminiApiKey: document.getElementById('geminiApiKey'),
  
  monsterCard: document.getElementById('monsterCard'),
  cardName: document.getElementById('cardName'),
  cardMeta: document.getElementById('cardMeta'),
  cardHP: document.getElementById('cardHP'),
  cardAP: document.getElementById('cardAP'),
  cardRP: document.getElementById('cardRP'),
  cardEvasion: document.getElementById('cardEvasion'),
  cardFocus: document.getElementById('cardFocus'),
  cardPower: document.getElementById('cardPower'),
  cardAgility: document.getElementById('cardAgility'),
  cardToughness: document.getElementById('cardToughness'),
  
  cardRegenContainer: document.getElementById('cardRegenContainer'),
  cardRegenVal: document.getElementById('cardRegenVal'),
  
  abilitiesList: document.getElementById('abilitiesList'),
  actionsList: document.getElementById('actionsList'),
  
  btnGenerate: document.getElementById('btnGenerate'),
  btnAiGen: document.getElementById('btnAiGen'),
  btnExportTxt: document.getElementById('btnExportTxt'),
  btnExportJson: document.getElementById('btnExportJson'),
  btnCopy: document.getElementById('btnCopy'),
  btnAiGenFromName: document.getElementById('btnAiGenFromName'),
  btnAiGenFullyRandom: document.getElementById('btnAiGenFullyRandom'),
  btnAiGenGrunt: document.getElementById('btnAiGenGrunt'),
  btnAiGenHeroic: document.getElementById('btnAiGenHeroic'),
  btnAiGenBoss: document.getElementById('btnAiGenBoss')
};

// ApiSync Helper to fetch and decrypt the official bestiary database from api.angelssword.com
const ApiSync = {
  aesKey: "CSRITDuXKJgTfpN20FthTQ",
  apiUrl: "https://api.angelssword.com",
  
  async importKey() {
    return window.crypto.subtle.importKey(
      "jwk",
      { kty: "oct", k: this.aesKey, alg: "A128CBC", ext: true },
      { name: "AES-CBC" },
      false,
      ["encrypt", "decrypt"]
    );
  },
  
  async encrypt(plaintext, ivStr) {
    const key = await this.importKey();
    const encoder = new TextEncoder();
    const ivBytes = encoder.encode(ivStr);
    const plaintextBytes = encoder.encode(plaintext);
    
    const ciphertext = await window.crypto.subtle.encrypt(
      { name: "AES-CBC", iv: ivBytes },
      key,
      plaintextBytes
    );
    
    return btoa(String.fromCharCode(...new Uint8Array(ciphertext)));
  },
  
  baseDecode(base64Str) {
    if (!base64Str) return "";
    try {
      return decodeURIComponent(
        atob(base64Str)
          .split("")
          .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
    } catch (e) {
      console.error("Base64 decode failed for string:", base64Str, e);
      return "";
    }
  },
  
  async fetchWithAuth(endpoint) {
    const sessionId = btoa(crypto.randomUUID());
    const requestId = btoa(Date.now().toString());
    const ivStr = requestId.slice(0, 16);
    const requestKey = await this.encrypt(sessionId, ivStr);
    
    const headers = {
      "requestId": requestId,
      "requestkey": requestKey,
      "sessionId": sessionId
    };
    
    const response = await fetch(`${this.apiUrl}/${endpoint}`, { headers });
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }
    return response.json();
  }
};

// Parse and evaluate stat-based formulas in action and ability description texts
function evaluateDescription(desc, stats) {
  if (!desc) return '';
  
  // 1. Replace stat names with actual values (case-insensitive word boundary)
  let text = desc
    .replace(/\bFocus\b/gi, stats.focus)
    .replace(/\bPower\b/gi, stats.power)
    .replace(/\bAgility\b/gi, stats.agility)
    .replace(/\bToughness\b/gi, stats.toughness);

  // 2. Evaluate expressions inside brackets: [...]
  text = text.replace(/\[([^\]]+)\]/g, (match, expression) => {
    // If it does not contain any dice expression (e.g. 4d6), evaluate the entire thing
    if (!/\b\d+d\d+\b/i.test(expression)) {
      try {
        if (/^[\d\s*+\-\/()]+$/.test(expression.trim())) {
          return new Function(`return ${expression}`)();
        }
      } catch (e) {
        console.error("Failed to evaluate entire bracket expression:", expression, e);
      }
    }

    // Split the expression by + or - while keeping the operators
    const parts = expression.split(/([+\-])/);
    const evaluatedParts = parts.map(part => {
      const trimmed = part.trim();
      if (!trimmed) return '';
      // If it contains a dice expression like "4d6", keep it
      if (/\b\d+d\d+\b/i.test(trimmed)) {
        return part;
      }
      // If it's a math operator (+ or -), keep it
      if (trimmed === '+' || trimmed === '-') {
        return part;
      }
      // Evaluate pure math expression safely
      try {
        if (/^[\d\s*+\-\/()]+$/.test(trimmed)) {
          const result = new Function(`return ${trimmed}`)();
          return ` ${result} `;
        }
      } catch (e) {
        console.error("Failed to evaluate part:", trimmed, e);
      }
      return part;
    });
    return evaluatedParts.join('').replace(/\s+/g, ' ').trim();
  });

  // 3. Evaluate expressions outside brackets: e.g. "1d20 + 5 * 2" -> "1d20 + 10"
  text = text.replace(/(\b\d+d\d+\s*[+\-]\s*)([\d\s*+\-\/()]+)/gi, (match, prefix, expression) => {
    try {
      if (/^[\d\s*+\-\/()]+$/.test(expression.trim())) {
        const result = new Function(`return ${expression}`)();
        return `${prefix}${result}`;
      }
    } catch (e) {
      console.error("Failed to evaluate outside bracket expression:", expression, e);
    }
    return match;
  });

  // 4. Evaluate Potency values: e.g. "Potency (11 + 5)" -> "Potency (16)"
  text = text.replace(/(Potency\s*\()([\d\s*+\-\/()]+)(\))/gi, (match, prefix, expression, suffix) => {
    try {
      if (/^[\d\s*+\-\/()]+$/.test(expression.trim())) {
        const result = new Function(`return ${expression}`)();
        return `${prefix}${result}${suffix}`;
      }
    } catch (e) {
      console.error("Failed to evaluate Potency:", expression, e);
    }
    return match;
  });

  return text;
}



// Initialize Application
function init() {
  try {
  // Bind inputs
  
  els.isFiend.addEventListener('change', () => {
    els.fiendRankGroup.style.display = els.isFiend.checked ? 'block' : 'none';
    updateCardRegenAndMetadata();
  });
  els.fiendRank.addEventListener('change', () => {
    updateCardRegenAndMetadata();
  });
  els.useGeminiApi.addEventListener('change', () => {
    els.apiGroup.style.display = els.useGeminiApi.checked ? 'block' : 'none';
  });
  
  const btnToggle = document.getElementById('btnToggleApiKeyVisibility');
  if (btnToggle) {
    btnToggle.addEventListener('click', () => {
      const input = els.geminiApiKey;
      const icon = btnToggle.querySelector('.material-icons');
      if (input.type === 'password') {
        input.type = 'text';
        icon.textContent = 'visibility_off';
      } else {
        input.type = 'password';
        icon.textContent = 'visibility';
      }
    });
  }
  
  // Slider displays
  els.astraLevel.addEventListener('input', () => {
    els.levelVal.textContent = els.astraLevel.value;
  });
  els.variance.addEventListener('input', () => {
    els.varianceVal.textContent = `±${els.variance.value}`;
  });
  
  // Roll button
  els.btnGenerate.addEventListener('click', () => generateMonster(false));
  
  // Export/Import actions
  els.btnExportTxt.addEventListener('click', exportToTxt);
  els.btnExportJson.addEventListener('click', exportToJson);
  els.btnCopy.addEventListener('click', copyToClipboard);
  
  // JSON Import handling
  const jsonInput = document.getElementById('creatureJsonInput');
  const btnUploadJson = document.getElementById('btnUploadJson');
  if (jsonInput && btnUploadJson) {
    btnUploadJson.addEventListener('click', () => {
      jsonInput.click();
    });
    jsonInput.addEventListener('change', () => {
      const file = jsonInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result);
            importFromJson(data);
          } catch (err) {
            alert('Failed to parse JSON file: ' + err.message);
          }
        };
        reader.readAsText(file);
        jsonInput.value = ''; // Reset file input
      }
    });
  }
  
  // AI Gen
  els.btnAiGen.addEventListener('click', handleAiGeneration);
  
  // Full AI Generators
  els.btnAiGenFromName.addEventListener('click', () => handleFullGeneration('name'));
  els.btnAiGenFullyRandom.addEventListener('click', () => handleFullGeneration('random'));
  els.btnAiGenGrunt.addEventListener('click', () => handleFullGeneration('rank', 'grunt'));
  els.btnAiGenHeroic.addEventListener('click', () => handleFullGeneration('rank', 'heroic'));
  els.btnAiGenBoss.addEventListener('click', () => handleFullGeneration('rank', 'boss'));


  // Load API key from local storage
  if (localStorage.getItem('gemini_api_key')) {
    els.geminiApiKey.value = localStorage.getItem('gemini_api_key');
    els.useGeminiApi.checked = true;
    els.apiGroup.style.display = 'block';
  }

  // Set card sync listeners for manual changes
  setupCardSyncListeners();

  // Setup portrait event listeners
  setupPortraitHandlers();

  } catch (e) {
    console.error('[init] Error during early init:', e);
  }

  // Session Deck binding — ALWAYS runs even if above code throws
  try {
  // Setup Session Deck event listeners
  document.getElementById('btnAddToDeck').addEventListener('click', addToSessionDeck);
  document.getElementById('btnExportDeck').addEventListener('click', exportSessionDeck);
  document.getElementById('btnImportDeck').addEventListener('click', () => {
    document.getElementById('deckImportInput').click();
  });
  document.getElementById('deckImportInput').addEventListener('change', importSessionDeck);
  document.getElementById('btnStartSession').addEventListener('click', enterSessionMode);
  document.getElementById('btnExitSession').addEventListener('click', exitSessionMode);
  var hpInput = document.getElementById('hpDirectInput');
  if (hpInput) hpInput.addEventListener('input', handleHpDirectInput);

  // Load Session Deck from LocalStorage
  loadDeckFromLocalStorage();

  // Load Roll20 format preference
  const savedFormat = localStorage.getItem('roll20_output_format');
  if (savedFormat) {
    window.setRoll20Format(savedFormat);
  }

  // Bind Toughness Save events
  var btnTSCard = document.getElementById('btnToughnessSaveCard');
  var btnTSSession = document.getElementById('btnToughnessSaveSession');
  if (btnTSCard) btnTSCard.addEventListener('click', copyToughnessSaveMacro);
  if (btnTSSession) btnTSSession.addEventListener('click', copyToughnessSaveMacro);

  // Bind Quick Attack Roll events
  var btnQL = document.getElementById('btnQuickLightAttack');
  var btnQH = document.getElementById('btnQuickHeavyAttack');
  var btnQP = document.getElementById('btnQuickPreciseAttack');
  if (btnQL) btnQL.addEventListener('click', () => copyQuickAttack('light'));
  if (btnQH) btnQH.addEventListener('click', () => copyQuickAttack('heavy'));
  if (btnQP) btnQP.addEventListener('click', () => copyQuickAttack('precise'));

  } catch (e) {
    console.error('[init] Error binding session deck:', e);
  }

  // Load default custom preset
  try {
  setupTokenCutter();
  handlePresetChange();
  initExpeditionSuite();
  } catch (e) {
    console.error('[init] Error in final setup:', e);
  }
}


// Preset Handler
function handlePresetChange() {
  const p = {
    name: 'Void Stalker',
    rank: 'heroic',
    level: 2,
    isFiend: false,
    fiendRank: 'heroic',
    hpTarget: 'average',
    focusTarget: 'average',
    powerTarget: 'average',
    agilityTarget: 'average',
    toughnessTarget: 'average',
    stats: {
      hp: 60,
      focus: 4,
      power: 4,
      agility: 4,
      toughness: 4
    },
    abilities: [
      { name: 'Void Camouflage', desc: 'Gains +3 to Stealth rolls when in dim light or darkness.' }
    ],
    actions: [
      { name: 'Claw Strike', cost: '1 AP', desc: 'Light Attack (1 AP): 1d20 + Focus to hit Evasion. Deals [Power + 2] physical damage on hit.' }
    ]
  };
  
  currentMonster = JSON.parse(JSON.stringify(p));
  
  els.monsterName.value = p.name;
  els.monsterRank.value = p.rank;
  els.astraLevel.value = p.level;
  els.levelVal.textContent = p.level;
  els.isFiend.checked = p.isFiend;
  els.fiendRankGroup.style.display = p.isFiend ? 'block' : 'none';
  els.fiendRank.value = p.fiendRank || 'grunt';
  
  els.statHP.value = p.hpTarget;
  els.statFocus.value = p.focusTarget;
  els.statPower.value = p.powerTarget;
  els.statAgility.value = p.agilityTarget;
  els.statToughness.value = p.toughnessTarget;
  
  // Update theme glow based on rank
  updateThemeGlow(p.rank);
  
  // Apply preset stats directly or roll them
  generateMonster(true); // pass true to use preset default ranges directly

  // Clear portrait
  const img = document.getElementById('portraitImage');
  const placeholder = document.getElementById('portraitPlaceholder');
  const removeBtn = document.getElementById('btnRemovePortrait');
  if (img) {
    img.src = '';
    img.style.display = 'none';
    placeholder.style.display = 'flex';
    if (removeBtn) removeBtn.style.display = 'none';
  }
}

// Update UI Theme Border Glow based on Monster Rank
function updateThemeGlow(rank) {
  els.monsterCard.classList.remove('glow-grunt', 'glow-heroic', 'glow-boss');
  if (rank === 'grunt') {
    els.monsterCard.classList.add('glow-grunt');
  } else if (rank === 'heroic') {
    els.monsterCard.classList.add('glow-heroic');
  } else if (rank === 'boss') {
    els.monsterCard.classList.add('glow-boss');
  }
}

// Random Number Generator in range [min, max]
function randRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Calculate Speed based on rank and Agility value
function calculateSpeedForAgility(rank, ag, useRawPresets = false) {
  let isHighOrVeryHigh = false;
  if (rank === 'grunt' && ag >= 4) isHighOrVeryHigh = true;
  else if (rank === 'heroic' && ag >= 5) isHighOrVeryHigh = true;
  else if (rank === 'boss' && ag >= 6) isHighOrVeryHigh = true;

  if (isHighOrVeryHigh) {
    if (useRawPresets) {
      return 20; // Average remains 20 since 25/30 is rare
    }
    const roll = Math.random();
    if (roll < 0.05) return 30; // 5% chance
    if (roll < 0.15) return 25; // 10% chance
    return 20;
  }
  return 20;
}

// Main Generation Engine
function generateMonster(useRawPresets = false) {
  const name = els.monsterName.value.trim() || 'Void Stalker';
  const rank = els.monsterRank.value;
  const level = parseInt(els.astraLevel.value);
  const isFiend = els.isFiend.checked;
  const fRank = els.fiendRank.value;
  const variance = parseInt(els.variance.value);
  
  updateThemeGlow(rank);
  
  // 1. Calculate Level Stat Modifier for HP (unchanged)
  const levelMod = (level <= 3) ? (level - 2) : (level - 1);
  
  let focus, power, agility, toughness, hpVal;
  
  // 2. Generate Primary Stats with Budget System
  // Base stat totals at Astra Level 2
  const STAT_BUDGETS = {
    grunt:  [13, 14],
    heroic: [18, 19],
    boss:   [22, 24]
  };
  
  // Calculate level offset for stat budget
  // Each level above 2 adds +1, except level 4 adds +2
  let budgetOffset = 0;
  for (let lvl = 3; lvl <= level; lvl++) {
    budgetOffset += (lvl === 4) ? 2 : 1;
  }
  
  const budgetMin = STAT_BUDGETS[rank][0] + budgetOffset;
  const budgetMax = STAT_BUDGETS[rank][1] + budgetOffset;
  const totalBudget = useRawPresets
    ? Math.round((budgetMin + budgetMax) / 2)
    : randRange(budgetMin, budgetMax);
  
  // Weight map: how the target ratings influence distribution
  const RATING_WEIGHTS = {
    'very-low':  1,
    'low':       2,
    'average':   3,
    'high':      4,
    'very-high': 5
  };
  
  const targets = [
    { name: 'focus',     rating: els.statFocus.value },
    { name: 'power',     rating: els.statPower.value },
    { name: 'agility',   rating: els.statAgility.value },
    { name: 'toughness', rating: els.statToughness.value }
  ];
  
  const totalWeight = targets.reduce((sum, t) => sum + RATING_WEIGHTS[t.rating], 0);
  
  // Distribute budget proportionally by weight, then apply variance
  let distributed = targets.map(t => {
    const weight = RATING_WEIGHTS[t.rating];
    let base = Math.round((weight / totalWeight) * totalBudget);
    // Apply variance jitter per stat
    if (!useRawPresets && variance > 0) {
      base += randRange(-variance, variance);
    }
    return Math.max(1, base);
  });
  
  // Adjust to hit exact budget: add/subtract from the highest-weighted stat
  let currentTotal = distributed.reduce((a, b) => a + b, 0);
  const diff = totalBudget - currentTotal;
  if (diff !== 0) {
    // Find the stat with the highest weight to absorb the difference
    let adjustIdx = 0;
    let maxWeight = 0;
    targets.forEach((t, i) => {
      if (RATING_WEIGHTS[t.rating] > maxWeight) {
        maxWeight = RATING_WEIGHTS[t.rating];
        adjustIdx = i;
      }
    });
    distributed[adjustIdx] = Math.max(1, distributed[adjustIdx] + diff);
  }
  
  focus     = distributed[0];
  power     = distributed[1];
  agility   = distributed[2];
  toughness = distributed[3];
  
  // 3. Generate HP with Level Scaling (unchanged)
  const hpBaseRange = STAT_BANDS[rank].hp[els.statHP.value];
  let hpBase = useRawPresets ? Math.round((hpBaseRange[0] + hpBaseRange[1]) / 2) : randRange(hpBaseRange[0], hpBaseRange[1]);
  
  let hpLevelOffset = 0;
  if (rank === 'grunt') {
    hpLevelOffset = (level <= 3) ? (level - 2) * 5 : (level - 1) * 5;
  } else if (rank === 'heroic') {
    hpLevelOffset = (level <= 3) ? (level - 2) * 10 : (level - 1) * 10;
  } else if (rank === 'boss') {
    hpLevelOffset = (level <= 3) ? (level - 2) * 30 : (level - 1) * 30;
  }
  
  hpVal = hpBase + hpLevelOffset;
  if (!useRawPresets && variance > 0) {
    const hpVar = rank === 'grunt' ? 2 : rank === 'heroic' ? 5 : 15;
    hpVal += randRange(-hpVar * variance, hpVar * variance);
  }
  hpVal = Math.max(1, hpVal);
  
  // 4. Derived Combat Stats
  const evasionVal = 7 + agility;
  
  let apVal = 4;
  let rpVal = 2 + agility;
  if (rank === 'grunt') {
    apVal = 2;
    rpVal = 1;
  } else if (rank === 'boss') {
    apVal = 6;
  }
  
  // 4b. Determine Speed (always defaults to 20ft, unless agility is high/very-high, then consider 25-30 rarely)
  const speedVal = calculateSpeedForAgility(rank, agility, useRawPresets);
  const speedBlocksVal = Math.floor(speedVal / 5);
  
  // 5. Update Preview Card DOM
  els.cardName.textContent = name;
  els.cardMeta.textContent = `${rank.charAt(0).toUpperCase() + rank.slice(1)} - Astra Level ${level} - ${isFiend ? 'Fiend' : 'Beast'}`;
  
  els.cardHP.textContent = hpVal;
  els.cardAP.textContent = apVal;
  els.cardRP.textContent = rpVal;
  els.cardEvasion.textContent = evasionVal;
  
  document.getElementById('cardSpeed').textContent = speedVal;
  document.getElementById('cardSpeedBlocks').textContent = `${speedBlocksVal} blocks`;
  
  document.getElementById('defenseEvasion').textContent = evasionVal;
  document.getElementById('defenseDodge').textContent = 20 + agility;
  document.getElementById('defenseGuard').textContent = toughness;
  document.getElementById('defenseBlock').textContent = toughness * 2;
  
  els.cardFocus.textContent = focus;
  els.cardPower.textContent = power;
  els.cardAgility.textContent = agility;
  els.cardToughness.textContent = toughness;
  
  // 6. Handle Fiend Regeneration and Metadata
  updateCardRegenAndMetadata();
  
  // 7. Update action and ability text descriptions (evaluating formulas)
  if (currentMonster) {
    populateAbilitiesAndActions(currentMonster.abilities, currentMonster.actions);
  }
}

// Calculate Individual Stat
function calculateStat(statName, targetRating, rank, levelMod, variance, useRawPresets) {
  const range = STAT_BANDS[rank].stat[targetRating];
  // Pick center or random
  let baseVal = useRawPresets ? Math.round((range[0] + range[1]) / 2) : randRange(range[0], range[1]);
  
  let finalVal = baseVal + levelMod;
  
  // Apply variance randomness
  if (!useRawPresets && variance > 0) {
    finalVal += randRange(-variance, variance);
  }
  
  return Math.max(1, finalVal);
}

// Render Abilities & Actions to DOM
function populateAbilitiesAndActions(abilities, actions) {
  els.abilitiesList.innerHTML = '';
  els.actionsList.innerHTML = '';
  
  const stats = {
    focus: parseInt(els.cardFocus.textContent) || 0,
    power: parseInt(els.cardPower.textContent) || 0,
    agility: parseInt(els.cardAgility.textContent) || 0,
    toughness: parseInt(els.cardToughness.textContent) || 0
  };
  
  abilities.forEach(ab => {
    addAbilityItem(ab.name, ab.desc, stats);
  });
  
  actions.forEach(ac => {
    addActionItem(ac.name, ac.cost, ac.desc, stats);
  });
}

// Sync Card Items changes to currentMonster state
function syncCardItemsToCurrentMonster() {
  if (!currentMonster) return;
  
  const abilities = [];
  els.abilitiesList.querySelectorAll('.item-row').forEach(row => {
    const title = row.querySelector('.item-title').textContent.trim();
    const descDiv = row.querySelector('.item-desc');
    const rawDesc = descDiv.getAttribute('data-raw-desc') || descDiv.textContent.trim();
    abilities.push({ name: title, desc: rawDesc });
  });
  
  const actions = [];
  els.actionsList.querySelectorAll('.item-row').forEach(row => {
    const title = row.querySelector('.item-title').textContent.trim();
    const costSpan = row.querySelector('.item-cost');
    const cost = costSpan ? costSpan.textContent.trim() : '1 AP';
    const descDiv = row.querySelector('.item-desc');
    const rawDesc = descDiv.getAttribute('data-raw-desc') || descDiv.textContent.trim();
    actions.push({ name: title, cost, desc: rawDesc });
  });
  
  currentMonster.abilities = abilities;
  currentMonster.actions = actions;
}

// Add Single Ability to DOM
function addAbilityItem(name = 'Ability Name', desc = 'Ability Description...', stats = null) {
  if (!stats) {
    stats = {
      focus: parseInt(els.cardFocus.textContent) || 0,
      power: parseInt(els.cardPower.textContent) || 0,
      agility: parseInt(els.cardAgility.textContent) || 0,
      toughness: parseInt(els.cardToughness.textContent) || 0
    };
  }
  const evaluatedDesc = evaluateDescription(desc, stats);
  
  const li = document.createElement('li');
  li.className = 'item-row';
  
  const header = document.createElement('div');
  header.className = 'item-header';
  
  const title = document.createElement('span');
  title.className = 'item-title editable';
  title.contentEditable = !sessionWorkspaceActive;
  title.textContent = name;
  title.addEventListener('input', syncCardItemsToCurrentMonster);
  
  const delBtn = document.createElement('button');
  delBtn.className = 'btn-remove-item';
  delBtn.innerHTML = `<i class="material-icons">delete</i>`;
  delBtn.addEventListener('click', () => {
    li.remove();
    syncCardItemsToCurrentMonster();
  });
  
  header.appendChild(title);
  header.appendChild(delBtn);
  
  const descDiv = document.createElement('div');
  descDiv.className = 'item-desc editable';
  descDiv.contentEditable = !sessionWorkspaceActive;
  descDiv.setAttribute('data-raw-desc', desc);
  descDiv.textContent = evaluatedDesc;
  descDiv.addEventListener('input', () => {
    descDiv.setAttribute('data-raw-desc', descDiv.textContent);
    syncCardItemsToCurrentMonster();
  });
  
  li.appendChild(header);
  li.appendChild(descDiv);
  
  els.abilitiesList.appendChild(li);
}

// Add Single Action to DOM
function addActionItem(name = 'Action Name', cost = '1 AP', desc = 'Action Description...', stats = null) {
  if (!stats) {
    stats = {
      focus: parseInt(els.cardFocus.textContent) || 0,
      power: parseInt(els.cardPower.textContent) || 0,
      agility: parseInt(els.cardAgility.textContent) || 0,
      toughness: parseInt(els.cardToughness.textContent) || 0
    };
  }
  const evaluatedDesc = evaluateDescription(desc, stats);
  
  const li = document.createElement('li');
  li.className = 'item-row';
  
  const header = document.createElement('div');
  header.className = 'item-header';
  
  const titleCostWrapper = document.createElement('div');
  
  const title = document.createElement('span');
  title.className = 'item-title editable';
  title.contentEditable = !sessionWorkspaceActive;
  title.textContent = name;
  title.addEventListener('input', syncCardItemsToCurrentMonster);
  
  const costSpan = document.createElement('span');
  costSpan.className = 'item-cost editable';
  costSpan.contentEditable = !sessionWorkspaceActive;
  costSpan.textContent = cost;
  costSpan.addEventListener('input', syncCardItemsToCurrentMonster);
  
  titleCostWrapper.appendChild(title);
  titleCostWrapper.appendChild(costSpan);
  
  const delBtn = document.createElement('button');
  delBtn.className = 'btn-remove-item';
  delBtn.innerHTML = `<i class="material-icons">delete</i>`;
  delBtn.addEventListener('click', () => {
    li.remove();
    syncCardItemsToCurrentMonster();
  });
  
  header.appendChild(titleCostWrapper);
  header.appendChild(delBtn);
  
  const descDiv = document.createElement('div');
  descDiv.className = 'item-desc editable';
  descDiv.contentEditable = !sessionWorkspaceActive;
  descDiv.setAttribute('data-raw-desc', desc);
  descDiv.textContent = evaluatedDesc;
  descDiv.addEventListener('input', () => {
    descDiv.setAttribute('data-raw-desc', descDiv.textContent);
    syncCardItemsToCurrentMonster();
  });
  
  li.appendChild(header);
  li.appendChild(descDiv);
  
  els.actionsList.appendChild(li);
}

// Action triggers inside Card
window.addAbilityRow = function() {
  addAbilityItem();
};

window.addActionRow = function() {
  addActionItem();
};

// Re-evaluate description text on card dynamically when stats are edited
function reevaluateCardDescriptions() {
  const stats = {
    focus: parseInt(els.cardFocus.textContent) || 0,
    power: parseInt(els.cardPower.textContent) || 0,
    agility: parseInt(els.cardAgility.textContent) || 0,
    toughness: parseInt(els.cardToughness.textContent) || 0
  };
  
  els.abilitiesList.querySelectorAll('.item-row').forEach(row => {
    const descDiv = row.querySelector('.item-desc');
    const rawDesc = descDiv.getAttribute('data-raw-desc') || descDiv.textContent.trim();
    descDiv.textContent = evaluateDescription(rawDesc, stats);
  });
  
  els.actionsList.querySelectorAll('.item-row').forEach(row => {
    const descDiv = row.querySelector('.item-desc');
    const rawDesc = descDiv.getAttribute('data-raw-desc') || descDiv.textContent.trim();
    descDiv.textContent = evaluateDescription(rawDesc, stats);
  });
}

// Sync Card Stats changes to currentMonster state
function syncCardStatsToCurrentMonster() {
  if (!currentMonster) return;
  if (!currentMonster.stats) currentMonster.stats = {};
  currentMonster.stats.focus = parseInt(els.cardFocus.textContent) || 0;
  currentMonster.stats.power = parseInt(els.cardPower.textContent) || 0;
  currentMonster.stats.agility = parseInt(els.cardAgility.textContent) || 0;
  currentMonster.stats.toughness = parseInt(els.cardToughness.textContent) || 0;
  currentMonster.stats.hp = parseInt(els.cardHP.textContent) || 0;
}

function updateCardRegenAndMetadata() {
  const rank = els.monsterRank.value;
  const level = parseInt(els.astraLevel.value) || 2;
  const isFiend = els.isFiend.checked;
  const fRank = els.fiendRank.value;
  const toughness = parseInt(els.cardToughness.textContent) || 0;

  // Update card metadata subtitle (Fiend vs Beast)
  els.cardMeta.textContent = `${rank.charAt(0).toUpperCase() + rank.slice(1)} - Astra Level ${level} - ${isFiend ? 'Fiend' : 'Beast'}`;

  // Handle Regeneration Container display and values
  if (isFiend) {
    els.cardRegenContainer.style.display = 'flex';
    let regenVal = 0;
    if (fRank === 'grunt') {
      regenVal = toughness;
      els.cardRegenContainer.querySelector('strong').textContent = "Lesser Fiend Regen:";
    } else if (fRank === 'heroic') {
      regenVal = 9 + toughness;
      els.cardRegenContainer.querySelector('strong').textContent = "Elite Kratos Regen:";
    } else if (fRank === 'boss') {
      regenVal = 24 + toughness;
      els.cardRegenContainer.querySelector('strong').textContent = "Boss Kratos Regen:";
    } else if (fRank === 'exousia') {
      regenVal = 10 * toughness;
      els.cardRegenContainer.querySelector('strong').textContent = "Exousiai Regen:";
    }
    els.cardRegenVal.textContent = regenVal;
  } else {
    els.cardRegenContainer.style.display = 'none';
  }

  // Sync to currentMonster if it exists
  if (currentMonster) {
    currentMonster.isFiend = isFiend;
    currentMonster.fiendRank = fRank;
    currentMonster.regenVal = isFiend ? els.cardRegenVal.textContent : '0';
  }
}

// Setup Listeners for Live Editing Sync
function setupCardSyncListeners() {
  // If user edits Agility, auto-update Evasion, Dodge, Speed, and RP
  els.cardAgility.addEventListener('input', () => {
    const ag = parseInt(els.cardAgility.textContent) || 0;
    els.cardEvasion.textContent = 7 + ag;
    document.getElementById('defenseEvasion').textContent = 7 + ag;
    document.getElementById('defenseDodge').textContent = 20 + ag;
    
    // Update Speed based on Agility (always defaults to 20ft, unless agility is high/very-high, then consider 25-30 rarely)
    const rank = els.monsterRank.value;
    const speedVal = calculateSpeedForAgility(rank, ag, false);
    document.getElementById('cardSpeed').textContent = speedVal;
    document.getElementById('cardSpeedBlocks').textContent = `${Math.floor(speedVal / 5)} blocks`;
    
    // Only update RP if it's Heroic or Boss (Grunts stay 1 RP)
    if (rank !== 'grunt') {
      els.cardRP.textContent = 2 + ag;
    }
    
    syncCardStatsToCurrentMonster();
    reevaluateCardDescriptions();
  });

  // If user edits Toughness, update Guard, Block, and Regen
  els.cardToughness.addEventListener('input', () => {
    const tg = parseInt(els.cardToughness.textContent) || 0;
    document.getElementById('defenseGuard').textContent = tg;
    document.getElementById('defenseBlock').textContent = tg * 2;
    
    const isFiend = els.isFiend.checked;
    if (isFiend) {
      const fRank = els.fiendRank.value;
      let regenVal = 0;
      
      if (fRank === 'grunt') {
        regenVal = tg;
      } else if (fRank === 'heroic') {
        regenVal = 9 + tg;
      } else if (fRank === 'boss') {
        regenVal = 24 + tg;
      } else if (fRank === 'exousia') {
        regenVal = 10 * tg;
      }
      els.cardRegenVal.textContent = regenVal;
    }
    
    syncCardStatsToCurrentMonster();
    reevaluateCardDescriptions();
  });

  // If user edits Focus, trigger description re-evaluation
  els.cardFocus.addEventListener('input', () => {
    syncCardStatsToCurrentMonster();
    reevaluateCardDescriptions();
  });

  // If user edits Power, trigger description re-evaluation
  els.cardPower.addEventListener('input', () => {
    syncCardStatsToCurrentMonster();
    reevaluateCardDescriptions();
  });

  // If user edits HP directly on the card
  els.cardHP.addEventListener('input', () => {
    syncCardStatsToCurrentMonster();
  });

  // If user edits Speed directly
  document.getElementById('cardSpeed').addEventListener('input', () => {
    const ft = parseInt(document.getElementById('cardSpeed').textContent) || 0;
    document.getElementById('cardSpeedBlocks').textContent = `${Math.floor(ft / 5)} blocks`;
    if (currentMonster) {
      currentMonster.speed = ft.toString();
      currentMonster.speedBlocks = `${Math.floor(ft / 5)} blocks`;
    }
  });
}

// ==========================================
// AI Generation Features
// ==========================================

// Helper to retrieve and clean the API key
function getCleanApiKey() {
  if (!els.geminiApiKey) return '';
  return els.geminiApiKey.value.trim().replace(/^["']|["']$/g, '');
}

async function handleAiGeneration() {
  const desc = els.creatureDesc.value.trim();
  if (!desc) {
    alert('Please write a short description of the creature first!');
    return;
  }
  
  const useApi = els.useGeminiApi.checked;
  const apiKey = getCleanApiKey();
  
  // Set button state to loading
  const originalHtml = els.btnAiGen.innerHTML;
  els.btnAiGen.disabled = true;
  els.btnAiGen.innerHTML = `<i class="material-icons rotating">sync</i> Generating...`;
  
  try {
    let abilities = [];
    let actions = [];
    
    if (useApi && apiKey) {
      // Save key locally
      localStorage.setItem('gemini_api_key', apiKey);
      
      // Call Gemini API client-side
      const data = await callGeminiApi(apiKey, desc);
      abilities = data.abilities || [];
      actions = data.actions || [];
    } else {
      // Local Template Keyword Generator (Offline fallback)
      const data = generateOfflineAbilities(desc);
      abilities = data.abilities;
      actions = data.actions;
    }
    
    // Populate card
    populateAbilitiesAndActions(abilities, actions);
    
  } catch (error) {
    console.error(error);
    let msg = error.message;
    if (msg.includes('API key not valid')) {
      msg += "\n\nPro Tip: Make sure you copied your key correctly from Google AI Studio (https://aistudio.google.com/) and that it doesn't have restrictions limiting the Generative Language API. Click the eye icon next to the input to verify your key starts with 'AIzaSy' or 'AQ.'.";
    }
    alert(`Generation failed: ${msg}. Falling back to offline generator.`);
    // Fallback
    const data = generateOfflineAbilities(desc);
    populateAbilitiesAndActions(data.abilities, data.actions);
  } finally {
    els.btnAiGen.disabled = false;
    els.btnAiGen.innerHTML = originalHtml;
  }
}

// Call Gemini API 3.5 Flash
async function callGeminiApi(apiKey, description) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent`;
  
  const rank = els.monsterRank.value;
  const ap = els.cardAP.textContent;
  const rp = els.cardRP.textContent;
  
  const systemPrompt = `You are a professional monster designer for the tabletop RPG "Angel's Sword RPG: The Lyrian Chronicles". 
Your task is to design creature Abilities and Actions.

Here are the rules of the system:
- Monsters have up to 6 Abilities (passive traits, immunities, resistances) and up to 6 Actions (attacks, movements, spells).
- Abilities and actions cost Action Points (AP) or Reaction Points (RP).
- Standard AP budget: Grunts have 2 AP. Heroics have 4 AP. Bosses have 6 AP.
- Actions MUST state their AP/RP cost in the cost field, e.g. "1 AP", "2 AP", "3 AP", or "Reaction" (spends RP).
- Stuns: DO NOT use abilities that Stun unless they require a complex setup and are used as a punish. Never stun on basic hits.
- Regeneration: Fiends have regen. Grunts = 1x Toughness, Heroics = 9+Toughness, Bosses = 24+Toughness.

CRITICAL RULES FOR ATTACKS AND ACCURACY:
- DO NOT use generic D&D vocabulary. There is NO creature level scaling for damage, NO "DC [X]", and NO "Agility Save", "Reason Save", or "Strength Save".
- Every attack action description MUST be labeled as one of these three exact formats:
  1. Light Attack (1 AP): 1d20 + Focus to hit Evasion. Deals [2d4 + Power] [damage type] damage.
  2. Heavy Attack (2 AP): 1d20 + Focus to hit Evasion. Deals [4d6 + Power * 2] [damage type] damage.
  3. Precise Attack (2 AP): 1d20 + Focus * 2 to hit Evasion. Deals [2d4 + Power] [damage type] damage. Has Pinpoint equal to Focus.
- Damage (X, Y, Z) must be formulaic, scaling with Power or Focus (e.g. "Power + 2" or "2d6 + Focus"), or be flat (e.g. "2d4"). NEVER use creature Level or Astra Level in damage scaling.
- Any action/spell that forces a target to resist a status condition or magical effect MUST use this exact text:
  "Target must roll a Toughness check (2d10 + Toughness) against the caster's Potency (11 + Focus) to resist/avoid [condition]."
  Never say "saving throw" or "DC [Focus + 10]". All magical/effect saves use the target's Toughness roll against the caster's Potency.

You must design abilities and actions that utilize the official keywords and conditions of the system:
Keywords:
- Circuit: Reduces action cost by 1 for the first use in combat.
- Combo: Special bonus when used sequentially after another specific action.
- Concentration: Sustained spell/effects (character can only maintain 1 concentration at a time).
- Rapid: Fast actions (low AP cost or bonus actions).
- Lock On: Focuses target for accuracy bonus.
- Sanctify: Infuses attacks with Holy damage.
- Augment: Enhances/modifies subsequent actions.
Conditions:
- Bleeding: Target takes 1d6 true damage at the start of their turn.
- Burning: Target takes X fire damage at the end of their turn (costs 1 AP to extinguish). Re-inflicting Burning immediately triggers existing Burning value as damage.
- Blinded: Imposes accuracy penalties (-4). Blinded 3 or higher disables ranged attacks.
- Weakened: Reduces roll results (e.g. -2) or primary stats.
- Poisoned: Deals damage over time or action penalties from venom.
- Challenge: Taunt/forced aggro (penalties if target attacks anyone other than the challenger).
- Silenced: Prevents casting spells or activating magical abilities.

Generate 2-3 custom thematic Abilities and 2-3 custom Actions for a creature based on the user's description. Use these keywords and conditions where appropriate.
Output ONLY a JSON block, with no markdown tags or other formatting. The JSON must match this structure exactly:
{
  "abilities": [
    { "name": "Ability Name", "desc": "Clean details..." }
  ],
  "actions": [
    { "name": "Action Name", "cost": "1 AP", "desc": "Clean details..." }
  ]
}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: `${systemPrompt}\n\nCreature Description:\n${description}` }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json"
    }
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    let errMsg = response.statusText;
    try {
      const errText = await response.text();
      const errJson = JSON.parse(errText);
      if (errJson && errJson.error && errJson.error.message) {
        errMsg = errJson.error.message;
      } else {
        errMsg = errText || response.statusText;
      }
    } catch (e) {
      // fallback
    }
    throw new Error(errMsg);
  }
  
  const resData = await response.json();
  const textResponse = resData.candidates[0].content.parts[0].text;
  return JSON.parse(textResponse);
}

// Local Keyword-based Offline generator
function generateOfflineAbilities(desc) {
  const d = desc.toLowerCase();
  
  let abilities = [];
  let actions = [];
  
  // Element detection
  let element = 'Void';
  if (d.includes('fire') || d.includes('flame') || d.includes('heat') || d.includes('burn')) element = 'Fire';
  else if (d.includes('ice') || d.includes('frost') || d.includes('cold') || d.includes('snow') || d.includes('freeze')) element = 'Ice';
  else if (d.includes('shadow') || d.includes('dark') || d.includes('void')) element = 'Shadow';
  else if (d.includes('poison') || d.includes('toxic') || d.includes('acid') || d.includes('venom')) element = 'Toxic';
  else if (d.includes('lightning') || d.includes('electric') || d.includes('thunder') || d.includes('storm')) element = 'Storm';
  else if (d.includes('light') || d.includes('holy') || d.includes('angelic')) element = 'Holy';
  
  // 1. General Abilities based on keywords
  if (d.includes('fly') || d.includes('flight') || d.includes('wings') || d.includes('bird')) {
    abilities.push({ name: 'Flight (Ability)', desc: 'The creature possesses wings, allowing it to ignore ground terrain difficulties and move over gaps.' });
  }
  
  if (d.includes('hide') || d.includes('stealth') || d.includes('shadow') || d.includes('stalk')) {
    abilities.push({ name: 'Shadow Cloak (Ability)', desc: 'Stealth keyword. Gains +3 to Stealth checks. The creature can take the Hide action as a minor action.' });
  } else if (d.includes('undead') || d.includes('skeleton') || d.includes('bone') || d.includes('zombie')) {
    abilities.push({ name: 'Undead Resilience (Ability)', desc: 'Immune to all mind-affecting effects. Immune to Poisoned and Bleeding conditions. Takes half damage from piercing weapon attacks.' });
  } else {
    abilities.push({ name: `${element} Essence (Ability)`, desc: `Immune to ${element} damage but takes double damage from opposing elements (Vulnerability).` });
  }
  
  // Threat/Fear or support
  if (d.includes('fear') || d.includes('terrify') || d.includes('scary') || d.includes('roar') || d.includes('growl')) {
    abilities.push({ name: 'Terrifying Roar (Ability)', desc: 'Challenge keyword. Enemies starting their turn within 15ft of the creature must roll a Toughness check (2d10 + Toughness) against Potency (11 + Focus) or take Weakened (debuffs all physical checks by -2) for 1 round.' });
  } else if (d.includes('combo') || d.includes('rapid') || d.includes('swift') || d.includes('fast')) {
    abilities.push({ name: 'Furious Combo (Ability)', desc: 'Combo keyword. After hitting with a Light Attack, the creature can follow up with a minor attack with +2 accuracy.' });
  } else {
    abilities.push({ name: 'Combat Instincts (Ability)', desc: 'Lock On keyword. Gains +2 accuracy against its target when it marks them with its focus.' });
  }
  
  // 2. Actions
  if (d.includes('bite') || d.includes('fang') || d.includes('mouth')) {
    actions.push({ name: 'Feral Bite', cost: '1 AP', desc: 'Light Attack (1 AP): 1d20 + Focus to hit Evasion. Deals [2d4 + Power] physical damage. Target must roll a Toughness check (2d10 + Toughness) against Potency (11 + Focus) or suffer Bleeding (takes 1d6 true damage at the start of their turn for 2 rounds).' });
  } else if (d.includes('claw') || d.includes('slash') || d.includes('talon') || d.includes('scratch')) {
    actions.push({ name: 'Rending Claws', cost: '1 AP', desc: 'Light Attack (1 AP): 1d20 + Focus to hit Evasion. Deals [2d4 + Power] physical damage. Applies Bleeding condition. If the target has Guard, shred 2 points of Guard.' });
  } else if (element === 'Fire') {
    actions.push({ name: 'Searing Flame', cost: '1 AP', desc: 'Light Attack (1 AP): 1d20 + Focus to hit Evasion. Ranged 30ft. Deals [2d4 + Focus] fire damage and inflicts Burning 2 (takes 2 fire damage at end of turn). If target is already Burning, triggers existing Burning damage immediately.' });
  } else if (element === 'Holy') {
    actions.push({ name: 'Divine Judgment', cost: '2 AP', desc: 'Precise Attack (2 AP): 1d20 + Focus * 2 to hit Evasion. Sanctify keyword. Deals [2d4 + Focus] Holy damage. Has Pinpoint equal to Focus. Target must roll a Toughness check (2d10 + Toughness) against Potency (11 + Focus) or suffer Blinded 2 (imposes -4 to accuracy checks) on hit.' });
  } else {
    actions.push({ name: `${element} Strike`, cost: '1 AP', desc: `Light Attack (1 AP): 1d20 + Focus to hit Evasion. Melee range. Deals [2d4 + Power] physical damage + [Focus] ${element} magical damage. Target must roll a Toughness check (2d10 + Toughness) against Potency (11 + Focus) or suffer Weakened (-2 to checks) on hit.` });
  }
  
  // Special Active Action
  if (d.includes('teleport') || d.includes('blink') || d.includes('warp')) {
    actions.push({ name: 'Warp Step', cost: '2 AP', desc: 'Rapid keyword (2 AP): Teleport up to 45ft to an unoccupied space within line of sight. Grants +2 Evasion until the start of its next turn.' });
  } else if (d.includes('breath') || d.includes('blast') || d.includes('shoot') || element === 'Fire') {
    actions.push({ name: `${element} Blast`, cost: '2 AP', desc: `Heavy Attack (2 AP): Spews a 20ft cone of ${element}. All targets must roll a Toughness check (2d10 + Toughness) against Potency (11 + Focus). On failure, they take [Focus + Power] damage and suffer Blinded 2, or take half damage on success.` });
  } else if (d.includes('heal') || d.includes('regenerate') || d.includes('drain')) {
    actions.push({ name: 'Life Drain', cost: '2 AP', desc: 'Concentration keyword (2 AP): Ranged 30ft. Deals [Focus] magical damage and heals the creature for the damage dealt. Target must roll a Toughness check (2d10 + Toughness) against Potency (11 + Focus) to resist. Caster must sustain concentration.' });
  } else {
    actions.push({ name: 'Frenzy', cost: '2 AP', desc: 'Heavy Attack (2 AP): Make two Light Attacks against the same target. If both hit, target must roll a Toughness check (2d10 + Toughness) against Potency (11 + Focus) or suffer Weakened (-2 to stats).' });
  }
  
  // Add a defensive reaction action using RP
  if (d.includes('guard') || d.includes('shield') || d.includes('tank') || d.includes('block')) {
    actions.push({ name: 'Bony Aegis', cost: 'Reaction', desc: 'Reaction (1 RP): Trigger: Targeted by an attack. Spends 1 RP. Increases Guard by +4 against the incoming hit.' });
  } else {
    actions.push({ name: 'Evasive Glide', cost: 'Reaction', desc: 'Reaction (1 RP): Trigger: Targeted by a physical melee attack. Spends 1 RP. Increases Evasion by +4 against this attack.' });
  }
  
  return { abilities, actions };
}

// ==========================================
// Full AI / Random Monster Generator Logic
// ==========================================

async function handleFullGeneration(mode, rankConstraint = '') {
  let name = els.monsterName.value.trim();
  if (mode === 'name' && !name) {
    alert('Please enter a name first to generate from name!');
    return;
  }

  const useApi = els.useGeminiApi.checked;
  const apiKey = getCleanApiKey();

  // Set loading state on clicked button
  let activeBtn = null;
  if (mode === 'name') activeBtn = els.btnAiGenFromName;
  else if (mode === 'random') activeBtn = els.btnAiGenFullyRandom;
  else if (rankConstraint === 'grunt') activeBtn = els.btnAiGenGrunt;
  else if (rankConstraint === 'heroic') activeBtn = els.btnAiGenHeroic;
  else if (rankConstraint === 'boss') activeBtn = els.btnAiGenBoss;

  const originalHtml = activeBtn.innerHTML;
  activeBtn.disabled = true;
  activeBtn.innerHTML = `<i class="material-icons rotating">sync</i>`;

  try {
    let data = null;

    if (useApi && apiKey) {
      localStorage.setItem('gemini_api_key', apiKey);
      data = await callGeminiApiFull(apiKey, name, rankConstraint, mode);
    } else {
      data = generateOfflineFull(mode, rankConstraint, name);
    }

    if (data) {
      // 1. Update all Form Inputs based on the generated data
      els.monsterName.value = data.name;
      els.monsterRank.value = data.rank;
      els.astraLevel.value = data.level;
      els.levelVal.textContent = data.level;
      els.isFiend.checked = data.isFiend;
      els.fiendRankGroup.style.display = data.isFiend ? 'block' : 'none';
      els.fiendRank.value = data.fiendRank || 'grunt';

      els.statHP.value = data.hpTarget || 'average';
      els.statFocus.value = data.focusTarget || 'average';
      els.statPower.value = data.powerTarget || 'average';
      els.statAgility.value = data.agilityTarget || 'average';
      els.statToughness.value = data.toughnessTarget || 'average';

      // 2. Generate stats (applying level modifications and targets)
      generateMonster(true); // use raw center averages of targets

      // 3. Populate abilities and actions
      populateAbilitiesAndActions(data.abilities || [], data.actions || []);
    }
  } catch (error) {
    console.error(error);
    let msg = error.message;
    if (msg.includes('API key not valid')) {
      msg += "\n\nPro Tip: Make sure you copied your key correctly from Google AI Studio (https://aistudio.google.com/) and that it doesn't have restrictions limiting the Generative Language API. Click the eye icon next to the input to verify your key starts with 'AIzaSy' or 'AQ.'.";
    }
    alert(`Full Generation failed: ${msg}. Falling back to offline randomizer.`);
    const data = generateOfflineFull(mode, rankConstraint, name);
    if (data) {
      els.monsterName.value = data.name;
      els.monsterRank.value = data.rank;
      els.astraLevel.value = data.level;
      els.levelVal.textContent = data.level;
      els.isFiend.checked = data.isFiend;
      els.fiendRankGroup.style.display = data.isFiend ? 'block' : 'none';
      els.fiendRank.value = data.fiendRank || 'grunt';

      els.statHP.value = data.hpTarget || 'average';
      els.statFocus.value = data.focusTarget || 'average';
      els.statPower.value = data.powerTarget || 'average';
      els.statAgility.value = data.agilityTarget || 'average';
      els.statToughness.value = data.toughnessTarget || 'average';

      generateMonster(true);
      populateAbilitiesAndActions(data.abilities || [], data.actions || []);
    }
  } finally {
    activeBtn.disabled = false;
    activeBtn.innerHTML = originalHtml;
  }
}

async function callGeminiApiFull(apiKey, inputName, rankConstraint, mode) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent`;
  
  const isFiendRequested = els.isFiend.checked;
  let instructions = '';
  if (mode === 'name') {
    instructions = `Generate a complete monster based on this name: "${inputName}". The name should inspire its elements, rank, abilities, and stats (e.g. "Flame Serpent" should be fire-based, "Grave Lich" should be undead, etc.).`;
  } else if (mode === 'random') {
    instructions = `Invent a completely new TTRPG monster. Make up a cool name and generate all its details randomly.`;
  } else if (mode === 'rank') {
    instructions = `Invent a completely new TTRPG monster. Make up a cool name and lock its rank to exactly "${rankConstraint}".`;
  }

  if (isFiendRequested) {
    instructions += `\nCRITICAL REQUIREMENT: This monster must be a Fiend. Set 'isFiend' to true, choose a fitting 'fiendRank' ('grunt', 'heroic', 'boss', 'exousia'), and describe its powers/abilities accordingly (with regeneration).`;
  } else {
    instructions += `\nCRITICAL REQUIREMENT: This monster is NOT a fiend. Set 'isFiend' to false, and do NOT give it any fiend regeneration or fiend-related passive regeneration.`;
  }

  const systemPrompt = `You are a professional game designer for the tabletop RPG "Angel's Sword RPG: The Lyrian Chronicles".
Your task is to generate a complete monster definition.

Here is the JSON schema you must return:
{
  "name": "The generated name of the monster",
  "rank": "grunt" | "heroic" | "boss",
  "level": 1 to 7,
  "isFiend": true | false,
  "fiendRank": "grunt" | "heroic" | "boss" | "exousia",
  "hpTarget": "very-low" | "low" | "average" | "high" | "very-high",
  "focusTarget": "very-low" | "low" | "average" | "high" | "very-high",
  "powerTarget": "very-low" | "low" | "average" | "high" | "very-high",
  "agilityTarget": "very-low" | "low" | "average" | "high" | "very-high",
  "toughnessTarget": "very-low" | "low" | "average" | "high" | "very-high",
  "abilities": [
    { "name": "Ability Name", "desc": "Clean details using official rules..." }
  ],
  "actions": [
    { "name": "Action Name", "cost": "1 AP" | "2 AP" | "3 AP" | "Reaction", "desc": "Clean details..." }
  ]
}

System Rules to apply:
1. Grunts: Locked to 2 AP, 1 RP. Max 2 simple actions.
2. Heroics: 4 AP, 2+Agility RP. 2-3 complex actions.
3. Bosses: 6 AP, 2+Agility RP. Solo monsters, need control/reaction actions.
4. Fiends: If isFiend is true, regeneration matches fiendRank (grunts = 1x Toughness, heroic = 9+Toughness, boss = 24+Toughness).
5. Keywords: Use official keywords (Circuit, Combo, Concentration, Rapid, Lock On, Sanctify, Augment) and conditions (Burning, Bleeding, Blinded, Weakened, Poisoned, Challenge, Silenced) in the abilities/actions where appropriate. Do not use stuns on basic hits.

CRITICAL RULES FOR ATTACKS AND ACCURACY:
- DO NOT use generic D&D vocabulary. There is NO level scaling for damage, NO "DC [X]", and NO "Agility Save", "Reason Save", or "Strength Save".
- Every attack action description MUST be labeled as one of these three exact formats:
  1. Light Attack (1 AP): 1d20 + Focus to hit Evasion. Deals [2d4 + Power] [damage type] damage.
  2. Heavy Attack (2 AP): 1d20 + Focus to hit Evasion. Deals [4d6 + Power * 2] [damage type] damage.
  3. Precise Attack (2 AP): 1d20 + Focus * 2 to hit Evasion. Deals [2d4 + Power] [damage type] damage. Has Pinpoint equal to Focus.
- Damage (X, Y, Z) must be formulaic, scaling with Power or Focus (e.g. "Power + 2" or "2d6 + Focus"), or be flat (e.g. "2d4"). NEVER use creature Level or Astra Level in damage scaling.
- Any action/spell that forces a target to resist a status condition or magical effect MUST use this exact text:
  "Target must roll a Toughness check (2d10 + Toughness) against the caster's Potency (11 + Focus) to resist/avoid [condition]."
  Never say "saving throw" or "DC [Focus + 10]". All magical/effect saves use the target's Toughness roll against the caster's Potency.

Output ONLY the JSON block matching the schema, with no markdown tags.`;

  const payload = {
    contents: [
      {
        parts: [
          { text: `${systemPrompt}\n\nTask:\n${instructions}` }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json"
    }
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    let errMsg = response.statusText;
    try {
      const errText = await response.text();
      const errJson = JSON.parse(errText);
      if (errJson && errJson.error && errJson.error.message) {
        errMsg = errJson.error.message;
      } else {
        errMsg = errText || response.statusText;
      }
    } catch (e) {
      // fallback
    }
    throw new Error(errMsg);
  }
  
  const resData = await response.json();
  const textResponse = resData.candidates[0].content.parts[0].text;
  return JSON.parse(textResponse);
}

// Local offline generator for full monster
function generateOfflineFull(mode, rankConstraint, inputName) {
  // Pool of prefixes and suffixes to generate random names
  const prefixes = ['Astra', 'Void', 'Grave', 'Flame', 'Frost', 'Crystal', 'Corrupted', 'Sylvan', 'Iron', 'Shadow', 'Abyssal', 'Storm', 'Light', 'Dread', 'Slime'];
  const suffixes = ['Stalker', 'Fiend', 'Horror', 'Goliath', 'Specter', 'Wurm', 'Beast', 'Gargoyle', 'Crawler', 'Slayer', 'Lich', 'Watcher', 'Lurker', 'Warrior', 'Wyrm'];
  
  let name = inputName;
  if (mode === 'random' || mode === 'rank') {
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const s = suffixes[Math.floor(Math.random() * suffixes.length)];
    name = `${p} ${s}`;
  }

  let rank = rankConstraint || 'heroic';
  if (mode === 'random') {
    const ranks = ['grunt', 'heroic', 'boss'];
    rank = ranks[Math.floor(Math.random() * ranks.length)];
  }

  const level = randRange(1, 7);
  const isFiend = els.isFiend.checked;
  const fiendRank = rank;

  // Stat targets
  const ratings = ['very-low', 'low', 'average', 'high', 'very-high'];
  const pickTarget = () => ratings[Math.floor(Math.random() * ratings.length)];
  
  const hpTarget = pickTarget();
  const focusTarget = pickTarget();
  const powerTarget = pickTarget();
  const agilityTarget = pickTarget();
  const toughnessTarget = pickTarget();

  // Generate abilities and actions based on the generated name
  const desc = `An offline generated creature named ${name} of rank ${rank} and level ${level}.`;
  const offlineData = generateOfflineAbilities(name + " " + desc);

  return {
    name, rank, level, isFiend, fiendRank,
    hpTarget, focusTarget, powerTarget, agilityTarget, toughnessTarget,
    abilities: offlineData.abilities,
    actions: offlineData.actions
  };
}

// ==========================================
// Export Features
// ==========================================

// Helper to gather all current card details (including user edits)
function getMonsterData() {
  const name = els.cardName.textContent.trim();
  const meta = els.cardMeta.textContent.trim();
  const hp = els.cardHP.textContent.trim();
  const ap = els.cardAP.textContent.trim();
  const rp = els.cardRP.textContent.trim();
  const evasion = els.cardEvasion.textContent.trim();
  const focus = els.cardFocus.textContent.trim();
  const power = els.cardPower.textContent.trim();
  const agility = els.cardAgility.textContent.trim();
  const toughness = els.cardToughness.textContent.trim();
  
  const isFiend = els.isFiend.checked;
  const regenVal = els.cardRegenVal.textContent.trim();
  
  // Abilities
  const abilities = [];
  els.abilitiesList.querySelectorAll('.item-row').forEach(row => {
    const title = row.querySelector('.item-title').textContent.trim();
    const desc = row.querySelector('.item-desc').textContent.trim();
    abilities.push({ name: title, desc });
  });
  
  // Actions
  const actions = [];
  els.actionsList.querySelectorAll('.item-row').forEach(row => {
    const title = row.querySelector('.item-title').textContent.trim();
    const cost = row.querySelector('.item-cost').textContent.trim();
    const desc = row.querySelector('.item-desc').textContent.trim();
    actions.push({ name: title, cost, desc });
  });
  
  const portraitImg = document.getElementById('portraitImage');
  const portraitSrc = (portraitImg && portraitImg.style.display !== 'none') ? portraitImg.src : '';
  
  return {
    name, meta, hp, ap, rp, evasion, focus, power, agility, toughness,
    isFiend, regenVal, abilities, actions, portraitSrc,
    level: parseInt(els.astraLevel.value),
    rank: els.monsterRank.value,
    fiendRank: els.fiendRank.value,
    hpTarget: els.statHP.value,
    focusTarget: els.statFocus.value,
    powerTarget: els.statPower.value,
    agilityTarget: els.statAgility.value,
    toughnessTarget: els.statToughness.value,
    variance: parseInt(els.variance.value)
  };
}

// Import creature details from parsed JSON
function importFromJson(data) {
  if (!data) return;

  currentMonster = JSON.parse(JSON.stringify(data));

  // 1. Update Form Inputs
  if (data.name !== undefined) els.monsterName.value = data.name;
  if (data.level !== undefined) {
    els.astraLevel.value = data.level;
    els.levelVal.textContent = data.level;
  }
  if (data.rank !== undefined) els.monsterRank.value = data.rank;
  if (data.isFiend !== undefined) {
    els.isFiend.checked = data.isFiend;
    els.fiendRankGroup.style.display = data.isFiend ? 'block' : 'none';
  }
  if (data.fiendRank !== undefined) els.fiendRank.value = data.fiendRank;
  if (data.hpTarget !== undefined) els.statHP.value = data.hpTarget;
  if (data.focusTarget !== undefined) els.statFocus.value = data.focusTarget;
  if (data.powerTarget !== undefined) els.statPower.value = data.powerTarget;
  if (data.agilityTarget !== undefined) els.statAgility.value = data.agilityTarget;
  if (data.toughnessTarget !== undefined) els.statToughness.value = data.toughnessTarget;
  if (data.variance !== undefined) {
    els.variance.value = data.variance;
    els.varianceVal.textContent = `±${data.variance}`;
  }

  // 2. Update Card Preview values directly
  els.cardName.textContent = data.name || 'Unnamed Creature';
  els.cardMeta.textContent = data.meta || '';
  els.cardHP.textContent = data.hp || '0';
  els.cardAP.textContent = data.ap || '0';
  els.cardRP.textContent = data.rp || '0';
  els.cardEvasion.textContent = data.evasion || '0';
  els.cardFocus.textContent = data.focus || '0';
  els.cardPower.textContent = data.power || '0';
  els.cardAgility.textContent = data.agility || '0';
  els.cardToughness.textContent = data.toughness || '0';

  // 3. Update metadata & regeneration banner using our helper
  updateCardRegenAndMetadata();

  // 4. Populate Abilities & Actions
  populateAbilitiesAndActions(data.abilities || [], data.actions || []);

  // 5. Restore Portrait Image
  const img = document.getElementById('portraitImage');
  const placeholder = document.getElementById('portraitPlaceholder');
  const removeBtn = document.getElementById('btnRemovePortrait');
  const tokenBtn = document.getElementById('btnAutoToken');
  if (data.portraitSrc) {
    img.src = data.portraitSrc;
    img.style.display = 'block';
    placeholder.style.display = 'none';
    removeBtn.style.display = 'flex';
    if (tokenBtn) tokenBtn.style.display = 'flex';
  } else {
    clearPortrait();
  }
}

// Format block as text
function formatAsTxt(data) {
  const border = "=".repeat(55);
  const divider = "-".repeat(55);
  let txt = `${border}\n`;
  txt += `${data.name.toUpperCase()} (${data.meta})\n`;
  txt += `${border}\n`;
  txt += `HP: ${data.hp} | AP: ${data.ap} | RP: ${data.rp} | Evasion: ${data.evasion}\n`;
  txt += `Focus (FC): ${data.focus} | Power (PW): ${data.power} | Agility (AG): ${data.agility} | Toughness (TG): ${data.toughness}\n`;
  
  if (data.isFiend) {
    txt += `Regeneration: ${data.regenVal} HP/turn (Disabled by silver weapon damage)\n`;
  }
  if (data.portraitSrc) {
    txt += `Portrait: [Image Data Attached]\n`;
  }
  
  txt += `\n${divider}\nABILITIES\n${divider}\n`;
  if (data.abilities.length === 0) {
    txt += "(None)\n";
  } else {
    data.abilities.forEach(ab => {
      txt += `* ${ab.name}\n  ${ab.desc}\n\n`;
    });
  }
  
  txt += `${divider}\nACTIONS\n${divider}\n`;
  if (data.actions.length === 0) {
    txt += "(None)\n";
  } else {
    data.actions.forEach(ac => {
      txt += `* ${ac.name} [${ac.cost}]\n  ${ac.desc}\n\n`;
    });
  }
  txt += border;
  return txt;
}

// Export as Notepad .txt file
function exportToTxt() {
  const data = getMonsterData();
  const txtContent = formatAsTxt(data);
  const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.name.toLowerCase().replace(/\s+/g, '-')}-statblock.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Export as JSON file
function exportToJson() {
  const data = getMonsterData();
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.name.toLowerCase().replace(/\s+/g, '-')}-data.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Copy raw text to clipboard
function copyToClipboard() {
  const data = getMonsterData();
  const txtContent = formatAsTxt(data);
  
  navigator.clipboard.writeText(txtContent).then(() => {
    // Show copy visual feedback
    const originalText = els.btnCopy.innerHTML;
    els.btnCopy.innerHTML = `<i class="material-icons">check</i> Copied!`;
    els.btnCopy.style.borderColor = 'var(--accent-cyan)';
    els.btnCopy.style.color = 'var(--accent-cyan)';
    
    setTimeout(() => {
      els.btnCopy.innerHTML = originalText;
      els.btnCopy.style.borderColor = '';
      els.btnCopy.style.color = '';
    }, 2000);
  }).catch(err => {
    alert('Failed to copy text: ' + err);
  });
}

// ==========================================
// Monster Portrait Management (Upload & AI)
// ==========================================

function clearPortrait() {
  const img = document.getElementById('portraitImage');
  const placeholder = document.getElementById('portraitPlaceholder');
  const removeBtn = document.getElementById('btnRemovePortrait');
  const tokenBtn = document.getElementById('btnAutoToken');
  const uploadInput = document.getElementById('portraitInput');
  if (img) {
    img.src = '';
    img.style.display = 'none';
    placeholder.style.display = 'flex';
    if (removeBtn) removeBtn.style.display = 'none';
    if (tokenBtn) tokenBtn.style.display = 'none';
    if (uploadInput) uploadInput.value = '';
  }
}

function setupPortraitHandlers() {
  const uploadInput = document.getElementById('portraitInput');
  const uploadBtn = document.getElementById('btnUploadPortrait');
  const removeBtn = document.getElementById('btnRemovePortrait');
  const tokenBtn = document.getElementById('btnAutoToken');
  const aiBtn = document.getElementById('btnAiPortrait');
  const placeholder = document.getElementById('portraitPlaceholder');
  const img = document.getElementById('portraitImage');
  
  // Click placeholder to upload
  placeholder.addEventListener('click', () => {
    uploadInput.click();
  });
  
  // Click upload button
  uploadBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    uploadInput.click();
  });
  
  // File change
  uploadInput.addEventListener('change', () => {
    const file = uploadInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
        img.style.display = 'block';
        placeholder.style.display = 'none';
        removeBtn.style.display = 'flex';
        if (tokenBtn) tokenBtn.style.display = 'flex';
      };
      reader.readAsDataURL(file);
    }
  });
  
  // Remove button
  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    clearPortrait();
  });
  
  // AI button
  aiBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    generateAiPortrait();
  });
}

async function generateAiPortrait() {
  const apiKey = getCleanApiKey();
  if (!apiKey) {
    alert('Please enter your Gemini API Key in the sidebar first to generate portraits!');
    return;
  }
  
  // Save key locally
  localStorage.setItem('gemini_api_key', apiKey);
  
  const name = els.cardName.textContent.trim();
  const meta = els.cardMeta.textContent.trim();
  const desc = els.creatureDesc.value.trim();
  
  // Gather abilities and actions for details
  const abilities = Array.from(els.abilitiesList.querySelectorAll('.item-row'))
    .map(row => row.querySelector('.item-title').textContent.trim() + ': ' + row.querySelector('.item-desc').textContent.trim())
    .join('. ');
  const actions = Array.from(els.actionsList.querySelectorAll('.item-row'))
    .map(row => row.querySelector('.item-title').textContent.trim() + ': ' + row.querySelector('.item-desc').textContent.trim())
    .join('. ');

  const promptText = `Generate a gorgeous anime style dark fantasy creature portrait illustration.
Creature Name: ${name}
Description/Type: ${meta}
Lore/Powers: ${desc}
Abilities and Actions: ${abilities} ${actions}

The style should be a high-fidelity epic anime fantasy card illustration, dark void atmosphere, vibrant magical lighting, showing the creature clearly. Clean portrait framing. Do not include any text, letters, words, names, stats, numbers, labels, borders, frames, watermarks, or overlays on the image. The output must be pure artwork only.`;

  const placeholder = document.getElementById('portraitPlaceholder');
  const img = document.getElementById('portraitImage');
  const removeBtn = document.getElementById('btnRemovePortrait');
  
  const originalHtml = placeholder.innerHTML;
  placeholder.innerHTML = `<i class="material-icons rotating">sync</i><span>Generating Portrait with Nano Banana 2...</span>`;
  placeholder.style.display = 'flex';
  img.style.display = 'none';
  
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent`;
    const payload = {
      contents: [
        {
          parts: [
            { text: promptText }
          ]
        }
      ],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || response.statusText);
    }
    
    const resData = await response.json();
    const parts = resData.candidates[0].content.parts;
    const imagePart = parts.find(p => p.inlineData);
    
    if (!imagePart) {
      throw new Error("No image was returned by the Nano Banana 2 API.");
    }
    
    const base64Data = imagePart.inlineData.data;
    const mimeType = imagePart.inlineData.mimeType;
    const imageUrl = `data:${mimeType};base64,${base64Data}`;
    
    img.src = imageUrl;
    img.style.display = 'block';
    placeholder.style.display = 'none';
    removeBtn.style.display = 'flex';
    const tokenBtn = document.getElementById('btnAutoToken');
    if (tokenBtn) tokenBtn.style.display = 'flex';
    
  } catch (error) {
    console.error(error);
    let msg = error.message;
    if (msg.includes('API key not valid')) {
      msg += "\n\nPro Tip: Make sure you copied your key correctly from Google AI Studio (https://aistudio.google.com/) and that it doesn't have restrictions limiting the Generative Language API. Click the eye icon next to the input to verify your key starts with 'AIzaSy' or 'AQ.'.";
    }
    alert(`Failed to generate portrait: ${msg}`);
    placeholder.innerHTML = originalHtml;
  }
}

// ==========================================
// Session Deck Management
// ==========================================

let sessionDeck = [];
let activeSessionIndex = -1;
let sessionWorkspaceActive = false;
let sessionCombatFilter = null; // array of monster UIDs to run
let roll20OutputFormat = 'template'; // default format

window.setRoll20Format = function(format) {
  roll20OutputFormat = format;
  localStorage.setItem('roll20_output_format', format);
  
  const btnTemplate = document.getElementById('btnFormatTemplate');
  const btnRaw = document.getElementById('btnFormatRaw');
  if (!btnTemplate || !btnRaw) return;
  
  if (format === 'template') {
    btnTemplate.classList.add('active');
    btnRaw.classList.remove('active');
  } else {
    btnRaw.classList.add('active');
    btnTemplate.classList.remove('active');
  }
};

function addToSessionDeck() {
  const monster = getMonsterData();
  // Unique UID for tracking copies of the same monster
  monster.uid = 'm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  
  // Set current HP to max HP initially
  monster.currentHP = parseInt(monster.hp) || 60;
  
  sessionDeck.push(monster);
  saveDeckToLocalStorage();
  renderDeckMiniList();
  showToast(`<i class="material-icons">check_circle</i> Added <strong>${monster.name}</strong> to Session Deck!`);
}

function removeFromSessionDeck(uid) {
  sessionDeck = sessionDeck.filter(m => m.uid !== uid);
  saveDeckToLocalStorage();
  renderDeckMiniList();
  if (activeSessionIndex >= sessionDeck.length) {
    activeSessionIndex = sessionDeck.length - 1;
  }
}

function saveDeckToLocalStorage() {
  localStorage.setItem('lyrian_session_deck', JSON.stringify(sessionDeck));
  document.getElementById('deckCount').textContent = sessionDeck.length;
}

function loadDeckFromLocalStorage() {
  const data = localStorage.getItem('lyrian_session_deck');
  if (data) {
    try {
      let parsed = JSON.parse(data);
      // Handle format from rebuilt SessionEngine: {deck: [...], conditions: {...}}
      if (parsed && !Array.isArray(parsed) && Array.isArray(parsed.deck)) {
        parsed = parsed.deck;
      }
      if (!Array.isArray(parsed)) {
        parsed = [];
      }
      sessionDeck = parsed;
      sessionDeck.forEach(m => {
        if (!m.uid) m.uid = 'm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        if (m.currentHP === undefined) m.currentHP = parseInt(m.hp) || 60;
      });
      document.getElementById('deckCount').textContent = sessionDeck.length;
      renderDeckMiniList();
    } catch (e) {
      console.error("Failed to load session deck:", e);
      sessionDeck = [];
    }
  }
}

function renderDeckMiniList() {
  const list = document.getElementById('deckMiniList');
  list.innerHTML = '';
  
  if (sessionDeck.length === 0) {
    list.innerHTML = `<li style="padding: 10px; font-size: 0.8rem; color: var(--text-muted); text-align: center;">Deck is empty. Add monsters above!</li>`;
    return;
  }
  
  sessionDeck.forEach(m => {
    const li = document.createElement('li');
    li.className = 'deck-mini-item';
    li.innerHTML = `
      <div class="monster-info">
        <span class="monster-name">${m.name}</span>
        <span class="monster-meta">${m.meta.split(' - ')[0]} | HP: ${m.hp}</span>
      </div>
      <button class="btn-remove-deck-item" onclick="removeDeckItem('${m.uid}')" title="Remove"><i class="material-icons">close</i></button>
    `;
    list.appendChild(li);
  });
}

window.removeDeckItem = function(uid) {
  removeFromSessionDeck(uid);
  showToast(`<i class="material-icons">delete</i> Removed monster from deck`);
};

function exportSessionDeck() {
  if (sessionDeck.length === 0) {
    alert("Your Session Deck is empty!");
    return;
  }
  const jsonContent = JSON.stringify(sessionDeck, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `session-deck-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`<i class="material-icons">download</i> Saved Session Deck to PC!`);
}

function importSessionDeck(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      if (Array.isArray(data)) {
        sessionDeck = data;
        sessionDeck.forEach(m => {
          if (!m.uid) m.uid = 'm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          if (m.currentHP === undefined) m.currentHP = parseInt(m.hp) || 60;
        });
        saveDeckToLocalStorage();
        renderDeckMiniList();
        showToast(`<i class="material-icons">cloud_upload</i> Session Deck imported!`);
      } else {
        alert("Invalid Session Deck file format.");
      }
    } catch (err) {
      alert("Failed to parse deck file: " + err.message);
    }
  };
  reader.readAsText(file);
}

// ==========================================
// Session Mode Engine
// ==========================================

function enterSessionMode() {
  if (sessionDeck.length === 0) {
    alert("Please add at least one monster to your Session Deck first!");
    return;
  }
  
  sessionWorkspaceActive = true;
  document.body.classList.add('session-active');
  document.getElementById('sessionWorkspace').style.display = 'flex';
  
  renderSessionMonsterList();
  toggleCardEditability(false);
  
  // Load the first visible monster in the filtered list
  let firstIdx = 0;
  if (sessionCombatFilter) {
    firstIdx = sessionDeck.findIndex(m => sessionCombatFilter.includes(m.uid));
    if (firstIdx === -1) firstIdx = 0;
  }
  loadActiveSessionMonster(firstIdx);
  
  // Move card into Session Slot
  const card = document.getElementById('monsterCard');
  document.getElementById('sessionCardSlot').appendChild(card);
  
  setupRoll20MacroClickHandlers();
  showToast(`<i class="material-icons">play_circle_filled</i> Entered Session Mode!`);
}

function exitSessionMode() {
  sessionWorkspaceActive = false;
  document.body.classList.remove('session-active');
  document.getElementById('sessionWorkspace').style.display = 'none';
  
  // Move card back to main preview container
  const card = document.getElementById('monsterCard');
  const previewContainer = document.querySelector('.main-preview');
  previewContainer.insertBefore(card, document.querySelector('.action-panel'));
  
  toggleCardEditability(true);
  removeRoll20MacroClickHandlers();
  
  // Restore the active session monster back to the editor
  if (activeSessionIndex >= 0 && activeSessionIndex < sessionDeck.length) {
    importFromJson(sessionDeck[activeSessionIndex]);
  } else {
    // Trigger standard editor rerender if no monster was active
    generateMonster(true);
  }
  
  // Reset the filter when exiting session mode
  sessionCombatFilter = null;
  
  showToast(`<i class="material-icons">exit_to_app</i> Returned to Editor`);
}

function toggleCardEditability(editable) {
  const editables = document.getElementById('monsterCard').querySelectorAll('.editable');
  editables.forEach(el => {
    el.contentEditable = editable ? "true" : "false";
  });
}

function renderSessionMonsterList() {
  const list = document.getElementById('sessionMonsterList');
  list.innerHTML = '';
  
  sessionDeck.forEach((m, idx) => {
    if (sessionCombatFilter && !sessionCombatFilter.includes(m.uid)) {
      return; // Skip monsters not participating in this specific combat
    }
    const li = document.createElement('li');
    li.className = `session-monster-item ${idx === activeSessionIndex ? 'active' : ''}`;
    li.dataset.index = idx; // Store absolute index
    li.innerHTML = `
      <div class="monster-meta-block">
        <span class="monster-name">${m.name}</span>
        <span class="monster-meta" style="font-size:0.7rem; color:var(--text-muted);">${m.meta.split(' - ')[0]}</span>
      </div>
      <span class="monster-hp-pill">${m.currentHP} / ${m.hp} HP</span>
    `;
    li.addEventListener('click', () => {
      loadActiveSessionMonster(idx);
    });
    list.appendChild(li);
  });
}

function loadActiveSessionMonster(index) {
  if (index < 0 || index >= sessionDeck.length) return;
  activeSessionIndex = index;
  
  // Update sidebar active states
  const items = document.querySelectorAll('.session-monster-item');
  items.forEach((item) => {
    if (parseInt(item.dataset.index) === index) item.classList.add('active');
    else item.classList.remove('active');
  });
  
  const m = sessionDeck[index];
  
  // Populate Preview Card DOM
  document.getElementById('cardName').textContent = m.name;
  document.getElementById('cardMeta').textContent = m.meta;
  document.getElementById('cardHP').textContent = m.hp;
  document.getElementById('cardAP').textContent = m.ap;
  document.getElementById('cardRP').textContent = m.rp;
  document.getElementById('cardEvasion').textContent = m.evasion;
  
  document.getElementById('cardSpeed').textContent = m.speed || '30';
  document.getElementById('cardSpeedBlocks').textContent = m.speedBlocks || '6 blocks';
  
  document.getElementById('cardFocus').textContent = m.focus;
  document.getElementById('cardPower').textContent = m.power;
  document.getElementById('cardAgility').textContent = m.agility;
  document.getElementById('cardToughness').textContent = m.toughness;
  
  // Defenses
  const evasionVal = m.evasion;
  const dodgeVal = 20 + parseInt(m.agility);
  const guardVal = m.guard || m.toughness;
  const blockVal = m.block || (m.toughness * 2);

  document.getElementById('defenseEvasion').textContent = evasionVal;
  document.getElementById('defenseDodge').textContent = dodgeVal;
  document.getElementById('defenseGuard').textContent = guardVal;
  document.getElementById('defenseBlock').textContent = blockVal;

  document.getElementById('sessionDefEvasion').textContent = evasionVal;
  document.getElementById('sessionDefDodge').textContent = dodgeVal;
  document.getElementById('sessionDefGuard').textContent = guardVal;
  document.getElementById('sessionDefBlock').textContent = blockVal;
  
  // Regen
  const regenCont = document.getElementById('cardRegenContainer');
  if (m.isFiend) {
    regenCont.style.display = 'flex';
    document.getElementById('cardRegenVal').textContent = m.regenVal;
  } else {
    regenCont.style.display = 'none';
  }
  
  // Portrait
  const img = document.getElementById('portraitImage');
  const placeholder = document.getElementById('portraitPlaceholder');
  const removeBtn = document.getElementById('btnRemovePortrait');
  const tokenBtn = document.getElementById('btnAutoToken');
  if (m.portraitSrc) {
    img.src = m.portraitSrc;
    img.style.display = 'block';
    placeholder.style.display = 'none';
  } else {
    img.src = '';
    img.style.display = 'none';
    placeholder.style.display = 'flex';
  }
  if (removeBtn) removeBtn.style.display = 'none'; // hide controls in session mode
  if (tokenBtn) tokenBtn.style.display = 'none';   // hide controls in session mode
  
  populateAbilitiesAndActions(m.abilities, m.actions);
  toggleCardEditability(false);
  setupRoll20MacroClickHandlers();
  
  // Update HP Tracker UI
  document.getElementById('sessionCurrentHP').textContent = m.currentHP;
  document.getElementById('sessionMaxHP').textContent = m.hp;
  document.getElementById('hpDirectInput').value = m.currentHP;
  
  const pct = Math.max(0, Math.min(100, (m.currentHP / m.hp) * 100));
  document.getElementById('sessionHpBarFill').style.width = `${pct}%`;
}

// Live HP adjustments
window.adjustHP = function(val) {
  if (activeSessionIndex < 0 || activeSessionIndex >= sessionDeck.length) return;
  const m = sessionDeck[activeSessionIndex];
  
  let hp = m.currentHP + val;
  hp = Math.max(0, Math.min(parseInt(m.hp), hp));
  m.currentHP = hp;
  
  document.getElementById('sessionCurrentHP').textContent = hp;
  document.getElementById('hpDirectInput').value = hp;
  
  const pct = Math.max(0, Math.min(100, (hp / m.hp) * 100));
  document.getElementById('sessionHpBarFill').style.width = `${pct}%`;
  
  renderSessionMonsterList();
  saveDeckToLocalStorage();
};

function handleHpDirectInput() {
  if (activeSessionIndex < 0 || activeSessionIndex >= sessionDeck.length) return;
  const m = sessionDeck[activeSessionIndex];
  
  const input = document.getElementById('hpDirectInput');
  let hp = parseInt(input.value);
  if (isNaN(hp)) hp = m.currentHP;
  
  hp = Math.max(0, Math.min(parseInt(m.hp), hp));
  m.currentHP = hp;
  input.value = hp;
  
  document.getElementById('sessionCurrentHP').textContent = hp;
  
  const pct = Math.max(0, Math.min(100, (hp / m.hp) * 100));
  document.getElementById('sessionHpBarFill').style.width = `${pct}%`;
  
  renderSessionMonsterList();
  saveDeckToLocalStorage();
}

// ==========================================
// Roll20 Macro Integration
// ==========================================

function setupRoll20MacroClickHandlers() {
  if (!sessionWorkspaceActive) return;
  
  const m = sessionDeck[activeSessionIndex];
  if (!m) return;
  
  const stats = {
    focus: parseInt(m.focus) || 4,
    power: parseInt(m.power) || 4,
    agility: parseInt(m.agility) || 4,
    toughness: parseInt(m.toughness) || 4
  };
  
  // Bind actions
  document.querySelectorAll('#actionsList .item-row').forEach(row => {
    // Clone and replace to strip old event handlers
    const newRow = row.cloneNode(true);
    row.parentNode.replaceChild(newRow, row);
    
    newRow.addEventListener('click', (e) => {
      e.preventDefault();
      const title = newRow.querySelector('.item-title').textContent.trim();
      const cost = newRow.querySelector('.item-cost').textContent.trim();
      const desc = newRow.querySelector('.item-desc').textContent.trim();
      
      let macro = '';
      if (roll20OutputFormat === 'template') {
        macro = generateRoll20Macro(m.name, title, cost, desc, stats);
      } else {
        macro = generateRoll20RawMacro(m.name, title, cost, desc, stats);
      }
      navigator.clipboard.writeText(macro);
      showToast(`<i class="material-icons">content_copy</i> Copied Roll20 Macro for <strong>${title}</strong>!`);
    });
  });
  
  // Bind abilities
  document.querySelectorAll('#abilitiesList .item-row').forEach(row => {
    const newRow = row.cloneNode(true);
    row.parentNode.replaceChild(newRow, row);
    
    newRow.addEventListener('click', (e) => {
      e.preventDefault();
      const title = newRow.querySelector('.item-title').textContent.trim();
      const desc = newRow.querySelector('.item-desc').textContent.trim();
      
      let macro = '';
      if (roll20OutputFormat === 'template') {
        macro = `&{template:default} {{name=${m.name} - ${title}}} {{Description=${desc}}}`;
      } else {
        macro = `**${m.name} - ${title}**\n${desc}`;
      }
      navigator.clipboard.writeText(macro);
      showToast(`<i class="material-icons">content_copy</i> Copied Roll20 Macro for <strong>${title}</strong>!`);
    });
  });
}

function removeRoll20MacroClickHandlers() {
  const m = getMonsterData();
  populateAbilitiesAndActions(m.abilities, m.actions);
}

function generateRoll20Macro(monsterName, actionName, actionCost, actionDesc, stats) {
  let cleanDesc = actionDesc;
  
  // Parse Accuracy Formula (look for 1d20 expressions)
  let accuracyFormula = '';
  const statOrNum = '(?:Focus|Power|Agility|Toughness|\\d+)';
  const accRegex = new RegExp(`1d20\\s*(?:[+\\-]\\s*${statOrNum}(?:\\s*[*+\\-\\/]\\s*${statOrNum})*)?`, 'i');
  const accMatch = cleanDesc.match(accRegex);
  
  if (accMatch) {
    accuracyFormula = accMatch[0]
      .replace(/Focus/i, stats.focus)
      .replace(/Power/i, stats.power)
      .replace(/Agility/i, stats.agility)
      .replace(/Toughness/i, stats.toughness)
      .replace(/\s+/g, '');
  } else if (cleanDesc.includes('1d20')) {
    accuracyFormula = '1d20';
  }
  
  // Parse Damage Formula
  let damageFormula = '';
  let dmgMatch = cleanDesc.match(/\[([^\]]+)\]/);
  if (dmgMatch) {
    damageFormula = dmgMatch[1];
  } else {
    const dmgTypes = 'physical|fire|ice|frost|shadow|toxic|acid|venom|storm|lightning|holy|elemental|true|force|earth|bludgeoning|slashing|piercing|magical';
    const dmgRegex = new RegExp(`deals\\s+([^.]+?)\\s+(?:${dmgTypes})?\\s*damage`, 'i');
    const match = cleanDesc.match(dmgRegex);
    if (match) {
      damageFormula = match[1].trim();
    }
  }
  
  if (damageFormula) {
    damageFormula = damageFormula.replace(/[\[\]]/g, '').trim();
    damageFormula = damageFormula
      .replace(/Focus/i, stats.focus)
      .replace(/Power/i, stats.power)
      .replace(/Agility/i, stats.agility)
      .replace(/Toughness/i, stats.toughness)
      .replace(/\s+/g, '');
  }
  
  // Determine damage type
  let dmgType = '';
  if (damageFormula) {
    const dmgTypesList = ['physical','fire','ice','frost','shadow','toxic','acid','venom','storm','lightning','holy','elemental','true','force','earth','bludgeoning','slashing','piercing','magical'];
    const lowerDesc = cleanDesc.toLowerCase();
    const damageIndex = lowerDesc.indexOf('damage');
    if (damageIndex !== -1) {
      const beforeDamage = lowerDesc.substring(Math.max(0, damageIndex - 20), damageIndex).trim();
      const matchedType = dmgTypesList.find(t => beforeDamage.includes(t));
      if (matchedType) {
        dmgType = matchedType;
      }
    }
    if (!dmgType) {
      const matchedType = dmgTypesList.find(t => lowerDesc.includes(t));
      if (matchedType) {
        dmgType = matchedType;
      }
    }
  }
  
  // Replace stats inside general description for display reading
  let displayDesc = cleanDesc
    .replace(/\[([^\]]+)\]/g, '$1') // remove brackets
    .replace(/Focus/gi, stats.focus)
    .replace(/Power/gi, stats.power)
    .replace(/Agility/gi, stats.agility)
    .replace(/Toughness/gi, stats.toughness)
    .replace(/Potency/gi, 11 + stats.focus);
  
  let macro = `&{template:default} {{name=${monsterName} - ${actionName}}} {{Cost=${actionCost}}}`;
  
  if (accuracyFormula) {
    macro += ` {{Accuracy=[[${accuracyFormula}]] vs Evasion}}`;
  }
  
  if (damageFormula) {
    macro += ` {{Damage=[[${damageFormula}]] ${dmgType}}}`;
  }
  
  macro += ` {{Effect=${displayDesc}}}`;
  return macro;
}

function generateRoll20RawMacro(monsterName, actionName, actionCost, actionDesc, stats) {
  let cleanDesc = actionDesc;
  
  // Parse Accuracy Formula (look for 1d20 expressions)
  let accuracyFormula = '';
  const statOrNum = '(?:Focus|Power|Agility|Toughness|\\d+)';
  const accRegex = new RegExp(`1d20\\s*(?:[+\\-]\\s*${statOrNum}(?:\\s*[*+\\-\\/]\\s*${statOrNum})*)?`, 'i');
  const accMatch = cleanDesc.match(accRegex);
  
  if (accMatch) {
    accuracyFormula = accMatch[0]
      .replace(/Focus/i, stats.focus)
      .replace(/Power/i, stats.power)
      .replace(/Agility/i, stats.agility)
      .replace(/Toughness/i, stats.toughness)
      .replace(/\s+/g, '');
  } else if (cleanDesc.includes('1d20')) {
    accuracyFormula = '1d20';
  }
  
  // Parse Damage Formula
  let damageFormula = '';
  let dmgMatch = cleanDesc.match(/\[([^\]]+)\]/);
  if (dmgMatch) {
    damageFormula = dmgMatch[1];
  } else {
    const dmgTypes = 'physical|fire|ice|frost|shadow|toxic|acid|venom|storm|lightning|holy|elemental|true|force|earth|bludgeoning|slashing|piercing|magical';
    const dmgRegex = new RegExp(`deals\\s+([^.]+?)\\s+(?:${dmgTypes})?\\s*damage`, 'i');
    const match = cleanDesc.match(dmgRegex);
    if (match) {
      damageFormula = match[1].trim();
    }
  }
  
  if (damageFormula) {
    damageFormula = damageFormula.replace(/[\[\]]/g, '').trim();
    damageFormula = damageFormula
      .replace(/Focus/i, stats.focus)
      .replace(/Power/i, stats.power)
      .replace(/Agility/i, stats.agility)
      .replace(/Toughness/i, stats.toughness)
      .replace(/\s+/g, '');
  }
  
  // Determine damage type
  let dmgType = '';
  if (damageFormula) {
    const dmgTypesList = ['physical','fire','ice','frost','shadow','toxic','acid','venom','storm','lightning','holy','elemental','true','force','earth','bludgeoning','slashing','piercing','magical'];
    const lowerDesc = cleanDesc.toLowerCase();
    const damageIndex = lowerDesc.indexOf('damage');
    if (damageIndex !== -1) {
      const beforeDamage = lowerDesc.substring(Math.max(0, damageIndex - 20), damageIndex).trim();
      const matchedType = dmgTypesList.find(t => beforeDamage.includes(t));
      if (matchedType) {
        dmgType = matchedType;
      }
    }
    if (!dmgType) {
      const matchedType = dmgTypesList.find(t => lowerDesc.includes(t));
      if (matchedType) {
        dmgType = matchedType;
      }
    }
  }
  
  // Replace stats inside general description for display reading
  let displayDesc = cleanDesc
    .replace(/\[([^\]]+)\]/g, '$1') // remove brackets
    .replace(/Focus/gi, stats.focus)
    .replace(/Power/gi, stats.power)
    .replace(/Agility/gi, stats.agility)
    .replace(/Toughness/gi, stats.toughness)
    .replace(/Potency/gi, 11 + stats.focus);
  
  let macro = `**${monsterName} - ${actionName}** [Cost: ${actionCost}]\n`;
  
  if (accuracyFormula && damageFormula) {
    // Send separate /roll commands so they roll independently without summing
    macro += `/roll ${accuracyFormula} to hit Evasion\n/roll ${damageFormula} ${dmgType || 'physical'} damage`;
  } else if (accuracyFormula) {
    macro += `/roll ${accuracyFormula} vs Evasion`;
  } else if (damageFormula) {
    macro += `/roll ${damageFormula} ${dmgType} Damage`;
  } else {
    macro += `${displayDesc}`;
  }
  
  if (accuracyFormula || damageFormula) {
    macro += `\nEffect: ${displayDesc}`;
  }
  
  return macro;
}

// ==========================================
// Toast Alerts
// ==========================================

function showToast(message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = message;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}



// ==========================================
// Defensive Saves & Quick Attacks Copy
// ==========================================

function copyToughnessSaveMacro(e) {
  e.preventDefault();
  e.stopPropagation();
  
  let toughness = 0;
  let name = 'Monster';
  
  if (sessionWorkspaceActive && activeSessionIndex >= 0 && activeSessionIndex < sessionDeck.length) {
    const m = sessionDeck[activeSessionIndex];
    toughness = parseInt(m.toughness) || 0;
    name = m.name;
  } else {
    toughness = parseInt(els.cardToughness.textContent) || 0;
    name = els.cardName.textContent.trim();
  }
  
  let macro = '';
  if (roll20OutputFormat === 'template') {
    macro = `&{template:default} {{name=${name} - Toughness Save}} {{Roll=[[2d10 + ${toughness}]] vs Potency}}`;
  } else {
    macro = `/roll 2d10 + ${toughness} vs Potency`;
  }
  
  navigator.clipboard.writeText(macro);
  showToast(`<i class="material-icons">content_copy</i> Copied Toughness Save macro for <strong>${name}</strong>!`);
}

function copyQuickAttack(type) {
  let focus = 0;
  let power = 0;
  let name = 'Monster';
  
  if (sessionWorkspaceActive && activeSessionIndex >= 0 && activeSessionIndex < sessionDeck.length) {
    const m = sessionDeck[activeSessionIndex];
    focus = parseInt(m.focus) || 0;
    power = parseInt(m.power) || 0;
    name = m.name;
  } else {
    focus = parseInt(els.cardFocus.textContent) || 0;
    power = parseInt(els.cardPower.textContent) || 0;
    name = els.cardName.textContent.trim();
  }
  
  let attackName = '';
  let cost = '1 AP';
  let desc = '';
  
  if (type === 'light') {
    attackName = 'Light Attack';
    cost = '1 AP';
    desc = `Light Attack (1 AP): 1d20 + Focus to hit Evasion. Deals [2d4 + Power] physical damage.`;
  } else if (type === 'heavy') {
    attackName = 'Heavy Attack';
    cost = '2 AP';
    desc = `Heavy Attack (2 AP): 1d20 + Focus to hit Evasion. Deals [4d6 + Power * 2] physical damage.`;
  } else if (type === 'precise') {
    attackName = 'Precise Attack';
    cost = '2 AP';
    desc = `Precise Attack (2 AP): 1d20 + Focus * 2 to hit Evasion. Deals [2d4 + Power] physical damage.`;
  }
  
  const stats = { focus, power, agility: 0, toughness: 0 };
  
  let macro = '';
  if (type === 'precise') {
    if (roll20OutputFormat === 'template') {
      macro = generateRoll20Macro(name, attackName, cost, desc, stats);
      macro = macro.replace('{{Effect=', `{{Pinpoint=[[${focus}]]}} {{Effect=`);
    } else {
      macro = generateRoll20RawMacro(name, attackName, cost, desc, stats);
      macro = macro.replace('\nEffect:', `\nPinpoint: [[${focus}]]\nEffect:`);
    }
  } else {
    if (roll20OutputFormat === 'template') {
      macro = generateRoll20Macro(name, attackName, cost, desc, stats);
    } else {
      macro = generateRoll20RawMacro(name, attackName, cost, desc, stats);
    }
  }
  
  navigator.clipboard.writeText(macro);
  showToast(`<i class="material-icons">content_copy</i> Copied ${attackName} macro for <strong>${name}</strong>!`);
}

// ==========================================
// Token Cookie Cutter Functionality
// ==========================================

let tokenZoom = 1;
let tokenTranslateX = 0;
let tokenTranslateY = 0;
let tokenIsDragging = false;
let tokenDragStartX = 0;
let tokenDragStartY = 0;
let tokenImgWidth = 0;
let tokenImgHeight = 0;

function setupTokenCutter() {
  const tokenModal = document.getElementById('tokenModal');
  const btnAutoToken = document.getElementById('btnAutoToken');
  const btnExitTokenModal = document.getElementById('btnExitTokenModal');
  const btnCancelToken = document.getElementById('btnCancelToken');
  const btnDownloadToken = document.getElementById('btnDownloadToken');
  const tokenZoomSlider = document.getElementById('tokenZoom');
  const tokenImageWrapper = document.getElementById('tokenImageWrapper');
  const tokenSourceImage = document.getElementById('tokenSourceImage');
  const cardImage = document.getElementById('portraitImage');

  if (!tokenModal || !btnAutoToken || !tokenSourceImage) return;

  // Open modal
  btnAutoToken.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!cardImage || !cardImage.src || cardImage.style.display === 'none') {
      alert("Please upload or generate a portrait first.");
      return;
    }

    // Set source image
    tokenSourceImage.src = cardImage.src;
    
    // Reset transform states
    tokenZoom = 1;
    tokenTranslateX = 0;
    tokenTranslateY = 0;
    tokenZoomSlider.value = 1;
    
    tokenSourceImage.style.transform = `translate(0px, 0px) scale(1)`;

    // Wait for image load to center it
    tokenSourceImage.onload = () => {
      // Calculate aspect-ratio and size image relative to viewport (280x280)
      const containerSize = 280;
      const naturalWidth = tokenSourceImage.naturalWidth;
      const naturalHeight = tokenSourceImage.naturalHeight;
      const ratio = naturalWidth / naturalHeight;

      if (ratio > 1) {
        // Landscape: fit height, width overflow
        tokenImgHeight = containerSize;
        tokenImgWidth = containerSize * ratio;
      } else {
        // Portrait/Square: fit width, height overflow
        tokenImgWidth = containerSize;
        tokenImgHeight = containerSize / ratio;
      }

      tokenSourceImage.style.width = `${tokenImgWidth}px`;
      tokenSourceImage.style.height = `${tokenImgHeight}px`;
      
      // Center the image in the wrapper
      tokenTranslateX = (containerSize - tokenImgWidth) / 2;
      tokenTranslateY = (containerSize - tokenImgHeight) / 2;
      
      updateTokenTransform();
    };

    tokenModal.style.display = 'flex';
  });

  // Close modal handlers
  const closeModal = () => {
    tokenModal.style.display = 'none';
    tokenSourceImage.src = '';
  };

  btnExitTokenModal.addEventListener('click', closeModal);
  btnCancelToken.addEventListener('click', closeModal);

  // Zoom slider change
  tokenZoomSlider.addEventListener('input', () => {
    tokenZoom = parseFloat(tokenZoomSlider.value);
    updateTokenTransform();
  });

  // Dragging event listeners (Mouse)
  tokenImageWrapper.addEventListener('mousedown', (e) => {
    e.preventDefault();
    tokenIsDragging = true;
    tokenDragStartX = e.clientX - tokenTranslateX;
    tokenDragStartY = e.clientY - tokenTranslateY;
  });

  window.addEventListener('mousemove', (e) => {
    if (!tokenIsDragging) return;
    e.preventDefault();
    
    // Calculate new position
    tokenTranslateX = e.clientX - tokenDragStartX;
    tokenTranslateY = e.clientY - tokenDragStartY;
    
    updateTokenTransform();
  });

  window.addEventListener('mouseup', () => {
    tokenIsDragging = false;
  });

  // Touch support for mobile/tablet dragging
  tokenImageWrapper.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      tokenIsDragging = true;
      tokenDragStartX = e.touches[0].clientX - tokenTranslateX;
      tokenDragStartY = e.touches[0].clientY - tokenTranslateY;
    }
  });

  window.addEventListener('touchmove', (e) => {
    if (!tokenIsDragging || e.touches.length !== 1) return;
    
    tokenTranslateX = e.touches[0].clientX - tokenDragStartX;
    tokenTranslateY = e.touches[0].clientY - tokenDragStartY;
    
    updateTokenTransform();
  });

  window.addEventListener('touchend', () => {
    tokenIsDragging = false;
  });

  // Download Token handler
  btnDownloadToken.addEventListener('click', () => {
    generateAndDownloadToken();
  });
}

function updateTokenTransform() {
  const tokenSourceImage = document.getElementById('tokenSourceImage');
  if (tokenSourceImage) {
    // Apply translate and scale
    tokenSourceImage.style.transform = `translate(${tokenTranslateX}px, ${tokenTranslateY}px) scale(${tokenZoom})`;
  }
}

function generateAndDownloadToken() {
  const tokenSourceImage = document.getElementById('tokenSourceImage');
  const tokenViewportCircle = document.getElementById('tokenViewportCircle');
  
  if (!tokenSourceImage || !tokenViewportCircle) return;
  
  const viewportRect = tokenViewportCircle.getBoundingClientRect();
  const imgRect = tokenSourceImage.getBoundingClientRect();
  
  // Create offscreen canvas of 512x512
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  // Load original image to preserve maximum resolution
  const img = new Image();
  img.crossOrigin = 'anonymous'; // prevent tainted canvas for CDN images
  img.src = tokenSourceImage.src;
  
  img.onload = () => {
    // Calculate scale factor from screen dimensions to natural dimensions
    const scaleX = img.naturalWidth / imgRect.width;
    const scaleY = img.naturalHeight / imgRect.height;
    
    // Calculate crop box relative to the image coordinates
    // Viewport circular cutout center
    const vCenterX = viewportRect.left + viewportRect.width / 2;
    const vCenterY = viewportRect.top + viewportRect.height / 2;
    
    // Position of center relative to image left/top
    const relCenterX = vCenterX - imgRect.left;
    const relCenterY = vCenterY - imgRect.top;
    
    // Crop center in natural pixels
    const cropCenterX = relCenterX * scaleX;
    const cropCenterY = relCenterY * scaleY;
    
    // Crop radius in natural pixels (screen radius * scale)
    const cropRadius = (viewportRect.width / 2) * ((scaleX + scaleY) / 2);
    
    // Define the outer ring thickness and offset
    const ringThickness = 40;
    const innerRadius = 256 - ringThickness + 2; // slight overlap under the ring
    
    // 1. Clip canvas to circular cutout inside the ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(256, 256, innerRadius, 0, Math.PI * 2);
    ctx.clip();
    
    // Draw the cropped image centered
    const sx = cropCenterX - cropRadius;
    const sy = cropCenterY - cropRadius;
    const sSize = cropRadius * 2;
    
    const destOffset = ringThickness - 2;
    const destSize = 512 - 2 * destOffset;
    
    ctx.drawImage(img, sx, sy, sSize, sSize, destOffset, destOffset, destSize, destSize);
    ctx.restore();
    
    // 2. Draw the 3D red ring on top
    drawRedRing(ctx, 256, 256, 256, ringThickness);
    
    // Trigger download
    const monsterName = document.getElementById('cardName').textContent.trim() || 'monster';
    const link = document.createElement('a');
    link.download = `${monsterName.toLowerCase().replace(/\s+/g, '_')}_token.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    // Close modal
    document.getElementById('tokenModal').style.display = 'none';
  };
  
  img.onerror = () => {
    alert("Could not load the image for rendering. If it was generated, check your network connection.");
  };
}

function drawRedRing(ctx, x, y, radius, thickness) {
  ctx.save();
  
  // Outer drop shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;
  
  // Draw base path of the ring (circular line)
  ctx.beginPath();
  ctx.arc(x, y, radius - thickness / 2, 0, Math.PI * 2);
  
  // Base ring red gradient from top-left to bottom-right
  const ringGrad = ctx.createLinearGradient(x - radius, y - radius, x + radius, y + radius);
  ringGrad.addColorStop(0, '#e60000');   // vibrant red
  ringGrad.addColorStop(0.5, '#ad0000'); // mid red
  ringGrad.addColorStop(1, '#570000');   // dark crimson
  
  ctx.strokeStyle = ringGrad;
  ctx.lineWidth = thickness;
  ctx.stroke();
  
  // Reset shadow for overlays
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  
  // Double accent lines defining the edges of the ring
  ctx.beginPath();
  ctx.arc(x, y, radius - thickness + 1.5, 0, Math.PI * 2); // inner edge accent
  ctx.strokeStyle = 'rgba(50, 0, 0, 0.7)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x, y, radius - 1.5, 0, Math.PI * 2); // outer edge accent
  ctx.strokeStyle = 'rgba(30, 0, 0, 0.9)';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Glossy light highlights (light source from top-left)
  ctx.beginPath();
  ctx.arc(x, y, radius - thickness / 2, Math.PI * 0.9, Math.PI * 1.6);
  const whiteGrad = ctx.createLinearGradient(x - radius, y - radius, x, y);
  whiteGrad.addColorStop(0, 'rgba(255, 255, 255, 0.65)');
  whiteGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.strokeStyle = whiteGrad;
  ctx.lineWidth = thickness - 4;
  ctx.stroke();
  
  // Bevel shadows (bottom-right)
  ctx.beginPath();
  ctx.arc(x, y, radius - thickness / 2, Math.PI * 1.9, Math.PI * 0.6);
  const blackGrad = ctx.createLinearGradient(x, y, x + radius, y + radius);
  blackGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  blackGrad.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
  ctx.strokeStyle = blackGrad;
  ctx.lineWidth = thickness - 4;
  ctx.stroke();

  ctx.restore();
}

// ==========================================
// Expedition Manager Module
// ==========================================

const EXP_ZONES = [
  { id: 'sarjes_pass', name: 'Sarjes Pass', level: 1 },
  { id: 'serenity_valley', name: 'Serenity Valley', level: 1 },
  { id: 'agari_plains', name: 'Agari Plains', level: 1 },
  { id: 'death_pass', name: 'Death Pass', level: 2 },
  { id: 'corwood', name: 'Corwood', level: 2 },
  { id: 'heartwood', name: 'Heartwood', level: 3 },
  { id: 'swamp', name: 'Swamp', level: 4 },
  { id: 'eisens_pass', name: "Eisen's Pass", level: 4 },
  { id: 'voltaires_fall', name: "Voltaire's Fall", level: 5 },
  { id: 'lightning_wastes', name: 'Lightning Wastes', level: 5 },
  { id: 'eastern_mesa', name: 'Eastern Mesa', level: 5 },
  { id: 'ruins_of_alpinum', name: 'Ruins of Alpinum', level: 7 },
  { id: 'dark_canyon', name: 'Dark Canyon', level: 8 }
];

const MAJOR_EVENTS = [
  { min: 1, max: 5, title: 'Exousia Fiend Encounter', desc: 'A powerful or cunning Exousia-tier Fiend appears. Extremely dangerous and retreat is likely.' },
  { min: 6, max: 10, title: 'Aggressive Kratos Fiend Encounter', desc: 'Aggressive Kratos-tier Fiend attacks without a chance to avoid them or an easy retreat.' },
  { min: 11, max: 15, title: 'Normal Kratos Fiend Encounter', desc: 'Kratos-tier Fiends that will attack if engaged, but a fight with which can be avoided.' },
  { min: 16, max: 20, title: 'Deadly-Level Encounter', desc: 'An encounter in which close to optimal play is required to win without risk of deaths.' },
  { min: 21, max: 30, title: 'Difficult Encounter', desc: 'An encounter that can cause trouble for a party that doesn’t have specific tools to handle the enemies.' },
  { min: 31, max: 40, title: 'Normal Encounter', desc: 'An average encounter that should provide little risk of injury against a prepared party.' },
  { min: 41, max: 50, title: 'Easy / Avoidable Encounter', desc: 'A fight against weak opponents that can be avoided with a minor cost.' },
  { min: 51, max: 70, title: 'Minor Lucky Break', desc: 'A modest but helpful discovery that poses little to no risk (e.g. hidden cache, leftover supplies).' },
  { min: 71, max: 80, title: 'Beneficial Discovery', desc: 'A meaningful boon or phenomenon that improves survival or grants minor long-term benefits.' },
  { min: 81, max: 85, title: 'Resource Nodes', desc: 'A large mining or botany node. Can contain up to 8k units total value (for 4 players).' },
  { min: 86, max: 90, title: 'Rare Resources', desc: 'A large mining or botany node. May contain Mithril/Ash for T2 nodes.' },
  { min: 91, max: 95, title: 'Possible Astra Relic', desc: 'Astra Relic or unique item. Value up to the max zone limit (e.g., 2000 in Corwood).' },
  { min: 96, max: 100, title: 'Great Treasure / Landmark / Rarities', desc: 'Dungeon or other point of interest that will offer extra value on a future expedition.' }
];

const MINOR_EVENTS = [
  { min: 1, max: 5, title: 'Near Certain Harm', desc: 'A sudden hazardous moment that forces players to act quickly or risk an injury.' },
  { min: 6, max: 10, title: 'Avoidable Fight', desc: 'Hostile creatures are spotted, but can be avoided though attention or clever play.' },
  { min: 11, max: 15, title: 'Major Loss', desc: 'Cunning or aggressive critters attempt a coordinated raid; difficult to fully prevent.' },
  { min: 16, max: 20, title: 'Fleeting Danger', desc: 'A brief, low-risk hazardous moment. Easy to avoid with a simple check or fast reaction.' },
  { min: 21, max: 25, title: 'Minor Loss', desc: 'A small, opportunistic attempt by wildlife to steal food; easy to stop if noticed.' },
  { min: 26, max: 30, title: 'Inconvenient Obstacle', desc: 'A natural barrier that delays travel or requires minor effort to bypass.' },
  { min: 31, max: 35, title: 'Unsettling Phenomenon', desc: 'Unsettling but harmless phenomena or signs of something passing by.' },
  { min: 36, max: 40, title: 'Risk-Bound Loot', desc: 'Valuable items or resources are visible but in a dangerous or delicate position.' },
  { min: 41, max: 60, title: 'Uneventful Passage', desc: 'Ambient or minor occurrences with no major impact on the journey.' },
  { min: 61, max: 75, title: 'Modest Fortune', desc: 'A simple, safe, and beneficial find that offers small rewards or conveniences.' },
  { min: 76, max: 80, title: 'Expedition Boon', desc: 'A discovery that directly helps the expedition in a practical way.' },
  { min: 81, max: 85, title: 'Minor Resource Node', desc: 'A small mining or botany node that can be harvested (Max 2 HP, Easy/Standard nodes only).' },
  { min: 86, max: 90, title: 'Wandering Vendor', desc: 'A merchant or peddler with a few items for sale at book price or slight discount.' },
  { min: 91, max: 95, title: 'Major Resource Node', desc: 'A substantial mining or botany node (Max 4 HP).' },
  { min: 96, max: 100, title: 'Remarkably Positive', desc: 'A rare or unique find with a one-use effect (e.g. spirit fuel, downburst ammo).' }
];

let expState = {
  name: "Unnamed Expedition",
  players: 4,
  durationWeeks: 3,
  currentDay: 1,
  startingFood: 2000,
  selectedWeekIndex: -1,
  selectedDayIndex: -1,
  weeks: []
};

function createDefaultWeek(index) {
  return {
    location: 'sarjes_pass',
    completed: false,
    majorRoll: null,
    dailyRolls: Array(7).fill(null),
    events: []
  };
}

function initExpeditionSuite() {
  // Tab Switcher
  const tabMonster = document.getElementById('tabMonsterCreator');
  const tabExpedition = document.getElementById('tabExpeditionManager');
  const wsMonster = document.getElementById('monsterCreatorWorkspace');
  const wsExpedition = document.getElementById('expeditionManagerWorkspace');

  tabMonster.addEventListener('click', () => {
    tabMonster.classList.add('active');
    tabExpedition.classList.remove('active');
    wsMonster.style.display = 'flex';
    wsExpedition.style.display = 'none';
  });

  tabExpedition.addEventListener('click', () => {
    tabExpedition.classList.add('active');
    tabMonster.classList.remove('active');
    wsExpedition.style.display = 'flex';
    wsMonster.style.display = 'none';
    refreshAttachedMonstersList();
  });

  // Provisions & Configuration Listeners
  const inputName = document.getElementById('expName');
  const displayTitle = document.getElementById('expTitle');
  const selectPlayers = document.getElementById('expPlayers');
  const btnAddWeek = document.getElementById('btnAddWeek');
  const btnRemoveWeek = document.getElementById('btnRemoveWeek');
  const valDuration = document.getElementById('expDurationVal');
  const inputStartingFood = document.getElementById('expStartingFood');

  inputName.addEventListener('input', () => {
    expState.name = inputName.value.trim() || "Unnamed Expedition";
    displayTitle.textContent = expState.name;
    saveExpeditionState();
  });

  selectPlayers.addEventListener('change', () => {
    expState.players = parseInt(selectPlayers.value);
    updateProvisionsAndLoot();
    saveExpeditionState();
  });

  btnAddWeek.addEventListener('click', () => {
    if (expState.durationWeeks < 7) {
      expState.durationWeeks++;
      valDuration.textContent = expState.durationWeeks;
      adjustTimelineWeeks(expState.durationWeeks);
      updateProvisionsAndLoot();
      renderWeeksTimeline();
      saveExpeditionState();
      showToast(`<i class="material-icons">add</i> Added Week ${expState.durationWeeks}`);
    } else {
      showToast(`<i class="material-icons">warning</i> Maximum duration is 7 weeks!`);
    }
  });

  btnRemoveWeek.addEventListener('click', () => {
    if (expState.durationWeeks > 1) {
      if (confirm(`Are you sure you want to remove Week ${expState.durationWeeks}? This will delete all events in that week.`)) {
        expState.durationWeeks--;
        valDuration.textContent = expState.durationWeeks;
        adjustTimelineWeeks(expState.durationWeeks);
        updateProvisionsAndLoot();
        renderWeeksTimeline();
        saveExpeditionState();
        showToast(`<i class="material-icons">remove</i> Removed last week`);
      }
    } else {
      showToast(`<i class="material-icons">warning</i> Minimum duration is 1 week!`);
    }
  });

  inputStartingFood.addEventListener('input', () => {
    expState.startingFood = Math.max(0, parseInt(inputStartingFood.value) || 0);
    updateProvisionsAndLoot();
    saveExpeditionState();
  });

  // Day Navigation Buttons
  document.getElementById('btnPrevDay').addEventListener('click', () => {
    if (expState.currentDay > 1) {
      expState.currentDay--;
      
      const newWeekIdx = Math.floor((expState.currentDay - 1) / 7);
      const newDayIdx = (expState.currentDay - 1) % 7;
      expState.selectedDayIndex = newDayIdx;
      
      updateProvisionsAndLoot();
      
      if (expState.selectedWeekIndex !== newWeekIdx) {
        loadWeekPlanner(newWeekIdx);
      } else {
        renderDaysGrid();
        renderDayDetailPanel();
      }
      
      saveExpeditionState();
    }
  });

  document.getElementById('btnNextDay').addEventListener('click', () => {
    const maxDay = expState.durationWeeks * 7;
    if (expState.currentDay < maxDay) {
      expState.currentDay++;
      
      const newWeekIdx = Math.floor((expState.currentDay - 1) / 7);
      const newDayIdx = (expState.currentDay - 1) % 7;
      expState.selectedDayIndex = newDayIdx;
      
      updateProvisionsAndLoot();
      
      if (expState.selectedWeekIndex !== newWeekIdx) {
        loadWeekPlanner(newWeekIdx);
      } else {
        renderDaysGrid();
        renderDayDetailPanel();
      }
      
      saveExpeditionState();
    }
  });

  document.getElementById('btnResetJourney').addEventListener('click', () => {
    if (confirm("Reset current journey back to Day 1? This will not clear rolled events or cards.")) {
      expState.currentDay = 1;
      expState.selectedDayIndex = 0;
      updateProvisionsAndLoot();
      loadWeekPlanner(0);
      saveExpeditionState();
    }
  });

  // Roller Events Binding
  document.getElementById('btnRollMajorEvent').addEventListener('click', rollMajorEvent);
  document.getElementById('btnRollMinorEvent').addEventListener('click', rollMinorEvent);
  document.getElementById('btnRollAllMinor').addEventListener('click', rollAllMinorEvents);

  // Dropdown add event menu toggler
  const addEventBtn = document.getElementById('btnAddEventBtn');
  const addEventDropdown = document.getElementById('addEventDropdown');

  addEventBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    addEventDropdown.classList.toggle('show');
  });

  document.addEventListener('click', () => {
    addEventDropdown.classList.remove('show');
  });

  // Add Event Items Clicks
  document.getElementById('btnAddSkill').addEventListener('click', () => addExpeditionEvent('skill'));
  document.getElementById('btnAddDialogue').addEventListener('click', () => addExpeditionEvent('dialogue'));
  document.getElementById('btnAddSpecial').addEventListener('click', () => addExpeditionEvent('special'));
  document.getElementById('btnAddCombat').addEventListener('click', () => addExpeditionEvent('combat'));

  // Backup & Storage listeners
  document.getElementById('btnExportCampaign').addEventListener('click', exportCampaign);
  document.getElementById('btnImportCampaign').addEventListener('click', () => {
    document.getElementById('campaignImportInput').click();
  });
  document.getElementById('campaignImportInput').addEventListener('change', importCampaign);

  // Load from Storage or Default init
  loadExpeditionState();
}

function loadExpeditionState() {
  const data = localStorage.getItem('lyrian_expedition_state');
  if (data) {
    try {
      const parsed = JSON.parse(data);
      expState.name = parsed.name || "Unnamed Expedition";
      expState.players = parsed.players || 4;
      expState.durationWeeks = parsed.durationWeeks || 3;
      expState.currentDay = parsed.currentDay || 1;
      expState.startingFood = parsed.startingFood !== undefined ? parsed.startingFood : 2000;
      expState.weeks = parsed.weeks || [];
      
      // select loaded selections or reset
      expState.selectedWeekIndex = parsed.selectedWeekIndex !== undefined ? parsed.selectedWeekIndex : -1;
      expState.selectedDayIndex = parsed.selectedDayIndex !== undefined ? parsed.selectedDayIndex : -1;
    } catch (e) {
      console.error("Failed to parse expedition state:", e);
      initializeDefaultExpedition();
    }
  } else {
    initializeDefaultExpedition();
  }

  // Set inputs to match state
  document.getElementById('expName').value = expState.name;
  document.getElementById('expTitle').textContent = expState.name;
  document.getElementById('expPlayers').value = expState.players;
  document.getElementById('expDurationVal').textContent = expState.durationWeeks;
  document.getElementById('expStartingFood').value = expState.startingFood;

  // Make sure we have the correct number of weeks in state
  adjustTimelineWeeks(expState.durationWeeks);

  updateProvisionsAndLoot();
  renderWeeksTimeline();
  
  if (expState.selectedWeekIndex >= 0 && expState.selectedWeekIndex < expState.weeks.length) {
    loadWeekPlanner(expState.selectedWeekIndex);
  }
}

function initializeDefaultExpedition() {
  expState.name = "Unnamed Expedition";
  expState.players = 4;
  expState.durationWeeks = 3;
  expState.currentDay = 1;
  expState.startingFood = 2000;
  expState.weeks = [];
  expState.selectedWeekIndex = -1;
  expState.selectedDayIndex = -1;
  adjustTimelineWeeks(expState.durationWeeks);
}

function saveExpeditionState() {
  localStorage.setItem('lyrian_expedition_state', JSON.stringify(expState));
}

function adjustTimelineWeeks(targetWeeks) {
  expState.durationWeeks = targetWeeks;
  if (expState.weeks.length < targetWeeks) {
    while (expState.weeks.length < targetWeeks) {
      expState.weeks.push(createDefaultWeek(expState.weeks.length));
    }
  } else if (expState.weeks.length > targetWeeks) {
    expState.weeks = expState.weeks.slice(0, targetWeeks);
    if (expState.selectedWeekIndex >= targetWeeks) {
      expState.selectedWeekIndex = -1;
      expState.selectedDayIndex = -1;
      document.getElementById('weekPlannerContent').style.display = 'none';
      document.getElementById('noWeekSelectedMsg').style.display = 'flex';
    }
  }
}

function updateProvisionsAndLoot() {
  // Provisions Math
  const dailyFood = expState.players * 40;
  const totalConsumed = dailyFood * (expState.currentDay - 1);
  const remainingFood = Math.max(0, expState.startingFood - totalConsumed);
  const daysLeft = dailyFood > 0 ? (remainingFood / dailyFood).toFixed(1) : 0;

  document.getElementById('expDailyFood').textContent = `${dailyFood} u`;
  document.getElementById('expConsumedFood').textContent = `${totalConsumed} u`;
  document.getElementById('expRemainingFood').textContent = `${remainingFood} u`;
  document.getElementById('expFoodDaysLeft').textContent = `${daysLeft} days`;

  // Loot budget accumulation
  let totalLoot = 0;
  expState.weeks.forEach(w => {
    if (w.completed) {
      const zone = EXP_ZONES.find(z => z.id === w.location);
      if (zone) {
        totalLoot += expState.players * (500 + 250 * zone.level);
      }
    }
  });
  document.getElementById('expLootBudget').innerHTML = `${totalLoot.toLocaleString()} <span class="metric-unit">Clim</span>`;

  // Journey progress bar
  const totalDays = expState.durationWeeks * 7;
  const progressPct = Math.min(100, Math.max(0, ((expState.currentDay - 1) / totalDays) * 100)).toFixed(0);
  document.getElementById('expProgressPct').textContent = `${progressPct}%`;
  document.getElementById('expProgressBarFill').style.width = `${progressPct}%`;
  document.getElementById('expCurrentDayDisplay').textContent = `Day ${expState.currentDay} / ${totalDays}`;
  
  const currentWeek = Math.ceil(expState.currentDay / 7);
  document.getElementById('expCurrentWeekDisplay').textContent = `Week ${currentWeek} / ${expState.durationWeeks}`;
}

function renderWeeksTimeline() {
  const container = document.getElementById('weeksTimeline');
  container.innerHTML = '';

  expState.weeks.forEach((w, idx) => {
    const zone = EXP_ZONES.find(z => z.id === w.location) || EXP_ZONES[0];
    const weeklyLootValue = expState.players * (500 + 250 * zone.level);
    
    const card = document.createElement('div');
    card.className = `week-card ${idx === expState.selectedWeekIndex ? 'active' : ''} ${w.completed ? 'completed' : ''}`;
    
    card.innerHTML = `
      <div class="week-card-header">
        <span class="week-card-title">Week ${idx + 1}</span>
        <div style="display: flex; align-items: center; gap: 8px;">
          <input type="checkbox" class="completed-check" ${w.completed ? 'checked' : ''} title="Mark as Completed" onclick="event.stopPropagation(); toggleWeekCompleted(${idx}, this.checked)">
          ${w.completed ? '<span class="week-card-completed-indicator"><i class="material-icons">check_circle</i></span>' : ''}
        </div>
      </div>
      <div class="week-card-body">
        <div class="week-card-meta-row">
          <span>Location:</span>
          <select class="week-zone-select" onclick="event.stopPropagation();" onchange="changeWeekLocation(${idx}, this.value)">
            ${EXP_ZONES.map(z => `<option value="${z.id}" ${z.id === w.location ? 'selected' : ''}>${z.name} (Lvl ${z.level})</option>`).join('')}
          </select>
        </div>
        <div class="week-card-meta-row" style="margin-top: 6px;">
          <span>Weekly Loot budget:</span>
          <span class="week-card-loot">${weeklyLootValue.toLocaleString()} u</span>
        </div>
      </div>
    `;

    card.addEventListener('click', () => {
      loadWeekPlanner(idx);
    });

    container.appendChild(card);
  });
}

window.toggleWeekCompleted = function(idx, checked) {
  expState.weeks[idx].completed = checked;
  updateProvisionsAndLoot();
  renderWeeksTimeline();
  if (expState.selectedWeekIndex === idx) {
    loadWeekPlanner(idx);
  }
  saveExpeditionState();
};

window.changeWeekLocation = function(idx, locationId) {
  expState.weeks[idx].location = locationId;
  updateProvisionsAndLoot();
  renderWeeksTimeline();
  if (expState.selectedWeekIndex === idx) {
    loadWeekPlanner(idx);
  }
  saveExpeditionState();
};

function loadWeekPlanner(weekIdx) {
  expState.selectedWeekIndex = weekIdx;
  saveExpeditionState();

  // Highlight active week card
  const cards = document.querySelectorAll('.week-card');
  cards.forEach((c, i) => {
    if (i === weekIdx) c.classList.add('active');
    else c.classList.remove('active');
  });

  document.getElementById('noWeekSelectedMsg').style.display = 'none';
  document.getElementById('weekPlannerContent').style.display = 'flex';

  const w = expState.weeks[weekIdx];
  const zone = EXP_ZONES.find(z => z.id === w.location) || EXP_ZONES[0];

  document.getElementById('plannerWeekTitle').textContent = `Week ${weekIdx + 1} Planner`;
  document.getElementById('plannerZoneBadge').textContent = `${zone.name} (Astra Lvl ${zone.level})`;

  // Render Major event display
  const majorBox = document.querySelector('#majorEventDisplay .roll-number-box');
  const majorTitle = document.querySelector('#majorEventDisplay .roll-result-title');
  const majorDesc = document.querySelector('#majorEventDisplay .roll-result-desc');

  if (w.majorRoll !== null) {
    majorBox.textContent = w.majorRoll;
    const item = MAJOR_EVENTS.find(e => w.majorRoll >= e.min && w.majorRoll <= e.max);
    majorTitle.textContent = item ? item.title : 'Unknown Event';
    majorDesc.textContent = item ? item.desc : '';
  } else {
    majorBox.textContent = '--';
    majorTitle.textContent = 'No Major Event rolled yet';
    majorDesc.textContent = 'Roll a d100 to determine the primary weekly event based on the campaign table.';
  }

  // Render Day selection boxes
  if (expState.selectedDayIndex === -1) {
    expState.selectedDayIndex = 0;
  }
  renderDaysGrid();
  renderDayDetailPanel();
  renderEventsList();
}

function renderDaysGrid() {
  const grid = document.getElementById('daysCalendarGrid');
  grid.innerHTML = '';
  
  const wIdx = expState.selectedWeekIndex;
  const w = expState.weeks[wIdx];
  const startDay = wIdx * 7 + 1;

  for (let i = 0; i < 7; i++) {
    const dayNum = startDay + i;
    const isJourneyDay = expState.currentDay === dayNum;
    const isSelected = expState.selectedDayIndex === i;
    const roll = w.dailyRolls[i];

    const box = document.createElement('div');
    box.className = `day-box ${isJourneyDay ? 'active-journey-day' : ''} ${isSelected ? 'selected-day' : ''}`;
    box.innerHTML = `
      <span class="day-box-title">Day ${dayNum}</span>
      <span class="day-box-roll ${roll === null ? 'empty' : ''}">${roll !== null ? roll : '--'}</span>
    `;

    box.addEventListener('click', () => {
      expState.selectedDayIndex = i;
      saveExpeditionState();
      
      // Update selected styling in grid
      const boxes = document.querySelectorAll('.day-box');
      boxes.forEach((b, idx) => {
        if (idx === i) b.classList.add('selected-day');
        else b.classList.remove('selected-day');
      });

      renderDayDetailPanel();
    });

    grid.appendChild(box);
  }
}

function renderDayDetailPanel() {
  const panel = document.getElementById('dayDetailPanel');
  const wIdx = expState.selectedWeekIndex;
  const dIdx = expState.selectedDayIndex;
  
  if (wIdx === -1 || dIdx === -1) {
    panel.style.display = 'none';
    return;
  }

  panel.style.display = 'block';
  const w = expState.weeks[wIdx];
  const dayNum = wIdx * 7 + dIdx + 1;
  const roll = w.dailyRolls[dIdx];

  document.getElementById('detailDayTitle').textContent = `Day ${dayNum} Details`;

  const rollBox = document.querySelector('#minorEventDisplay .roll-number-box-small');
  const rollTitle = document.querySelector('#minorEventDisplay .roll-result-title-small');
  const rollDesc = document.querySelector('#minorEventDisplay .roll-result-desc-small');

  if (roll !== null) {
    rollBox.textContent = roll;
    const item = MINOR_EVENTS.find(e => roll >= e.min && roll <= e.max);
    rollTitle.textContent = item ? item.title : 'Unknown Occurence';
    rollDesc.textContent = item ? item.desc : '';
  } else {
    rollBox.textContent = '--';
    rollTitle.textContent = 'No event rolled for this day';
    rollDesc.textContent = 'Roll a d100 to lookup the daily minor occurrence.';
  }
}

function rollMajorEvent() {
  const wIdx = expState.selectedWeekIndex;
  if (wIdx === -1) return;
  
  const rollVal = Math.floor(Math.random() * 100) + 1;
  expState.weeks[wIdx].majorRoll = rollVal;
  
  loadWeekPlanner(wIdx);
  saveExpeditionState();
  showToast(`<i class="material-icons">casino</i> Rolled <strong>${rollVal}</strong> for Week ${wIdx+1} Major Event!`);
}

function rollMinorEvent() {
  const wIdx = expState.selectedWeekIndex;
  const dIdx = expState.selectedDayIndex;
  if (wIdx === -1 || dIdx === -1) return;
  
  const rollVal = Math.floor(Math.random() * 100) + 1;
  expState.weeks[wIdx].dailyRolls[dIdx] = rollVal;
  
  renderDaysGrid();
  renderDayDetailPanel();
  saveExpeditionState();
  showToast(`<i class="material-icons">casino</i> Rolled <strong>${rollVal}</strong> for Day ${wIdx*7+dIdx+1} Minor Event!`);
}

function rollAllMinorEvents() {
  const wIdx = expState.selectedWeekIndex;
  if (wIdx === -1) {
    showToast(`<i class="material-icons">warning</i> Select a week first!`);
    return;
  }
  
  const w = expState.weeks[wIdx];
  for (let i = 0; i < 7; i++) {
    w.dailyRolls[i] = Math.floor(Math.random() * 100) + 1;
  }
  
  renderDaysGrid();
  renderDayDetailPanel();
  saveExpeditionState();
  showToast(`<i class="material-icons">casino</i> Rolled minor events for all 7 days of Week ${wIdx+1}!`);
}

function addExpeditionEvent(type) {
  const wIdx = expState.selectedWeekIndex;
  if (wIdx === -1) return;

  const eventTypeNames = {
    skill: 'Skill Challenge',
    dialogue: 'Dialogue Moment',
    special: 'Special Event',
    combat: 'Combat Encounter'
  };

  const newEvent = {
    id: 'e_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    type: type,
    name: eventTypeNames[type] || 'New Event',
    dayIndex: expState.selectedDayIndex !== undefined ? expState.selectedDayIndex : -1,
    attachedMonsters: [] // used for combat type to link session deck UIDs
  };

  expState.weeks[wIdx].events.push(newEvent);
  saveExpeditionState();
  renderEventsList();
  showToast(`<i class="material-icons">add_circle</i> Added ${eventTypeNames[type]}`);
}

window.removeExpeditionEvent = function(eventId) {
  const wIdx = expState.selectedWeekIndex;
  if (wIdx === -1) return;

  expState.weeks[wIdx].events = expState.weeks[wIdx].events.filter(e => e.id !== eventId);
  saveExpeditionState();
  renderEventsList();
  showToast(`<i class="material-icons">delete</i> Removed event`);
};

window.updateEventName = function(eventId, name) {
  const wIdx = expState.selectedWeekIndex;
  if (wIdx === -1) return;
  const ev = expState.weeks[wIdx].events.find(e => e.id === eventId);
  if (ev) {
    ev.name = name;
    saveExpeditionState();
  }
};

window.updateEventDay = function(eventId, dayValue) {
  const wIdx = expState.selectedWeekIndex;
  if (wIdx === -1) return;
  const ev = expState.weeks[wIdx].events.find(e => e.id === eventId);
  if (ev) {
    ev.dayIndex = parseInt(dayValue);
    saveExpeditionState();
    renderEventsList();
    showToast(`<i class="material-icons">event</i> Reassigned encounter day`);
  }
};

window.toggleEventMonsterAttach = function(eventId, monsterUid, checked) {
  const wIdx = expState.selectedWeekIndex;
  if (wIdx === -1) return;
  const ev = expState.weeks[wIdx].events.find(e => e.id === eventId);
  if (ev) {
    if (checked) {
      if (!ev.attachedMonsters.includes(monsterUid)) {
        ev.attachedMonsters.push(monsterUid);
      }
    } else {
      ev.attachedMonsters = ev.attachedMonsters.filter(uid => uid !== monsterUid);
    }
    saveExpeditionState();
  }
};

window.runExpeditionCombat = function(eventId) {
  const wIdx = expState.selectedWeekIndex;
  if (wIdx === -1) return;
  const ev = expState.weeks[wIdx].events.find(e => e.id === eventId);
  if (!ev || ev.type !== 'combat') return;

  if (ev.attachedMonsters.length === 0) {
    alert("Please attach at least one monster from your Session Deck to run this combat encounter!");
    return;
  }

  // Filter the session deck for only checked ones
  sessionCombatFilter = ev.attachedMonsters;
  
  // Enter session mode
  enterSessionMode();
};

function renderEventsList() {
  const list = document.getElementById('expeditionEventsList');
  list.innerHTML = '';

  const wIdx = expState.selectedWeekIndex;
  if (wIdx === -1) return;

  const events = [...expState.weeks[wIdx].events];
  if (events.length === 0) {
    list.innerHTML = `<li style="padding: 12px; font-size: 0.8rem; color: var(--text-muted); text-align: center; background: rgba(0,0,0,0.1); border-radius: 8px;">No encounters or events recorded for this week. Click "Add Event" to plan!</li>`;
    return;
  }

  // Sort events: Weekly (-1) first, then by dayIndex (0 to 6)
  events.sort((a, b) => {
    const dayA = a.dayIndex !== undefined ? a.dayIndex : -1;
    const dayB = b.dayIndex !== undefined ? b.dayIndex : -1;
    return dayA - dayB;
  });

  events.forEach(ev => {
    const li = document.createElement('li');
    li.className = `event-item ${ev.type}`;

    let bodyContent = `
      <input type="text" class="event-name-input" placeholder="Describe the event..." value="${ev.name}" onchange="updateEventName('${ev.id}', this.value)">
    `;

    if (ev.type === 'combat') {
      bodyContent += `
        <div class="combat-monster-attachment">
          <span class="attachment-label"><i class="material-icons" style="font-size:0.8rem; vertical-align:middle; margin-right:4px;">pets</i> Attach Session Monsters</span>
          <div class="attached-monsters-list">
            ${sessionDeck.length === 0 ? 
              `<span style="font-size:0.75rem; color:var(--text-muted);">Session Deck is empty. Create & add monsters in the Monster Creator tool!</span>` : 
              sessionDeck.map(m => {
                const checked = ev.attachedMonsters.includes(m.uid) ? 'checked' : '';
                return `
                  <label class="attached-monster-checkbox">
                    <input type="checkbox" ${checked} onchange="toggleEventMonsterAttach('${ev.id}', '${m.uid}', this.checked)">
                    <span>${m.name} (${m.meta.split(' - ')[0]})</span>
                  </label>
                `;
              }).join('')
            }
          </div>
          ${sessionDeck.length > 0 ? 
            `<button class="btn-run-combat" type="button" onclick="runExpeditionCombat('${ev.id}')"><i class="material-icons">play_arrow</i> Run Combat Encounter</button>` : 
            ''
          }
        </div>
      `;
    }

    li.innerHTML = `
      <div class="event-item-header">
        <span class="event-type-tag">
          <i class="material-icons" style="font-size: 0.95rem;">${
            ev.type === 'skill' ? 'alt_route' :
            ev.type === 'dialogue' ? 'chat' :
            ev.type === 'special' ? 'auto_awesome' : 'swords'
          }</i>
          ${ev.type}
        </span>
        <div style="display: flex; align-items: center; gap: 8px;">
          <select class="event-day-select" onchange="updateEventDay('${ev.id}', this.value)" title="Assign to specific Day">
            <option value="-1" ${ev.dayIndex === -1 ? 'selected' : ''}>Weekly</option>
            ${[0, 1, 2, 3, 4, 5, 6].map(i => {
              const dayNum = wIdx * 7 + i + 1;
              const isSelected = ev.dayIndex === i ? 'selected' : '';
              return `<option value="${i}" ${isSelected}>Day ${dayNum}</option>`;
            }).join('')}
          </select>
          <button class="btn-remove-event" type="button" onclick="removeExpeditionEvent('${ev.id}')" title="Delete Event">&times;</button>
        </div>
      </div>
      <div class="event-item-body">
        ${bodyContent}
      </div>
    `;

    list.appendChild(li);
  });
}

function refreshAttachedMonstersList() {
  if (expState.selectedWeekIndex >= 0) {
    renderEventsList();
  }
}

function exportCampaign() {
  const jsonContent = JSON.stringify(expState, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const nameSlug = expState.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const fileName = `${nameSlug || 'campaign'}_expedition_${new Date().toISOString().slice(0, 10)}.json`;
  
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`<i class="material-icons">download</i> Saved Campaign Information to PC!`);
}

function importCampaign(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const parsed = JSON.parse(event.target.result);
      if (parsed && Array.isArray(parsed.weeks)) {
        expState.name = parsed.name || "Unnamed Expedition";
        expState.players = parsed.players || 4;
        expState.durationWeeks = parsed.durationWeeks || 3;
        expState.currentDay = parsed.currentDay || 1;
        expState.startingFood = parsed.startingFood !== undefined ? parsed.startingFood : 2000;
        expState.weeks = parsed.weeks;
        expState.selectedWeekIndex = parsed.selectedWeekIndex !== undefined ? parsed.selectedWeekIndex : -1;
        expState.selectedDayIndex = parsed.selectedDayIndex !== undefined ? parsed.selectedDayIndex : -1;
        
        saveExpeditionState();
        
        // Refresh DOM elements
        document.getElementById('expName').value = expState.name;
        document.getElementById('expTitle').textContent = expState.name;
        document.getElementById('expPlayers').value = expState.players;
        document.getElementById('expDurationVal').textContent = expState.durationWeeks;
        document.getElementById('expStartingFood').value = expState.startingFood;
        
        updateProvisionsAndLoot();
        renderWeeksTimeline();
        
        if (expState.selectedWeekIndex >= 0 && expState.selectedWeekIndex < expState.weeks.length) {
          loadWeekPlanner(expState.selectedWeekIndex);
        } else {
          document.getElementById('weekPlannerContent').style.display = 'none';
          document.getElementById('noWeekSelectedMsg').style.display = 'flex';
        }
        
        showToast(`<i class="material-icons">cloud_upload</i> Campaign Information imported!`);
      } else {
        alert("Invalid Campaign file format.");
      }
    } catch (err) {
      alert("Failed to parse campaign file: " + err.message);
    }
    e.target.value = '';
  };
  reader.readAsText(file);
}

// ==========================================
// Boot up Hook
// ==========================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
