// IndexedDB & LocalStorage management for Bhaai Run Endless Runner

const DB_NAME = 'BhaaiRunnerAssetsDB';
const DB_VERSION = 1;
const STORE_NAME = 'uploaded_assets';
const CONFIG_KEY = 'bhaai_runner_config_v7';
const STATS_KEY = 'bhaai_runner_stats_v1';
const HIGH_SCORES_KEY = 'bhaai_runner_highscores_v1';

// Open / initialize IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Store a binary or large string asset in IndexedDB
export async function saveAssetToDB(key, data) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(data, key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to save to IndexedDB:', err);
    return false;
  }
}

// Retrieve an asset from IndexedDB
export async function getAssetFromDB(key) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to get from IndexedDB:', err);
    return null;
  }
}

// Delete an asset from IndexedDB
export async function deleteAssetFromDB(key) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to delete from IndexedDB:', err);
    return false;
  }
}

// Default Configuration Presets
export const DEFAULT_CONFIG = {
  character: {
    selectedId: 'bhaai', // 'bhaai', 'chintu', 'grandma', 'robo', 'alien', 'custom'
    name: 'Bhaai The Legend',
    scale: 1.0,
    headScale: 1.1,
    runningSpeedMultiplier: 1.0,
    animationStyle: 'swagger', // 'swagger', 'goofy', 'ninja', 'waddle'
    customImageUrl: null,
    customModelUrl: null,
    hasSunglasses: false,
    hasGoldChain: true,
    hasMustache: false,
    suitColor: '#4f535e',
    skinColor: '#D99B77',
  },
  train: {
    selectedPreset: 'express', // 'express', 'metro', 'cartoon', 'monster', 'custom'
    color: '#0052cc',
    accentColor: '#ffcc00',
    length: 1.0, // scale multiplier
    width: 1.0,
    height: 1.0,
    speedMultiplier: 1.0,
    spawnFrequency: 1.0,
    customImageUrl: '/train_face.png',
    sideImageUrl: '/train_side.png',
  },
  coin: {
    shape: 'gold', // 'gold', 'pizza', 'diamond', 'chocolate', 'donut', 'custom'
    size: 1.0,
    color: '#FFD700',
    rotationSpeed: 1.0,
    value: 10,
    sound: 'arcade_bell', // 'arcade_bell', 'munch', 'cha_ching', 'wah_bhaai', 'custom'
    customImageUrl: '/coin_face.png',
  },
  obstacle: {
    selectedPreset: 'classic', // 'classic', 'funny', 'urban', 'custom'
    customImageUrl: null,
    hurdleImage1: '/hurdle_face_1.png',
    hurdleImage2: '/hurdle_face_2.png',
    spawnFrequency: 1.0,
    difficulty: 'normal', // 'easy', 'normal', 'hard', 'insane'
    allowBanana: true,
    allowChicken: true,
    allowMovingObstacles: true,
  },
  environment: {
    theme: 'bhaai_junction', // 'bhaai_junction', 'cyberpunk', 'sunny_beach', 'toon_valley', 'spooky'
    customSkyUrl: null,
    customTrackUrl: null,
    fogDensity: 0.008,
    lighting: 'day', // 'day', 'sunset', 'night', 'neon'
    cloudsEnabled: true,
  },
  sound: {
    masterVolume: 0.8,
    bgmVolume: 0.6,
    sfxVolume: 0.9,
    muted: false,
    bgmEnabled: true,
    sfxEnabled: true,
    bgmTrack: 'bhaai_laugh', // 'bhaai_laugh', 'desi_bhangra', 'retro_arcade', 'cyber_groove', 'cartoon_chase', 'custom'
    customSounds: {
      jump: null,
      slide: null,
      coin: null,
      trainHorn: null,
      collision: null,
      gameOver: '/bhaai_dialogue_gameover.mp3',
      powerup: null,
      bgm: null,
    }
  },
  gameplay: {
    gravity: 36,
    jumpForce: 15.5,
    slideDuration: 0.75,
    baseSpeed: 24,
    maxSpeed: 52,
    speedAcceleration: 0.35,
    touchSensitivity: 1.0,
  }
};

// Load saved configuration from LocalStorage (with fallback to defaults)
export function loadGameConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    const parsed = JSON.parse(raw);
    // Deep merge with default config so newly introduced fields don't cause undefined errors
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      character: { ...DEFAULT_CONFIG.character, ...(parsed.character || {}) },
      train: { ...DEFAULT_CONFIG.train, ...(parsed.train || {}) },
      coin: { ...DEFAULT_CONFIG.coin, ...(parsed.coin || {}) },
      obstacle: { ...DEFAULT_CONFIG.obstacle, ...(parsed.obstacle || {}) },
      environment: { ...DEFAULT_CONFIG.environment, ...(parsed.environment || {}) },
      sound: {
        ...DEFAULT_CONFIG.sound,
        ...(parsed.sound || {}),
        customSounds: { ...DEFAULT_CONFIG.sound.customSounds, ...((parsed.sound && parsed.sound.customSounds) || {}) }
      },
      gameplay: { ...DEFAULT_CONFIG.gameplay, ...(parsed.gameplay || {}) },
    };
  } catch (err) {
    console.error('Failed to load game config:', err);
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  }
}

// Save configuration to LocalStorage
export function saveGameConfig(config) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    return true;
  } catch (err) {
    console.error('Failed to save game config to localStorage:', err);
    return false;
  }
}

// Reset configuration to default
export function resetGameConfig() {
  try {
    localStorage.removeItem(CONFIG_KEY);
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  } catch (err) {
    console.error('Failed to reset config:', err);
    return DEFAULT_CONFIG;
  }
}

// High scores storage
export function getHighScores() {
  try {
    const raw = localStorage.getItem(HIGH_SCORES_KEY);
    return raw ? JSON.parse(raw) : [
      { name: 'Bhaai', score: 12500, coins: 140, distance: 820, date: '2026-03-01' },
      { name: 'Chintu', score: 8400, coins: 95, distance: 540, date: '2026-02-28' },
      { name: 'Dadi', score: 5200, coins: 60, distance: 380, date: '2026-02-25' },
    ];
  } catch {
    return [];
  }
}

export function saveHighScore(entry) {
  try {
    const scores = getHighScores();
    scores.push(entry);
    scores.sort((a, b) => b.score - a.score);
    const topScores = scores.slice(0, 10);
    localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(topScores));
    return topScores;
  } catch (err) {
    console.error('Failed to save highscore:', err);
    return [];
  }
}

// Stats tracking
export function getGameStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? JSON.parse(raw) : { totalRuns: 0, totalCoins: 0, totalDistance: 0, bestScore: 0 };
  } catch {
    return { totalRuns: 0, totalCoins: 0, totalDistance: 0, bestScore: 0 };
  }
}

export function updateGameStats(runData) {
  try {
    const stats = getGameStats();
    stats.totalRuns = (stats.totalRuns || 0) + 1;
    stats.totalCoins = (stats.totalCoins || 0) + (runData.coins || 0);
    stats.totalDistance = (stats.totalDistance || 0) + Math.floor(runData.distance || 0);
    stats.bestScore = Math.max(stats.bestScore || 0, runData.score || 0);
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    return stats;
  } catch (err) {
    console.error('Failed to update stats:', err);
  }
}

