/**
 * GameEngine.js
 * Master coordinator orchestrating Three.js 3D rendering, HDR environment reflections,
 * real GLTF vehicle models, city environment, weather effects, audio synthesis, and UI HUD synchronization.
 */

import * as THREE from 'three';
import { AssetLoader } from './AssetLoader.js';
import { CarPhysics } from './CarPhysics.js';
import { CarModelGenerator } from './CarModels.js';
import { CityEnvironment } from './CityEnvironment.js';
import { WeatherSystem } from './WeatherSystem.js';
import { SoundManager } from '../audio/SoundManager.js';
import { HudOverlay } from '../ui/HudOverlay.js';
import { GarageModal } from '../ui/GarageModal.js';
import { RadioModal } from '../ui/RadioModal.js';
import { PhoneModal } from '../ui/PhoneModal.js';
import { WeatherModal } from '../ui/WeatherModal.js';
import { SettingsModal } from '../ui/SettingsModal.js';

export class GameEngine {
  constructor(canvas) {
    this.canvas = canvas;

    // Three.js Core Renderer
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 3000);
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: "high-performance",
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Subsystems
    this.assetLoader = new AssetLoader(this.renderer);
    this.sound = new SoundManager();
    this.physics = new CarPhysics('quadra');
    this.carGenerator = new CarModelGenerator(this.assetLoader);
    this.city = new CityEnvironment(this.scene, this.assetLoader);
    this.weather = new WeatherSystem(this.scene);
    this.hud = new HudOverlay();

    // 3D Car Object
    this.currentCarMesh = null;

    // Camera Modes: 'chase', 'cockpit', 'bumper', 'drone'
    this.cameraModes = ['chase', 'cockpit', 'bumper', 'drone'];
    this.currentCamIndex = 0;
    this.camMode = 'chase';

    // Game Loop & Performance
    this.clock = new THREE.Clock();
    this.fpsCount = 0;
    this.lastFpsUpdate = 0;

    // Active Mission State
    this.activeMission = null;
    this.nitroContinuousTime = 0;
    this.sigilsCollectedCount = 0;

    // Modals
    this.garageModal = new GarageModal((options) => this.onCarChange(options), this.sound);
    this.radioModal = new RadioModal(this.sound, (track) => {
      this.hud.setRadioTrack(`${track.title} — ${track.artist}`);
    });
    this.phoneModal = new PhoneModal(this.sound, (mission) => this.setActiveMission(mission));
    this.weatherModal = new WeatherModal(this.weather, this.sound);
    this.settingsModal = new SettingsModal(this.sound, (quality) => this.onQualityChange(quality));

    this.setupInputs();
    this.setupWindowResize();
    this.setupModalControls();

