import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, Zap, Shield, Magnet, Rocket, ArrowUpCircle } from 'lucide-react';

const HUD = React.memo(function HUD({
  score = 0,
  coins = 0,
  distance = 0,
  multiplier = 1,
  speed = 24,
  powerups = {},
  comicPraise = null,
  onPause
}) {
  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-20 flex flex-col justify-between p-3 md:p-6">
      {/* Top Header: Score, Coins, Distance, Pause Button */}
      <div className="flex items-start justify-between w-full">
        {/* Left Side: Score & Multiplier */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="glass-panel px-4 py-1.5 rounded-2xl flex items-baseline gap-2 border border-amber-500/40 shadow-lg">
              <span className="text-xs uppercase font-bold text-amber-400 font-comic tracking-wider">SCORE</span>
              <span className="text-2xl md:text-3xl font-black text-white text-comic">
                {score.toLocaleString()}
              </span>
            </div>
            {multiplier > 1 && (
              <span className="bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 font-black text-xs md:text-sm px-2.5 py-1 rounded-xl shadow-md">
                x{multiplier}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs md:text-sm text-slate-300 font-bold px-3 py-1 bg-slate-900/60 rounded-xl backdrop-blur-md border border-slate-700/50 w-fit">
            <span className="text-sky-400">⚡ DISTANCE:</span>
            <span>{distance} m</span>
            <span className="text-slate-500">|</span>
            <span className="text-emerald-400">{speed} km/h</span>
          </div>
        </div>

        {/* Right Side: Coins & Pause Button */}
        <div className="flex items-center gap-3">
          <div className="glass-panel px-4 py-1.5 rounded-2xl flex items-center gap-2.5 border border-yellow-500/40 shadow-lg">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-300 border-2 border-amber-200 overflow-hidden flex items-center justify-center shadow-md">
              <img src="/coin_face.png" alt="Coin" className="w-full h-full object-cover" />
            </div>
            <span className="text-2xl md:text-3xl font-black text-amber-300 text-comic">
              {coins.toLocaleString()}
            </span>
          </div>

          <button
            onClick={onPause}
            className="pointer-events-auto w-11 h-11 md:w-12 md:h-12 rounded-2xl glass-panel-glow flex items-center justify-center text-amber-300 hover:text-white hover:scale-105 active:scale-95 transition-all shadow-xl"
            aria-label="Pause Game"
          >
            <Pause className="w-5 h-5 md:w-6 md:h-6 fill-current" />
          </button>
        </div>
      </div>

      {/* Center: Comic Praise Floating Popup */}
      <div className="flex items-center justify-center">
        <AnimatePresence>
          {comicPraise && (
            <motion.div
              key={comicPraise.id}
              initial={{ scale: 0.3, y: 20, opacity: 0 }}
              animate={{ scale: 1.1, y: -15, opacity: 1 }}
              exit={{ scale: 0.8, y: -40, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 text-white font-black text-2xl md:text-4xl px-6 py-2.5 rounded-3xl shadow-2xl border-4 border-yellow-300 text-title tracking-wider"
            >
              {comicPraise.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Center: Active Power-Ups */}
      <div className="flex items-center justify-center gap-2.5 pb-2">
        {powerups.jetpack > 0 && (
          <PowerupPill
            icon={<Rocket className="w-4 h-4 text-amber-400" />}
            label="JETPACK"
            color="from-amber-500 to-red-500"
            seconds={powerups.jetpack}
            max={8}
          />
        )}

        {powerups.magnet > 0 && (
          <PowerupPill
            icon={<Magnet className="w-4 h-4 text-red-400" />}
            label="MAGNET"
            color="from-red-500 to-pink-500"
            seconds={powerups.magnet}
            max={12}
          />
        )}

        {powerups.super_jump > 0 && (
          <PowerupPill
            icon={<ArrowUpCircle className="w-4 h-4 text-emerald-400" />}
            label="SUPER JUMP"
            color="from-emerald-500 to-teal-500"
            seconds={powerups.super_jump}
            max={12}
          />
        )}

        {powerups.speed_boost > 0 && (
          <PowerupPill
            icon={<Zap className="w-4 h-4 text-cyan-400" />}
            label="TURBO NITRO"
            color="from-cyan-500 to-blue-500"
            seconds={powerups.speed_boost}
            max={6}
          />
        )}

        {powerups.shield && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-950/80 border border-sky-400/60 shadow-lg text-sky-300 font-bold text-xs">
            <Shield className="w-4 h-4 fill-sky-400/30 text-sky-300" />
            <span>SHIELD ACTIVE</span>
          </div>
        )}
      </div>
    </div>
  );
});

export default HUD;

function PowerupPill({ icon, label, color, seconds, max }) {
  const percent = Math.min(100, Math.max(0, (seconds / max) * 100));

  return (
    <div className="glass-panel px-3 py-1.5 rounded-2xl flex items-center gap-2 border border-slate-700 shadow-xl min-w-[110px]">
      <div className="p-1 rounded-lg bg-slate-800/80">{icon}</div>
      <div className="flex flex-col gap-0.5 flex-1">
        <div className="flex justify-between items-center text-[10px] font-bold text-slate-200">
          <span>{label}</span>
          <span className="font-mono text-amber-300">{Math.ceil(seconds)}s</span>
        </div>
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${color} rounded-full`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
