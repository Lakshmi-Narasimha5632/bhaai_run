import React, { useState, useEffect, useRef } from 'react';
import { GameEngine } from './game/GameEngine';
import HUD from './components/HUD';
import TouchControls from './components/TouchControls';
import MainMenu from './components/MainMenu';
import GameOverModal from './components/GameOverModal';
import PauseModal from './components/PauseModal';
import HighScoresModal from './components/HighScoresModal';
import SettingsModal from './components/SettingsModal';
import CustomizationDashboard from './components/CustomizationDashboard';
import { soundManager } from './utils/soundEngine';
import { loadGameConfig, saveGameConfig, getAssetFromDB } from './utils/assetStorage';

export default function App() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  // Active Game State: 'menu' | 'playing' | 'paused' | 'game_over'
  const [gameState, setGameState] = useState('menu');

  // Modals
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [isHighScoresOpen, setIsHighScoresOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Config State
  const [config, setConfig] = useState(loadGameConfig);

  // HUD and Live Game stats
  const [hudStats, setHudStats] = useState({
    score: 0,
    coins: 0,
    distance: 0,
    multiplier: 1,
    speed: 24,
    powerups: {},
  });

  // Comic Praise Floating Notification
  const [comicPraise, setComicPraise] = useState(null);

  // Game Over Details
  const [gameOverData, setGameOverData] = useState({
    score: 0,
    coins: 0,
    distance: 0,
    obstacle: 'Train',
  });

  // Settings
  const [showTouchButtons, setShowTouchButtons] = useState(() => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  });

  // Initialize GameEngine & load assets from IndexedDB on mount
  useEffect(() => {
    async function loadSavedIndexedDBAssets() {
      const loaded = loadGameConfig();

      // Check if custom character image was saved in IndexedDB
      const charImg = await getAssetFromDB('character_custom_image');
      if (charImg) loaded.character.customImageUrl = charImg;

      const trainImg = await getAssetFromDB('train_custom_image');
      if (trainImg) loaded.train.customImageUrl = trainImg;

      const coinImg = await getAssetFromDB('coin_custom_image');
      if (coinImg) loaded.coin.customImageUrl = coinImg;

      const obsImg = await getAssetFromDB('obstacle_custom_image');
      if (obsImg) loaded.obstacle.customImageUrl = obsImg;

      // Check custom sounds in IndexedDB
      for (const key of ['jump', 'slide', 'coin', 'trainHorn', 'collision', 'gameOver', 'powerup', 'bgm']) {
        const soundData = await getAssetFromDB(`custom_sound_${key}`);
        if (soundData) {
          if (!loaded.sound.customSounds) loaded.sound.customSounds = {};
          loaded.sound.customSounds[key] = soundData;
          await soundManager.loadCustomSound(key, soundData);
        }
      }

      setConfig(loaded);
      soundManager.updateVolumes(loaded.sound || {});

      // Instantiate GameEngine
      if (canvasRef.current && !engineRef.current) {
        engineRef.current = new GameEngine(
          canvasRef.current,
          loaded,
          {
            onScoreUpdate: (stats) => setHudStats(stats),
            onComicPraise: (text) => {
              setComicPraise({ id: Date.now(), text });
              setTimeout(() => setComicPraise(null), 1800);
            },
            onGameOver: (data) => {
              setGameOverData(data);
              setGameState('game_over');
            },
            onPauseStateChange: (paused) => {
              setGameState(paused ? 'paused' : 'playing');
            }
          }
        );
      }
    }

    loadSavedIndexedDBAssets();

    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, []);

  // Update config helper
  const handleUpdateConfig = (section, field, value) => {
    setConfig(prev => {
      const next = {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      };
      saveGameConfig(next);
      if (engineRef.current) {
        engineRef.current.applyConfig(next);
      }
      return next;
    });
  };

  // Live Apply Changes from Customization Studio
  const handleApplyChanges = async (newConfig) => {
    setConfig(newConfig);
    saveGameConfig(newConfig);
    if (engineRef.current) {
      await engineRef.current.applyConfig(newConfig);
    }
  };

  // Gameplay actions
  const handlePlay = () => {
    soundManager.init();
    soundManager.stopGameOverAudio();
    setGameState('playing');
    if (engineRef.current) {
      engineRef.current.start();
    }
  };

  const handlePause = () => {
    if (engineRef.current) {
      engineRef.current.pause();
    }
    setGameState('paused');
  };

  const handleResume = () => {
    if (engineRef.current) {
      engineRef.current.resume();
    }
    setGameState('playing');
  };

  const handleRestart = () => {
    soundManager.stopGameOverAudio();
    setGameState('playing');
    if (engineRef.current) {
      engineRef.current.start();
    }
  };

  const handleMainMenu = () => {
    soundManager.stopGameOverAudio();
    if (engineRef.current) {
      engineRef.current.reset();
      engineRef.current.isRunning = false;
    }
    soundManager.stopBGM();
    setGameState('menu');
  };

  // Touch controls bindings to GameEngine
  const handleTouchLeft = () => {
    if (engineRef.current && gameState === 'playing') {
      engineRef.current.moveLane(-1);
    }
  };

  const handleTouchRight = () => {
    if (engineRef.current && gameState === 'playing') {
      engineRef.current.moveLane(1);
    }
  };

  const handleTouchJump = () => {
    if (engineRef.current && gameState === 'playing') {
      engineRef.current.jump();
    }
  };

  const handleTouchSlide = () => {
    if (engineRef.current && gameState === 'playing') {
      engineRef.current.slide();
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 font-game">
      {/* 3D WebGL Canvas for Endless Runner */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block z-0" />

      {/* Main Menu Screen */}
      {gameState === 'menu' && (
        <MainMenu
          config={config}
          onPlay={handlePlay}
          onOpenCustomize={() => setIsCustomizeOpen(true)}
          onOpenHighScores={() => setIsHighScoresOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {/* In-Game HUD and Controls */}
      {gameState === 'playing' && (
        <>
          <HUD
            score={hudStats.score}
            coins={hudStats.coins}
            distance={hudStats.distance}
            multiplier={hudStats.multiplier}
            speed={hudStats.speed}
            powerups={hudStats.powerups}
            comicPraise={comicPraise}
            onPause={handlePause}
          />
          <TouchControls
            onLeft={handleTouchLeft}
            onRight={handleTouchRight}
            onJump={handleTouchJump}
            onSlide={handleTouchSlide}
            showButtons={showTouchButtons}
          />
        </>
      )}

      {/* Game Paused Modal */}
      {gameState === 'paused' && (
        <PauseModal
          config={config}
          onUpdateConfig={handleUpdateConfig}
          onResume={handleResume}
          onRestart={handleRestart}
          onCustomize={() => setIsCustomizeOpen(true)}
          onMainMenu={handleMainMenu}
        />
      )}

      {/* Game Over Modal */}
      {gameState === 'game_over' && (
        <GameOverModal
          score={gameOverData.score}
          coins={gameOverData.coins}
          distance={gameOverData.distance}
          obstacle={gameOverData.obstacle}
          characterName={config.character?.name || 'Bhaai'}
          onRestart={handleRestart}
          onCustomize={() => setIsCustomizeOpen(true)}
          onMainMenu={handleMainMenu}
        />
      )}

      {/* Full Admin Customization Studio */}
      {isCustomizeOpen && (
        <CustomizationDashboard
          config={config}
          onApplyChanges={handleApplyChanges}
          onClose={() => setIsCustomizeOpen(false)}
        />
      )}

      {/* High Scores Leaderboard Modal */}
      {isHighScoresOpen && (
        <HighScoresModal onClose={() => setIsHighScoresOpen(false)} />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          config={config}
          onUpdateConfig={handleUpdateConfig}
          onClose={() => setIsSettingsOpen(false)}
          showTouchButtons={showTouchButtons}
          onToggleTouchButtons={() => setShowTouchButtons(!showTouchButtons)}
        />
      )}
    </div>
  );
}

