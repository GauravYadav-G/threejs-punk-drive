/**
 * WeatherSystem.js
 * Ultra-fast GPU-friendly atmospheric system.
 * Animates rain particles via group offset (0 buffer re-allocations) for a rock-solid 60 FPS,
 * dynamic cyberpunk fog, lightning flashes, and environmental lighting.
 */

import * as THREE from 'three';

export class WeatherSystem {
  constructor(scene) {
    this.scene = scene;

    this.mode = 'rain'; // 'dry', 'rain', 'storm', 'fog'
    this.timeOfDay = 'midnight'; // 'midnight', 'sunset', 'dawn'

    // Volumetric Cyberpunk Fog
    this.fog = new THREE.FogExp2(0x050512, 0.0035);
    this.scene.fog = this.fog;

    // Ambient Moonlight
    this.ambientLight = new THREE.AmbientLight(0x181830, 1.4);
    this.scene.add(this.ambientLight);

    // Directional Cyber Blue Light
    this.sunLight = new THREE.DirectionalLight(0x00f3ff, 1.2);
    this.sunLight.position.set(40, 80, 50);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 250;
    this.sunLight.shadow.camera.left = -60;
    this.sunLight.shadow.camera.right = 60;
    this.sunLight.shadow.camera.top = 60;
    this.sunLight.shadow.camera.bottom = -60;
    this.scene.add(this.sunLight);

    // High Performance Rain (1000 static particles, translated via container)
    this.rainBoxHeight = 80;
    this.rainCount = 1200;
    this.rainGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.rainCount * 3);

    for (let i = 0; i < this.rainCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 160;
      positions[i * 3 + 1] = Math.random() * this.rainBoxHeight;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 160;
    }

    this.rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    this.rainMat = new THREE.PointsMaterial({
      color: 0x88d4ff,
      size: 0.35,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });

    this.rainGroup = new THREE.Group();
    this.rainParticles = new THREE.Points(this.rainGeo, this.rainMat);
    this.rainGroup.add(this.rainParticles);
    this.scene.add(this.rainGroup);

    // Lightning Flash Light
    this.lightningLight = new THREE.PointLight(0xd0e8ff, 0, 300);
    this.lightningLight.position.set(0, 60, 0);
    this.scene.add(this.lightningLight);

    this.applyWeatherSettings();
  }

  setWeather(mode) {
    this.mode = mode;
    this.applyWeatherSettings();
  }

  setTimeOfDay(time) {
    this.timeOfDay = time;
    this.applyWeatherSettings();
  }

  applyWeatherSettings() {
    switch (this.timeOfDay) {
      case 'sunset':
        this.fog.color.setHex(0x180824);
        this.ambientLight.color.setHex(0x281036);
        this.sunLight.color.setHex(0xff007f);
        break;
      case 'dawn':
        this.fog.color.setHex(0x1a1a10);
        this.ambientLight.color.setHex(0x2c2616);
        this.sunLight.color.setHex(0xffaa00);
        break;
      case 'midnight':
      default:
        this.fog.color.setHex(0x050512);
        this.ambientLight.color.setHex(0x14182e);
        this.sunLight.color.setHex(0x00f3ff);
        break;
    }

    switch (this.mode) {
      case 'dry':
        this.rainGroup.visible = false;
        this.fog.density = 0.002;
        break;
      case 'storm':
        this.rainGroup.visible = true;
        this.rainMat.opacity = 0.85;
        this.fog.density = 0.005;
        break;
      case 'fog':
        this.rainGroup.visible = false;
        this.fog.density = 0.012;
        break;
      case 'rain':
      default:
        this.rainGroup.visible = true;
        this.rainMat.opacity = 0.6;
        this.fog.density = 0.0035;
        break;
    }
  }

  update(delta, playerCarPos) {
    if (!playerCarPos) return;

    // Follow player in X and Z
    this.rainGroup.position.x = playerCarPos.x;
    this.rainGroup.position.z = playerCarPos.z;

    // Super fast modulo translation without touching vertex buffer (Rock Solid 60 FPS!)
    if (this.rainGroup.visible) {
      const rainSpeed = 65;
      this.rainParticles.position.y -= rainSpeed * delta;
      if (this.rainParticles.position.y < -this.rainBoxHeight) {
        this.rainParticles.position.y = 0;
      }
    }

    // Thunderstorm Lightning Strike
    if (this.mode === 'storm') {
      if (Math.random() < 0.01) {
        this.lightningLight.intensity = 60;
        this.lightningLight.position.set(playerCarPos.x + (Math.random() - 0.5) * 80, 50, playerCarPos.z + (Math.random() - 0.5) * 80);
      } else {
        this.lightningLight.intensity *= 0.84;
      }
    }
  }
}
