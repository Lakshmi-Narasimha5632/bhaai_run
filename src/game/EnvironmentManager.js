import * as THREE from 'three';
import { createTrackTexture } from '../utils/textureGenerator';
import { disposeHierarchy } from './ObjectModels';

export class EnvironmentManager {
  constructor(scene, config = {}) {
    this.scene = scene;
    this.config = config;
    this.trackSegments = [];
    this.clouds = [];
    this.environmentGroup = new THREE.Group();
    this.scene.add(this.environmentGroup);

    this.segmentLength = 60;
    this.numSegments = 5;
    this.trackTexture = createTrackTexture();

    // Shared Scenery Geometries & Materials
    this.groundGeo = new THREE.PlaneGeometry(12, this.segmentLength);
    this.curbGeo = new THREE.BoxGeometry(0.8, 0.6, this.segmentLength);
    this.curbMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.6 });

    // Shared Gantry Geometries
    this.pillarGeo = new THREE.CylinderGeometry(0.18, 0.18, 7.5, 8);
    this.beamGeo = new THREE.BoxGeometry(14.2, 0.3, 0.3);
    this.steelMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6, roughness: 0.4 });

    this.setupEnvironment(config);
  }

  setupEnvironment(config = {}) {
    this.config = config;
    const theme = config.theme || 'bhaai_junction';

    // Remove & cleanly dispose existing environment objects
    while (this.environmentGroup.children.length > 0) {
      const child = this.environmentGroup.children[0];
      this.environmentGroup.remove(child);
      disposeHierarchy(child);
    }
    this.trackSegments = [];
    this.clouds = [];

    // Sky and Fog Setup
    let skyColor = 0x87ceeb;
    let fogColor = 0xa0e0ff;
    let lightColor = 0xfff3d6;
    let ambientColor = 0xdde7ee;

    if (theme === 'cyberpunk') {
      skyColor = 0x090514;
      fogColor = 0x180d33;
      lightColor = 0x00ffff;
      ambientColor = 0x8800ff;
    } else if (theme === 'sunny_beach') {
      skyColor = 0x38bdf8;
      fogColor = 0xbae6fd;
      lightColor = 0xffedd5;
      ambientColor = 0xf0f9ff;
    } else if (theme === 'toon_valley') {
      skyColor = 0x60a5fa;
      fogColor = 0xbfdbfe;
      lightColor = 0xfef08a;
      ambientColor = 0xecfdf5;
    } else if (theme === 'spooky') {
      skyColor = 0x0f0b1a;
      fogColor = 0x2e1065;
      lightColor = 0xc084fc;
      ambientColor = 0x3b0764;
    }

    this.scene.background = new THREE.Color(skyColor);
    this.scene.fog = new THREE.FogExp2(fogColor, config.fogDensity || 0.007);

    // Setup Lighting
    this.setupLighting(lightColor, ambientColor, theme);

    // Build Continuous Infinite Track Segments
    this.buildInitialTrackSegments();

    // Build Clouds (Low poly, lightweight)
    if (config.cloudsEnabled !== false && theme !== 'cyberpunk' && theme !== 'spooky') {
      this.buildClouds();
    }
  }

  setupLighting(dirColor, ambColor, theme) {
    if (this.dirLight) this.scene.remove(this.dirLight);
    if (this.ambLight) this.scene.remove(this.ambLight);

    this.ambLight = new THREE.AmbientLight(ambColor, theme === 'cyberpunk' ? 0.95 : 0.9);
    this.scene.add(this.ambLight);

    this.dirLight = new THREE.DirectionalLight(dirColor, theme === 'cyberpunk' ? 1.3 : 1.5);
    this.dirLight.position.set(20, 35, -25);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 1.0;
    this.dirLight.shadow.camera.far = 120;
    this.dirLight.shadow.camera.left = -16;
    this.dirLight.shadow.camera.right = 16;
    this.dirLight.shadow.camera.top = 16;
    this.dirLight.shadow.camera.bottom = -16;
    this.scene.add(this.dirLight);
  }

  buildInitialTrackSegments() {
    for (let i = 0; i < this.numSegments; i++) {
      const zOffset = i * this.segmentLength - 40;
      this.spawnTrackSegment(zOffset);
    }
  }

  spawnTrackSegment(zPos) {
    const segGroup = new THREE.Group();
    segGroup.position.z = zPos;

    // 1. Ground & Tracks
    const groundMat = new THREE.MeshStandardMaterial({
      map: this.trackTexture,
      roughness: 0.8,
      metalness: 0.1,
    });
    this.trackTexture.repeat.set(1, this.segmentLength / 8);

    const groundMesh = new THREE.Mesh(this.groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    segGroup.add(groundMesh);

    // 2. Curbs
    const leftCurb = new THREE.Mesh(this.curbGeo, this.curbMat);
    leftCurb.position.set(-6.4, 0.3, 0);
    segGroup.add(leftCurb);

    const rightCurb = new THREE.Mesh(this.curbGeo, this.curbMat);
    rightCurb.position.set(6.4, 0.3, 0);
    segGroup.add(rightCurb);

    // 3. Catenary Gantry
    const gantry = this.createCatenaryGantry();
    gantry.position.set(0, 0, 0);
    segGroup.add(gantry);

    // 4. Side scenery
    this.addTrackScenery(segGroup, this.config.theme || 'bhaai_junction');

    this.environmentGroup.add(segGroup);
    this.trackSegments.push(segGroup);
  }

  addTrackScenery(segGroup, theme) {
    if (theme === 'bhaai_junction') {
      const palm1 = this.createPalmTree();
      palm1.position.set(-9.5, 0, -15);
      segGroup.add(palm1);

      const palm2 = this.createPalmTree();
      palm2.position.set(9.5, 0, 15);
      segGroup.add(palm2);
    } else if (theme === 'cyberpunk') {
      const tower = this.createCyberTower(0x06b6d4);
      tower.position.set(-10.5, 0, 0);
      segGroup.add(tower);
    } else {
      const tree = this.createCartoonTree();
      tree.position.set(-9.5, 0, 0);
      segGroup.add(tree);
    }
  }

  createCatenaryGantry() {
    const group = new THREE.Group();

    const leftPillar = new THREE.Mesh(this.pillarGeo, this.steelMat);
    leftPillar.position.set(-6.8, 3.75, 0);
    group.add(leftPillar);

    const rightPillar = new THREE.Mesh(this.pillarGeo, this.steelMat);
    rightPillar.position.set(6.8, 3.75, 0);
    group.add(rightPillar);

    const beam = new THREE.Mesh(this.beamGeo, this.steelMat);
    beam.position.set(0, 7.2, 0);
    group.add(beam);

    return group;
  }

  createPalmTree() {
    const group = new THREE.Group();
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 7, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 3.5;
    group.add(trunk);

    const leafMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.6 });
    const leafGeo = new THREE.ConeGeometry(1.2, 4.0, 4);
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(Math.cos(angle) * 1.2, 6.8, Math.sin(angle) * 1.2);
      leaf.rotation.x = Math.PI / 2 + 0.3;
      leaf.rotation.y = angle;
      group.add(leaf);
    }
    return group;
  }

  createCartoonTree() {
    const group = new THREE.Group();
    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.5, 4, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.7 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 2;
    group.add(trunk);

    const puffGeo = new THREE.DodecahedronGeometry(2.2, 0);
    const puffMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.5 });
    const puff = new THREE.Mesh(puffGeo, puffMat);
    puff.position.y = 4.8;
    group.add(puff);
    return group;
  }

  createCyberTower(neonColor = 0x06b6d4) {
    const group = new THREE.Group();
    const towerGeo = new THREE.BoxGeometry(3.5, 20, 3.5);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.8 });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.y = 10;
    group.add(tower);

    const neonGeo = new THREE.BoxGeometry(3.6, 0.4, 3.6);
    const neonMat = new THREE.MeshBasicMaterial({ color: neonColor });
    for (let y = 3; y < 18; y += 4) {
      const stripe = new THREE.Mesh(neonGeo, neonMat);
      stripe.position.y = y;
      group.add(stripe);
    }
    return group;
  }

  buildClouds() {
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      transparent: true,
      opacity: 0.8,
    });
    const puffGeo = new THREE.SphereGeometry(3, 6, 6);

    for (let i = 0; i < 6; i++) {
      const cloudGroup = new THREE.Group();
      for (let j = 0; j < 3; j++) {
        const puff = new THREE.Mesh(puffGeo, cloudMat);
        puff.position.set((j - 1) * 2.8, Math.random() * 1.2, Math.random() * 1.5);
        cloudGroup.add(puff);
      }
      cloudGroup.position.set(
        (Math.random() - 0.5) * 70,
        22 + Math.random() * 8,
        (Math.random() - 0.5) * 140
      );
      this.scene.add(cloudGroup);
      this.clouds.push(cloudGroup);
    }
  }

  update(playerZ, delta) {
    if (this.dirLight) {
      this.dirLight.position.z = playerZ - 25;
      this.dirLight.target.position.set(0, 0, playerZ + 5);
      this.dirLight.target.updateMatrixWorld();
    }

    // Recycle track segments as player moves forward
    for (let i = 0; i < this.trackSegments.length; i++) {
      const seg = this.trackSegments[i];
      if (seg.position.z < playerZ - this.segmentLength) {
        let maxZ = -Infinity;
        for (let j = 0; j < this.trackSegments.length; j++) {
          if (this.trackSegments[j].position.z > maxZ) {
            maxZ = this.trackSegments[j].position.z;
          }
        }
        seg.position.z = maxZ + this.segmentLength;
      }
    }

    // Drift clouds
    for (let i = 0; i < this.clouds.length; i++) {
      const cloud = this.clouds[i];
      cloud.position.x += delta * 1.2;
      if (cloud.position.x > 50) cloud.position.x = -50;
      if (cloud.position.z < playerZ - 60) cloud.position.z = playerZ + 100;
    }
  }
}
