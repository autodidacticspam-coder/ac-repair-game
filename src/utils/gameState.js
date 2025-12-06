const STORAGE_KEY = 'ac-repair-game-state';

// Character definitions - can use custom images or CSS fallback
export const characters = [
  { id: 'repairman', name: 'Repairman', cost: 0, color: '#1976d2', image: '/characters/repairman.png' },
  { id: 'bluey', name: 'Bluey', cost: 25, color: '#5ba4d9', image: '/characters/Bluey.png' },
  { id: 'bingo', name: 'Bingo', cost: 25, color: '#e8a855', image: '/characters/Bingo.png' },
  { id: 'rainbow-llama', name: 'Rainbow Llama', cost: 25, color: '#ff69b4', image: '/characters/Rainbow Llama.png' },
  { id: 'curious-george', name: 'Curious George', cost: 25, color: '#8b4513', image: '/characters/Curious George.png' },
  { id: 'orca', name: 'Orca', cost: 25, color: '#1a1a2e', image: '/characters/Orca.png' },
  { id: 'qiaohu', name: 'Qiaohu', cost: 25, color: '#ff9800', image: '/characters/Qiaohu.png' },
  { id: 'zander', name: 'Zander', cost: 25, color: '#9c27b0', image: '/characters/Zander.png' },
];

export const defaultSettings = {
  numACs: 3,
  numRounds: 5,
  mathMode: 'addition', // 'addition', 'subtraction', 'both'
  blankMode: false, // When true, shows "2 + ? = 5" instead of "2 + 3 = ?"
  // First number range
  minValue1: 1,
  maxValue1: 5,
  // Second number range
  minValue2: 1,
  maxValue2: 5,
  musicEnabled: true, // Background music toggle
};

export const defaultGameState = {
  settings: { ...defaultSettings },
  totalStars: 0,
  currentGame: null, // Will hold in-progress game data
  unlockedCharacters: ['repairman'], // Start with first character unlocked
  selectedCharacter: 'repairman',
};

export function loadGameState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);

      // Check if we need to reset (version change or first time with new characters)
      const needsReset = !parsed.version || parsed.version < 3;

      if (needsReset) {
        // Reset to fresh state with version marker
        return {
          ...defaultGameState,
          settings: { ...defaultSettings, ...parsed.settings },
          totalStars: 0,
          unlockedCharacters: ['repairman'],
          selectedCharacter: 'repairman',
          currentGame: null,
          version: 3,
        };
      }

      // Validate selected character exists in current character list
      const validCharacterIds = characters.map(c => c.id);
      let selectedChar = parsed.selectedCharacter || defaultGameState.selectedCharacter;
      if (!validCharacterIds.includes(selectedChar)) {
        selectedChar = 'repairman';
      }

      // Filter unlocked characters to only valid ones
      let unlockedChars = parsed.unlockedCharacters || defaultGameState.unlockedCharacters;
      unlockedChars = unlockedChars.filter(id => validCharacterIds.includes(id));
      if (!unlockedChars.includes('repairman')) {
        unlockedChars = ['repairman', ...unlockedChars];
      }

      return {
        ...defaultGameState,
        ...parsed,
        settings: { ...defaultSettings, ...parsed.settings },
        unlockedCharacters: unlockedChars,
        selectedCharacter: selectedChar,
        currentGame: null,
        version: 3,
      };
    }
  } catch (e) {
    console.error('Failed to load game state:', e);
  }
  return { ...defaultGameState, version: 3 };
}

export function saveGameState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save game state:', e);
  }
}

export function generateMathProblem(mathMode, minValue1, maxValue1, minValue2, maxValue2, blankMode = false) {
  const operations = mathMode === 'both'
    ? ['addition', 'subtraction']
    : [mathMode];

  const operation = operations[Math.floor(Math.random() * operations.length)];

  let num1, num2, answer;

  if (blankMode) {
    // Blank mode: num1 op ? = result
    if (operation === 'addition') {
      // Format: num1 + ___ = result
      num1 = Math.floor(Math.random() * (maxValue1 - minValue1 + 1)) + minValue1;
      answer = Math.floor(Math.random() * (maxValue2 - minValue2 + 1)) + minValue2;
      const result = num1 + answer;
      return { num1, result, operation: '+', answer, displayType: 'blank' };
    } else {
      // Format: num1 - ___ = result
      num1 = Math.floor(Math.random() * (maxValue1 - minValue1 + 1)) + minValue1;
      answer = Math.floor(Math.random() * (maxValue2 - minValue2 + 1)) + minValue2;
      // Ensure num1 >= answer so result is positive
      if (num1 < answer) {
        [num1, answer] = [answer, num1];
      }
      const result = num1 - answer;
      return { num1, result, operation: '-', answer, displayType: 'blank' };
    }
  } else {
    // Standard mode: num1 op num2 = ?
    if (operation === 'addition') {
      num1 = Math.floor(Math.random() * (maxValue1 - minValue1 + 1)) + minValue1;
      num2 = Math.floor(Math.random() * (maxValue2 - minValue2 + 1)) + minValue2;
      answer = num1 + num2;
      return { num1, num2, operation: '+', answer, displayType: 'standard' };
    } else {
      // For subtraction, ensure positive result
      num1 = Math.floor(Math.random() * (maxValue1 - minValue1 + 1)) + minValue1;
      num2 = Math.floor(Math.random() * (maxValue2 - minValue2 + 1)) + minValue2;
      // Make sure num1 >= num2 for positive result
      if (num1 < num2) {
        [num1, num2] = [num2, num1];
      }
      answer = num1 - num2;
      return { num1, num2, operation: '-', answer, displayType: 'standard' };
    }
  }
}

