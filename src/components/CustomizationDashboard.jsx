import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Train, CircleDollarSign, AlertTriangle, Mountain, Volume2, Music,
  Sliders, Upload, Trash2, RotateCcw, Check, Play, VolumeX, Sparkles, X
} from 'lucide-react';
import LivePreviewCanvas from './LivePreviewCanvas';
import { soundManager } from '../utils/soundEngine';
import { saveAssetToDB, deleteAssetFromDB, saveGameConfig, resetGameConfig, DEFAULT_CONFIG } from '../utils/assetStorage';

const TABS = [
  { id: 'characters', label: 'Characters', icon: User },
  { id: 'trains', label: 'Trains', icon: Train },
  { id: 'coins', label: 'Coins', icon: CircleDollarSign },
  { id: 'obstacles', label: 'Obstacles', icon: AlertTriangle },
  { id: 'backgrounds', label: 'Backgrounds', icon: Mountain },
  { id: 'sounds', label: 'Sound FX', icon: Volume2 },
  { id: 'music', label: 'BGM Music', icon: Music },
  { id: 'gameplay', label: 'Game Settings', icon: Sliders },
];

export default function CustomizationDashboard({ config, onApplyChanges, onClose }) {
  const [activeTab, setActiveTab] = useState('characters');
  const [tempConfig, setTempConfig] = useState(JSON.parse(JSON.stringify(config)));
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(null);

  // Helper to update a nested config field
  const updateConfig = (section, field, value) => {
    setTempConfig(prev => {
      const next = {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      };
      return next;
    });
    setHasChanges(true);
  };

  // Generic File Upload Handler (Images, 3D Models, Audio)
  const handleFileUpload = (e, targetSection, targetField, assetDbKey) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const resultData = event.target.result;
      // Save binary to IndexedDB
      if (assetDbKey) {
        await saveAssetToDB(assetDbKey, resultData);
      }
      // Update state for live preview
      updateConfig(targetSection, targetField, resultData);
    };
    reader.readAsDataURL(file);
  };

  // Generic Reset / Delete Asset Handler
  const handleDeleteAsset = async (targetSection, targetField, assetDbKey) => {
    if (assetDbKey) {
      await deleteAssetFromDB(assetDbKey);
    }
    updateConfig(targetSection, targetField, null);
  };

  // Sound File Upload Handler
  const handleSoundUpload = (e, soundType) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target.result;
      const dbKey = `custom_sound_${soundType}`;
      await saveAssetToDB(dbKey, dataUrl);

      // Load into sound engine immediately
      await soundManager.loadCustomSound(soundType, dataUrl);

      setTempConfig(prev => ({
        ...prev,
        sound: {
          ...prev.sound,
          customSounds: {
            ...prev.sound.customSounds,
            [soundType]: dataUrl
          }
        }
      }));
      setHasChanges(true);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteSound = async (soundType) => {
    const dbKey = `custom_sound_${soundType}`;
    await deleteAssetFromDB(dbKey);
    await soundManager.loadCustomSound(soundType, null);

    setTempConfig(prev => ({
      ...prev,
      sound: {
        ...prev.sound,
        customSounds: {
          ...prev.sound.customSounds,
          [soundType]: null
        }
      }
    }));
    setHasChanges(true);
  };

  // Apply Changes Button (Immediately saves to LocalStorage & updates live Game Engine)
  const handleApplyChanges = async () => {
    saveGameConfig(tempConfig);
    soundManager.updateVolumes(tempConfig.sound || {});
    await onApplyChanges(tempConfig);

    setHasChanges(false);
    setSaveSuccessMsg('Changes applied and saved successfully!');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Restore All Defaults
  const handleRestoreDefaults = async () => {
    if (window.confirm('Are you sure you want to restore all default characters, trains, coins, obstacles, and sounds?')) {
      const defaults = resetGameConfig();
      setTempConfig(JSON.parse(JSON.stringify(defaults)));
      await onApplyChanges(defaults);
      setHasChanges(false);
      setSaveSuccessMsg('Restored all default settings and assets!');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-6 bg-slate-950/85 backdrop-blur-xl">
      <div className="relative w-full max-w-5xl h-[92vh] glass-panel-glow rounded-3xl overflow-hidden flex flex-col border border-amber-500/40 shadow-2xl">
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-slate-700/80 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-black shadow-lg">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white text-title tracking-wide">
                CUSTOMIZATION STUDIO
              </h2>
              <p className="text-xs text-amber-400 font-medium">
                Upload your own photos, 3D models & audio files — live in-game!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRestoreDefaults}
              className="px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-red-400 hover:bg-red-950/30 border border-slate-700 transition-all flex items-center gap-1.5"
              title="Reset all settings to default"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Defaults</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl glass-panel flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto gap-1 px-4 py-2 border-b border-slate-800 bg-slate-950/60 no-scrollbar">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content Area: Left Controls & Right Live 3D Preview */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Form Column */}
          <div className="lg:col-span-7 flex flex-col gap-5 overflow-y-auto pr-1">
            {/* 1. CHARACTERS TAB */}
            {activeTab === 'characters' && (
              <div className="flex flex-col gap-4">
                <SectionHeader title="Character Customization" desc="Select a built-in hero or upload your own photo/model" />

                {/* Character Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-300">Character Name</label>
                  <input
                    type="text"
                    value={tempConfig.character.name || ''}
                    onChange={(e) => updateConfig('character', 'name', e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-bold focus:outline-none focus:border-amber-400"
                    placeholder="Enter character name"
                  />
                </div>

                {/* Default Character Presets */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-300">Default Characters</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'bhaai', name: 'Bhaai', color: '#4f535e' },
                      { id: 'chintu', name: 'Chintu', color: '#0284c7' },
                      { id: 'robo', name: 'Robo-Dash', color: '#10b981' },
                      { id: 'grandma', name: 'Dadi Turbo', color: '#d946ef' },
                    ].map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          updateConfig('character', 'selectedId', preset.id);
                          updateConfig('character', 'suitColor', preset.color);
                          updateConfig('character', 'customImageUrl', null);
                          if (preset.id === 'bhaai') {
                            updateConfig('character', 'hasSunglasses', false);
                            updateConfig('character', 'hasMustache', false);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                          tempConfig.character.selectedId === preset.id && !tempConfig.character.customImageUrl
                            ? 'border-amber-400 bg-amber-500/15 text-amber-300 font-black'
                            : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-full shadow-md" style={{ backgroundColor: preset.color }} />
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Police Inspector Chiranjeevi & Dog Chaser Feature Card */}
                <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src="/police_face.png"
                      alt="Inspector Chiranjeevi"
                      className="w-12 h-12 rounded-xl object-cover border border-amber-400/50 shadow"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-amber-300">Police Inspector (Chiranjeevi) & Dog</span>
                      <span className="text-[11px] text-slate-300">
                        Megastar Chiranjeevi as the police inspector chasing Bhaai with baton, whistle & bulldog!
                      </span>
                    </div>
                  </div>
                </div>

                {/* UPLOAD CUSTOM CHARACTER PHOTO */}
                <div className="p-4 rounded-2xl border-2 border-dashed border-amber-500/40 bg-amber-500/5 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                      <Upload className="w-4 h-4" /> UPLOAD YOUR OWN FACE / CHARACTER IMAGE
                    </span>
                    {tempConfig.character.customImageUrl && (
                      <button
                        onClick={() => handleDeleteAsset('character', 'customImageUrl', 'character_custom_image')}
                        className="text-red-400 hover:text-red-300 text-xs font-bold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Upload PNG, JPG, WebP, or transparent PNG. It will appear as your runner inside the 3D game!
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'character', 'customImageUrl', 'character_custom_image')}
                    className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                  />
                  {tempConfig.character.customImageUrl && (
                    <div className="flex items-center gap-2 mt-1">
                      <img
                        src={tempConfig.character.customImageUrl}
                        alt="Custom character"
                        className="w-12 h-12 object-cover rounded-xl border border-amber-400/50 shadow-md"
                      />
                      <span className="text-xs text-emerald-400 font-bold">✓ Custom image active in 3D game!</span>
                    </div>
                  )}
                </div>

                {/* Upload 3D Model GLTF / GLB */}
                <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-sky-400" /> Upload 3D Model (.GLB / .GLTF)
                    </span>
                    {tempConfig.character.customModelUrl && (
                      <button
                        onClick={() => handleDeleteAsset('character', 'customModelUrl', 'character_custom_model')}
                        className="text-red-400 hover:text-red-300 text-xs font-bold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    accept=".glb,.gltf"
                    onChange={(e) => handleFileUpload(e, 'character', 'customModelUrl', 'character_custom_model')}
                    className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-sky-600 file:text-white hover:file:bg-sky-500 cursor-pointer"
                  />
                </div>

                {/* Running Animation Style */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-300">Running Animation Style</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'swagger', label: 'Swagger Run' },
                      { id: 'goofy', label: 'Goofy Flap' },
                      { id: 'ninja', label: 'Ninja Sprint' },
                      { id: 'waddle', label: 'Waddle Run' },
                    ].map(style => (
                      <button
                        key={style.id}
                        onClick={() => updateConfig('character', 'animationStyle', style.id)}
                        className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                          tempConfig.character.animationStyle === style.id
                            ? 'border-amber-400 bg-amber-500/15 text-amber-300'
                            : 'border-slate-800 bg-slate-900 text-slate-400'
                        }`}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Character Accessories & Sliders */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempConfig.character.hasSunglasses}
                      onChange={(e) => updateConfig('character', 'hasSunglasses', e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-0"
                    />
                    <span>Cool Sunglasses</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempConfig.character.hasGoldChain}
                      onChange={(e) => updateConfig('character', 'hasGoldChain', e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-0"
                    />
                    <span>Gold Chain</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempConfig.character.hasMustache}
                      onChange={(e) => updateConfig('character', 'hasMustache', e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-0"
                    />
                    <span>Handlebar Mustache</span>
                  </label>
                </div>
              </div>
            )}

            {/* 2. TRAINS TAB */}
            {activeTab === 'trains' && (
              <div className="flex flex-col gap-4">
                <SectionHeader title="Train Customization" desc="Change train skins, dimensions, speed, and upload images" />

                {/* Train Presets */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-300">Train Design Preset</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'express', name: 'Indian Express', color: '#0052cc', accent: '#ffcc00' },
                      { id: 'metro', name: 'Neon Metro', color: '#0284c7', accent: '#38bdf8' },
                      { id: 'cartoon', name: 'Cartoon Choo-Choo', color: '#dc2626', accent: '#fbbf24' },
                      { id: 'monster', name: 'Chonky Monster', color: '#4c1d95', accent: '#a855f7' },
                    ].map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          updateConfig('train', 'selectedPreset', preset.id);
                          updateConfig('train', 'color', preset.color);
                          updateConfig('train', 'accentColor', preset.accent);
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                          tempConfig.train.selectedPreset === preset.id
                            ? 'border-amber-400 bg-amber-500/15 text-amber-300 font-black'
                            : 'border-slate-800 bg-slate-900 text-slate-400'
                        }`}
                      >
                        <div className="w-8 h-4 rounded shadow" style={{ backgroundColor: preset.color }} />
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Train Front Face & Side Image Customizers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Locomotive Front Face */}
                  <div className="p-3 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">Front Locomotive Face</span>
                      {tempConfig.train.customImageUrl && tempConfig.train.customImageUrl !== '/train_face.png' && (
                        <button
                          onClick={() => {
                            updateConfig('train', 'customImageUrl', '/train_face.png');
                            deleteAssetFromDB('train_custom_image');
                          }}
                          className="text-red-400 hover:text-red-300 text-[11px] font-bold flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Reset
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <img
                        src={tempConfig.train.customImageUrl || '/train_face.png'}
                        alt="Train Front Face"
                        className="w-14 h-16 rounded-xl object-cover border-2 border-amber-400/40 shadow-md"
                      />
                      <div className="flex-1 flex flex-col gap-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'train', 'customImageUrl', 'train_custom_image')}
                          className="text-[11px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                        />
                        <span className="text-[10px] text-slate-400">Charging directly at player!</span>
                      </div>
                    </div>
                  </div>

                  {/* Train Carriage Side Skin */}
                  <div className="p-3 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">Carriage Side Skin</span>
                      {tempConfig.train.sideImageUrl && tempConfig.train.sideImageUrl !== '/train_side.png' && (
                        <button
                          onClick={() => {
                            updateConfig('train', 'sideImageUrl', '/train_side.png');
                            deleteAssetFromDB('train_side_custom_image');
                          }}
                          className="text-red-400 hover:text-red-300 text-[11px] font-bold flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Reset
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <img
                        src={tempConfig.train.sideImageUrl || '/train_side.png'}
                        alt="Train Side Skin"
                        className="w-16 h-12 rounded-lg object-cover border border-amber-400/40 shadow"
                      />
                      <div className="flex-1 flex flex-col gap-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'train', 'sideImageUrl', 'train_side_custom_image')}
                          className="text-[11px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                        />
                        <span className="text-[10px] text-slate-400">Windows & express stripes.</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sliders: Speed Multiplier & Dimensions */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs font-bold text-slate-300">
                      <span>Train Speed</span>
                      <span className="text-amber-400">{tempConfig.train.speedMultiplier || 1.0}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={tempConfig.train.speedMultiplier || 1.0}
                      onChange={(e) => updateConfig('train', 'speedMultiplier', parseFloat(e.target.value))}
                      className="accent-amber-400 cursor-pointer"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs font-bold text-slate-300">
                      <span>Train Length</span>
                      <span className="text-amber-400">{tempConfig.train.length || 1.0}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.6"
                      max="1.5"
                      step="0.1"
                      value={tempConfig.train.length || 1.0}
                      onChange={(e) => updateConfig('train', 'length', parseFloat(e.target.value))}
                      className="accent-amber-400 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. COINS TAB */}
            {activeTab === 'coins' && (
              <div className="flex flex-col gap-4">
                <SectionHeader title="Coin Customization" desc="Change shape, rotation speed, sound, and upload custom coin photo" />

                {/* Preset Shapes */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-300">Coin Shape</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'gold', label: 'Gold Star Coin' },
                      { id: 'pizza', label: 'Pizza Slice' },
                      { id: 'diamond', label: 'Diamond Jewel' },
                      { id: 'donut', label: 'Pink Donut' },
                    ].map(shape => (
                      <button
                        key={shape.id}
                        onClick={() => {
                          updateConfig('coin', 'shape', shape.id);
                          updateConfig('coin', 'customImageUrl', null);
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                          tempConfig.coin.shape === shape.id && !tempConfig.coin.customImageUrl
                            ? 'border-amber-400 bg-amber-500/15 text-amber-300 font-black'
                            : 'border-slate-800 bg-slate-900 text-slate-400'
                        }`}
                      >
                        {shape.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Upload Custom Coin Photo */}
                <div className="p-4 rounded-2xl border-2 border-dashed border-amber-500/40 bg-amber-500/5 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                      <Upload className="w-4 h-4" /> UPLOAD YOUR OWN COIN IMAGE
                    </span>
                    {tempConfig.coin.customImageUrl && (
                      <button
                        onClick={() => handleDeleteAsset('coin', 'customImageUrl', 'coin_custom_image')}
                        className="text-red-400 hover:text-red-300 text-xs font-bold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Upload any face, logo, or meme. Coins floating on the track will feature your image!
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'coin', 'customImageUrl', 'coin_custom_image')}
                    className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                  />
                  {tempConfig.coin.customImageUrl && (
                    <span className="text-xs text-emerald-400 font-bold">✓ Custom photo coin active in game!</span>
                  )}
                </div>

                {/* Coin Value & Rotation */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs font-bold text-slate-300">
                      <span>Coin Score Value</span>
                      <span className="text-amber-400">+{tempConfig.coin.value || 10} pts</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      step="5"
                      value={tempConfig.coin.value || 10}
                      onChange={(e) => updateConfig('coin', 'value', parseInt(e.target.value))}
                      className="accent-amber-400 cursor-pointer"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs font-bold text-slate-300">
                      <span>Spin Speed</span>
                      <span className="text-amber-400">{tempConfig.coin.rotationSpeed || 1.0}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="3.0"
                      step="0.5"
                      value={tempConfig.coin.rotationSpeed || 1.0}
                      onChange={(e) => updateConfig('coin', 'rotationSpeed', parseFloat(e.target.value))}
                      className="accent-amber-400 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 4. OBSTACLES TAB */}
            {activeTab === 'obstacles' && (
              <div className="flex flex-col gap-4">
                <SectionHeader title="Obstacle Customization" desc="Hurdles, overhead slide pipes, funny bananas, and custom billboards" />

                {/* Obstacle Types */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-300">Preview Obstacle Type</label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { id: 'barrier', label: 'Hurdle 1 (Jr. NTR)' },
                      { id: 'barrier_2', label: 'Hurdle 2 (Shocked)' },
                      { id: 'high_pipe', label: 'Overhead Pipe' },
                      { id: 'banana', label: 'Giant Banana' },
                      { id: 'chicken', label: 'Angry Chicken' },
                    ].map(obs => (
                      <button
                        key={obs.id}
                        onClick={() => {
                          updateConfig('obstacle', 'selectedPreset', obs.id);
                          updateConfig('obstacle', 'customImageUrl', null);
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                          tempConfig.obstacle.selectedPreset === obs.id && !tempConfig.obstacle.customImageUrl
                            ? 'border-amber-400 bg-amber-500/15 text-amber-300 font-black'
                            : 'border-slate-800 bg-slate-900 text-slate-400'
                        }`}
                      >
                        {obs.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hurdle 1 & Hurdle 2 Customizers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Hurdle 1 */}
                  <div className="p-3 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">Hurdle Face 1 (Jr. NTR)</span>
                      {tempConfig.obstacle.hurdleImage1 && tempConfig.obstacle.hurdleImage1 !== '/hurdle_face_1.png' && (
                        <button
                          onClick={() => handleDeleteAsset('obstacle', 'hurdleImage1', 'obstacle_hurdle_1')}
                          className="text-red-400 hover:text-red-300 text-[11px] font-bold flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Reset
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <img
                        src={tempConfig.obstacle.hurdleImage1 || '/hurdle_face_1.png'}
                        alt="Hurdle 1"
                        className="w-12 h-12 rounded-lg object-cover border border-amber-400/40"
                      />
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'obstacle', 'hurdleImage1', 'obstacle_hurdle_1')}
                          className="text-[11px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Hurdle 2 */}
                  <div className="p-3 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">Hurdle Face 2 (Shocked Meme)</span>
                      {tempConfig.obstacle.hurdleImage2 && tempConfig.obstacle.hurdleImage2 !== '/hurdle_face_2.png' && (
                        <button
                          onClick={() => handleDeleteAsset('obstacle', 'hurdleImage2', 'obstacle_hurdle_2')}
                          className="text-red-400 hover:text-red-300 text-[11px] font-bold flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Reset
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <img
                        src={tempConfig.obstacle.hurdleImage2 || '/hurdle_face_2.png'}
                        alt="Hurdle 2"
                        className="w-12 h-12 rounded-lg object-cover border border-amber-400/40"
                      />
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'obstacle', 'hurdleImage2', 'obstacle_hurdle_2')}
                          className="text-[11px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* UPLOAD CUSTOM BILLBOARD OBSTACLE */}
                <div className="p-4 rounded-2xl border-2 border-dashed border-amber-500/40 bg-amber-500/5 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                      <Upload className="w-4 h-4" /> UPLOAD CUSTOM BILLBOARD OBSTACLE
                    </span>
                    {tempConfig.obstacle.customImageUrl && (
                      <button
                        onClick={() => handleDeleteAsset('obstacle', 'customImageUrl', 'obstacle_custom_image')}
                        className="text-red-400 hover:text-red-300 text-xs font-bold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Upload an image (e.g. meme, friend's face, warning sign). It becomes an in-game 3D obstacle billboard!
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'obstacle', 'customImageUrl', 'obstacle_custom_image')}
                    className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                  />
                  {tempConfig.obstacle.customImageUrl && (
                    <span className="text-xs text-emerald-400 font-bold">✓ Custom obstacle billboard active!</span>
                  )}
                </div>
              </div>
            )}

            {/* 5. BACKGROUNDS TAB */}
            {activeTab === 'backgrounds' && (
              <div className="flex flex-col gap-4">
                <SectionHeader title="Environment & Worlds" desc="Choose stunning themes or upload sky and track visuals" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'bhaai_junction', name: 'Bhaai Junction', desc: 'Indian Railway platform with chai stall & palm trees' },
                    { id: 'cyberpunk', name: 'Cyberpunk 2099', desc: 'Moody neon city towers and glowing tracks' },
                    { id: 'sunny_beach', name: 'Sunny Beach', desc: 'Ocean coast railway with bright sunshine' },
                    { id: 'toon_valley', name: 'Cartoon Valley', desc: 'Lollipop trees and fluffy low-poly clouds' },
                  ].map(env => (
                    <button
                      key={env.id}
                      onClick={() => updateConfig('environment', 'theme', env.id)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        tempConfig.environment.theme === env.id
                          ? 'border-amber-400 bg-amber-500/15 shadow-md'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                      }`}
                    >
                      <h4 className="text-sm font-black text-white">{env.name}</h4>
                      <p className="text-xs text-slate-400 mt-1">{env.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 6. SOUND EFFECTS TAB */}
            {activeTab === 'sounds' && (
              <div className="flex flex-col gap-4">
                <SectionHeader title="Sound Effects Manager" desc="Preview built-in sound effects or upload your own audio (MP3/WAV/OGG)" />

                <div className="flex flex-col gap-3">
                  {[
                    { key: 'jump', label: 'Jump Sound' },
                    { key: 'slide', label: 'Slide Sound' },
                    { key: 'coin', label: 'Coin Collect Sound' },
                    { key: 'trainHorn', label: 'Train Horn Sound' },
                    { key: 'collision', label: 'Crash / Collision Sound' },
                    { key: 'gameOver', label: 'Bhaai Out / Game Over (Bhaai Dialogue)' },
                    { key: 'powerup', label: 'Power-up Pickup Sound' },
                  ].map(item => {
                    const hasCustom = !!tempConfig.sound.customSounds?.[item.key];
                    const isDefaultBhaaiDialogue = item.key === 'gameOver' && !hasCustom;
                    return (
                      <div key={item.key} className="p-3 rounded-xl border border-slate-800 bg-slate-900/70 flex items-center justify-between gap-3">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-white">{item.label}</span>
                          <span className="text-[11px] text-amber-400">
                            {isDefaultBhaaiDialogue ? '✓ Bhaai Dialogue audio active' : (hasCustom ? '✓ Custom uploaded audio active' : 'Procedural synth active')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Live Preview Button */}
                          <button
                            onClick={() => soundManager.previewSound(item.key)}
                            className="p-2 rounded-xl bg-amber-500 text-slate-950 font-black hover:bg-amber-400 transition-all shadow"
                            title="Preview sound"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>

                          {/* Upload Custom Audio */}
                          <label className="cursor-pointer px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1">
                            <Upload className="w-3 h-3 text-amber-400" />
                            <span>Upload</span>
                            <input
                              type="file"
                              accept="audio/*"
                              onChange={(e) => handleSoundUpload(e, item.key)}
                              className="hidden"
                            />
                          </label>

                          {/* Delete custom audio */}
                          {hasCustom && (
                            <button
                              onClick={() => handleDeleteSound(item.key)}
                              className="p-1.5 text-red-400 hover:text-red-300"
                              title="Revert to built-in sound"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 7. BACKGROUND MUSIC TAB */}
            {activeTab === 'music' && (
              <div className="flex flex-col gap-4">
                <SectionHeader title="Background Music Studio" desc="Select vibrant procedural loops or upload custom music track" />

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-300">BGM Track Style</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'bhaai_laugh', label: 'Bhaai Laugh Anthem (Default)' },
                      { id: 'desi_bhangra', label: 'Desi Bhangra Beats' },
                      { id: 'retro_arcade', label: '8-Bit Retro Arcade' },
                      { id: 'cyber_groove', label: 'Cyberpunk Groove' },
                    ].map(track => (
                      <button
                        key={track.id}
                        onClick={() => {
                          updateConfig('sound', 'bgmTrack', track.id);
                          soundManager.startBGM(track.id);
                        }}
                        className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                          tempConfig.sound.bgmTrack === track.id && !tempConfig.sound.customSounds?.bgm
                            ? 'border-amber-400 bg-amber-500/15 text-amber-300 font-black'
                            : 'border-slate-800 bg-slate-900 text-slate-400'
                        }`}
                      >
                        <span>{track.label}</span>
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Upload Custom BGM */}
                <div className="p-4 rounded-2xl border-2 border-dashed border-amber-500/40 bg-amber-500/5 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                      <Music className="w-4 h-4" /> UPLOAD CUSTOM BGM AUDIO FILE (MP3 / WAV / OGG)
                    </span>
                    {tempConfig.sound.customSounds?.bgm && (
                      <button
                        onClick={() => handleDeleteSound('bgm')}
                        className="text-red-400 hover:text-red-300 text-xs font-bold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => handleSoundUpload(e, 'bgm')}
                    className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                  />
                  {tempConfig.sound.customSounds?.bgm && (
                    <span className="text-xs text-emerald-400 font-bold">✓ Custom background music track active!</span>
                  )}
                </div>

                {/* Music Volume Slider */}
                <div className="flex flex-col gap-1.5 pt-2">
                  <div className="flex justify-between text-xs font-bold text-slate-300">
                    <span>Music Volume</span>
                    <span className="text-amber-400">{Math.round((tempConfig.sound.bgmVolume || 0.6) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={tempConfig.sound.bgmVolume || 0.6}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      updateConfig('sound', 'bgmVolume', val);
                      soundManager.updateVolumes({ bgmVolume: val });
                    }}
                    className="accent-amber-400 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* 8. GAME SETTINGS & PHYSICS TAB */}
            {activeTab === 'gameplay' && (
              <div className="flex flex-col gap-4">
                <SectionHeader title="Game Physics & Mechanics" desc="Adjust gravity, jump force, running speed, and slide timing" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs font-bold text-slate-300">
                      <span>Jump Force</span>
                      <span className="text-amber-400">{tempConfig.gameplay.jumpForce || 15.5}</span>
                    </div>
                    <input
                      type="range"
                      min="12"
                      max="22"
                      step="0.5"
                      value={tempConfig.gameplay.jumpForce || 15.5}
                      onChange={(e) => updateConfig('gameplay', 'jumpForce', parseFloat(e.target.value))}
                      className="accent-amber-400 cursor-pointer"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs font-bold text-slate-300">
                      <span>Base Running Speed</span>
                      <span className="text-amber-400">{tempConfig.gameplay.baseSpeed || 24} km/h</span>
                    </div>
                    <input
                      type="range"
                      min="18"
                      max="40"
                      step="1"
                      value={tempConfig.gameplay.baseSpeed || 24}
                      onChange={(e) => updateConfig('gameplay', 'baseSpeed', parseFloat(e.target.value))}
                      className="accent-amber-400 cursor-pointer"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs font-bold text-slate-300">
                      <span>Gravity Acceleration</span>
                      <span className="text-amber-400">{tempConfig.gameplay.gravity || 36}</span>
                    </div>
                    <input
                      type="range"
                      min="24"
                      max="55"
                      step="1"
                      value={tempConfig.gameplay.gravity || 36}
                      onChange={(e) => updateConfig('gameplay', 'gravity', parseFloat(e.target.value))}
                      className="accent-amber-400 cursor-pointer"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs font-bold text-slate-300">
                      <span>Slide Duration</span>
                      <span className="text-amber-400">{tempConfig.gameplay.slideDuration || 0.75}s</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.05"
                      value={tempConfig.gameplay.slideDuration || 0.75}
                      onChange={(e) => updateConfig('gameplay', 'slideDuration', parseFloat(e.target.value))}
                      className="accent-amber-400 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live 3D Preview Canvas */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <span className="text-xs font-black text-amber-400 tracking-wider">
              REAL-TIME 3D PREVIEW
            </span>
            <LivePreviewCanvas
              type={activeTab === 'characters' ? 'character' : activeTab === 'trains' ? 'train' : activeTab === 'coins' ? 'coin' : activeTab === 'obstacles' ? 'obstacle' : 'general'}
              config={tempConfig}
            />
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 flex flex-col gap-1">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Live In-Game Reflection:
              </span>
              <span>
                Clicking <strong className="text-amber-300">APPLY CHANGES</strong> immediately injects these assets into the running 3D subway world.
              </span>
            </div>
          </div>
        </div>

        {/* Footer Bar: Notification & APPLY CHANGES Button */}
        <div className="px-5 py-4 border-t border-slate-800 bg-slate-900/95 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {saveSuccessMsg ? (
              <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                <Check className="w-4 h-4" /> {saveSuccessMsg}
              </span>
            ) : hasChanges ? (
              <span className="text-xs font-bold text-amber-400 animate-pulse">
                ● Unsaved changes ready to apply!
              </span>
            ) : (
              <span className="text-xs text-slate-400">
                All changes saved & persistent across browser reloads.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl glass-panel text-slate-300 font-bold text-xs hover:text-white transition-all w-1/2 sm:w-auto"
            >
              Close
            </button>
            <button
              onClick={handleApplyChanges}
              className="btn-arcade px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400 text-slate-950 font-black text-sm tracking-wider shadow-xl flex items-center justify-center gap-2 w-1/2 sm:w-auto"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>APPLY CHANGES</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, desc }) {
  return (
    <div className="border-b border-slate-800/80 pb-2">
      <h3 className="text-base font-black text-white text-title tracking-wide">{title}</h3>
      <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
    </div>
  );
}

