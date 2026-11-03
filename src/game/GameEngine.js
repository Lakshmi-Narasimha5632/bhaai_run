import * as THREE from 'three';
import { CharacterModel } from './CharacterModel';
import { PoliceChaserModel } from './PoliceChaserModel';
import { EnvironmentManager } from './EnvironmentManager';
import { createTrainMesh, createCoinMesh, createObstacleMesh, createPowerupMesh, disposeHierarchy } from './ObjectModels';
import { soundManager } from '../utils/soundEngine';

export const LANES = [-3.0, 0, 3.0]; // Left (-3), Center (0), Right (+3)

export class GameEngine {
  constructor(canvas, config = {}, callbacks = {}) {
    this.canvas = canvas;
    this.config = config;
    this.callbacks = callbacks;

    // Game state
    this.isRunning = false;
    this.isPaused = false;
    this.isGameOver = false;
    this.isBustedSequence = false;
    this.bustedTimer = 0;
    this.bustedObstacle = '';
    this.chaser = null;

    // Gameplay stats
    this.score = 0;
    this.coins = 0;
    this.distance = 0;
    this.multiplier = 1;
    this.speed = config.gameplay?.baseSpeed || 24;

    // Player position and movement
    this.currentLane = 1; // Center lane
    this.targetX = LANES[1];
    this.playerX = LANES[1];
    this.playerY = 0;
    this.playerZ = 0;
    this.playerVy = 0;
    this.isJumping = false;
    this.isSliding = false;
    this.slideTimer = 0;
    this.isInvincible = false;
    this.invincibilityTimer = 0;
    this.isOnTrain = false;

    // Active power-ups
    this.powerups = {
      magnet: 0,
      jetpack: 0,
      shield: false,
      super_jump: 0,
      speed_boost: 0,
    };

    // Object collections & Recycled Pools
    this.trains = [];
    this.obstacles = [];
    this.coinsList = [];
    this.coinPool = []; // Object pool for coins
    this.powerupPickups = [];

    // Spawning control
    this.nextSpawnZ = 45;
    this.spawnDistanceStep = 32;

    // Performance & Throttling
    this.hudUpdateTimer = 0;

    // Three.js core
    this.initThree();
    this.initGameWorld();
    this.initControls();

    // Clock
    this.clock = new THREE.Clock();
    this.animationFrameId = null;
  }

