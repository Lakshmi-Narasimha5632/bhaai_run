import * as THREE from 'three';
import {
  createTrainFrontTexture,
  createTrainSideTexture,
  createCoinTexture,
  createObstacleTexture,
  loadUserTexture
} from '../utils/textureGenerator';

// Geometry & Material Cache for 60 FPS performance on any mobile / desktop device
const geoCache = new Map();
const matCache = new Map();

function getOrCreateGeometry(key, createFn) {
  if (geoCache.has(key)) return geoCache.get(key);
  const geo = createFn();
  geoCache.set(key, geo);
  return geo;
}

function getOrCreateMaterial(key, createFn) {
  if (matCache.has(key)) return matCache.get(key);
  const mat = createFn();
  matCache.set(key, mat);
  return mat;
}

// Memory clean-up helper
export function disposeHierarchy(node) {
  if (!node) return;
  for (let i = node.children.length - 1; i >= 0; i--) {
    disposeHierarchy(node.children[i]);
  }
  if (node.geometry) {
    node.geometry.dispose();
  }
  if (node.material) {
    if (Array.isArray(node.material)) {
      node.material.forEach(m => m.dispose());
    } else {
      node.material.dispose();
    }
  }
}

// --- 1. TRAIN BUILDER ---

export async function createTrainMesh(trainConfig = {}) {
  const {
    color = '#0052cc',
    accentColor = '#ffcc00',
    length = 1.0,
    width = 1.0,
    height = 1.0,
    customImageUrl = '/train_face.png',
    sideImageUrl = '/train_side.png',
    selectedPreset = 'express'
  } = trainConfig;

  const trainGroup = new THREE.Group();

  const trainLength = 18 * length;
  const trainWidth = 2.4 * width;
  const trainHeight = 3.6 * height;

  const bodyGeo = new THREE.BoxGeometry(trainWidth, trainHeight, trainLength);

  let frontTexture = null;
  let sideTexture = null;

  const frontUrl = customImageUrl || '/train_face.png';
  frontTexture = await loadUserTexture(frontUrl);
  if (!frontTexture) {
    frontTexture = createTrainFrontTexture(selectedPreset, color, accentColor);
  }

  const sideUrl = sideImageUrl || '/train_side.png';
  sideTexture = await loadUserTexture(sideUrl);
  if (!sideTexture) {
    sideTexture = createTrainSideTexture(color, accentColor);
  }

  const sideMat = new THREE.MeshStandardMaterial({
    map: sideTexture,
    roughness: 0.35,
    metalness: 0.2,
  });

  const frontMat = new THREE.MeshStandardMaterial({
    map: frontTexture,
    roughness: 0.3,
    metalness: 0.15,
  });

  const roofMat = new THREE.MeshStandardMaterial({
    color: selectedPreset === 'monster' ? 0x1e1b4b : 0x334155,
    roughness: 0.4,
    metalness: 0.5,
  });

  const materials = [
    sideMat,  // +X right side
    sideMat,  // -X left side
    roofMat,  // +Y top
    roofMat,  // -Y bottom
    frontMat, // +Z preview canvas face
    frontMat, // -Z oncoming player game face!
  ];

  const bodyMesh = new THREE.Mesh(bodyGeo, materials);
  bodyMesh.position.y = trainHeight / 2 + 0.4;
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  trainGroup.add(bodyMesh);

  // Rooftop AC units
  const acGeo = getOrCreateGeometry('train_ac_geo', () => new THREE.BoxGeometry(1.6, 0.4, 2.5));
  const acMat = getOrCreateMaterial('train_ac_mat', () => new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3 }));

  for (let z = -trainLength * 0.3; z <= trainLength * 0.3; z += 5) {
    const acUnit = new THREE.Mesh(acGeo, acMat);
    acUnit.position.set(0, trainHeight + 0.6, z);
    trainGroup.add(acUnit);
  }

  // Glowing headlight lenses (High visual fidelity, 0 dynamic light overhead)
  const bulbGeo = getOrCreateGeometry('headlight_bulb_geo', () => new THREE.SphereGeometry(0.35, 12, 12));
  const bulbMat = getOrCreateMaterial('headlight_bulb_mat', () => new THREE.MeshBasicMaterial({ color: 0xfff08a }));

  [-0.6, 0.6].forEach(x => {
    // Preview face (+Z)
    const bulbFront = new THREE.Mesh(bulbGeo, bulbMat);
    bulbFront.position.set(x, 1.4, trainLength / 2 + 0.1);
    trainGroup.add(bulbFront);

    // Oncoming game face (-Z)
    const bulbBack = new THREE.Mesh(bulbGeo, bulbMat);
    bulbBack.position.set(x, 1.4, -trainLength / 2 - 0.1);
    trainGroup.add(bulbBack);
  });

  // Wheels
  const wheelGeo = getOrCreateGeometry('train_wheel_geo', () => new THREE.CylinderGeometry(0.35, 0.35, 0.25, 12));
  const wheelMat = getOrCreateMaterial('train_wheel_mat', () => new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.4 }));
  const wheelSpacing = 4.5;

  for (let z = -trainLength * 0.4; z <= trainLength * 0.4; z += wheelSpacing) {
    [-trainWidth / 2 - 0.05, trainWidth / 2 + 0.05].forEach(x => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.35, z);
      trainGroup.add(wheel);
    });
  }

  trainGroup.userData = {
    isTrain: true,
    width: trainWidth,
    height: trainHeight + 0.4,
    length: trainLength,
    halfWidth: trainWidth / 2,
    halfHeight: (trainHeight + 0.4) / 2,
    halfLength: trainLength / 2,
  };

  return trainGroup;
}

