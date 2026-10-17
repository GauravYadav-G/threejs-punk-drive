/**
 * CarModels.js
 * Loads and manages real rigged Cyberpunk vehicles (Quadra Turbo-R, Tsurugi, Raijin, Katana, etc.)
 * with authentic PBR materials, active headlights, real steerable wheels, brake lights,
 * neon underglow, and nitro exhaust flames.
 */

import * as THREE from 'three';

export class CarModelGenerator {
  constructor(assetLoader) {
    this.assetLoader = assetLoader;
    this.carCache = new Map();
  }

  async createCar(spec, finishType = "metallic", bodyColorHex = null, underglowHex = null) {
    const root = new THREE.Group();
    root.name = `car_${spec.id}`;

    // 1. Load the real authentic GLB vehicle
    const modelPath = spec.modelPath || `/models/game/${spec.id}_rig.glb`;
    let glbScene;
    try {
      glbScene = await this.assetLoader.loadGlb(modelPath);
    } catch (e) {
      console.error(`Failed to load ${modelPath}:`, e);
      // Fallback placeholder group if needed
      glbScene = new THREE.Group();
    }

    const carModel = glbScene.clone();
    root.add(carModel);

    // 2. Locate Wheels and Body Mesh inside the Rig
    let wheelFL = null;
    let wheelFR = null;
    let wheelRL = null;
    let wheelRR = null;
    let bodyMesh = null;
    const bodyMeshes = [];

    const underglowColor = new THREE.Color(underglowHex || spec.underglowColor || '#00f3ff');
    const bodyColor = new THREE.Color(bodyColorHex || spec.bodyColor || '#00f3ff');

    carModel.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;

        // Apply finish adjustments if node is the main exterior paint
        if (node.name.toLowerCase().includes('body') || node.material?.name?.includes('77') || node.material?.name?.includes('mat_0')) {
          bodyMeshes.push(node);
          if (finishType === 'chrome') {
            node.material = node.material.clone();
            node.material.metalness = 0.95;
            node.material.roughness = 0.08;
            node.material.color = bodyColor;
          } else if (finishType === 'matte') {
            node.material = node.material.clone();
            node.material.metalness = 0.15;
            node.material.roughness = 0.85;
            node.material.color = bodyColor;
          } else if (finishType === 'iridescent') {
            node.material = new THREE.MeshPhysicalMaterial({
              color: bodyColor,
              metalness: 0.8,
              roughness: 0.18,
              clearcoat: 1.0,
              clearcoatRoughness: 0.1,
              iridescence: 0.9,
              iridescenceIOR: 1.55
            });
          } else {
            // Metallic
            node.material = node.material.clone();
            node.material.metalness = 0.85;
            node.material.roughness = 0.22;
            node.material.color = bodyColor;
          }
        }
      }

      // Wheels
      const name = node.name.toLowerCase();
      if (name.includes('wheel_fl') || name.includes('wheelfl')) wheelFL = node;
      else if (name.includes('wheel_fr') || name.includes('wheelfr')) wheelFR = node;
      else if (name.includes('wheel_rl') || name.includes('wheelrl')) wheelRL = node;
      else if (name.includes('wheel_rr') || name.includes('wheelrr')) wheelRR = node;
      else if (name.includes('body')) bodyMesh = node;
    });

    // 3. Headlights & Spotlights
    const hlLeft = new THREE.SpotLight(0x00f3ff, 35, 45, Math.PI / 6, 0.4, 1.2);
    hlLeft.position.set(0.65, 0.6, 2.2);
    hlLeft.target.position.set(0.65, 0.2, 30);
    root.add(hlLeft);
    root.add(hlLeft.target);

    const hlRight = new THREE.SpotLight(0x00f3ff, 35, 45, Math.PI / 6, 0.4, 1.2);
    hlRight.position.set(-0.65, 0.6, 2.2);
    hlRight.target.position.set(-0.65, 0.2, 30);
    root.add(hlRight);
    root.add(hlRight.target);

    // 4. Taillights & Brake Flash
    const taillightMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
    const taillightMesh = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.04), taillightMat);
    taillightMesh.position.set(0, 0.72, -2.25);
    root.add(taillightMesh);

    // 5. Dual Nitro Boost Exhaust Flames
    const flameGeo = new THREE.ConeGeometry(0.14, 0.85, 8);
    flameGeo.rotateX(-Math.PI / 2);
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      transparent: true,
      opacity: 0.9
    });

    const flameL = new THREE.Mesh(flameGeo, flameMat);
    flameL.position.set(0.35, 0.38, -2.4);
    flameL.visible = false;
    root.add(flameL);

    const flameR = flameL.clone();
    flameR.position.x = -0.35;
    flameR.visible = false;
    root.add(flameR);

    // 6. Neon Underglow Light
    const underglowLight = new THREE.PointLight(underglowColor, 6, 6, 2);
    underglowLight.position.set(0, 0.18, 0);
    root.add(underglowLight);

    return {
      root,
      carModel,
      bodyMeshes,
      underglowLight,
      taillightMat,
      flameL,
      flameR,
      wheelFL,
      wheelFR,
      wheelRL,
      wheelRR,
      update(physics) {
        // Position and main yaw
        root.position.set(physics.x, physics.y, physics.z);
        // Note: quadra_rig.glb faces +Z, so rotation is -physics.angle + Math.PI
        root.rotation.y = physics.angle;

        // Pitch & Roll
        if (bodyMesh) {
          bodyMesh.rotation.x = physics.pitch;
          bodyMesh.rotation.z = physics.roll;
        }

        // Steer front wheels
        if (wheelFL) wheelFL.rotation.y = physics.steerAngle;
        if (wheelFR) wheelFR.rotation.y = physics.steerAngle;

        // Roll wheels
        const wheelRoll = (physics.speed / 0.4) * 0.016;
        if (wheelFL) wheelFL.rotation.x += wheelRoll;
        if (wheelFR) wheelFR.rotation.x += wheelRoll;
        if (wheelRL) wheelRL.rotation.x += wheelRoll;
        if (wheelRR) wheelRR.rotation.x += wheelRoll;

        // Brake lights
        if (physics.inputs.brake > 0 || physics.inputs.handbrake) {
          taillightMat.color.setHex(0xff0044);
        } else {
          taillightMat.color.setHex(0x550011);
        }

        // Nitro exhaust flame flicker
        if (physics.isNitro) {
          flameL.visible = true;
          flameR.visible = true;
          const flicker = 0.8 + Math.random() * 0.4;
          flameL.scale.set(flicker, flicker, flicker * 1.5);
          flameR.scale.set(flicker, flicker, flicker * 1.5);
        } else {
          flameL.visible = false;
          flameR.visible = false;
        }
      }
    };
  }
}
