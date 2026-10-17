/**
 * AssetLoader.js
 * High-performance 3D asset manager with Meshopt, DRACO, KTX2, and RGBELoader support.
 * Loads the authentic Cyberpunk City, Quadra Turbo-R, Billboards, and HDR Sky environment.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'meshoptimizer';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

export class AssetLoader {
  constructor(renderer) {
    this.renderer = renderer;

    // DRACO Decoder
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('/libs/draco/');

    // KTX2 Loader with Basis Universal Transcoder
    this.ktx2Loader = new KTX2Loader();
    this.ktx2Loader.setTranscoderPath('/libs/basis/');
    this.ktx2Loader.detectSupport(this.renderer);

    // GLTF Loader
    this.gltfLoader = new GLTFLoader();
    this.gltfLoader.setDRACOLoader(this.dracoLoader);
    this.gltfLoader.setKTX2Loader(this.ktx2Loader);
    this.gltfLoader.setMeshoptDecoder(MeshoptDecoder);

    // RGBE HDR Loader
    this.rgbeLoader = new RGBELoader();

    this.cache = new Map();
  }

  async loadHdrEnvironment(path = '/hdri/sunflowers_puresky_1k.hdr') {
    try {
      const texture = await this.rgbeLoader.loadAsync(path);
      texture.mapping = THREE.EquirectangularReflectionMapping;

      const pmrem = new THREE.PMREMGenerator(this.renderer);
      const envMap = pmrem.fromEquirectangular(texture).texture;
      pmrem.dispose();
      texture.dispose();

      return envMap;
    } catch (e) {
      console.warn('Failed to load HDR environment map:', e);
      return null;
    }
  }

  async loadGlb(path) {
    if (this.cache.has(path)) {
      return this.cache.get(path).clone();
    }
    const gltf = await this.gltfLoader.loadAsync(path);
    this.cache.set(path, gltf.scene);
    return gltf.scene;
  }
}
