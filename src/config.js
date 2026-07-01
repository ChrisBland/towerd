// Central place for every tunable value in the game. Logic modules read from
// here so balance can be adjusted without touching behaviour.

export const CANVAS = {
    width: 800,
    height: 600,
};

// Fixed simulation step. The loop advances the world in increments of this many
// milliseconds so the simulation is deterministic and frame-rate independent.
export const SIM_STEP_MS = 1000 / 60;

export const ECONOMY = {
    startingGold: 300,        // was a debug value of 5500 in the original
    startingLives: 10,
    interestRate: 0.07,       // fraction of gold awarded each interest tick
    interestIntervalMs: 6000,
    sellRatio: 0.6,           // refund = cost * level * sellRatio
    upgradeCostFactor: 1.5,   // upgrade = cost * (level + 1) * upgradeCostFactor
    levelBonusBase: 200,      // level clear bonus = base + level * perLevel
    levelBonusPerLevel: 100,
};

export const WAVES = {
    enemiesPerWave: 10,
    spawnIntervalMs: 1000,
    waveCountdownSec: 5,
    wavesPerLevel: 10,
    healthScalingPerWave: 0.1, // +10% enemy health per wave
};

export const TOWER_MAX_LEVEL = 5;

// Per-level multipliers shared by all tower types.
export const TOWER_SCALING = {
    rangePerLevel: 0.2,        // range *= 1 + (level-1)*0.2
    damageGrowth: 1.5,         // damage = base * 1.5^(level-1)
    cooldownReductionPerLevel: 0.2, // cooldown *= 1 - (level-1)*0.2
};

export const TOWERS = {
    fire: {
        cost: 100,
        range: 100,
        damage: 20,
        cooldownMs: 1000,
        // damage-per-second of the burn, indexed by level (1..5)
        burnDpsByLevel: [10, 14, 18, 22, 26],
        burnDurationMs: 3000,
        projectileColor: '#ff4400',
        rangeColor: 'rgba(255, 68, 68, 0.3)',
        glowColor: 'rgba(255, 68, 68, 0.6)',
        fillGlow: 'rgba(255, 100, 0, 0.5)',
    },
    water: {
        cost: 150,
        range: 120,
        damage: 15,
        cooldownMs: 800,
        // slow strength (fraction of speed removed) per level
        slowAmountByLevel: [0.5, 0.6, 0.7, 0.8, 0.9],
        // slow duration in ms per level
        slowDurationByLevel: [1000, 1500, 2000, 2500, 3000],
        projectileColor: '#00aaff',
        rangeColor: 'rgba(68, 68, 255, 0.3)',
        glowColor: 'rgba(68, 68, 255, 0.6)',
        fillGlow: 'rgba(0, 150, 255, 0.5)',
    },
    earth: {
        cost: 125,
        range: 150,
        damage: 40,
        cooldownMs: 2000,
        projectileColor: '#654321',
        rangeColor: 'rgba(68, 170, 68, 0.3)',
        glowColor: 'rgba(68, 170, 68, 0.6)',
        fillGlow: 'rgba(0, 200, 0, 0.5)',
    },
};

export const ENEMIES = {
    slow: { speed: 1, baseHealth: 80, fallbackColor: '#8844FF' },
    fast: { speed: 3, baseHealth: 30, fallbackColor: '#FF4444' },
    strong: { speed: 1.5, baseHealth: 150, fallbackColor: '#44AA44' },
};

export const ENEMY_TYPES = ['slow', 'fast', 'strong'];

export const LEVELS = {
    names: [
        'The Beginning',
        'Zigzag Valley',
        'Spiral Path',
        'Crossroads',
        'Figure Eight',
        'The Maze',
        'Diamond Rush',
        'Split Decision',
        'Spiral Madness',
        'The Gauntlet',
    ],
    layouts: [
        // Level 1: Simple S-shape (Beginner)
        [
            { x: 0, y: 100 }, { x: 600, y: 100 }, { x: 600, y: 400 },
            { x: 200, y: 400 }, { x: 200, y: 250 }, { x: 800, y: 250 },
        ],
        // Level 2: Zigzag (Easy)
        [
            { x: 0, y: 50 }, { x: 700, y: 50 }, { x: 700, y: 200 },
            { x: 100, y: 200 }, { x: 100, y: 350 }, { x: 700, y: 350 },
            { x: 700, y: 500 }, { x: 100, y: 500 }, { x: 800, y: 500 },
        ],
        // Level 3: Spiral (Medium)
        [
            { x: 0, y: 50 }, { x: 750, y: 50 }, { x: 750, y: 550 },
            { x: 50, y: 550 }, { x: 50, y: 150 }, { x: 650, y: 150 },
            { x: 650, y: 450 }, { x: 150, y: 450 }, { x: 150, y: 250 },
            { x: 800, y: 250 },
        ],
        // Level 4: Double Cross (Hard)
        [
            { x: 0, y: 300 }, { x: 200, y: 300 }, { x: 200, y: 100 },
            { x: 400, y: 100 }, { x: 400, y: 500 }, { x: 600, y: 500 },
            { x: 600, y: 100 }, { x: 800, y: 100 },
        ],
        // Level 5: Figure 8 (Challenging)
        [
            { x: 0, y: 300 }, { x: 200, y: 300 }, { x: 400, y: 100 },
            { x: 600, y: 300 }, { x: 400, y: 500 }, { x: 200, y: 300 },
            { x: 400, y: 100 }, { x: 800, y: 100 },
        ],
        // Level 6: Maze (Very Hard)
        [
            { x: 0, y: 50 }, { x: 750, y: 50 }, { x: 750, y: 150 },
            { x: 50, y: 150 }, { x: 50, y: 250 }, { x: 750, y: 250 },
            { x: 750, y: 350 }, { x: 50, y: 350 }, { x: 50, y: 450 },
            { x: 750, y: 450 }, { x: 750, y: 550 }, { x: 800, y: 550 },
        ],
        // Level 7: Diamond Pattern (Expert)
        [
            { x: 0, y: 300 }, { x: 200, y: 100 }, { x: 400, y: 300 },
            { x: 200, y: 500 }, { x: 400, y: 300 }, { x: 600, y: 100 },
            { x: 800, y: 300 },
        ],
        // Level 8: Dual Path Split (Master)
        [
            { x: 0, y: 300 }, { x: 200, y: 300 }, { x: 400, y: 100 },
            { x: 600, y: 100 }, { x: 800, y: 300 }, { x: 400, y: 500 },
            { x: 600, y: 500 }, { x: 800, y: 300 },
        ],
        // Level 9: Spiral Maze (Nightmare)
        [
            { x: 0, y: 300 }, { x: 700, y: 300 }, { x: 700, y: 100 },
            { x: 100, y: 100 }, { x: 100, y: 500 }, { x: 600, y: 500 },
            { x: 600, y: 200 }, { x: 200, y: 200 }, { x: 200, y: 400 },
            { x: 500, y: 400 }, { x: 500, y: 300 }, { x: 800, y: 300 },
        ],
        // Level 10: The Gauntlet (Ultimate)
        [
            { x: 0, y: 550 }, { x: 100, y: 550 }, { x: 100, y: 50 },
            { x: 300, y: 50 }, { x: 300, y: 550 }, { x: 500, y: 550 },
            { x: 500, y: 50 }, { x: 700, y: 50 }, { x: 700, y: 550 },
            { x: 800, y: 550 },
        ],
    ],
};
