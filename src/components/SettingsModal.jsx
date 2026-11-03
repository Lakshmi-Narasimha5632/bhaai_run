import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Volume2, VolumeX, Maximize2, Smartphone, X, Sparkles } from 'lucide-react';
import { soundManager } from '../utils/soundEngine';

export default function SettingsModal({
  config,
  onUpdateConfig,
  onClose,
  showTouchButtons,
  onToggleTouchButtons
}) {
  const isMuted = config.sound?.muted || false;
  const masterVol = config.sound?.masterVolume !== undefined ? config.sound.masterVolume : 0.8;
  const sfxVol = config.sound?.sfxVolume !== undefined ? config.sound.sfxVolume : 0.9;
  const bgmVol = config.sound?.bgmVolume !== undefined ? config.sound.bgmVolume : 0.6;

  const handleMuteToggle = () => {
    const nextMuted = !isMuted;
    onUpdateConfig('sound', 'muted', nextMuted);
    soundManager.updateVolumes({ muted: nextMuted });
  };

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        className="w-full max-w-md glass-panel-glow rounded-3xl p-6 flex flex-col border border-amber-500/40 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 shadow-lg">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white text-title tracking-wide">
                SETTINGS
              </h3>
              <p className="text-xs text-amber-400 font-bold">Preferences & Controls</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl glass-panel flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 flex flex-col gap-4">
          {/* Audio Master Controls */}
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-amber-400" /> Audio Master
              </span>
              <button
                onClick={handleMuteToggle}
                className={`text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1 transition-all ${
                  isMuted ? 'bg-red-950 text-red-400 border border-red-500/30' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{isMuted ? 'MUTED' : 'UNMUTED'}</span>
              </button>
            </div>

            {/* SFX Volume */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs font-bold text-slate-400">
                <span>Sound FX Volume</span>
                <span>{Math.round(sfxVol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={sfxVol}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdateConfig('sound', 'sfxVolume', val);
                  soundManager.updateVolumes({ sfxVolume: val });
                }}
                disabled={isMuted}
                className="accent-amber-400 cursor-pointer disabled:opacity-40"
              />
            </div>

            {/* BGM Volume */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs font-bold text-slate-400">
                <span>Music Volume</span>
                <span>{Math.round(bgmVol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={bgmVol}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdateConfig('sound', 'bgmVolume', val);
                  soundManager.updateVolumes({ bgmVolume: val });
                }}
                disabled={isMuted}
                className="accent-amber-400 cursor-pointer disabled:opacity-40"
              />
            </div>
          </div>

          {/* Gameplay & Display Toggles */}
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
            {/* Touch Buttons Overlay Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-black text-white flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-sky-400" /> Touch Buttons Overlay
                </span>
                <span className="text-[11px] text-slate-400">On-screen jump/slide & steering buttons</span>
              </div>
              <input
                type="checkbox"
                checked={showTouchButtons}
                onChange={onToggleTouchButtons}
                className="w-5 h-5 rounded text-amber-500 focus:ring-0 cursor-pointer"
              />
            </div>

            {/* Fullscreen Button */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <Maximize2 className="w-4 h-4 text-emerald-400" /> Fullscreen Display
              </span>
              <button
                onClick={handleFullscreenToggle}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-all"
              >
                Toggle Fullscreen
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl glass-panel text-slate-300 font-bold text-xs hover:text-white"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}