// --- 2. COIN BUILDER (INSTANCED / POOLED FOR 60 FPS) ---

export async function createCoinMesh(coinConfig = {}) {
  const {
    shape = 'gold',
    size = 1.0,
    customImageUrl = null,
  } = coinConfig;

  const coinGroup = new THREE.Group();
  let mesh;

  const coinImgUrl = customImageUrl || (shape === 'gold' ? '/coin_face.png' : null);

  if (coinImgUrl) {
    const userTex = await loadUserTexture(coinImgUrl);
    const coinGeo = getOrCreateGeometry(`coin_cyl_${size}`, () => new THREE.CylinderGeometry(0.48 * size, 0.48 * size, 0.08, 16));
    const sideMat = getOrCreateMaterial('coin_side_gold', () => new THREE.MeshStandardMaterial({
      color: 0xffcc00,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0x442200,
      emissiveIntensity: 0.25,
    }));
    const faceMat = getOrCreateMaterial(`coin_face_${coinImgUrl}`, () => new THREE.MeshStandardMaterial({
      map: userTex,
      roughness: 0.3,
      emissive: 0x332200,
      emissiveIntensity: 0.25,
    }));
    mesh = new THREE.Mesh(coinGeo, [sideMat, faceMat, faceMat]);
  } else if (shape === 'donut') {
    const torusGeo = getOrCreateGeometry('donut_geo', () => new THREE.TorusGeometry(0.38 * size, 0.16 * size, 12, 20));
    const torusMat = getOrCreateMaterial('donut_mat', () => new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.3, emissive: 0x330011, emissiveIntensity: 0.2 }));
    mesh = new THREE.Mesh(torusGeo, torusMat);
  } else if (shape === 'diamond') {
    const octGeo = getOrCreateGeometry('diamond_geo', () => new THREE.OctahedronGeometry(0.45 * size));
    const octMat = getOrCreateMaterial('diamond_mat', () => new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      metalness: 0.2,
      roughness: 0.1,
      transparent: true,
      opacity: 0.9,
      emissive: 0x002233,
      emissiveIntensity: 0.4,
    }));
    mesh = new THREE.Mesh(octGeo, octMat);
  } else {
    // Shared Star Gold Coin or Pizza
    const tex = createCoinTexture(shape);
    const coinGeo = getOrCreateGeometry(`coin_cyl_${size}_${shape}`, () => new THREE.CylinderGeometry(0.46 * size, 0.46 * size, 0.08, 16));
    const rimMat = getOrCreateMaterial('coin_rim_mat', () => new THREE.MeshStandardMaterial({
      color: 0xeab308,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0x442200,
      emissiveIntensity: 0.25,
    }));
    const faceMat = getOrCreateMaterial(`coin_face_mat_${shape}`, () => new THREE.MeshStandardMaterial({
      map: tex,
      metalness: 0.6,
      roughness: 0.3,
      emissive: 0x332200,
      emissiveIntensity: 0.3,
    }));
    mesh = new THREE.Mesh(coinGeo, [rimMat, faceMat, faceMat]);
  }

  mesh.rotation.x = Math.PI / 2;
  coinGroup.add(mesh);

  coinGroup.userData = {
    isCoin: true,
    radius: 0.5 * size,
    mesh: mesh,
    active: true,
  };

  return coinGroup;
}

