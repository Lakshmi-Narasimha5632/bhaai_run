import React from 'react';
import { motion } from 'framer-motion';
import { Play, RotateCcw, Palette, Home, Volume2, VolumeX, Sliders } from 'lucide-react';
import { soundManager } from '../utils/soundEngine';

export default function PauseModal({
  onResume,
  onRestart,
  onCustomize,
  onMainMenu,
  config,
  onUpdateConfig
}) {
  const isMuted = config.sound?.muted || false;
  const sfxVol = config.sound?.sfxVolume !== undefined ? config.sound.sfxVolume : 0.9;
  const bgmVol = config.sound?.bgmVolume !== undefined ? config.sound.bgmVolume : 0.6;

  const handleMuteToggle = () => {
    const nextMuted = !isMuted;
    onUpdateConfig('sound', 'muted', nextMuted);
    soundManager.updateVolumes({ muted: nextMuted });
  };

  const handleSfxChange = (e) => {
    const val = parseFloat(e.target.value);
    onUpdateConfig('sound', 'sfxVolume', val);
    soundManager.updateVolumes({ sfxVolume: val });
  };

  const handleBgmChange = (e) => {
    const val = parseFloat(e.target.value);
    onUpdateConfig('sound', 'bgmVolume', val);
    soundManager.updateVolumes({ bgmVolume: val });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        className="w-full max-w-sm glass-panel-glow rounded-3xl p-6 flex flex-col items-center border border-amber-500/40 shadow-2xl"
      >
        <h3 className="text-2xl font-black text-white text-title tracking-wide mb-1">
          GAME PAUSED
        </h3>
        <p className="text-xs text-amber-400 font-bold mb-4">Take a breather, Bhaai!</p>

        {/* Audio Quick Sliders */}
        <div className="w-full bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 flex flex-col gap-3 mb-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-amber-400" /> Sound Settings
            </span>
            <button
              onClick={handleMuteToggle}
              className={`text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 transition-all ${
                isMuted ? 'bg-red-950 text-red-400 border border-red-500/30' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{isMuted ? 'MUTED' : 'MUTE'}</span>
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px] font-bold text-slate-400">
              <span>Sound Effects</span>
              <span>{Math.round(sfxVol * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={sfxVol}
              onChange={handleSfxChange}
              disabled={isMuted}
              className="accent-amber-400 cursor-pointer disabled:opacity-40"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px] font-bold text-slate-400">
              <span>Music Volume</span>
              <span>{Math.round(bgmVol * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={bgmVol}
              onChange={handleBgmChange}
              disabled={isMuted}
              className="accent-amber-400 cursor-pointer disabled:opacity-40"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={onResume}
            className="btn-arcade w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-400 text-slate-950 font-black text-lg text-title tracking-wider shadow-xl flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>RESUME</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 rounded-xl glass-panel text-amber-300 font-bold text-xs hover:text-white transition-all flex items-center justify-center gap-2 border border-amber-500/30"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart Run</span>
          </button>

          <button
            onClick={onCustomize}
            className="w-full py-3 rounded-xl glass-panel text-slate-300 font-bold text-xs hover:text-white transition-all flex items-center justify-center gap-2 border border-slate-700"
          >
            <Palette className="w-4 h-4 text-sky-400" />
            <span>Open Customizer Studio</span>
          </button>

          <button
            onClick={onMainMenu}
            className="w-full py-2.5 rounded-xl text-slate-400 font-bold text-xs hover:text-red-400 transition-all flex items-center justify-center gap-1.5"
          >
            <Home className="w-4 h-4" />
            <span>Quit to Main Menu</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