    // Asynchronous 3D initialization
    this.initSceneAssets();
  }

  async initSceneAssets() {
    // 1. Load HDR Environment map for photorealistic PBR reflections
    const envMap = await this.assetLoader.loadHdrEnvironment('/hdri/sunflowers_puresky_1k.hdr');
    if (envMap) {
      this.scene.environment = envMap;
      this.scene.environmentIntensity = 0.85;
    }

    // 2. Load the initial Quadra Turbo-R car model
    await this.loadCarModel('quadra', 'metallic', null, null);
  }

  async loadCarModel(carId, finish = 'metallic', bodyColor = null, underglow = null) {
    if (this.currentCarMesh) {
      this.scene.remove(this.currentCarMesh.root);
    }

    this.physics.setCar(carId);
    this.currentCarMesh = await this.carGenerator.createCar(this.physics.spec, finish, bodyColor, underglow);
    this.scene.add(this.currentCarMesh.root);
    this.hud.setCarName(this.physics.spec.name);
  }

  async onCarChange(options) {
    await this.loadCarModel(options.carId, options.finish, options.bodyColor, options.underglowColor);
    this.hud.showToast('GARAGE UPDATE', `Equipped ${this.physics.spec.name}`);
  }

  onQualityChange(quality) {
    if (quality === 'low') {
      this.renderer.setPixelRatio(1.0);
      this.renderer.shadowMap.enabled = false;
    } else if (quality === 'medium') {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      this.renderer.shadowMap.enabled = true;
    } else {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
      this.renderer.shadowMap.enabled = true;
    }
    this.hud.showToast('GRAPHICS CONFIG', `Quality set to ${quality.toUpperCase()}`);
  }

  setActiveMission(mission) {
    this.activeMission = mission;
    this.hud.updateObjective(mission.title, 0);
    this.hud.showToast('NEW CONTRACT', `Tracking: ${mission.title}`);
  }

  setupInputs() {
    // Keyboard Event Listeners
    window.addEventListener('keydown', (e) => {
      if (e.repeat && ['KeyC', 'KeyR', 'KeyG', 'KeyM', 'KeyI', 'KeyW', 'KeyO', 'KeyH'].includes(e.code)) return;

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.physics.inputs.throttle = 1.0;
          this.sound.ensureContext();
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.physics.inputs.brake = 1.0;
          this.sound.ensureContext();
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.physics.inputs.steer = 1.0;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.physics.inputs.steer = -1.0;
          break;
        case 'Space':
          this.physics.inputs.handbrake = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.physics.inputs.nitro = true;
          break;
        case 'KeyC':
          this.cycleCamera();
          break;
        case 'KeyR':
          this.physics.resetPosition();
          this.hud.showToast('SYSTEM RESET', 'Vehicle telemetry and coordinates restored');
          break;
        case 'KeyG':
          this.toggleModal('garage');
          break;
        case 'KeyM':
          this.toggleModal('radio');
          break;
        case 'KeyI':
          this.toggleModal('phone');
          break;
        case 'KeyO':
          this.toggleModal('settings');
          break;
        case 'KeyH':
          this.toggleModal('help');
          break;
        case 'Tab':
          e.preventDefault();
          this.toggleHudView();
          break;
        case 'Escape':
          this.closeAllModals();
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.physics.inputs.throttle = 0;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.physics.inputs.brake = 0;
          break;
        case 'KeyA':
        case 'ArrowLeft':
        case 'KeyD':
        case 'ArrowRight':
          this.physics.inputs.steer = 0;
          break;
        case 'Space':
          this.physics.inputs.handbrake = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.physics.inputs.nitro = false;
          break;
      }
    });

    // Mobile Virtual Touch Button Listeners
    const bindTouch = (id, onDown, onUp) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('touchstart', (e) => { e.preventDefault(); this.sound.ensureContext(); onDown(); });
      el.addEventListener('touchend', (e) => { e.preventDefault(); onUp(); });
      el.addEventListener('mousedown', () => { this.sound.ensureContext(); onDown(); });
      el.addEventListener('mouseup', () => onUp());
      el.addEventListener('mouseleave', () => onUp());
    };

    bindTouch('touch-gas-btn', () => this.physics.inputs.throttle = 1.0, () => this.physics.inputs.throttle = 0);
    bindTouch('touch-brake-btn', () => this.physics.inputs.brake = 1.0, () => this.physics.inputs.brake = 0);
    bindTouch('touch-left-btn', () => this.physics.inputs.steer = 1.0, () => this.physics.inputs.steer = 0);
    bindTouch('touch-right-btn', () => this.physics.inputs.steer = -1.0, () => this.physics.inputs.steer = 0);
    bindTouch('touch-nitro-btn', () => this.physics.inputs.nitro = true, () => this.physics.inputs.nitro = false);
  }

  setupModalControls() {
    // Top Bar Buttons
    document.getElementById('btn-nav-garage')?.addEventListener('click', () => this.toggleModal('garage'));
    document.getElementById('btn-nav-radio')?.addEventListener('click', () => this.toggleModal('radio'));
    document.getElementById('btn-nav-phone')?.addEventListener('click', () => this.toggleModal('phone'));
    document.getElementById('btn-nav-weather')?.addEventListener('click', () => this.toggleModal('weather'));
    document.getElementById('btn-nav-settings')?.addEventListener('click', () => this.toggleModal('settings'));
    document.getElementById('btn-nav-help')?.addEventListener('click', () => this.toggleModal('help'));
    document.getElementById('btn-nav-camera')?.addEventListener('click', () => this.cycleCamera());

    // Audio Mute Pill
    document.getElementById('audio-toggle-btn')?.addEventListener('click', () => {
      const isMuted = this.sound.toggleMute();
      const icon = document.getElementById('audio-icon');
      if (icon) icon.textContent = isMuted ? '🔇' : '🔊';
      this.hud.showToast('AUDIO SYSTEM', isMuted ? 'Master audio muted' : 'Master audio enabled');
    });

    // Close buttons
    document.querySelectorAll('.modal-close-btn').forEach((btn) => {
      btn.addEventListener('click', () => this.closeAllModals());
    });
    document.getElementById('modal-backdrop')?.addEventListener('click', () => this.closeAllModals());

    // Start Button
    document.getElementById('start-game-btn')?.addEventListener('click', () => {
      this.sound.ensureContext();
      this.sound.playRadio();
      document.getElementById('intro-screen')?.classList.add('fade-out');
      this.hud.showToast('NIGHT CITY LINK', 'Systems nominal. Welcome to Watson Expressway.');
    });
  }

  toggleModal(name) {
    this.closeAllModals();
    switch (name) {
      case 'garage':
        this.garageModal.open();
        break;
      case 'radio':
        this.radioModal.open();
        break;
      case 'phone':
        this.phoneModal.open();
        break;
      case 'weather':
        this.weatherModal.open();
        break;
      case 'settings':
        this.settingsModal.open();
        break;
      case 'help':
        document.getElementById('modal-help')?.classList.remove('hidden');
        document.getElementById('modal-container')?.classList.remove('hidden');
        this.sound.playUiBeep(520);
        break;
    }
  }

  closeAllModals() {
    document.querySelectorAll('.cyber-modal').forEach(m => m.classList.add('hidden'));
    document.getElementById('modal-container')?.classList.add('hidden');
  }

  cycleCamera() {
    this.currentCamIndex = (this.currentCamIndex + 1) % this.cameraModes.length;
    this.camMode = this.cameraModes[this.currentCamIndex];
    const labels = {
      chase: 'CHASE CAM',
      cockpit: 'COCKPIT CAM',
      bumper: 'BUMPER CAM',
      drone: 'DRONE ORBIT'
    };
    const label = document.getElementById('cam-label');
    if (label) label.textContent = labels[this.camMode];
    this.hud.showToast('CAMERA SWITCH', labels[this.camMode]);
    this.sound.playUiBeep(880, 0.05);
  }

  toggleHudView() {
    const dashboard = document.getElementById('hud-dashboard');
    if (dashboard) {
      dashboard.classList.toggle('hidden');
      this.hud.showToast('VIEWPORT', dashboard.classList.contains('hidden') ? 'Cinematic HUD Off' : 'HUD Restored');
    }
  }

  setupWindowResize() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  updateCamera(delta) {
    const carX = this.physics.x;
    const carY = this.physics.y;
    const carZ = this.physics.z;
    const carAngle = this.physics.angle;
    const speed = this.physics.speed;

    // Dynamic FOV based on speed
    if (this.settingsModal.useDynamicFov) {
      const targetFov = 65 + (Math.abs(speed) / 60) * 16;
      this.camera.fov += (targetFov - this.camera.fov) * Math.min(1, delta * 5);
      this.camera.updateProjectionMatrix();
    }

    switch (this.camMode) {
      case 'cockpit': {
        const camDist = 0.2;
        const camHeight = 1.35;
        this.camera.position.set(
          carX + Math.sin(carAngle) * camDist,
          carY + camHeight,
          carZ - Math.cos(carAngle) * camDist
        );
        this.camera.lookAt(
          carX + Math.sin(carAngle) * 50,
          carY + camHeight - 0.2,
          carZ - Math.cos(carAngle) * 50
        );
        break;
      }
      case 'bumper': {
        const camDist = 2.4;
        const camHeight = 0.45;
        this.camera.position.set(
          carX - Math.sin(carAngle) * camDist,
          carY + camHeight,
          carZ + Math.cos(carAngle) * camDist
        );
        this.camera.lookAt(
          carX + Math.sin(carAngle) * 40,
          carY + 0.3,
          carZ - Math.cos(carAngle) * 40
        );
        break;
      }
      case 'drone': {
        const time = performance.now() * 0.001;
        const orbitDist = 12;
        this.camera.position.set(
          carX + Math.sin(time) * orbitDist,
          carY + 5 + Math.sin(time * 0.5) * 2,
          carZ + Math.cos(time) * orbitDist
        );
        this.camera.lookAt(carX, carY + 1.2, carZ);
        break;
      }
      case 'chase':
      default: {
        const targetDist = 7.5 + (Math.abs(speed) / 50) * 2.2;
        const targetHeight = carY + 2.6 + (Math.abs(speed) / 50) * 0.5;

        // Smooth chase lag behind car angle
        const targetCamX = carX - Math.sin(carAngle) * targetDist;
        const targetCamZ = carZ + Math.cos(carAngle) * targetDist;

        this.camera.position.x += (targetCamX - this.camera.position.x) * Math.min(1, delta * 8);
        this.camera.position.y += (targetHeight - this.camera.position.y) * Math.min(1, delta * 8);
        this.camera.position.z += (targetCamZ - this.camera.position.z) * Math.min(1, delta * 8);

        this.camera.lookAt(carX, carY + 1.1, carZ);
        break;
      }
    }
  }

  checkMissions(delta) {
    if (!this.activeMission) return;

    if (this.activeMission.type === 'drift') {
      const progress = Math.min(100, (this.physics.currentDriftPoints / this.activeMission.targetPoints) * 100);
      this.hud.updateObjective(this.activeMission.title, progress);

      if (this.physics.currentDriftPoints >= this.activeMission.targetPoints) {
        this.hud.showToast('MISSION COMPLETE', 'Drift Combo Master achieved! +1,500 Creds');
        this.sound.playUiBeep(1300, 0.25);
        this.activeMission = null;
      }
    } else if (this.activeMission.type === 'speed') {
      const progress = Math.min(100, (this.physics.speedKmh / this.activeMission.targetSpeed) * 100);
      this.hud.updateObjective(this.activeMission.title, progress);

      if (this.physics.speedKmh >= this.activeMission.targetSpeed) {
        this.hud.showToast('MISSION COMPLETE', 'High Velocity Run achieved! +2,000 Creds');
        this.sound.playUiBeep(1300, 0.25);
        this.activeMission = null;
      }
    } else if (this.activeMission.type === 'sigils') {
      const progress = Math.min(100, (this.sigilsCollectedCount / this.activeMission.targetCount) * 100);
      this.hud.updateObjective(this.activeMission.title, progress);

      if (this.sigilsCollectedCount >= this.activeMission.targetCount) {
        this.hud.showToast('MISSION COMPLETE', 'All 5 Cyber-Sigils Recovered! +3,000 Creds');
        this.sound.playUiBeep(1300, 0.25);
        this.activeMission = null;
      }
    } else if (this.activeMission.type === 'nitro') {
      if (this.physics.isNitro) {
        this.nitroContinuousTime += delta;
      } else {
        this.nitroContinuousTime = 0;
      }
      const progress = Math.min(100, (this.nitroContinuousTime / this.activeMission.targetSeconds) * 100);
      this.hud.updateObjective(this.activeMission.title, progress);

      if (this.nitroContinuousTime >= this.activeMission.targetSeconds) {
        this.hud.showToast('MISSION COMPLETE', 'Nitro Overdrive achieved! +1,800 Creds');
        this.sound.playUiBeep(1300, 0.25);
        this.activeMission = null;
      }
    }
  }

  start() {
    this.renderer.setAnimationLoop(() => this.render());
  }

  render() {
    const delta = Math.min(0.05, this.clock.getDelta());

    // 1. Physics Update
    this.physics.update(delta);

    // 2. 3D Car Mesh Update
    if (this.currentCarMesh) {
      this.currentCarMesh.update(this.physics);
    }

    // 3. Environment & Sigil Updates
    this.city.update(delta);

    // Check Sigil pickups
    this.city.checkSigilPickups(this.physics.x, this.physics.z, (sigil) => {
      this.sigilsCollectedCount++;
      this.sound.playUiBeep(1400, 0.15);
      this.hud.showToast('SIGIL RECOVERED', `Found: ${sigil.name}! (+500 PTS)`);
    });

    // 4. Weather & Particles (Rock solid 60 FPS)
    this.weather.update(delta, { x: this.physics.x, z: this.physics.z });

    // 5. Camera Update
    this.updateCamera(delta);

    // 6. Sound Synthesis Update
    this.sound.updateEngineSound(
      this.physics.rpm,
      this.physics.inputs.throttle,
      this.physics.isDrifting,
      this.physics.isNitro
    );

    // 7. HUD Telemetry & Radar Update
    this.hud.update(this.physics, this.city.sigils);

    // 8. Mission Logic
    this.checkMissions(delta);

    // 9. FPS Counter
    this.fpsCount++;
    const now = performance.now();
    if (now - this.lastFpsUpdate >= 1000) {
      this.hud.setFps(this.fpsCount);
      this.fpsCount = 0;
      this.lastFpsUpdate = now;
    }

    // 10. Render Scene
    this.renderer.render(this.scene, this.camera);
  }
}