// --- 3. OBSTACLE BUILDER ---

export async function createObstacleMesh(type = 'barrier', obstacleConfig = {}, variant = 0) {
  if (type === 'barrier_2') {
    variant = 1;
    type = 'barrier';
  }
  const { customImageUrl = null } = obstacleConfig;
  const group = new THREE.Group();

  // A. CUSTOM BILLBOARD
  if (customImageUrl) {
    const userTex = await loadUserTexture(customImageUrl);
    const legGeo = getOrCreateGeometry('billboard_leg_geo', () => new THREE.BoxGeometry(0.16, 2.2, 0.16));
    const legMat = getOrCreateMaterial('billboard_leg_mat', () => new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.7 }));

    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-1.0, 1.1, 0);
    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(1.0, 1.1, 0);
    group.add(leftLeg);
    group.add(rightLeg);

    const boardGeo = getOrCreateGeometry('billboard_board_geo', () => new THREE.BoxGeometry(2.4, 2.0, 0.1));
    const boardMat = new THREE.MeshStandardMaterial({
      map: userTex || createObstacleTexture('barrier'),
      roughness: 0.4,
    });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.set(0, 1.4, 0);
    group.add(board);

    group.userData = {
      isObstacle: true,
      obstacleType: 'custom_billboard',
      requiresSlide: false,
      requiresJump: true,
      width: 2.2,
      height: 2.2,
      depth: 0.6,
      active: true,
    };
    return group;
  }

  // B. HIGH OVERHEAD BARRIER (SLIDE UNDER - Features Shocked Face looking down!)
  if (type === 'high_pipe') {
    const pipeFaceUrl = obstacleConfig.hurdleImage2 || '/hurdle_face_2.png';
    const pipeTex = await loadUserTexture(pipeFaceUrl) || createObstacleTexture('high_pipe');
    const poleGeo = getOrCreateGeometry('pipe_pole_geo', () => new THREE.CylinderGeometry(0.12, 0.12, 3.8, 12));
    const poleMat = getOrCreateMaterial('pipe_pole_mat', () => new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.3 }));

    const leftPole = new THREE.Mesh(poleGeo, poleMat);
    leftPole.position.set(-1.3, 1.9, 0);
    const rightPole = new THREE.Mesh(poleGeo, poleMat);
    rightPole.position.set(1.3, 1.9, 0);
    group.add(leftPole);
    group.add(rightPole);

    const barGeo = getOrCreateGeometry('pipe_bar_geo', () => new THREE.BoxGeometry(2.7, 0.95, 0.35));
    const pipeSideMat = getOrCreateMaterial('pipe_side_mat', () => new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 }));
    const pipeFaceMat = new THREE.MeshStandardMaterial({ map: pipeTex, roughness: 0.35 });
    // [right, left, top, bottom, front, back]
    const bar = new THREE.Mesh(barGeo, [pipeSideMat, pipeSideMat, pipeSideMat, pipeSideMat, pipeFaceMat, pipeFaceMat]);
    bar.position.set(0, 2.3, 0);
    group.add(bar);

    group.userData = {
      isObstacle: true,
      obstacleType: 'high_pipe',
      requiresSlide: true,
      requiresJump: false,
      clearanceHeight: 1.25,
      width: 2.6,
      height: 3.5,
      depth: 0.6,
      active: true,
    };
    return group;
  }

  // C. CHICKEN
  if (type === 'chicken') {
    const chickenGroup = new THREE.Group();
    const bodyGeo = getOrCreateGeometry('chicken_body_geo', () => new THREE.SphereGeometry(0.45, 12, 12));
    const bodyMat = getOrCreateMaterial('chicken_body_mat', () => new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.6 }));
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.55;
    chickenGroup.add(body);

    const beakGeo = getOrCreateGeometry('chicken_beak_geo', () => new THREE.ConeGeometry(0.12, 0.25, 8));
    const beakMat = getOrCreateMaterial('chicken_beak_mat', () => new THREE.MeshStandardMaterial({ color: 0xf97316 }));
    const beak = new THREE.Mesh(beakGeo, beakMat);
    beak.position.set(0, 0.6, 0.45);
    beak.rotation.x = Math.PI / 2;
    chickenGroup.add(beak);

    const combGeo = getOrCreateGeometry('chicken_comb_geo', () => new THREE.BoxGeometry(0.08, 0.22, 0.3));
    const combMat = getOrCreateMaterial('chicken_comb_mat', () => new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
    const comb = new THREE.Mesh(combGeo, combMat);
    comb.position.set(0, 0.95, 0.05);
    chickenGroup.add(comb);

    group.add(chickenGroup);
    group.userData = {
      isObstacle: true,
      obstacleType: 'chicken',
      requiresSlide: false,
      requiresJump: true,
      width: 1.2,
      height: 1.0,
      depth: 1.0,
      active: true,
    };
    return group;
  }

  // D. BANANA
  if (type === 'banana') {
    const peelMat = getOrCreateMaterial('banana_mat', () => new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 }));
    const peelGroup = new THREE.Group();
    const flapGeo = getOrCreateGeometry('banana_flap_geo', () => new THREE.CylinderGeometry(0.04, 0.22, 0.9, 6));

    for (let i = 0; i < 4; i++) {
      const flap = new THREE.Mesh(flapGeo, peelMat);
      flap.position.set(Math.cos(i * Math.PI / 2) * 0.4, 0.2, Math.sin(i * Math.PI / 2) * 0.4);
      flap.rotation.z = Math.cos(i * Math.PI / 2) * 0.8;
      flap.rotation.x = Math.sin(i * Math.PI / 2) * 0.8;
      peelGroup.add(flap);
    }
    const tipGeo = getOrCreateGeometry('banana_tip_geo', () => new THREE.SphereGeometry(0.16, 8, 8));
    const tipMat = getOrCreateMaterial('banana_tip_mat', () => new THREE.MeshStandardMaterial({ color: 0x713f12 }));
    const tip = new THREE.Mesh(tipGeo, tipMat);
    tip.position.y = 0.5;
    peelGroup.add(tip);

    group.add(peelGroup);
    group.userData = {
      isObstacle: true,
      obstacleType: 'banana',
      requiresSlide: false,
      requiresJump: true,
      width: 1.4,
      height: 0.8,
      depth: 1.4,
      active: true,
    };
    return group;
  }

  // E. FUNNY HURDLES (Alternating between Jr. NTR grinning and Shocked Meme Face!)
  const face1 = obstacleConfig.hurdleImage1 || '/hurdle_face_1.png';
  const face2 = obstacleConfig.hurdleImage2 || '/hurdle_face_2.png';
  const chosenFaceUrl = (variant % 2 === 0) ? face1 : face2;
  const hurdleTex = await loadUserTexture(chosenFaceUrl) || createObstacleTexture('barrier');

  const frameGeo = getOrCreateGeometry('hurdle_frame_geo', () => new THREE.BoxGeometry(2.4, 1.0, 0.2));
  const sideMat = getOrCreateMaterial('hurdle_side_mat', () => new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 }));
  const faceMat = new THREE.MeshStandardMaterial({
    map: hurdleTex,
    roughness: 0.35,
    metalness: 0.05,
  });

  const barrier = new THREE.Mesh(frameGeo, [sideMat, sideMat, sideMat, sideMat, faceMat, faceMat]);
  barrier.position.y = 0.55;
  group.add(barrier);

  const footGeo = getOrCreateGeometry('hurdle_foot_geo', () => new THREE.BoxGeometry(0.18, 0.12, 0.7));
  const footMat = getOrCreateMaterial('hurdle_foot_mat', () => new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 }));
  [-1.0, 1.0].forEach(x => {
    const foot = new THREE.Mesh(footGeo, footMat);
    foot.position.set(x, 0.06, 0);
    group.add(foot);
  });

  group.userData = {
    isObstacle: true,
    obstacleType: (variant % 2 === 0) ? 'Jr. NTR Hurdle' : 'Shocked Face Hurdle',
    requiresSlide: false,
    requiresJump: true,
    width: 2.4,
    height: 1.1,
    depth: 0.5,
    active: true,
  };
  return group;
}

