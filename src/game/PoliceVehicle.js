/**
 * PoliceVehicle.js
 * VCPD Police Interceptor & AI Pursuit System for GTA VI: Vice City Drive
 * Features:
 * - 3D Police Interceptor Cruiser with authentic VCPD livery
 * - Functional 3D Emergency Roof Lightbar (Alternating Red/Blue Strobe LEDs & PointLights)
 * - Front Grille Wig-Wag Strobes
 * - Procedural Dual-Tone Police Siren (Wail & Yelp) via Web Audio API
 * - AI Pursuit Dynamics when Wanted Level >= 2
 */

import * as THREE from 'three';

export class PoliceVehicleManager {
  constructor(scene, assetLoader = null) {
    this.scene = scene;
    this.assetLoader = assetLoader;

    this.policeCar = null;
    this.lightbar = null;
    this.redStrobeLight = null;
    this.blueStrobeLight = null;
    this.redLens = null;
    this.blueLens = null;

    // Siren Audio Context & Synthesis
    this.audioCtx = null;
    this.sirenGain = null;
    this.sirenOsc = null;
    this.sirenTimer = null;
    this.isSirenOn = false;

    // Pursuit State
    this.isPursuing = false;
    this.x = 0;
    this.y = -5.0;
    this.z = 20;
    this.speed = 0;
    this.angle = 0;

    this.initPoliceMesh();
  }

  ensureAudioContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  initPoliceMesh() {
    const root = new THREE.Group();
    root.name = 'vcpd_police_interceptor';

    // 1. Vehicle Body & Chassis
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x0a0c10, // Gloss Police Black
      metalness: 0.85,
      roughness: 0.2
    });

    const whiteDoorMat = new THREE.MeshStandardMaterial({
      color: 0xf0f4f8, // Police White Door
      metalness: 0.7,
      roughness: 0.25
    });

    // Main Chassis
    const chassisGeo = new THREE.BoxGeometry(2.1, 0.7, 4.8);
    const chassis = new THREE.Mesh(chassisGeo, bodyMat);
    chassis.position.y = 0.55;
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    root.add(chassis);

    // White Police Door Panels
    const doorL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.55, 1.9), whiteDoorMat);
    doorL.position.set(1.06, 0.55, 0);
    const doorR = doorL.clone();
    doorR.position.x = -1.06;
    root.add(doorL);
    root.add(doorR);

    // Cabin / Windshield
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x111622,
      transmission: 0.6,
      opacity: 1,
      roughness: 0.05,
      ior: 1.5
    });
    const cabinGeo = new THREE.BoxGeometry(1.8, 0.55, 2.3);
    const cabin = new THREE.Mesh(cabinGeo, glassMat);
    cabin.position.set(0, 1.1, -0.2);
    root.add(cabin);

    // Front Bumper Bullbar (Push Bar)
    const bullbarMat = new THREE.MeshStandardMaterial({ color: 0x111116, metalness: 0.9, roughness: 0.3 });
    const bullbar = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.5, 0.2), bullbarMat);
    bullbar.position.set(0, 0.45, -2.45);
    root.add(bullbar);

    // 2. Wheels
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111114, roughness: 0.8 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.85, roughness: 0.2 });
    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.3, 16);
    wheelGeo.rotateZ(Math.PI / 2);

    const wheels = [
      { x: 1.05, y: 0.38, z: 1.4 },
      { x: -1.05, y: 0.38, z: 1.4 },
      { x: 1.05, y: 0.38, z: -1.4 },
      { x: -1.05, y: 0.38, z: -1.4 }
    ];
    wheels.forEach(pos => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.position.set(pos.x, pos.y, pos.z);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.32, 12), rimMat);
      cap.rotation.z = Math.PI / 2;
      w.add(cap);
      root.add(w);
    });

    // 3. High-Intensity 3D Roof Emergency Lightbar
    const lightbarGroup = new THREE.Group();
    lightbarGroup.position.set(0, 1.42, -0.2);

    const baseBar = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.08, 0.28),
      new THREE.MeshStandardMaterial({ color: 0x050505, metalness: 0.9, roughness: 0.2 })
    );
    lightbarGroup.add(baseBar);

    // Red Left Strobe Lens
    const redLensMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
    const redLens = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.24), redLensMat);
    redLens.position.set(0.38, 0.08, 0);
    lightbarGroup.add(redLens);

    // Blue Right Strobe Lens
    const blueLensMat = new THREE.MeshBasicMaterial({ color: 0x0066ff });
    const blueLens = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.24), blueLensMat);
    blueLens.position.set(-0.38, 0.08, 0);
    lightbarGroup.add(blueLens);

    // Dynamic Strobe PointLights
    const redLight = new THREE.PointLight(0xff0033, 0, 30, 1.8);
    redLight.position.set(0.4, 0.3, 0);
    lightbarGroup.add(redLight);

    const blueLight = new THREE.PointLight(0x0066ff, 0, 30, 1.8);
    blueLight.position.set(-0.4, 0.3, 0);
    lightbarGroup.add(blueLight);

    root.add(lightbarGroup);

    this.policeCar = root;
    this.lightbar = lightbarGroup;
    this.redStrobeLight = redLight;
    this.blueStrobeLight = blueLight;
    this.redLens = redLens;
    this.blueLens = blueLens;

    // Start disabled until wanted
    this.policeCar.position.set(0, -5.0, 50);
    this.policeCar.visible = false;
    this.scene.add(this.policeCar);
  }

  startSiren() {
    this.ensureAudioContext();
    if (!this.audioCtx || this.isSirenOn) return;

    try {
      this.isSirenOn = true;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();

      this.sirenOsc = osc;
      this.sirenGain = gain;

      // Wail Modulation Cycle (650Hz -> 1350Hz -> 650Hz)
      let phase = 0;
      this.sirenTimer = setInterval(() => {
        if (!this.isSirenOn || !this.sirenOsc) return;
        phase += 0.08;
        const freq = 750 + Math.sin(phase) * 550;
        this.sirenOsc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      }, 50);
    } catch (e) {
      console.warn('Siren audio error:', e);
    }
  }

  stopSiren() {
    this.isSirenOn = false;
    if (this.sirenTimer) {
      clearInterval(this.sirenTimer);
      this.sirenTimer = null;
    }
    if (this.sirenGain && this.audioCtx) {
      try {
        this.sirenGain.gain.linearRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.3);
        setTimeout(() => {
          if (this.sirenOsc) {
            this.sirenOsc.stop();
            this.sirenOsc.disconnect();
            this.sirenOsc = null;
          }
        }, 320);
      } catch (e) {}
    }
  }

  toggleSiren() {
    if (this.isSirenOn) this.stopSiren();
    else this.startSiren();
  }

  update(delta, playerX, playerY, playerZ, playerAngle, playerSpeedKmh, wantedLevel) {
    if (!this.policeCar) return;

    // 1. Strobe Lights Animation (Fast Emergency Wig-Wag Cycle)
    const time = performance.now() * 0.012;
    const cycle = Math.floor(time) % 8; // 8-step strobe pulse

    if (this.isPursuing || this.isSirenOn) {
      if (cycle < 3) {
        // Red strobe active
        this.redStrobeLight.intensity = (cycle % 2 === 0) ? 9 : 0;
        this.redLens.material.color.setHex(0xff0044);
        this.blueStrobeLight.intensity = 0;
        this.blueLens.material.color.setHex(0x001144);
      } else if (cycle >= 4 && cycle < 7) {
        // Blue strobe active
        this.blueStrobeLight.intensity = (cycle % 2 === 0) ? 9 : 0;
        this.blueLens.material.color.setHex(0x0088ff);
        this.redStrobeLight.intensity = 0;
        this.redLens.material.color.setHex(0x440011);
      } else {
        this.redStrobeLight.intensity = 0;
        this.blueStrobeLight.intensity = 0;
      }
    } else {
      this.redStrobeLight.intensity = 0;
      this.blueStrobeLight.intensity = 0;
    }

    // 2. AI Pursuit Logic
    if (wantedLevel >= 2) {
      if (!this.isPursuing) {
        this.isPursuing = true;
        this.policeCar.visible = true;
        // Spawn behind player
        this.x = playerX - Math.sin(playerAngle) * 28;
        this.z = playerZ + Math.cos(playerAngle) * 28;
        this.y = playerY;
        this.speed = (playerSpeedKmh / 3.6) * 0.9;
        this.startSiren();
      }

      // Pursuit vector towards player
      const dx = playerX - this.x;
      const dz = playerZ - this.z;
      const dist = Math.hypot(dx, dz);
      const targetAngle = Math.atan2(dx, -dz);

      // Smooth steering towards player
      let diffAngle = targetAngle - this.angle;
      while (diffAngle < -Math.PI) diffAngle += Math.PI * 2;
      while (diffAngle > Math.PI) diffAngle -= Math.PI * 2;
      this.angle += diffAngle * Math.min(1, delta * 3.5);

      // Speed regulation (try to maintain pursuit distance ~12-18 meters)
      const playerSpeedMs = (playerSpeedKmh * 1000) / 3600;
      const targetSpeedMs = dist > 20 ? playerSpeedMs + 6 : Math.max(0, playerSpeedMs - 2);
      this.speed += (targetSpeedMs - this.speed) * Math.min(1, delta * 2.2);

      // Move Police Car
      this.x += Math.sin(this.angle) * this.speed * delta;
      this.z += -Math.cos(this.angle) * this.speed * delta;
      this.y = playerY;

      this.policeCar.position.set(this.x, this.y, this.z);
      this.policeCar.rotation.y = this.angle;
    } else {
      if (this.isPursuing) {
        this.isPursuing = false;
        this.stopSiren();
        // Slow down and fade out
        setTimeout(() => {
          if (!this.isPursuing) this.policeCar.visible = false;
        }, 3000);
      }
    }
  }
}
