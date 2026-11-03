import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { loadUserTexture } from '../utils/textureGenerator';

export class CharacterModel {
  constructor(config = {}) {
    this.config = config;
    this.root = new THREE.Group();
    this.limbs = {};
    this.isSliding = false;
    this.isJumping = false;
    this.isStumbling = false;
    this.hasJetpack = false;
    this.hasShield = false;
    this.animationTime = 0;
    this.userTexture = null;
    this.customMesh = null;
    this.isCustomImageMode = false;

    this.buildCharacter();
  }

  async buildCharacter() {
    // Clear any existing children
    while (this.root.children.length > 0) {
      this.root.remove(this.root.children[0]);
    }

    const {
      selectedId = 'bhaai',
      scale = 1.0,
      headScale = 1.0,
      customImageUrl = null,
      customModelUrl = null,
      suitColor = selectedId === 'bhaai' ? '#4f535e' : '#FF2A55',
      skinColor = '#D99B77',
      hasSunglasses = selectedId !== 'bhaai',
      hasGoldChain = true,
      hasMustache = selectedId !== 'bhaai',
      animationStyle = 'swagger'
    } = this.config;

    this.animationStyle = animationStyle;
    this.root.scale.set(scale, scale, scale);

    // 1. If custom 3D model is provided (.glb / .gltf)
    if (customModelUrl) {
      try {
        const loader = new GLTFLoader();
        const gltf = await loader.loadAsync(customModelUrl);
        const model = gltf.scene;
        model.scale.set(1.2, 1.2, 1.2);
        model.position.y = 0;
        this.root.add(model);
        this.customMesh = model;
        this.buildPowerupAccessories();
        return;
      } catch (err) {
        console.warn('Failed to load custom GLB model, falling back to procedural character:', err);
      }
    }

    // 2. If custom image is provided (PNG/JPG/WebP/Transparent PNG)
    if (customImageUrl) {
      this.userTexture = await loadUserTexture(customImageUrl);
      if (this.userTexture) {
        this.isCustomImageMode = true;
        this.buildCustomImageCutout(this.userTexture);
        this.buildPowerupAccessories();
        return;
      }
    }

    // 3. Stylized 3D Procedural Character with Real Bhaai Face
    this.isCustomImageMode = false;
    await this.buildProceduralCharacter(selectedId, suitColor, skinColor, hasSunglasses, hasGoldChain, hasMustache, headScale);
    this.buildPowerupAccessories();
  }

