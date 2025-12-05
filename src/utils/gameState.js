const STORAGE_KEY = 'ac-repair-game-state';

export const defaultSettings = {
  numACs: 3,
  numRounds: 5,
  mathMode: 'addition', // 'addition', 'subtraction', 'both'
  blankMode: false, // When true, shows "2 + ? = 5" instead of "2 + 3 = ?"
  minValue: 1,
  maxValue: 5,
};

export const defaultGameState = {
  settings: { ...defaultSettings },
  totalStars: 0,
  currentGame: null, // Will hold in-progress game data
};

export function loadGameState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...defaultGameState,
        ...parsed,
        settings: { ...defaultSettings, ...parsed.settings },
      };
    }
  } catch (e) {
    console.error('Failed to load game state:', e);
  }
  return { ...defaultGameState };
}

export function saveGameState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save game state:', e);
  }
}

export function generateMathProblem(mathMode, minValue, maxValue, blankMode = false) {
  const operations = mathMode === 'both'
    ? ['addition', 'subtraction']
    : [mathMode];

  const operation = operations[Math.floor(Math.random() * operations.length)];

  let num1, num2, answer;

  if (blankMode) {
    // Blank mode: num1 op ? = result
    if (operation === 'addition') {
      // Format: num1 + ___ = result
      num1 = Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue;
      answer = Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue;
      const result = num1 + answer;
      return { num1, result, operation: '+', answer, displayType: 'blank' };
    } else {
      // Format: num1 - ___ = result
      num1 = Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue;
      answer = Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue;
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
      num1 = Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue;
      num2 = Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue;
      answer = num1 + num2;
      return { num1, num2, operation: '+', answer, displayType: 'standard' };
    } else {
      // For subtraction, ensure positive result
      num1 = Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue;
      num2 = Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue;
      // Make sure num1 >= num2 for positive result
      if (num1 < num2) {
        [num1, num2] = [num2, num1];
      }
      answer = num1 - num2;
      return { num1, num2, operation: '-', answer, displayType: 'standard' };
    }
  }
}

export function generateMap(numACs) {
  const mapWidth = 800;
  const mapHeight = 600;
  const margin = 80;

  // Place house randomly but not too close to edges
  const house = {
    x: margin + Math.random() * (mapWidth - 2 * margin - 120),
    y: margin + Math.random() * (mapHeight - 2 * margin - 100),
    width: 120,
    height: 100,
  };

  // Generate AC positions near the house
  const acs = [];
  const acSize = 40;
  const minDistFromHouse = 60;
  const maxDistFromHouse = 150;

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

      // Check overlap with other ACs
      let overlaps = false;
      for (const existingAc of acs) {
        const dist = Math.hypot(ac.x - existingAc.x, ac.y - existingAc.y);
        if (dist < acSize + 20) {
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

  // Generate some obstacles (trees, bushes)
  const obstacles = [];
  const numObstacles = 5 + Math.floor(Math.random() * 5);

  for (let i = 0; i < numObstacles; i++) {
    let validPosition = false;
    let attempts = 0;
    let obstacle;

    while (!validPosition && attempts < 50) {
      const isTree = Math.random() > 0.5;
      const size = isTree ? 30 + Math.random() * 20 : 20 + Math.random() * 15;

      obstacle = {
        id: i,
        x: margin + Math.random() * (mapWidth - 2 * margin - size),
        y: margin + Math.random() * (mapHeight - 2 * margin - size),
        width: size,
        height: size,
        type: isTree ? 'tree' : 'bush',
      };

      // Check not overlapping house
      if (rectsOverlap(obstacle, house, 20)) {
        attempts++;
        continue;
      }

      // Check not overlapping ACs
      let overlapsAC = false;
      for (const ac of acs) {
        if (rectsOverlap(obstacle, ac, 30)) {
          overlapsAC = true;
          break;
        }
      }

      if (overlapsAC) {
        attempts++;
        continue;
      }

      // Check not overlapping other obstacles
      let overlapsObstacle = false;
      for (const existing of obstacles) {
        if (rectsOverlap(obstacle, existing, 10)) {
          overlapsObstacle = true;
          break;
        }
      }

      if (!overlapsObstacle) {
        validPosition = true;
      }
      attempts++;
    }

    if (obstacle && validPosition) {
      obstacles.push(obstacle);
    }
  }

  // Starting position for repairman (away from obstacles)
  const repairman = {
    x: margin + 20,
    y: mapHeight / 2,
    width: 32,
    height: 48,
  };

  return { house, acs, obstacles, repairman, mapWidth, mapHeight };
}

function rectsOverlap(rect1, rect2, padding = 0) {
  return !(rect1.x + rect1.width + padding < rect2.x ||
           rect2.x + rect2.width + padding < rect1.x ||
           rect1.y + rect1.height + padding < rect2.y ||
           rect2.y + rect2.height + padding < rect1.y);
}
