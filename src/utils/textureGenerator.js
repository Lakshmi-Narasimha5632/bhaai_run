import * as THREE from 'three';

// Global Texture Cache so canvases and textures are generated ONCE and shared across all instances
const textureCache = new Map();

export function createTrackTexture() {
  const key = 'track_ballast_sleepers';
  if (textureCache.has(key)) return textureCache.get(key);

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d', { alpha: false });

  // Gravel ballast background
  ctx.fillStyle = '#4a4238';
  ctx.fillRect(0, 0, 512, 512);

  // Gravel flecks
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = Math.random() * 3 + 1;
    ctx.fillStyle = Math.random() > 0.5 ? '#61574a' : '#332d26';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Wooden sleepers across the track (horizontal)
  const sleeperCount = 8;
  const sleeperHeight = 24;
  for (let i = 0; i < sleeperCount; i++) {
    const y = (512 / sleeperCount) * i + 10;
    // Wood body
    ctx.fillStyle = '#6d4c41';
    ctx.fillRect(40, y, 432, sleeperHeight);
    // Wood shadow
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(40, y + sleeperHeight - 4, 432, 4);
    // Wood grain highlight
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(40, y + 2, 432, 3);
  }

  // Steel rails (vertical lines)
  const railPositions = [110, 402];
  railPositions.forEach(x => {
    // Metal shadow
    ctx.fillStyle = '#263238';
    ctx.fillRect(x - 8, 0, 16, 512);
    // Metal body
    ctx.fillStyle = '#90a4ae';
    ctx.fillRect(x - 5, 0, 10, 512);
    // Metal shine
    ctx.fillStyle = '#eceff1';
    ctx.fillRect(x - 2, 0, 4, 512);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  textureCache.set(key, texture);
  return texture;
}

export function createTrainFrontTexture(preset = 'express', color = '#0052cc', accentColor = '#ffcc00') {
  const key = `train_front_${preset}_${color}_${accentColor}`;
  if (textureCache.has(key)) return textureCache.get(key);

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d', { alpha: false });

  // Train body base
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 512, 512);

  // Accent stripe
  ctx.fillStyle = accentColor;
  ctx.fillRect(0, 320, 512, 50);

  // Large windshield
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.roundRect(64, 80, 384, 180, 24);
  ctx.fill();

  // Glass reflection
  ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
  ctx.beginPath();
  ctx.roundRect(76, 92, 360, 80, 16);
  ctx.fill();

  // Headlights
  [120, 392].forEach(x => {
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(x, 410, 38, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(x, 410, 30, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, 410, 16, 0, Math.PI * 2);
    ctx.fill();
  });

  // Front cowcatcher grille
  ctx.fillStyle = '#1e293b';
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(180 + i * 26, 400, 14, 80);
  }

  // Train Logo
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.roundRect(170, 290, 172, 40, 8);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px Fredoka, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('BHAAI EXPRESS', 256, 318);

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set(key, texture);
  return texture;
}

export function createTrainSideTexture(color = '#0052cc', accentColor = '#ffcc00') {
  const key = `train_side_${color}_${accentColor}`;
  if (textureCache.has(key)) return textureCache.get(key);

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d', { alpha: false });

  // Base paint
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1024, 512);

  // Speed stripe
  ctx.fillStyle = accentColor;
  ctx.fillRect(0, 320, 1024, 60);

  // Windows
  const windowCount = 5;
  const winWidth = 110;
  const winGap = 80;
  const startX = 60;
  for (let i = 0; i < windowCount; i++) {
    const x = startX + i * (winWidth + winGap);
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(x - 4, 100, winWidth + 8, 140, 12);
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.roundRect(x, 104, winWidth, 132, 8);
    ctx.fill();

    if (i === 1 || i === 3) {
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(x + winWidth / 2, 160, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + winWidth / 2, 210, 32, Math.PI, 0);
      ctx.fill();
    }
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 48px Bungee, cursive';
  ctx.textAlign = 'center';
  ctx.fillText('BHAAI SUPERFAST', 512, 440);

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set(key, texture);
  return texture;
}

export function createCoinTexture(shape = 'gold') {
  const key = `coin_texture_${shape}`;
  if (textureCache.has(key)) return textureCache.get(key);

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  if (shape === 'pizza') {
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(64, 64, 55, -0.6, 0.6);
    ctx.lineTo(64, 64);
    ctx.fill();

    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(64, 64, 48, -0.55, 0.55);
    ctx.lineTo(64, 64);
    ctx.fill();

    ctx.fillStyle = '#dc2626';
    [[80, 58], [90, 68], [98, 58], [82, 72]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (shape === 'diamond') {
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.moveTo(64, 10);
    ctx.lineTo(110, 50);
    ctx.lineTo(64, 118);
    ctx.lineTo(18, 50);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.moveTo(64, 10);
    ctx.lineTo(85, 50);
    ctx.lineTo(64, 118);
    ctx.lineTo(43, 50);
    ctx.closePath();
    ctx.fill();
  } else {
    // Star coin
    const grad = ctx.createRadialGradient(50, 50, 5, 64, 64, 60);
    grad.addColorStop(0, '#fffbeb');
    grad.addColorStop(0.3, '#fde047');
    grad.addColorStop(0.8, '#eab308');
    grad.addColorStop(1, '#ca8a04');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(64, 64, 58, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(64, 64, 48, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    drawStar(ctx, 64, 64, 5, 25, 12);
  }

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set(key, texture);
  return texture;
}

function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
  let rot = Math.PI / 2 * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fill();
}

export function createObstacleTexture(type = 'barrier') {
  const key = `obstacle_texture_${type}`;
  if (textureCache.has(key)) return textureCache.get(key);

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d', { alpha: false });

  if (type === 'high_pipe') {
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(0, 0, 256, 128);
    ctx.fillStyle = '#dc2626';
    for (let i = -100; i < 350; i += 30) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 18, 0);
      ctx.lineTo(i + 18 - 35, 128);
      ctx.lineTo(i - 35, 128);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 20px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SLIDE UNDER!', 128, 70);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 128);
    ctx.fillStyle = '#ef4444';
    for (let i = -50; i < 300; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 20, 0);
      ctx.lineTo(i + 20 - 25, 128);
      ctx.lineTo(i - 25, 128);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 20px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('JUMP OVER!', 128, 70);
  }

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set(key, texture);
  return texture;
}

export function loadUserTexture(url) {
  if (!url) return Promise.resolve(null);
  if (textureCache.has(url)) return Promise.resolve(textureCache.get(url));

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const texture = new THREE.Texture(img);
      texture.needsUpdate = true;
      texture.colorSpace = THREE.SRGBColorSpace;
      textureCache.set(url, texture);
      resolve(texture);
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = url;
  });
}
