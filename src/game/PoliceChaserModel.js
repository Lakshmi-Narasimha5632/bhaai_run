import * as THREE from 'three';
import { loadUserTexture } from '../utils/textureGenerator';

// Caches for geometry and materials to guarantee 60 FPS performance
const geoCache = new Map();
const matCache = new Map();

function getOrCreateGeo(key, fn) {
  if (geoCache.has(key)) return geoCache.get(key);
  const geo = fn();
  geoCache.set(key, geo);
  return geo;
}

function getOrCreateMat(key, fn) {
  if (matCache.has(key)) return matCache.get(key);
  const mat = fn();
  matCache.set(key, mat);
  return mat;
}

export class PoliceChaserModel {
  constructor() {
    this.root = new THREE.Group();
    this.limbs = {};
    this.animationTime = 0;
    this.chaseDistance = 5.2; // Distance behind player
    this.targetChaseDistance = 5.2;
    this.currentX = 0;
    this.isBusted = false;
    this.bustedTimer = 0;
    this.hasWhistled = false;

    this.buildInspector();
    this.buildDog();
  }

  buildInspector() {
    const inspectorGroup = new THREE.Group();

    // Materials
    const khakiShirtMat = getOrCreateMat('pol_shirt_mat', () => new THREE.MeshStandardMaterial({
      color: 0xc4a36b, // Indian Police Khaki Shirt
      roughness: 0.6,
      metalness: 0.05
    }));
    const khakiPantsMat = getOrCreateMat('pol_pants_mat', () => new THREE.MeshStandardMaterial({
      color: 0x9f7e49, // Khaki Pants
      roughness: 0.65
    }));
    const skinMat = getOrCreateMat('pol_skin_mat', () => new THREE.MeshStandardMaterial({
      color: 0xbe835c, // Skin tone
      roughness: 0.4
    }));
    const beltMat = getOrCreateMat('pol_belt_mat', () => new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Dark duty belt
      roughness: 0.3
    }));
    const goldMat = getOrCreateMat('pol_gold_mat', () => new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Gold buckle and badges
      metalness: 0.8,
      roughness: 0.2
    }));
    const darkMat = getOrCreateMat('pol_dark_mat', () => new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Boots and mustache
      roughness: 0.4
    }));
    const redMat = getOrCreateMat('pol_red_mat', () => new THREE.MeshStandardMaterial({
      color: 0xdc2626, // Cap band & dog collar
      roughness: 0.4
    }));
    const lathiMat = getOrCreateMat('pol_lathi_mat', () => new THREE.MeshStandardMaterial({
      color: 0x5c3a21, // Wooden police baton
      roughness: 0.5
    }));

    // 1. Torso (Burly inspector body with comic belly)
    const torsoGeo = getOrCreateGeo('pol_torso_geo', () => new THREE.BoxGeometry(0.96, 0.98, 0.62));
    const torso = new THREE.Mesh(torsoGeo, khakiShirtMat);
    torso.position.y = 1.35;
    torso.castShadow = true;
    inspectorGroup.add(torso);
    this.limbs.torso = torso;

    // Belly protrusion (burly inspector look!)
    const bellyGeo = getOrCreateGeo('pol_belly_geo', () => new THREE.SphereGeometry(0.34, 12, 10));
    const belly = new THREE.Mesh(bellyGeo, khakiShirtMat);
    belly.position.set(0, 1.25, 0.22);
    belly.scale.set(1.1, 0.9, 0.7);
    inspectorGroup.add(belly);

    // Duty Belt & Gold Buckle
    const beltGeo = getOrCreateGeo('pol_belt_geo', () => new THREE.BoxGeometry(1.0, 0.16, 0.66));
    const belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.y = 0.94;
    inspectorGroup.add(belt);

    const buckleGeo = getOrCreateGeo('pol_buckle_geo', () => new THREE.BoxGeometry(0.24, 0.18, 0.08));
    const buckle = new THREE.Mesh(buckleGeo, goldMat);
    buckle.position.set(0, 0.94, 0.35);
    inspectorGroup.add(buckle);

    // Shoulder Epaulettes
    [-0.45, 0.45].forEach(x => {
      const epGeo = getOrCreateGeo('pol_ep_geo', () => new THREE.BoxGeometry(0.22, 0.06, 0.38));
      const ep = new THREE.Mesh(epGeo, khakiPantsMat);
      ep.position.set(x, 1.84, 0);
      inspectorGroup.add(ep);

      // Gold stars on epaulette
      const starGeo = getOrCreateGeo('pol_star_geo', () => new THREE.OctahedronGeometry(0.04));
      const star = new THREE.Mesh(starGeo, goldMat);
      star.position.set(x, 1.88, 0.08);
      inspectorGroup.add(star);
    });

    // 2. Head Group with Chiranjeevi Police Face
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 2.15, 0);

    const headGeo = getOrCreateGeo('pol_head_geo', () => new THREE.BoxGeometry(0.72, 0.72, 0.65));
    const head = new THREE.Mesh(headGeo, skinMat);
    head.castShadow = true;
    headGroup.add(head);
    this.limbs.head = headGroup;

    // Load Chiranjeevi Police Face Texture (mapped to all 4 lateral sides: +X, -X, +Z, -Z)
    loadUserTexture('/police_face.png').then((tex) => {
      if (tex) {
        const faceMat = new THREE.MeshStandardMaterial({
          map: tex,
          roughness: 0.35,
          metalness: 0.05,
        });

        // 4 lateral sides display Chiranjeevi's face!
        head.material = [
          faceMat, // Right (+X)
          faceMat, // Left (-X)
          darkMat, // Top (+Y)
          skinMat, // Bottom (-Y)
          faceMat, // Front (+Z)
          faceMat  // Back (-Z)
        ];
        head.needsUpdate = true;
      }
    });

    // Silver Police Whistle on collar
    const whistleGeo = getOrCreateGeo('pol_whistle_geo', () => new THREE.CylinderGeometry(0.04, 0.04, 0.22, 8));
    const whistleMat = getOrCreateMat('pol_whistle_mat', () => new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.1 }));
    const whistle = new THREE.Mesh(whistleGeo, whistleMat);
    whistle.rotation.x = Math.PI * 0.45;
    whistle.position.set(0.18, -0.32, 0.38);
    headGroup.add(whistle);
    this.limbs.whistle = whistle;

    // Police Cap (Khaki crown, red band, gold star, black peak)
    const capCrownGeo = getOrCreateGeo('pol_cap_crown', () => new THREE.CylinderGeometry(0.48, 0.44, 0.26, 16));
    const cap = new THREE.Mesh(capCrownGeo, khakiShirtMat);
    cap.position.y = 0.45;
    headGroup.add(cap);

    // Red ribbon band around cap
    const capBandGeo = getOrCreateGeo('pol_cap_band', () => new THREE.CylinderGeometry(0.46, 0.46, 0.08, 16));
    const capBand = new THREE.Mesh(capBandGeo, redMat);
    capBand.position.y = 0.35;
    headGroup.add(capBand);

    // Gold Police Star Badge
    const badgeGeo = getOrCreateGeo('pol_badge_geo', () => new THREE.OctahedronGeometry(0.1));
    const badge = new THREE.Mesh(badgeGeo, goldMat);
    badge.position.set(0, 0.38, 0.47);
    headGroup.add(badge);

    // Shiny black visor / brim
    const visorGeo = getOrCreateGeo('pol_visor_geo', () => new THREE.BoxGeometry(0.68, 0.06, 0.38));
    const visor = new THREE.Mesh(visorGeo, darkMat);
    visor.position.set(0, 0.32, 0.48);
    visor.rotation.x = 0.15;
    headGroup.add(visor);

    inspectorGroup.add(headGroup);

    // 3. Arms & Police Lathi (Baton)
    const armGeo = getOrCreateGeo('pol_arm_geo', () => new THREE.BoxGeometry(0.24, 0.72, 0.24));

    // Left Arm (Pumping running fist)
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.62, 1.7, 0);
    const leftArm = new THREE.Mesh(armGeo, khakiShirtMat);
    leftArm.position.y = -0.32;
    leftArm.castShadow = true;
    leftArmGroup.add(leftArm);

    const leftHandGeo = getOrCreateGeo('pol_hand_geo', () => new THREE.BoxGeometry(0.2, 0.2, 0.2));
    const leftHand = new THREE.Mesh(leftHandGeo, skinMat);
    leftHand.position.y = -0.72;
    leftArmGroup.add(leftHand);

    inspectorGroup.add(leftArmGroup);
    this.limbs.leftArm = leftArmGroup;

    // Right Arm (Holding Police Lathi)
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.62, 1.7, 0);
    const rightArm = new THREE.Mesh(armGeo, khakiShirtMat);
    rightArm.position.y = -0.32;
    rightArm.castShadow = true;
    rightArmGroup.add(rightArm);

    const rightHand = new THREE.Mesh(leftHandGeo, skinMat);
    rightHand.position.y = -0.72;
    rightArmGroup.add(rightHand);

    // Police Lathi (Wood Baton)
    const lathiGeo = getOrCreateGeo('pol_lathi_geo', () => new THREE.CylinderGeometry(0.045, 0.045, 1.35, 8));
    const lathi = new THREE.Mesh(lathiGeo, lathiMat);
    lathi.position.set(0, -0.65, 0.35);
    lathi.rotation.x = Math.PI * 0.4;
    rightArmGroup.add(lathi);
    this.limbs.lathi = lathi;

    inspectorGroup.add(rightArmGroup);
    this.limbs.rightArm = rightArmGroup;

    // 4. Legs & Police Boots
    const legGeo = getOrCreateGeo('pol_leg_geo', () => new THREE.BoxGeometry(0.32, 0.82, 0.32));
    const bootGeo = getOrCreateGeo('pol_boot_geo', () => new THREE.BoxGeometry(0.34, 0.25, 0.52));

    // Left Leg
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.28, 0.85, 0);
    const leftLeg = new THREE.Mesh(legGeo, khakiPantsMat);
    leftLeg.position.y = -0.4;
    leftLeg.castShadow = true;
    leftLegGroup.add(leftLeg);

    const leftBoot = new THREE.Mesh(bootGeo, darkMat);
    leftBoot.position.set(0, -0.75, 0.08);
    leftBoot.castShadow = true;
    leftLegGroup.add(leftBoot);

    inspectorGroup.add(leftLegGroup);
    this.limbs.leftLeg = leftLegGroup;

    // Right Leg
    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.28, 0.85, 0);
    const rightLeg = new THREE.Mesh(legGeo, khakiPantsMat);
    rightLeg.position.y = -0.4;
    rightLeg.castShadow = true;
    rightLegGroup.add(rightLeg);

    const rightBoot = new THREE.Mesh(bootGeo, darkMat);
    rightBoot.position.set(0, -0.75, 0.08);
    rightBoot.castShadow = true;
    rightLegGroup.add(rightBoot);

    inspectorGroup.add(rightLegGroup);
    this.limbs.rightLeg = rightLegGroup;

    this.inspectorMesh = inspectorGroup;
    this.root.add(inspectorGroup);
  }

  buildDog() {
    // Cute little police bulldog trotting alongside the inspector
    const dogGroup = new THREE.Group();
    dogGroup.position.set(0.95, 0, -0.2);

    const dogBrownMat = getOrCreateMat('pol_dog_brown', () => new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.6 }));
    const dogWhiteMat = getOrCreateMat('pol_dog_white', () => new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 }));
    const redMat = getOrCreateMat('pol_red_mat', () => new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
    const darkMat = getOrCreateMat('pol_dark_mat', () => new THREE.MeshStandardMaterial({ color: 0x0f172a }));

    // Body
    const bodyGeo = getOrCreateGeo('pol_dog_body', () => new THREE.BoxGeometry(0.38, 0.36, 0.65));
    const body = new THREE.Mesh(bodyGeo, dogBrownMat);
    body.position.y = 0.42;
    dogGroup.add(body);

    // Chest patch
    const chestGeo = getOrCreateGeo('pol_dog_chest', () => new THREE.BoxGeometry(0.32, 0.28, 0.22));
    const chest = new THREE.Mesh(chestGeo, dogWhiteMat);
    chest.position.set(0, 0.38, 0.24);
    dogGroup.add(chest);

    // Collar
    const collarGeo = getOrCreateGeo('pol_dog_collar', () => new THREE.BoxGeometry(0.39, 0.08, 0.12));
    const collar = new THREE.Mesh(collarGeo, redMat);
    collar.position.set(0, 0.52, 0.22);
    dogGroup.add(collar);

    // Head
    const headGeo = getOrCreateGeo('pol_dog_head', () => new THREE.BoxGeometry(0.36, 0.34, 0.36));
    const head = new THREE.Mesh(headGeo, dogBrownMat);
    head.position.set(0, 0.65, 0.35);

    // Snout
    const snoutGeo = getOrCreateGeo('pol_dog_snout', () => new THREE.BoxGeometry(0.24, 0.18, 0.2));
    const snout = new THREE.Mesh(snoutGeo, dogWhiteMat);
    snout.position.set(0, -0.06, 0.22);
    head.add(snout);

    // Nose
    const noseGeo = getOrCreateGeo('pol_dog_nose', () => new THREE.BoxGeometry(0.1, 0.08, 0.06));
    const nose = new THREE.Mesh(noseGeo, darkMat);
    nose.position.set(0, 0.02, 0.13);
    snout.add(nose);

    // Floppy ears
    [-0.18, 0.18].forEach(x => {
      const earGeo = getOrCreateGeo('pol_dog_ear', () => new THREE.BoxGeometry(0.08, 0.22, 0.12));
      const ear = new THREE.Mesh(earGeo, darkMat);
      ear.position.set(x, 0.12, 0);
      ear.rotation.z = x > 0 ? -0.2 : 0.2;
      head.add(ear);
    });

    dogGroup.add(head);

    // Tail
    const tailGeo = getOrCreateGeo('pol_dog_tail', () => new THREE.BoxGeometry(0.08, 0.28, 0.08));
    const tail = new THREE.Mesh(tailGeo, dogBrownMat);
    tail.position.set(0, 0.55, -0.32);
    tail.rotation.x = -Math.PI * 0.3;
    dogGroup.add(tail);
    this.limbs.dogTail = tail;

    // Legs
    const dogLegGeo = getOrCreateGeo('pol_dog_leg', () => new THREE.BoxGeometry(0.12, 0.28, 0.12));
    const dogLegs = [];
    [
      { x: -0.14, z: 0.2 },
      { x: 0.14, z: 0.2 },
      { x: -0.14, z: -0.2 },
      { x: 0.14, z: -0.2 },
    ].forEach((pos, i) => {
      const leg = new THREE.Mesh(dogLegGeo, dogWhiteMat);
      leg.position.set(pos.x, 0.14, pos.z);
      dogGroup.add(leg);
      dogLegs.push(leg);
    });
    this.limbs.dogLegs = dogLegs;

    this.dogMesh = dogGroup;
    this.root.add(dogGroup);
  }

  update(delta, runSpeed = 24, playerX = 0, playerY = 0, playerZ = 0, isBusted = false) {
    this.animationTime += delta * (runSpeed / 12);

    const { torso, head, leftArm, rightArm, leftLeg, rightLeg, lathi, dogTail, dogLegs } = this.limbs;

    // --- CASE A: BUSTED / CAUGHT SEQUENCE ---
    if (isBusted) {
      this.isBusted = true;
      this.bustedTimer += delta;

      // Inspector rushes forward right up to Bhaai!
      const targetZ = playerZ - 0.75;
      this.root.position.z += (targetZ - this.root.position.z) * Math.min(1.0, delta * 8);
      this.root.position.x += (playerX - this.root.position.x) * Math.min(1.0, delta * 8);
      this.root.position.y = playerY;

      // Triumph pose: Stands over Bhaai, baton raised, hands on hips
      if (rightArm) {
        rightArm.rotation.x = -Math.PI * 0.75 + Math.sin(this.bustedTimer * 10) * 0.25; // Shake baton triumphantly!
        rightArm.rotation.z = 0.2;
      }
      if (leftArm) {
        leftArm.rotation.x = Math.PI * 0.2; // Hand on hip
        leftArm.rotation.z = -0.3;
      }
      if (head) {
        head.rotation.y = Math.sin(this.bustedTimer * 4) * 0.15; // Nodding sternly
        head.rotation.x = 0.1;
      }
      if (leftLeg && rightLeg) {
        leftLeg.rotation.x = 0.1;
        rightLeg.rotation.x = -0.1;
      }

      // Dog wags tail happily next to Bhaai
      if (dogTail) {
        dogTail.rotation.z = Math.sin(this.bustedTimer * 20) * 0.6;
      }
      return;
    }

    // --- CASE B: ACTIVE RUNNING CHASE ---
    this.isBusted = false;
    this.bustedTimer = 0;

    // Smoothly follow player lane with a slight delayed trailing spring
    const lerpX = 1.0 - Math.exp(-9 * delta);
    this.currentX += (playerX - this.currentX) * lerpX;
    this.root.position.x = this.currentX;

    // Trailing distance behind player:
    // Slightly drops back when speed is high, stays closer (~4.2m) when speed is low or on lane shift
    this.targetChaseDistance = 4.8;
    this.chaseDistance += (this.targetChaseDistance - this.chaseDistance) * delta * 2;
    this.root.position.z = playerZ - this.chaseDistance;
    this.root.position.y = Math.max(0, playerY * 0.4); // Stays on ground or leaps slightly

    // Running limb cycle
    const cycle = this.animationTime * 2.2;

    if (leftLeg) leftLeg.rotation.x = Math.sin(cycle) * 0.95;
    if (rightLeg) rightLeg.rotation.x = -Math.sin(cycle) * 0.95;

    // Left arm pumping running cycle
    if (leftArm) leftArm.rotation.x = -Math.sin(cycle) * 1.0;

    // Right arm waving the wooden police lathi forward as he charges!
    if (rightArm) {
      rightArm.rotation.x = -Math.PI * 0.35 + Math.sin(cycle) * 0.65;
      rightArm.rotation.z = 0.15;
    }
    if (lathi) {
      lathi.rotation.x = Math.PI * 0.35 + Math.sin(cycle * 2) * 0.15;
    }

    // Comical body bobbing
    if (torso) {
      torso.position.y = 1.35 + Math.abs(Math.sin(cycle)) * 0.14;
    }
    if (head) {
      head.rotation.z = Math.sin(cycle * 0.5) * 0.08;
    }

    // Dog galloping animation
    if (dogLegs && dogLegs.length === 4) {
      dogLegs[0].rotation.x = Math.sin(cycle * 1.5) * 0.8;
      dogLegs[1].rotation.x = -Math.sin(cycle * 1.5) * 0.8;
      dogLegs[2].rotation.x = -Math.sin(cycle * 1.5) * 0.8;
      dogLegs[3].rotation.x = Math.sin(cycle * 1.5) * 0.8;
    }
    if (dogTail) {
      dogTail.rotation.z = Math.sin(cycle * 3) * 0.5;
    }
  }

  reset(startZ = 0, startX = 0) {
    this.chaseDistance = 3.6; // Start very close behind player just like Subway Surfers!
    this.targetChaseDistance = 4.8;
    this.currentX = startX;
    this.isBusted = false;
    this.bustedTimer = 0;
    this.root.position.set(startX, 0, startZ - this.chaseDistance);
    this.root.rotation.set(0, 0, 0);
  }
}

