# 🏃‍♂️ Bhaai Run - Funny 3D Customizable Endless Runner Game

An original, high-performance, responsive browser-based 3D endless runner inspired by Subway Surfers mechanics with an energetic Bollywood comic identity and a full **Live Customization Studio**.

Playable on **Desktop**, **Laptops**, **Tablets**, and **Mobile Phones**.

---

## 🎮 Gameplay Mechanics

- **3 Running Lanes:** Smooth lateral lane switching with character tilt and banking.
- **Jumping:** Jump over low track barriers, hurdles, and comical rolling obstacles. Super-jump powerup boosts jump height!
- **Sliding:** Slide under high overhead warning bars and railway pipes. Includes mid-air fast dive!
- **Coins:** Collect spinning coins in straight lines, jump arcs, and sky lanes.
- **Incoming Trains:** Trains move along the tracks towards you, with realistic headlights and blaring horns. Run on top of trains or dodge them!
- **Moving & Funny Obstacles:** Slippery giant banana peels, angry flapping chickens, and custom user billboards.
- **Power-ups:**
  - 🧲 **Coin Magnet (12s):** Attracts coins from all 3 lanes directly to the player.
  - 🚀 **Jetpack (8s):** Launches you into the sky with a trail of gold coins, completely bypassing ground traffic.
  - 🛡️ **Bubble Shield:** Absorbs an obstacle crash with a pop sound, granting recovery invincibility.
  - 👟 **Super Jump (12s):** Bouncy spring jump with comic boing physics.
  - ⚡ **Turbo Nitro (6s):** High-speed invincibility dash that smashes obstacles.
- **Progression:** Speed increases gradually with distance traveled. High scores and total coin tallies persist across sessions.

---

## 🕹️ Controls

| Action | Desktop Keyboard | Mobile / Tablet Touch |
| :--- | :--- | :--- |
| **Move Left** | Left Arrow / `A` | Swipe Left or Left Button |
| **Move Right** | Right Arrow / `D` | Swipe Right or Right Button |
| **Jump** | Up Arrow / `W` / `Space` | Swipe Up or Jump Button |
| **Slide Under** | Down Arrow / `S` | Swipe Down or Slide Button |
| **Pause / Resume** | `Escape` / `P` | Pause Button (Top Right) |

---

## 🎨 Admin Customization Studio (Live In-Game!)

Access the studio from the **Main Menu** or during pause by clicking **CUSTOMIZE**.

### 1. Character Studio
- **Upload Custom Character Images:** Supports PNG, JPG, WebP, and transparent PNG. Uploaded images instantly appear as your 3D runner in the game with animated sneaker feet and comic border!
- **Upload 3D Models:** Upload `.glb` / `.gltf` 3D character models.
- **Default Characters:** *Bhaai The Legend*, *Cheeky Chintu*, *Robo-Dash*, and *Dadi Turbo*.
- **Funny Animations:** Swagger Run, Goofy Flap, Ninja Sprint, and Waddle Run.
- **Accessories & Style:** Sunglasses, curled mustache, gold chain, suit colors, custom names.

### 2. Train Customization
- **Presets:** Indian Railways Express, Cyberpunk Neon Metro, Cartoon Steamer, Chonky Monster Train.
- **Upload Custom Skins:** Apply your own image or logo directly to the train side and front!
- **Sliders:** Train speed multiplier and train car length.

### 3. Coin Customization
- **Shapes:** Star Gold Coin, Pizza Slice, Diamond Jewel, Donut.
- **Upload Custom Coin Photo:** Turn any photo (friend, meme, crypto coin) into an in-game spinning collectible!
- **Sliders:** Score value (+10, +25, +50 pts) and rotation speed.

### 4. Obstacle Customization
- **Presets:** Low Track Hurdle, Overhead Warning Pipe, Giant Banana, Flapping Chicken.
- **Upload Custom Billboard:** Upload any image to turn it into an in-game 3D billboard obstacle!

### 5. Environments
- **Themes:** *Bhaai Junction* (Indian Railway station with chai stalls and palm trees), *Cyberpunk 2099*, *Sunny Beach*, *Cartoon Valley*.
- Dynamic lighting, fog, and continuous procedural track recycling.

### 6. Sound Effects & Music Manager
- **Upload Custom Audio:** Upload `.mp3`, `.wav`, or `.ogg` for:
  - Jump
  - Slide
  - Coin pickup
  - Train horn
  - Crash / Collision
  - Game Over
  - Power-up pickup
  - Background music (BGM)
- **Built-in Web Audio API Synthesizer:** High-fidelity procedural sound effects and energetic procedural bhangra/arcade beats that work out of the box with zero external audio dependencies.
- **Live Sound Previews:** Test every sound before playing.
- **Volume Sliders & Individual Mutes.**

### 7. Instant Reactive "APPLY CHANGES"
- Clicking **APPLY CHANGES** writes large binary assets to **IndexedDB** and game configurations to **LocalStorage**.
- The running 3D engine immediately hot-swaps models, textures, sounds, and physics without refreshing the page!

---

## 🛠️ Architecture & Tech Stack

- **React 18** (`useState`, `useEffect`, `useRef`, modular component hierarchy)
- **Three.js** (WebGL 3D engine, custom geometry, PBR materials, shadows, spot lights, camera lerping)
- **Tailwind CSS** (Arcade glassmorphism, responsive grid, comic typography)
- **Framer Motion** (Spring physics for popups, badges, modals)
- **Canvas Confetti** (Celebratory particle explosions on new high scores)
- **Web Audio API** (Procedural synth audio engine + HTML5 audio buffer decoders)
- **IndexedDB & LocalStorage** (Persistent offline storage for custom uploaded textures and audio)

---

## 🚀 Running the Project

```bash
# Start development server
npm run dev

# Build production bundle
npm run build

# Preview production build
npm run preview
```