  buildCustomImageCutout(texture) {
    const group = new THREE.Group();
    group.position.y = 1.1;

    // Front & Back cutout plane
    const planeGeo = new THREE.PlaneGeometry(1.5, 2.0);
    const planeMat = new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.1,
      roughness: 0.4,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    const cutoutMesh = new THREE.Mesh(planeGeo, planeMat);
    cutoutMesh.castShadow = true;
    group.add(cutoutMesh);

    // Comic white outline border behind image
    const outlineMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.8
    });
    const outlineMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.56, 2.06), outlineMat);
    outlineMesh.position.z = -0.01;
    group.add(outlineMesh);

    // Running sneaker feet underneath the cutout
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0xff0055, roughness: 0.3 });
    const shoeGeo = new THREE.BoxGeometry(0.28, 0.2, 0.45);

    const leftFoot = new THREE.Mesh(shoeGeo, shoeMat);
    leftFoot.position.set(-0.35, -1.0, 0.1);
    leftFoot.castShadow = true;
    group.add(leftFoot);

    const rightFoot = new THREE.Mesh(shoeGeo, shoeMat);
    rightFoot.position.set(0.35, -1.0, 0.1);
    rightFoot.castShadow = true;
    group.add(rightFoot);

    this.limbs.leftLeg = leftFoot;
    this.limbs.rightLeg = rightFoot;
    this.limbs.torso = cutoutMesh;

    this.root.add(group);
    this.customMesh = group;
  }

  async buildProceduralCharacter(selectedId, suitColor, skinColor, hasSunglasses, hasGoldChain, hasMustache, headScale) {
    const group = new THREE.Group();
    group.position.y = 0;

    // Materials
    const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.5 });
    const suitMat = new THREE.MeshStandardMaterial({ color: suitColor, roughness: 0.4 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, metalness: 0.85, roughness: 0.2 });
    const shirtColor = selectedId === 'bhaai' ? 0x0f172a : 0xf8fafc;
    const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.4 });

    // Torso / Jacket
    const torsoGeo = new THREE.BoxGeometry(0.88, 0.96, 0.52);
    const torso = new THREE.Mesh(torsoGeo, suitMat);
    torso.position.y = 1.35;
    torso.castShadow = true;
    group.add(torso);
    this.limbs.torso = torso;

    // Inner tee
    const shirtGeo = new THREE.BoxGeometry(0.32, 0.42, 0.54);
    const shirt = new THREE.Mesh(shirtGeo, shirtMat);
    shirt.position.set(0, 1.55, 0);
    group.add(shirt);

    // Wolf / Flower Lapel Pin on Bhaai's blazer
    if (selectedId === 'bhaai') {
      const pinGeo = new THREE.BoxGeometry(0.12, 0.12, 0.04);
      const pinMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.5, roughness: 0.2 });
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.position.set(-0.28, 1.6, 0.27);
      group.add(pin);
    }

    // Gold chain necklace
    if (hasGoldChain) {
      const chainGeo = new THREE.TorusGeometry(0.24, 0.045, 8, 20);
      const chain = new THREE.Mesh(chainGeo, goldMat);
      chain.position.set(0, 1.55, 0.26);
      chain.rotation.x = Math.PI * 0.35;
      group.add(chain);
    }

    // Head Group
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 2.1, 0);
    headGroup.scale.set(headScale, headScale, headScale);

    const headGeo = new THREE.BoxGeometry(0.68, 0.68, 0.62);

    // If default character is 'bhaai', load the iconic laughing face!
    if (selectedId === 'bhaai') {
      const bhaaiFaceTex = await loadUserTexture('/bhaai_head.png');
      if (bhaaiFaceTex) {
        const faceMat = new THREE.MeshStandardMaterial({
          map: bhaaiFaceTex,
          roughness: 0.35,
          metalness: 0.05,
        });

        // Four sides of the head (Right, Left, Front, Back) all display Bhaai's laughing face!
        const headMaterials = [
          faceMat, // Right (+X)
          faceMat, // Left (-X)
          darkMat, // Top (+Y)
          skinMat, // Bottom (-Y)
          faceMat, // Front (+Z)
          faceMat  // Back (-Z)
        ];

        const headMesh = new THREE.Mesh(headGeo, headMaterials);
        headMesh.castShadow = true;
        headGroup.add(headMesh);
      } else {
        const head = new THREE.Mesh(headGeo, skinMat);
        head.castShadow = true;
        headGroup.add(head);
      }
    } else {
      const head = new THREE.Mesh(headGeo, skinMat);
      head.castShadow = true;
      headGroup.add(head);
    }

    // Hair / Cap
    if (selectedId === 'chintu') {
      const capGeo = new THREE.BoxGeometry(0.72, 0.25, 0.68);
      const capMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(0, 0.34, 0);
      headGroup.add(cap);

      const visorGeo = new THREE.BoxGeometry(0.68, 0.05, 0.42);
      const visor = new THREE.Mesh(visorGeo, capMat);
      visor.position.set(0, 0.24, 0.44);
      headGroup.add(visor);
    } else if (selectedId === 'robo') {
      const antGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.4);
      const ant = new THREE.Mesh(antGeo, goldMat);
      ant.position.set(0, 0.52, 0);
      headGroup.add(ant);

      const bulbGeo = new THREE.SphereGeometry(0.1);
      const bulbMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.set(0, 0.72, 0);
      headGroup.add(bulb);
    } else if (selectedId !== 'bhaai') {
      // Styled hair for other characters
      const hairGeo = new THREE.BoxGeometry(0.72, 0.22, 0.68);
      const hair = new THREE.Mesh(hairGeo, darkMat);
      hair.position.set(0, 0.36, 0);
      headGroup.add(hair);
    }

    // Sunglasses
    if (hasSunglasses) {
      const glassesGeo = new THREE.BoxGeometry(0.64, 0.18, 0.12);
      const glasses = new THREE.Mesh(glassesGeo, darkMat);
      glasses.position.set(0, 0.05, 0.33);
      headGroup.add(glasses);

      const frameGeo = new THREE.BoxGeometry(0.66, 0.04, 0.14);
      const frame = new THREE.Mesh(frameGeo, goldMat);
      frame.position.set(0, 0.14, 0.33);
      headGroup.add(frame);
    }

    // Mustache (Only if not using face photo or if explicitly enabled)
    if (hasMustache && selectedId !== 'bhaai') {
      const mustacheGeo = new THREE.BoxGeometry(0.38, 0.08, 0.12);
      const mustache = new THREE.Mesh(mustacheGeo, darkMat);
      mustache.position.set(0, -0.16, 0.33);
      mustache.rotation.z = 0.05;
      headGroup.add(mustache);
    }

    group.add(headGroup);
    this.limbs.head = headGroup;

    // Arms
    const armGeo = new THREE.BoxGeometry(0.24, 0.75, 0.24);

    // Left Arm
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.56, 1.7, 0);
    const leftArm = new THREE.Mesh(armGeo, suitMat);
    leftArm.position.y = -0.35;
    leftArm.castShadow = true;
    leftArmGroup.add(leftArm);
    group.add(leftArmGroup);
    this.limbs.leftArm = leftArmGroup;

    // Right Arm
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.56, 1.7, 0);
    const rightArm = new THREE.Mesh(armGeo, suitMat);
    rightArm.position.y = -0.35;
    rightArm.castShadow = true;
    rightArmGroup.add(rightArm);
    group.add(rightArmGroup);
    this.limbs.rightArm = rightArmGroup;

    // Legs
    const legGeo = new THREE.BoxGeometry(0.28, 0.85, 0.28);
    const pantsColor = selectedId === 'bhaai' ? 0x1e293b : 0x1f2937;
    const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.6 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3 });
    const shoeGeo = new THREE.BoxGeometry(0.3, 0.2, 0.45);

    // Left Leg
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.25, 0.85, 0);
    const leftLeg = new THREE.Mesh(legGeo, pantsMat);
    leftLeg.position.y = -0.4;
    leftLeg.castShadow = true;
    leftLegGroup.add(leftLeg);

    const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
    leftShoe.position.set(0, -0.75, 0.08);
    leftShoe.castShadow = true;
    leftLegGroup.add(leftShoe);

    group.add(leftLegGroup);
    this.limbs.leftLeg = leftLegGroup;

    // Right Leg
    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.25, 0.85, 0);
    const rightLeg = new THREE.Mesh(legGeo, pantsMat);
    rightLeg.position.y = -0.4;
    rightLeg.castShadow = true;
    rightLegGroup.add(rightLeg);

    const rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
    rightShoe.position.set(0, -0.75, 0.08);
    rightShoe.castShadow = true;
    rightLegGroup.add(rightShoe);

    group.add(rightLegGroup);
    this.limbs.rightLeg = rightLegGroup;

    this.root.add(group);
  }

  buildPowerupAccessories() {
    // 1. Jetpack
    const jetpackGroup = new THREE.Group();
    jetpackGroup.position.set(0, 1.4, -0.35);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.2 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.1 });
    const tankGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.75, 12);

    const leftTank = new THREE.Mesh(tankGeo, metalMat);
    leftTank.position.x = -0.22;
    jetpackGroup.add(leftTank);

    const rightTank = new THREE.Mesh(tankGeo, metalMat);
    rightTank.position.x = 0.22;
    jetpackGroup.add(rightTank);

    const nozzleGeo = new THREE.ConeGeometry(0.12, 0.2, 12);
    const leftNozzle = new THREE.Mesh(nozzleGeo, goldMat);
    leftNozzle.position.set(-0.22, -0.45, 0);
    leftNozzle.rotation.x = Math.PI;
    jetpackGroup.add(leftNozzle);

    const rightNozzle = new THREE.Mesh(nozzleGeo, goldMat);
    rightNozzle.position.set(0.22, -0.45, 0);
    rightNozzle.rotation.x = Math.PI;
    jetpackGroup.add(rightNozzle);

    jetpackGroup.visible = false;
    this.root.add(jetpackGroup);
    this.jetpackMesh = jetpackGroup;

    // 2. Bubble Shield
    const shieldGeo = new THREE.SphereGeometry(1.6, 16, 16);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      metalness: 0.2,
    });
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    shield.position.y = 1.3;
    shield.visible = false;
    this.root.add(shield);
    this.shieldMesh = shield;
  }

  setPowerupStatus({ jetpack = false, shield = false }) {
    this.hasJetpack = jetpack;
    this.hasShield = shield;
    if (this.jetpackMesh) this.jetpackMesh.visible = jetpack;
    if (this.shieldMesh) this.shieldMesh.visible = shield;
  }

  update(delta, runSpeed = 25) {
    this.animationTime += delta * (runSpeed / 12) * (this.config.runningSpeedMultiplier || 1.0);

    if (this.isCustomImageMode && this.customMesh) {
      if (this.isSliding) {
        this.customMesh.rotation.x = -Math.PI * 0.45;
        this.customMesh.position.y = 0.4;
      } else if (this.isJumping) {
        this.customMesh.rotation.x = 0.15;
        this.customMesh.position.y = 1.1;
      } else {
        this.customMesh.rotation.x = 0;
        this.customMesh.position.y = 1.1 + Math.abs(Math.sin(this.animationTime * 2)) * 0.15;
        this.customMesh.rotation.z = Math.sin(this.animationTime) * 0.08;
      }

      if (this.limbs.leftLeg && this.limbs.rightLeg) {
        this.limbs.leftLeg.position.z = Math.sin(this.animationTime * 2) * 0.3;
        this.limbs.rightLeg.position.z = -Math.sin(this.animationTime * 2) * 0.3;
      }
      return;
    }

    const { head, torso, leftArm, rightArm, leftLeg, rightLeg } = this.limbs;
    if (!torso) return;

    if (this.hasShield && this.shieldMesh) {
      this.shieldMesh.rotation.y += delta * 2;
    }

    // 1. Sliding Pose
    if (this.isSliding) {
      this.root.rotation.x = -Math.PI * 0.42;
      this.root.position.y = 0.35;
      if (leftArm && rightArm) {
        leftArm.rotation.x = Math.PI * 0.4;
        rightArm.rotation.x = Math.PI * 0.4;
      }
      if (leftLeg && rightLeg) {
        leftLeg.rotation.x = -Math.PI * 0.3;
        rightLeg.rotation.x = -Math.PI * 0.3;
      }
      return;
    }

    // 2. Jumping Pose
    if (this.isJumping) {
      this.root.rotation.x = 0.1;
      this.root.rotation.z = 0;
      if (leftArm && rightArm) {
        leftArm.rotation.x = -Math.PI * 0.6;
        rightArm.rotation.x = -Math.PI * 0.6;
      }
      if (leftLeg && rightLeg) {
        leftLeg.rotation.x = Math.PI * 0.3;
        rightLeg.rotation.x = -Math.PI * 0.2;
      }
      if (torso) torso.position.y = 1.35;
      return;
    }

    // 3. Stumbling / Crash Pose
    if (this.isStumbling) {
      this.root.rotation.x = Math.PI * 0.5;
      this.root.rotation.y += delta * 10;
      this.root.position.y = 0.5;
      return;
    }

    // 4. Jetpack Flight Pose
    if (this.hasJetpack) {
      this.root.rotation.x = 0.25;
      this.root.rotation.z = Math.sin(this.animationTime) * 0.05;
      if (leftLeg && rightLeg) {
        leftLeg.rotation.x = 0.2;
        rightLeg.rotation.x = 0.3;
      }
      if (leftArm && rightArm) {
        leftArm.rotation.x = -0.4;
        rightArm.rotation.x = -0.4;
      }
      return;
    }

    // 5. Standard Running Cycle (Swagger / Goofy / Ninja / Waddle)
    this.root.rotation.x = 0.05;
    const cycle = this.animationTime * 2;

    if (this.animationStyle === 'goofy') {
      if (leftLeg) leftLeg.rotation.x = Math.sin(cycle) * 1.1;
      if (rightLeg) rightLeg.rotation.x = -Math.sin(cycle) * 1.1;
      if (leftArm) leftArm.rotation.x = -Math.sin(cycle) * 1.2;
      if (rightArm) rightArm.rotation.x = Math.sin(cycle) * 1.2;
      if (head) head.rotation.z = Math.sin(cycle) * 0.25;
      this.root.rotation.z = Math.sin(cycle * 0.5) * 0.12;
      torso.position.y = 1.35 + Math.abs(Math.sin(cycle)) * 0.18;
    } else if (this.animationStyle === 'ninja') {
      this.root.rotation.x = 0.3;
      if (leftLeg) leftLeg.rotation.x = Math.sin(cycle) * 0.9;
      if (rightLeg) rightLeg.rotation.x = -Math.sin(cycle) * 0.9;
      if (leftArm) leftArm.rotation.x = 1.2;
      if (rightArm) rightArm.rotation.x = 1.2;
      this.root.rotation.z = 0;
      torso.position.y = 1.3;
    } else if (this.animationStyle === 'waddle') {
      if (leftLeg) leftLeg.rotation.x = Math.sin(cycle) * 0.5;
      if (rightLeg) rightLeg.rotation.x = -Math.sin(cycle) * 0.5;
      if (leftArm) leftArm.rotation.z = Math.sin(cycle) * 0.6;
      if (rightArm) rightArm.rotation.z = -Math.sin(cycle) * 0.6;
      this.root.rotation.z = Math.sin(cycle * 0.5) * 0.22;
      torso.position.y = 1.35 + Math.abs(Math.sin(cycle)) * 0.1;
    } else {
      // Default: 'swagger'
      if (leftLeg) leftLeg.rotation.x = Math.sin(cycle) * 0.85;
      if (rightLeg) rightLeg.rotation.x = -Math.sin(cycle) * 0.85;
      if (leftArm) leftArm.rotation.x = -Math.sin(cycle) * 0.9;
      if (rightArm) rightArm.rotation.x = Math.sin(cycle) * 0.9;
      if (head) head.rotation.y = Math.sin(cycle * 0.5) * 0.1;
      this.root.rotation.z = Math.sin(cycle * 0.5) * 0.06;
      torso.position.y = 1.35 + Math.abs(Math.sin(cycle)) * 0.12;
    }
  }
}