// --- 4. POWER-UP PICKUP BUILDER ---

export function createPowerupMesh(type = 'magnet') {
  const group = new THREE.Group();

  if (type === 'magnet') {
    const magnetGeo = getOrCreateGeometry('magnet_torus_geo', () => new THREE.TorusGeometry(0.42, 0.14, 8, 16, Math.PI));
    const redMat = getOrCreateMaterial('magnet_red_mat', () => new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.4, roughness: 0.3, emissive: 0x330000, emissiveIntensity: 0.2 }));
    const magnet = new THREE.Mesh(magnetGeo, redMat);
    magnet.rotation.z = Math.PI;
    group.add(magnet);

    const tipGeo = getOrCreateGeometry('magnet_tip_geo', () => new THREE.BoxGeometry(0.28, 0.2, 0.28));
    const silverMat = getOrCreateMaterial('magnet_silver_mat', () => new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.1 }));
    const leftTip = new THREE.Mesh(tipGeo, silverMat);
    leftTip.position.set(-0.42, -0.1, 0);
    const rightTip = new THREE.Mesh(tipGeo, silverMat);
    rightTip.position.set(0.42, -0.1, 0);
    group.add(leftTip);
    group.add(rightTip);
  } else if (type === 'jetpack') {
    const tankGeo = getOrCreateGeometry('jetpack_tank_geo', () => new THREE.CylinderGeometry(0.18, 0.18, 0.7, 12));
    const goldMat = getOrCreateMaterial('jetpack_gold_mat', () => new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2, emissive: 0x332200, emissiveIntensity: 0.2 }));
    const tank1 = new THREE.Mesh(tankGeo, goldMat);
    tank1.position.x = -0.22;
    const tank2 = new THREE.Mesh(tankGeo, goldMat);
    tank2.position.x = 0.22;
    group.add(tank1);
    group.add(tank2);
  } else if (type === 'shield') {
    const orbGeo = getOrCreateGeometry('shield_pickup_geo', () => new THREE.SphereGeometry(0.45, 12, 12));
    const orbMat = getOrCreateMaterial('shield_pickup_mat', () => new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85,
      metalness: 0.3,
      roughness: 0.1,
      emissive: 0x002244,
      emissiveIntensity: 0.3,
    }));
    const orb = new THREE.Mesh(orbGeo, orbMat);
    group.add(orb);
  } else if (type === 'super_jump') {
    const springGeo = getOrCreateGeometry('spring_geo', () => new THREE.CylinderGeometry(0.25, 0.25, 0.5, 10));
    const springMat = getOrCreateMaterial('spring_mat', () => new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.7, roughness: 0.3, emissive: 0x003311, emissiveIntensity: 0.2 }));
    const spring = new THREE.Mesh(springGeo, springMat);
    group.add(spring);
  } else {
    const coneGeo = getOrCreateGeometry('turbo_cone_geo', () => new THREE.ConeGeometry(0.35, 0.8, 4));
    const boostMat = getOrCreateMaterial('turbo_boost_mat', () => new THREE.MeshStandardMaterial({ color: 0xec4899, metalness: 0.5, roughness: 0.2, emissive: 0x330022, emissiveIntensity: 0.2 }));
    const cone = new THREE.Mesh(coneGeo, boostMat);
    group.add(cone);
  }

  group.userData = {
    isPowerup: true,
    powerupType: type,
    radius: 0.75,
    active: true,
  };

  return group;
}
