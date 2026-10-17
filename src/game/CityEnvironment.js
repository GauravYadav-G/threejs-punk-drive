/**
 * CityEnvironment.js
 * Loads the authentic Cyberpunk City 3D model (cyberpunk_compressed.glb) at y = -20,
 * creates high-gloss wet asphalt with puddle normal maps, illuminated neon billboards,
 * and collectible 3D holographic sigils.
 */

import * as THREE from 'three';

export class CityEnvironment {
  constructor(scene, assetLoader) {
    this.scene = scene;
    this.assetLoader = assetLoader;

    this.cityGroup = new THREE.Group();
    this.scene.add(this.cityGroup);

    this.cityModel = null;
    this.sigils = [];

    this.initPuddleHighway();
    this.initCityModel();
    this.initCollectibleSigils();
  }

  async initCityModel() {
    try {
      const city = await this.assetLoader.loadGlb('/models/cyberpunk_compressed.glb');
      city.position.set(0, -20, 0);
      city.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
      this.cityGroup.add(city);
      this.cityModel = city;
    } catch (e) {
      console.warn('Failed to load cyberpunk_compressed.glb, using modular fallback:', e);
    }

    // Load Billboards
    try {
      const billboards = await this.assetLoader.loadGlb('/models/billboards.glb');
      billboards.position.set(0, -20, 0);
      this.cityGroup.add(billboards);
    } catch (e) {
      // Ignored if billboards optional
    }
  }

  initPuddleHighway() {
    const texLoader = new THREE.TextureLoader();
    const albedoTex = texLoader.load('/textures/wet-puddles-albedo.jpg');
    const normalTex = texLoader.load('/textures/wet-puddles-normal.jpg');
    const roughTex = texLoader.load('/textures/wet-puddles-roughness.jpg');

    [albedoTex, normalTex, roughTex].forEach((tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(16, 120);
    });

    const roadGeo = new THREE.PlaneGeometry(160, 2000, 16, 32);
    roadGeo.rotateX(-Math.PI / 2);

    const roadMat = new THREE.MeshStandardMaterial({
      map: albedoTex,
      normalMap: normalTex,
      roughnessMap: roughTex,
      roughness: 0.18, // Puddle gloss
      metalness: 0.82,
    });

    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.position.set(0, -5.4, 0); // Road surface ground level
    roadMesh.receiveShadow = true;
    this.cityGroup.add(roadMesh);

    // Highway Median & Neon Guard Rails
    const railMat = new THREE.MeshStandardMaterial({ color: 0x0e111a, metalness: 0.85, roughness: 0.2 });
    const neonCyan = new THREE.MeshBasicMaterial({ color: 0x00f3ff });

    const railL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 2000), railMat);
    railL.position.set(-78, -4.8, 0);
    const railR = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 2000), railMat);
    railR.position.set(78, -4.8, 0);

    const stripL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 2000), neonCyan);
    stripL.position.set(-77.5, -4.4, 0);
    const stripR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 2000), neonCyan);
    stripR.position.set(77.5, -4.4, 0);

    this.cityGroup.add(railL);
    this.cityGroup.add(railR);
    this.cityGroup.add(stripL);
    this.cityGroup.add(stripR);
  }

  initCollectibleSigils() {
    const sigilDefs = [
      { id: "crossed-katanas", name: "Crossed Katanas", color: 0xff4dff, x: -16, z: -150 },
      { id: "arcade-stick", name: "Arcade Stick", color: 0x39ff88, x: 20, z: -50 },
      { id: "dead-mans-step", name: "Dead Man's Step", color: 0xb8a1ff, x: -24, z: 100 },
      { id: "wetware-brain", name: "Wetware Brain", color: 0xff85c8, x: 18, z: 250 },
      { id: "stim-shot", name: "Stim Shot", color: 0x00ffd5, x: 0, z: 420 }
    ];

    sigilDefs.forEach((def) => {
      const group = new THREE.Group();
      group.position.set(def.x, -3.2, def.z);

      const ringGeo = new THREE.TorusGeometry(1.5, 0.12, 12, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: def.color });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      group.add(ring);

      const crystalGeo = new THREE.OctahedronGeometry(0.9);
      const crystalMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true
      });
      const crystal = new THREE.Mesh(crystalGeo, crystalMat);
      group.add(crystal);

      const light = new THREE.PointLight(def.color, 4, 15);
      group.add(light);

      this.cityGroup.add(group);

      this.sigils.push({
        id: def.id,
        name: def.name,
        color: def.color,
        group,
        collected: false,
        x: def.x,
        z: def.z
      });
    });
  }

  update(delta) {
    const time = performance.now() * 0.002;
    this.sigils.forEach((sigil) => {
      if (!sigil.collected) {
        sigil.group.rotation.y += delta * 2.2;
        sigil.group.rotation.x = Math.sin(time) * 0.25;
        sigil.group.position.y = -3.2 + Math.sin(time * 2) * 0.4;
      }
    });
  }

  checkSigilPickups(carX, carZ, onCollect) {
    this.sigils.forEach((sigil) => {
      if (!sigil.collected) {
        const dx = carX - sigil.x;
        const dz = carZ - sigil.z;
        if (Math.hypot(dx, dz) < 4.5) {
          sigil.collected = true;
          sigil.group.visible = false;
          if (onCollect) onCollect(sigil);
        }
      }
    });
  }
}