function rectsOverlap(rect1, rect2, padding = 0) {
  return !(rect1.x + rect1.width + padding < rect2.x ||
           rect2.x + rect2.width + padding < rect1.x ||
           rect1.y + rect1.height + padding < rect2.y ||
           rect2.y + rect2.height + padding < rect1.y);
}

export function generateMap(numACs) {
  const mapWidth = 1920;
  const mapHeight = 1080;
  const margin = 150;

  // Define repairman spawn position FIRST so we can create buffer zone
  const repairman = {
    x: margin + 50,
    y: mapHeight / 2,
    width: 64,
    height: 96,
  };

  // Spawn buffer zone - NOTHING can spawn here except the character
  const spawnBuffer = {
    x: repairman.x - 150,
    y: repairman.y - 150,
    width: repairman.width + 300,
    height: repairman.height + 300,
  };

  // Place house randomly but not too close to edges and NOT in spawn buffer
  let house;
  let houseAttempts = 0;
  do {
    house = {
      x: margin + Math.random() * (mapWidth - 2 * margin - 280),
      y: margin + Math.random() * (mapHeight - 2 * margin - 240),
      width: 280,
      height: 240,
    };
    houseAttempts++;
  } while (rectsOverlap(house, spawnBuffer, 80) && houseAttempts < 50);

  // Generate AC positions near the house
  const acs = [];
  const acSize = 80;
  const minDistFromHouse = 140;
  const maxDistFromHouse = 300;

  for (let i = 0; i < numACs; i++) {
    let validPosition = false;
    let attempts = 0;
    let ac;

    while (!validPosition && attempts < 100) {
      const angle = Math.random() * Math.PI * 2;
      const distance = minDistFromHouse + Math.random() * (maxDistFromHouse - minDistFromHouse);

      const houseCenter = {
        x: house.x + house.width / 2,
        y: house.y + house.height / 2,
      };

      ac = {
        id: i,
        x: houseCenter.x + Math.cos(angle) * distance - acSize / 2,
        y: houseCenter.y + Math.sin(angle) * distance - acSize / 2,
        width: acSize,
        height: acSize,
        fixed: false,
        variant: i % 4, // 4 different AC appearances
      };

      // Check bounds
      if (ac.x < margin || ac.x + acSize > mapWidth - margin ||
          ac.y < margin || ac.y + acSize > mapHeight - margin) {
        attempts++;
        continue;
      }

      // Check not overlapping spawn buffer zone
      if (rectsOverlap(ac, spawnBuffer, 50)) {
        attempts++;
        continue;
      }

      // Check not overlapping house
      if (rectsOverlap(ac, house, 50)) {
        attempts++;
        continue;
      }

      // Check overlap with other ACs
      let overlaps = false;
      for (const existingAc of acs) {
        const dist = Math.hypot(ac.x - existingAc.x, ac.y - existingAc.y);
        if (dist < acSize + 40) {
          overlaps = true;
          break;
        }
      }

      if (!overlaps) {
        validPosition = true;
      }
      attempts++;
    }

    if (ac) {
      acs.push(ac);
    }
  }

  // Generate decorative trees (no collision, but keep away from important areas)
  const obstacles = [];
  const numTrees = 12 + Math.floor(Math.random() * 8);

  const treeBuffer = 200; // Keep trees this far from important objects

  for (let i = 0; i < numTrees; i++) {
    let validPosition = false;
    let attempts = 0;
    let obstacle;

    while (!validPosition && attempts < 100) {
      const size = 80 + Math.random() * 60; // Trees 80-140px

      obstacle = {
        id: i,
        x: margin + Math.random() * (mapWidth - 2 * margin - size),
        y: margin + Math.random() * (mapHeight - 2 * margin - size),
        width: size,
        height: size,
        type: 'tree',
      };

      // Check not overlapping spawn buffer zone (keep far from avatar spawn)
      if (rectsOverlap(obstacle, spawnBuffer, treeBuffer)) {
        attempts++;
        continue;
      }

      // Check not overlapping house
      if (rectsOverlap(obstacle, house, treeBuffer)) {
        attempts++;
        continue;
      }

      // Check not overlapping ACs
      let overlapsAC = false;
      for (const ac of acs) {
        if (rectsOverlap(obstacle, ac, treeBuffer)) {
          overlapsAC = true;
          break;
        }
      }
      if (overlapsAC) {
        attempts++;
        continue;
      }

      // Check not overlapping other trees
      let overlapsTree = false;
      for (const existing of obstacles) {
        if (rectsOverlap(obstacle, existing, 20)) {
          overlapsTree = true;
          break;
        }
      }
      if (overlapsTree) {
        attempts++;
        continue;
      }

      validPosition = true;
      attempts++;
    }

    if (obstacle && validPosition) {
      obstacles.push(obstacle);
    }
  }

  return { house, acs, obstacles, repairman, mapWidth, mapHeight };
}
