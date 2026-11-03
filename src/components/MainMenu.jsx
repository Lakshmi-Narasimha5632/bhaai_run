import React from 'react';
import { motion } from 'framer-motion';
import { Play, Palette, Trophy, Settings, Users, Sparkles, Flame, ShieldAlert } from 'lucide-react';
import LivePreviewCanvas from './LivePreviewCanvas';

export default function MainMenu({
  onPlay,
  onOpenCustomize,
  onOpenHighScores,
  onOpenSettings,
  config
}) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-between p-4 md:p-8 overflow-y-auto select-none bg-gradient-to-b from-slate-950/80 via-slate-900/60 to-slate-950/90 backdrop-blur-sm">
      {/* Top Bar with Daily Challenge Badge */}
      <div className="w-full max-w-4xl flex items-center justify-between">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl glass-panel border border-amber-500/30">
          <Flame className="w-4 h-4 text-orange-400 fill-orange-400 animate-bounce" />
          <span className="text-xs font-black text-amber-300">DAILY QUEST:</span>
          <span className="text-xs font-bold text-slate-200">Collect 50 Coins</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSettings}
            className="w-10 h-10 rounded-2xl glass-panel flex items-center justify-center text-slate-300 hover:text-white hover:scale-105 active:scale-95 transition-all shadow-md"
            title="Game Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center Hero: Title Logo & 3D Character Preview */}
      <div className="flex flex-col items-center gap-4 my-auto">
        {/* Title Logo with Comic Subway Surfers 3D text */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="text-center"
        >
          <div className="inline-block px-4 py-1 rounded-full bg-gradient-to-r from-pink-600 to-amber-500 text-white font-black text-[11px] tracking-widest uppercase mb-1 shadow-lg">
            3D CUSTOMIZABLE ENDLESS RUNNER
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-amber-400 to-orange-500 text-title tracking-wider drop-shadow-[0_10px_20px_rgba(245,158,11,0.4)]">
            BHAAI RUN
          </h1>
          <p className="text-sm md:text-base font-bold text-amber-200/90 mt-1 font-comic tracking-wide">
            Dodging Trains • Jumping Hurdles • BHAAIwood Swag
          </p>
        </motion.div>

        {/* 3D Character Hero Preview Card */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="w-64 h-64 md:w-72 md:h-72 relative"
        >
          <LivePreviewCanvas type="character" config={config} />
          <div className="absolute top-2 left-3 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-amber-500/30 text-[11px] font-black text-amber-300">
            RUNNER: {config.character?.name || 'Bhaai'}
          </div>
        </motion.div>

        {/* Big PLAY Button */}
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
          onClick={onPlay}
          className="btn-arcade px-10 md:px-14 py-4 rounded-3xl bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-400 text-slate-950 font-black text-2xl md:text-3xl text-title tracking-wider shadow-[0_10px_30px_rgba(245,158,11,0.5)] border-4 border-yellow-200 flex items-center gap-3"
        >
          <Play className="w-8 h-8 fill-slate-950" />
          <span>PLAY NOW</span>
        </motion.button>
      </div>

      {/* Bottom Menu Navigation Buttons */}
      <div className="w-full max-w-2xl grid grid-cols-3 gap-2.5 md:gap-4 mt-4">
        <button
          onClick={onOpenCustomize}
          className="glass-panel-glow py-3 px-3 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-2 text-amber-300 hover:text-white hover:scale-102 active:scale-95 transition-all shadow-lg"
        >
          <Palette className="w-5 h-5 text-amber-400" />
          <span className="text-xs md:text-sm font-black tracking-wide">CUSTOMIZE</span>
        </button>

        <button
          onClick={onOpenCustomize}
          className="glass-panel py-3 px-3 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-2 text-slate-200 hover:text-white hover:scale-102 active:scale-95 transition-all shadow-lg border border-slate-700"
        >
          <Users className="w-5 h-5 text-sky-400" />
          <span className="text-xs md:text-sm font-black tracking-wide">CHARACTERS</span>
        </button>

        <button
          onClick={onOpenHighScores}
          className="glass-panel py-3 px-3 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-2 text-yellow-300 hover:text-white hover:scale-102 active:scale-95 transition-all shadow-lg border border-yellow-500/30"
        >
          <Trophy className="w-5 h-5 text-yellow-400" />
          <span className="text-xs md:text-sm font-black tracking-wide">HIGH SCORES</span>
        </button>
      </div>

      {/* Desktop Controls Tip */}
      <div className="hidden md:flex items-center gap-4 text-xs font-bold text-slate-400 mt-3 bg-slate-950/60 px-4 py-1.5 rounded-full border border-slate-800">
        <span>Controls: <strong>A / D / ← / →</strong> Steer</span>
        <span>•</span>
        <span><strong>W / ↑ / Space</strong> Jump</span>
        <span>•</span>
        <span><strong>S / ↓</strong> Slide Under</span>
      </div>
    </div>
  );
}