  initThree() {
    this.scene = new THREE.Scene();

    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 240);
    this.camera.position.set(0, 4.6, -7.2);
    this.camera.lookAt(0, 2.0, 10);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: window.devicePixelRatio < 2, // Enable AA only when pixel ratio <= 1.5 for speed
      powerPreference: 'high-performance',
      alpha: false,
      stencil: false,
      depth: true,
    });
    this.renderer.setSize(width, height);
    // Cap pixel ratio at 1.5 to guarantee 60 FPS on Retina / 4K mobile screens
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap; // Fast, lightweight shadow map

    this.resizeHandler = () => this.handleResize();
    window.addEventListener('resize', this.resizeHandler);
  }

  handleResize() {
    if (!this.canvas) return;
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;

    if (this.camera.aspect < 1.0) {
      // Mobile portrait view
      this.camera.fov = 70;
    } else {
      this.camera.fov = 60;
    }

    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  async initGameWorld() {
    // 1. Environment & Infinite Tracks
    this.environment = new EnvironmentManager(this.scene, this.config.environment || {});

    // 2. Character Model
    this.character = new CharacterModel(this.config.character || {});
    this.scene.add(this.character.root);

    // 3. Police Inspector Chaser Model (Subway Surfers inspector chasing Bhaai)
    this.chaser = new PoliceChaserModel();
    this.scene.add(this.chaser.root);

    // Initial pre-spawns
    for (let i = 0; i < 4; i++) {
      await this.spawnHazardCluster(40 + i * this.spawnDistanceStep);
    }
  }

  initControls() {
    this.keydownHandler = (e) => {
      if (this.isGameOver) return;

      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        this.togglePause();
        return;
      }

      if (this.isPaused) return;

      switch (e.key) {
        case 'ArrowRight':
        case 'd':
        case 'D':
          this.moveLane(-1);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          this.moveLane(1);
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
        case ' ':
          this.jump();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          this.slide();
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', this.keydownHandler);
  }

  // --- CONTROLS ---

  moveLane(direction) {
    const newLane = this.currentLane + direction;
    if (newLane >= 0 && newLane <= 2) {
      this.currentLane = newLane;
      this.targetX = LANES[this.currentLane];
      soundManager.playSlide();
    }
  }

  jump() {
    if (this.powerups.jetpack > 0) return;

    if (!this.isJumping || this.isOnTrain) {
      this.isJumping = true;
      this.isOnTrain = false;
      this.isSliding = false;
      const jumpForce = this.powerups.super_jump > 0
        ? (this.config.gameplay?.jumpForce || 15.5) * 1.45
        : (this.config.gameplay?.jumpForce || 15.5);

      this.playerVy = jumpForce;
      if (this.character) {
        this.character.isJumping = true;
        this.character.isSliding = false;
      }
      soundManager.playJump();

      if (this.powerups.super_jump > 0) {
        this.triggerComicPraise('SUPER BOING!');
      }
    }
  }

  slide() {
    if (this.powerups.jetpack > 0) return;

    // Fast dive if in mid-air
    if (this.isJumping) {
      this.playerVy = -32;
    }

    this.isSliding = true;
    this.slideTimer = this.config.gameplay?.slideDuration || 0.75;
    if (this.character) {
      this.character.isSliding = true;
      this.character.isJumping = false;
    }
    soundManager.playSlide();
  }

  triggerComicPraise(text) {
    if (this.callbacks.onComicPraise) {
      this.callbacks.onComicPraise(text);
    }
  }

  // --- RECYCLING COIN POOL HELPER ---

  async acquireCoin(x, y, z) {
    let coin;
    if (this.coinPool.length > 0) {
      coin = this.coinPool.pop();
      coin.position.set(x, y, z);
      coin.visible = true;
      coin.userData.active = true;
    } else {
      coin = await createCoinMesh(this.config.coin || {});
      coin.position.set(x, y, z);
      this.scene.add(coin);
    }
    this.coinsList.push(coin);
  }

  recycleCoin(coin, index) {
    coin.visible = false;
    coin.userData.active = false;
    this.coinsList.splice(index, 1);
    this.coinPool.push(coin);
  }

  // --- SPAWNING ---

  async spawnHazardCluster(spawnZ) {
    const laneChoices = [0, 1, 2];
    laneChoices.sort(() => Math.random() - 0.5);
    const patternType = Math.random();

    // Pattern A: Incoming Moving Train
    if (patternType < 0.38) {
      const trainLane = laneChoices[0];
      const train = await createTrainMesh(this.config.train || {});
      train.position.set(LANES[trainLane], 0, spawnZ + 20);
      train.userData.lane = trainLane;
      train.userData.speed = (this.config.train?.speedMultiplier || 1.0) * 12;
      this.scene.add(train);
      this.trains.push(train);

      if (Math.random() > 0.45) {
        soundManager.playTrainHorn();
      }

      await this.spawnCoinLine(LANES[laneChoices[1]], spawnZ, 5);

      if (Math.random() < 0.25) {
        await this.spawnPowerupPickup(LANES[laneChoices[2]], spawnZ);
      } else {
        await this.spawnSingleObstacle(LANES[laneChoices[2]], spawnZ, 'barrier');
      }
    }
    // Pattern B: High Overhead Pipe
    else if (patternType < 0.65) {
      const obsLane = laneChoices[0];
      await this.spawnSingleObstacle(LANES[obsLane], spawnZ, 'high_pipe');
      await this.spawnCoinLine(LANES[obsLane], spawnZ - 8, 3, 0.4);

      const obsType2 = Math.random() > 0.5 ? 'banana' : 'chicken';
      await this.spawnSingleObstacle(LANES[laneChoices[1]], spawnZ + 8, obsType2);
      await this.spawnCoinArc(LANES[laneChoices[2]], spawnZ);
    }
    // Pattern C: Hurdle jump over low barrier
    else {
      const hurdleLane = laneChoices[0];
      await this.spawnSingleObstacle(LANES[hurdleLane], spawnZ, 'barrier');
      await this.spawnCoinArc(LANES[hurdleLane], spawnZ);

      if (Math.random() < 0.3) {
        await this.spawnPowerupPickup(LANES[laneChoices[1]], spawnZ + 5);
      } else {
        await this.spawnCoinLine(LANES[laneChoices[1]], spawnZ, 4);
      }
    }
  }

  async spawnSingleObstacle(xPos, zPos, type = 'barrier', variant = null) {
    if (variant === null) {
      this.obstacleVariant = ((this.obstacleVariant || 0) + 1) % 2;
      variant = this.obstacleVariant;
    }
    const obstacle = await createObstacleMesh(type, this.config.obstacle || {}, variant);
    obstacle.position.set(xPos, 0, zPos);
    this.scene.add(obstacle);
    this.obstacles.push(obstacle);
  }

  async spawnCoinLine(xPos, startZ, count = 5, yPos = 0.8) {
    for (let i = 0; i < count; i++) {
      await this.acquireCoin(xPos, yPos, startZ + i * 3.2);
    }
  }

  async spawnCoinArc(xPos, centerZ) {
    const arcPoints = [
      { z: centerZ - 5, y: 0.8 },
      { z: centerZ - 2.5, y: 2.2 },
      { z: centerZ, y: 3.2 },
      { z: centerZ + 2.5, y: 2.2 },
      { z: centerZ + 5, y: 0.8 },
    ];
    for (const pt of arcPoints) {
      await this.acquireCoin(xPos, pt.y, pt.z);
    }
  }

  async spawnPowerupPickup(xPos, zPos) {
    const types = ['magnet', 'jetpack', 'shield', 'super_jump', 'speed_boost'];
    const chosenType = types[Math.floor(Math.random() * types.length)];
    const pickup = createPowerupMesh(chosenType);
    pickup.position.set(xPos, 1.2, zPos);
    this.scene.add(pickup);
    this.powerupPickups.push(pickup);
  }

  // --- PHYSICS & MAIN LOOP ---

  update(delta) {
    if (!this.isRunning || this.isPaused) return;

    // Delta cap to prevent tunneling or huge leaps on lag
    const clampedDelta = Math.min(delta, 0.033);

    // --- BUSTED CAUGHT SEQUENCE ANIMATION ---
    if (this.isBustedSequence) {
      this.bustedTimer += clampedDelta;

      if (this.character) {
        this.character.isStumbling = true;
        this.character.update(clampedDelta, 0);
      }

      if (this.chaser) {
        this.chaser.update(clampedDelta, 20, this.playerX, this.playerY, this.playerZ, true);
      }

      // Camera smoothly frames Bhaai on ground and Inspector standing triumphantly over him
      const targetCamX = this.playerX * 0.4;
      const targetCamY = 2.4;
      const targetCamZ = this.playerZ - 4.5;
      this.camera.position.x += (targetCamX - this.camera.position.x) * clampedDelta * 6;
      this.camera.position.y += (targetCamY - this.camera.position.y) * clampedDelta * 6;
      this.camera.position.z += (targetCamZ - this.camera.position.z) * clampedDelta * 6;
      this.camera.lookAt(this.playerX, 1.0, this.playerZ);

      this.renderer.render(this.scene, this.camera);

      // After 1.8 seconds of the inspector catching Bhaai, show Game Over screen!
      if (this.bustedTimer >= 1.8) {
        this.isBustedSequence = false;
        this.isGameOver = true;
        this.isRunning = false;
        soundManager.playGameOver();

        if (this.callbacks.onGameOver) {
          this.callbacks.onGameOver({
            score: this.score,
            coins: this.coins,
            distance: this.distance,
            obstacle: this.bustedObstacle || 'Obstacle',
            caughtByPolice: true,
          });
        }
      }
      return;
    }

    if (this.isGameOver) return;

    const gravity = this.config.gameplay?.gravity || 36;
    const baseSpeed = this.config.gameplay?.baseSpeed || 24;
    const maxSpeed = this.config.gameplay?.maxSpeed || 52;
    const accel = this.config.gameplay?.speedAcceleration || 0.35;

    // 1. Dynamic Speed & Distance
    let effectiveSpeed = this.speed;
    if (this.powerups.speed_boost > 0) {
      effectiveSpeed *= 1.6;
    }
    this.playerZ += effectiveSpeed * clampedDelta;
    this.distance = Math.floor(this.playerZ);
    this.speed = Math.min(maxSpeed, baseSpeed + (this.distance / 100) * accel);

    // 2. Smooth Frame-Rate Independent Lane Movement (Exponential Decay)
    const lerpFactor = 1.0 - Math.exp(-22 * clampedDelta);
    this.playerX += (this.targetX - this.playerX) * lerpFactor;

    // 3. Jump and Jetpack Physics
    if (this.powerups.jetpack > 0) {
      this.playerY += (7.5 - this.playerY) * clampedDelta * 6;
      this.isJumping = false;
      this.isSliding = false;
      this.isOnTrain = false;
    } else {
      if (this.isJumping) {
        this.playerY += this.playerVy * clampedDelta;
        this.playerVy -= gravity * clampedDelta;
        const groundThreshold = this.isOnTrain ? 3.8 : 0;
        if (this.playerY <= groundThreshold) {
          this.playerY = groundThreshold;
          this.playerVy = 0;
          this.isJumping = false;
          if (this.character) this.character.isJumping = false;
        }
      } else if (!this.isOnTrain && this.playerY > 0) {
        // Fall down if walked off train
        this.playerVy -= gravity * clampedDelta;
        this.playerY = Math.max(0, this.playerY + this.playerVy * clampedDelta);
      }
    }

    // 4. Slide Timer
    if (this.isSliding) {
      this.slideTimer -= clampedDelta;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
        if (this.character) this.character.isSliding = false;
      }
    }

    // 5. Invincibility Timer
    if (this.isInvincible) {
      this.invincibilityTimer -= clampedDelta;
      if (this.invincibilityTimer <= 0) {
        this.isInvincible = false;
      }
    }

    // 6. Power-up Timers
    for (const key of ['magnet', 'jetpack', 'super_jump', 'speed_boost']) {
      if (this.powerups[key] > 0) {
        this.powerups[key] = Math.max(0, this.powerups[key] - clampedDelta);
      }
    }

    // Update Character Model
    if (this.character) {
      this.character.root.position.set(this.playerX, this.playerY, this.playerZ);
      this.character.setPowerupStatus({
        jetpack: this.powerups.jetpack > 0,
        shield: this.powerups.shield,
      });
      this.character.update(clampedDelta, effectiveSpeed);
    }

    // Update Police Inspector Chaser Model (Subway Surfers inspector chasing Bhaai)
    if (this.chaser) {
      this.chaser.update(clampedDelta, effectiveSpeed, this.playerX, this.playerY, this.playerZ, false);
    }

    // Update Environment
    if (this.environment) {
      this.environment.update(this.playerZ, clampedDelta);
    }

    // 7. Camera Follow
    const targetCamX = this.playerX * 0.5;
    const targetCamY = 4.2 + (this.playerY * 0.4);
    const targetCamZ = this.playerZ - 7.2;

    this.camera.position.x += (targetCamX - this.camera.position.x) * clampedDelta * 10;
    this.camera.position.y += (targetCamY - this.camera.position.y) * clampedDelta * 10;
    this.camera.position.z = targetCamZ;
    this.camera.lookAt(this.playerX * 0.2, 1.8 + this.playerY * 0.35, this.playerZ + 8);

    // 8. Update Incoming Trains & Train Collision
    let supportedByTrain = false;
    for (let i = this.trains.length - 1; i >= 0; i--) {
      const train = this.trains[i];
      train.position.z -= (train.userData.speed || 10) * clampedDelta;

      const zDist = Math.abs(train.position.z - this.playerZ);
      const xDist = Math.abs(train.position.x - this.playerX);
      const trainHalfLen = train.userData.halfLength || 9;
      const trainHalfWid = train.userData.halfWidth || 1.2;
      const trainHeight = train.userData.height || 3.8;

      if (zDist < trainHalfLen && xDist < (trainHalfWid + 0.35)) {
        if (this.playerY >= trainHeight - 0.3 || this.powerups.jetpack > 0) {
          // On top of train
          if (this.powerups.jetpack <= 0) {
            supportedByTrain = true;
            this.isOnTrain = true;
            this.playerY = trainHeight;
            this.isJumping = false;
          }
        } else {
          this.handleCollision('Train');
        }
      }

      if (train.position.z < this.playerZ - 30) {
        this.scene.remove(train);
        disposeHierarchy(train);
        this.trains.splice(i, 1);
      }
    }
    if (!supportedByTrain && this.isOnTrain) {
      this.isOnTrain = false;
      this.isJumping = true; // start falling down
      this.playerVy = -5;
    }

    // 9. Update Obstacles & Collision Check
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];

      if (obs.userData.obstacleType === 'chicken') {
        obs.position.x += Math.sin(this.playerZ * 0.4) * clampedDelta * 2;
      }

      const zDist = Math.abs(obs.position.z - this.playerZ);
      const xDist = Math.abs(obs.position.x - this.playerX);

      if (zDist < 0.75 && xDist < 0.95 && !this.isInvincible) {
        if (this.powerups.jetpack > 0) {
          // flying safely
        } else if (obs.userData.requiresSlide) {
          if (!this.isSliding) {
            this.handleCollision('High Barrier');
          } else {
            this.triggerComicPraise('SLICK SLIDE!');
          }
        } else if (obs.userData.requiresJump) {
          if (this.playerY < 0.95) {
            this.handleCollision('Low Barrier');
          }
        } else {
          this.handleCollision('Obstacle');
        }
      }

      if (obs.position.z < this.playerZ - 25) {
        this.scene.remove(obs);
        disposeHierarchy(obs);
        this.obstacles.splice(i, 1);
      }
    }

    // 10. Update Coins & Magnet Pull
    const magnetActive = this.powerups.magnet > 0;
    const coinValue = this.config.coin?.value || 10;
    const coinRotSpeed = (this.config.coin?.rotationSpeed || 1.0) * clampedDelta * 4;

    for (let i = this.coinsList.length - 1; i >= 0; i--) {
      const coin = this.coinsList[i];
      if (!coin.visible) continue;

      if (coin.userData.mesh) {
        coin.userData.mesh.rotation.z += coinRotSpeed;
      }

      // Magnet pull
      if (magnetActive) {
        const distToPlayer = coin.position.distanceTo(
          new THREE.Vector3(this.playerX, this.playerY + 1.0, this.playerZ)
        );
        if (distToPlayer < 18) {
          coin.position.x += (this.playerX - coin.position.x) * clampedDelta * 14;
          coin.position.y += ((this.playerY + 1.0) - coin.position.y) * clampedDelta * 14;
          coin.position.z += (this.playerZ - coin.position.z) * clampedDelta * 14;
        }
      }

      // Collection
      const zDist = Math.abs(coin.position.z - this.playerZ);
      const xDist = Math.abs(coin.position.x - this.playerX);
      const yDist = Math.abs(coin.position.y - (this.playerY + 1.0));

      if (zDist < 1.4 && xDist < 1.2 && yDist < 1.6) {
        this.coins++;
        soundManager.playCoin();
        this.recycleCoin(coin, i);
        continue;
      }

      // Recycle if passed behind
      if (coin.position.z < this.playerZ - 20) {
        this.recycleCoin(coin, i);
      }
    }

    // 11. Update Power-up Pickups
    for (let i = this.powerupPickups.length - 1; i >= 0; i--) {
      const pickup = this.powerupPickups[i];
      pickup.rotation.y += clampedDelta * 3;
      pickup.position.y = 1.2 + Math.sin(this.playerZ * 0.3) * 0.25;

      const zDist = Math.abs(pickup.position.z - this.playerZ);
      const xDist = Math.abs(pickup.position.x - this.playerX);
      const yDist = Math.abs(pickup.position.y - (this.playerY + 1.0));

      if (zDist < 1.5 && xDist < 1.2 && yDist < 1.8) {
        this.activatePowerup(pickup.userData.powerupType);
        this.scene.remove(pickup);
        disposeHierarchy(pickup);
        this.powerupPickups.splice(i, 1);
        continue;
      }

      if (pickup.position.z < this.playerZ - 20) {
        this.scene.remove(pickup);
        disposeHierarchy(pickup);
        this.powerupPickups.splice(i, 1);
      }
    }

    // 12. Spawn Next Hazard Clusters Ahead
    if (this.playerZ + 120 > this.nextSpawnZ) {
      this.spawnHazardCluster(this.nextSpawnZ);
      this.nextSpawnZ += this.spawnDistanceStep;
    }

    // 13. Update Total Score & Throttle HUD callback to 10 FPS
    this.score = Math.floor(this.distance * this.multiplier + this.coins * coinValue);

    this.hudUpdateTimer += clampedDelta;
    if (this.hudUpdateTimer >= 0.09) {
      this.hudUpdateTimer = 0;
      if (this.callbacks.onScoreUpdate) {
        this.callbacks.onScoreUpdate({
          score: this.score,
          coins: this.coins,
          distance: this.distance,
          multiplier: this.multiplier,
          speed: Math.round(effectiveSpeed),
          powerups: this.powerups,
        });
      }
    }

    // Render Scene
    this.renderer.render(this.scene, this.camera);
  }

  activatePowerup(type) {
    soundManager.playPowerup();

    switch (type) {
      case 'magnet':
        this.powerups.magnet = 12;
        this.triggerComicPraise('COIN MAGNET ON!');
        break;
      case 'jetpack':
        this.powerups.jetpack = 8;
        this.triggerComicPraise('ROCKET LAUNCH!');
        this.spawnSkyCoinsTrail(this.playerZ + 10);
        break;
      case 'shield':
        this.powerups.shield = true;
        this.triggerComicPraise('SHIELD EQUIPPED!');
        break;
      case 'super_jump':
        this.powerups.super_jump = 12;
        this.triggerComicPraise('SUPER BOUNCY JUMP!');
        break;
      case 'speed_boost':
        this.powerups.speed_boost = 6;
        this.triggerComicPraise('TURBO NITRO DASH!');
        break;
      default:
        break;
    }

    // Immediate HUD update on powerup activation
    if (this.callbacks.onScoreUpdate) {
      this.callbacks.onScoreUpdate({
        score: this.score,
        coins: this.coins,
        distance: this.distance,
        multiplier: this.multiplier,
        speed: Math.round(this.speed),
        powerups: this.powerups,
      });
    }
  }

  async spawnSkyCoinsTrail(startZ) {
    for (let i = 0; i < 15; i++) {
      const xLane = LANES[i % 3];
      await this.acquireCoin(xLane, 7.5, startZ + i * 4);
    }
  }

  handleCollision(obstacleName) {
    if (this.isInvincible) return;

    if (this.powerups.shield) {
      this.powerups.shield = false;
      this.isInvincible = true;
      this.invincibilityTimer = 2.0;
      soundManager.playShieldBreak();
      this.triggerComicPraise('SHIELD SAVED YOU!');
      return;
    }

    if (this.powerups.speed_boost > 0) {
      this.triggerComicPraise('SMASHED THROUGH!');
      return;
    }

    if (this.isBustedSequence || this.isGameOver) return;

    // Fatal Collision -> Trigger Police Inspector Catch Sequence!
    this.isBustedSequence = true;
    this.bustedTimer = 0;
    this.bustedObstacle = obstacleName;
    soundManager.playCollision();
    soundManager.playPoliceWhistle();
    soundManager.stopBGM();

    if (this.character) {
      this.character.isStumbling = true;
    }

    this.triggerComicPraise('🚨 POLICE CAUGHT BHAAI! 🚨');
  }

  start() {
    soundManager.stopGameOverAudio();
    this.reset();
    this.isRunning = true;
    this.isPaused = false;
    this.isGameOver = false;
    this.isBustedSequence = false;
    this.bustedTimer = 0;
    soundManager.startBGM(this.config.sound?.bgmTrack || 'bhaai_laugh');
    soundManager.playPoliceWhistle();
    this.clock.start();
    this.loop();
  }

  pause() {
    this.isPaused = true;
    soundManager.stopBGM();
  }

  resume() {
    this.isPaused = false;
    soundManager.startBGM(this.config.sound?.bgmTrack || 'bhaai_laugh');
    this.clock.start();
    this.loop();
  }

  togglePause() {
    if (this.isPaused) {
      this.resume();
      if (this.callbacks.onPauseStateChange) this.callbacks.onPauseStateChange(false);
    } else {
      this.pause();
      if (this.callbacks.onPauseStateChange) this.callbacks.onPauseStateChange(true);
    }
  }

  reset() {
    soundManager.stopGameOverAudio();
    this.score = 0;
    this.coins = 0;
    this.distance = 0;
    this.multiplier = 1;
    this.speed = this.config.gameplay?.baseSpeed || 24;

    this.currentLane = 1;
    this.targetX = LANES[1];
    this.playerX = LANES[1];
    this.playerY = 0;
    this.playerZ = 0;
    this.playerVy = 0;
    this.isJumping = false;
    this.isSliding = false;
    this.slideTimer = 0;
    this.isInvincible = false;
    this.isOnTrain = false;
    this.isGameOver = false;

    this.powerups = {
      magnet: 0,
      jetpack: 0,
      shield: false,
      super_jump: 0,
      speed_boost: 0,
    };

    // Cleanly recycle active coins into pool
    for (let i = this.coinsList.length - 1; i >= 0; i--) {
      this.recycleCoin(this.coinsList[i], i);
    }

    // Dispose trains and obstacles
    [...this.trains, ...this.obstacles, ...this.powerupPickups].forEach(obj => {
      this.scene.remove(obj);
      disposeHierarchy(obj);
    });
    this.trains = [];
    this.obstacles = [];
    this.powerupPickups = [];

    this.nextSpawnZ = 45;

    this.isBustedSequence = false;
    this.bustedTimer = 0;

    if (this.character) {
      this.character.isStumbling = false;
      this.character.isSliding = false;
      this.character.isJumping = false;
      this.character.root.position.set(0, 0, 0);
      this.character.root.rotation.set(0, 0, 0);
    }

    if (this.chaser) {
      this.chaser.reset(0, LANES[1]);
    }
  }

  async applyConfig(newConfig) {
    this.config = newConfig;

    if (this.character) {
      this.scene.remove(this.character.root);
      disposeHierarchy(this.character.root);
      this.character = new CharacterModel(newConfig.character || {});
      this.scene.add(this.character.root);
      this.character.root.position.set(this.playerX, this.playerY, this.playerZ);
    }

    if (this.environment) {
      this.environment.setupEnvironment(newConfig.environment || {});
    }

    soundManager.updateVolumes(newConfig.sound || {});
    if (newConfig.sound?.bgmTrack && this.isRunning && !this.isPaused) {
      soundManager.startBGM(newConfig.sound.bgmTrack);
    }
  }

  loop = () => {
    if (!this.isRunning || this.isPaused) return;

    const delta = this.clock.getDelta();
    this.update(delta);

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  destroy() {
    this.isRunning = false;
    soundManager.stopBGM();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.resizeHandler);
    window.removeEventListener('keydown', this.keydownHandler);
    if (this.chaser) {
      this.scene.remove(this.chaser.root);
      disposeHierarchy(this.chaser.root);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
