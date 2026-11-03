import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, X, Coins, Footprints } from 'lucide-react';
import { getHighScores } from '../utils/assetStorage';

export default function HighScoresModal({ onClose }) {
  const scores = getHighScores();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        className="relative w-full max-w-lg glass-panel-glow rounded-3xl p-6 flex flex-col border border-yellow-500/40 shadow-2xl max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-yellow-500 to-amber-300 flex items-center justify-center text-slate-950 shadow-lg">
              <Trophy className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white text-title tracking-wide">
                HALL OF FAME
              </h3>
              <p className="text-xs text-amber-400 font-bold">Top Subway Runners</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl glass-panel flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scores List */}
        <div className="flex-1 overflow-y-auto py-3 flex flex-col gap-2 my-2 pr-1">
          {scores.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm font-bold">
              No runs recorded yet. Start running to set the first record!
            </div>
          ) : (
            scores.map((entry, idx) => {
              const isTop3 = idx < 3;
              const medalColor = idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-600' : 'text-slate-500';

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                    idx === 0
                      ? 'border-yellow-500/50 bg-yellow-500/10 shadow-md'
                      : 'border-slate-800/80 bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 flex items-center justify-center font-black text-sm">
                      {isTop3 ? (
                        <Medal className={`w-5 h-5 ${medalColor}`} />
                      ) : (
                        <span className="text-slate-500 font-mono">#{idx + 1}</span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-white">{entry.name}</span>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="flex items-center gap-0.5 text-yellow-400">
                          <Coins className="w-3 h-3" /> {entry.coins}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 text-sky-400">
                          <Footprints className="w-3 h-3" /> {entry.distance}m
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="text-lg font-black text-amber-300 text-comic">
                      {entry.score.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{entry.date || 'Today'}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl glass-panel text-slate-300 font-bold text-xs hover:text-white"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

