import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { RotateCcw, Palette, Home, Trophy, Coins, Footprints, AlertOctagon } from 'lucide-react';
import { saveHighScore, getHighScores } from '../utils/assetStorage';
import { soundManager } from '../utils/soundEngine';

export default function GameOverModal({
  score = 0,
  coins = 0,
  distance = 0,
  obstacle = 'Train',
  characterName = 'Bhaai',
  onRestart,
  onCustomize,
  onMainMenu
}) {
  const highScores = getHighScores();
  const bestScore = highScores.length > 0 ? highScores[0].score : 0;
  const isNewHighScore = score > bestScore && score > 0;

  useEffect(() => {
    // Save to highscores list
    saveHighScore({
      name: characterName,
      score: score,
      coins: coins,
      distance: distance,
      date: new Date().toISOString().split('T')[0]
    });

    // Fire celebratory confetti if high score!
    if (isNewHighScore) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    }

    return () => {
      soundManager.stopGameOverAudio();
    };
  }, [score, isNewHighScore]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none">
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 22 }}
        className="relative w-full max-w-md glass-panel-glow rounded-3xl p-6 md:p-8 flex flex-col items-center text-center border-2 border-red-500/50 shadow-2xl"
      >
        {/* Police Inspector Chiranjeevi Avatar & Title */}
        <div className="relative mb-3">
          <img
            src="/police_face.png"
            alt="Police Inspector Boss"
            className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-400 shadow-2xl"
          />
          <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-red-600 border-2 border-slate-900 flex items-center justify-center text-sm shadow">
            👮
          </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-amber-300 text-title tracking-wider">
          🚨 BUSTED BY POLICE! 🚨
        </h2>
        <p className="text-xs font-bold text-red-300 mt-1">
          Inspector Boss caught {characterName} after colliding with a {obstacle}!
        </p>

        {/* New High Score Celebratory Banner */}
        {isNewHighScore && (
          <div className="mt-3 px-4 py-1.5 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest shadow-lg animate-bounce">
            🎉 NEW HIGH SCORE! 🎉
          </div>
        )}

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-3 gap-2.5 my-5 bg-slate-900/80 p-3 rounded-2xl border border-slate-800 shadow-inner">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">SCORE</span>
            <span className="text-xl md:text-2xl font-black text-amber-300 text-comic">
              {score.toLocaleString()}
            </span>
          </div>

          <div className="flex flex-col items-center border-x border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Coins className="w-3 h-3 text-yellow-400" /> COINS
            </span>
            <span className="text-xl md:text-2xl font-black text-yellow-400 text-comic">
              {coins.toLocaleString()}
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Footprints className="w-3 h-3 text-sky-400" /> DISTANCE
            </span>
            <span className="text-xl md:text-2xl font-black text-sky-300 text-comic">
              {distance}m
            </span>
          </div>
        </div>

        {/* Best Score Indicator */}
        <div className="text-xs text-slate-400 font-bold mb-5 flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>All-Time Best: <strong className="text-amber-300">{Math.max(score, bestScore).toLocaleString()}</strong></span>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={() => {
              soundManager.stopGameOverAudio();
              onRestart();
            }}
            className="btn-arcade w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400 text-slate-950 font-black text-lg text-title tracking-wider shadow-xl flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5 stroke-[3]" />
            <span>PLAY AGAIN</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => {
                soundManager.stopGameOverAudio();
                onCustomize();
              }}
              className="py-2.5 rounded-xl glass-panel text-amber-300 font-bold text-xs hover:text-white transition-all flex items-center justify-center gap-1.5 border border-amber-500/30"
            >
              <Palette className="w-4 h-4" />
              <span>Customize</span>
            </button>

            <button
              onClick={() => {
                soundManager.stopGameOverAudio();
                onMainMenu();
              }}
              className="py-2.5 rounded-xl glass-panel text-slate-300 font-bold text-xs hover:text-white transition-all flex items-center justify-center gap-1.5 border border-slate-700"
            >
              <Home className="w-4 h-4" />
              <span>Main Menu</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

