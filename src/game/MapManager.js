/**
 * MapManager.js
 * Multi-Map Environment Manager for GTA VI: Vice City Drive
 * Provides 4 switchable map sectors and biomes from Vice City & Leonida:
 * 1. Ocean Beach (Coastal Miami Sunset with Water Reflections)
 * 2. Downtown Vice City (Skyscrapers, Neon Billboards & Wet Pavement)
 * 3. Port Gellhorn (Industrial Acid Highway & Speed Traps)
 * 4. Starfish Island (Golden Hour Causeway & Luxury Estates)
 */

export const MAP_ZONES = [
  {
    id: "ocean-beach",
    name: "OCEAN BEACH // COASTAL MIAMI",
    tagline: "Golden Hour Ocean Boulevard",
    coords: { x: -128, y: -5.47, z: 33, angle: Math.PI / 2 + 0.6 },
    skyTop: "#ff007f",
    skyBottom: "#ffaa00",
    fogColor: "#220022",
    fogDensity: 0.003,
    roadGloss: 0.95,
    lightingIntensity: 1.4,
    description: "Cruising along Ocean Drive alongside palm trees, art deco hotels, and sunset reflections."
  },
  {
    id: "downtown-vice",
    name: "DOWNTOWN VICE CITY",
    tagline: "Metro Towers & Neon Billboards",
    coords: { x: 35, y: -5.47, z: -180, angle: 0 },
    skyTop: "#110033",
    skyBottom: "#00f3ff",
    fogColor: "#050014",
    fogDensity: 0.005,
    roadGloss: 0.88,
    lightingIntensity: 1.2,
    description: "High-density skyline with illuminated corporate towers, holographic ads, and wet asphalt."
  },
  {
    id: "port-gellhorn",
    name: "PORT GELLHORN // INDUSTRIAL",
    tagline: "Highway 9 Straightaway",
    coords: { x: -45, y: -5.47, z: 320, angle: Math.PI },
    skyTop: "#331100",
    skyBottom: "#ff5500",
    fogColor: "#1a0800",
    fogDensity: 0.008,
    roadGloss: 0.75,
    lightingIntensity: 1.0,
    description: "Heavy cargo expressway with sodium-vapor streetlamps, industrial cranes, and radar speed traps."
  },
  {
    id: "starfish-island",
    name: "STARFISH ISLAND // CAUSEWAY",
    tagline: "Luxury Bridge & Sunset Waters",
    coords: { x: 80, y: -5.47, z: 90, angle: -Math.PI / 2 },
    skyTop: "#7928ca",
    skyBottom: "#ff007f",
    fogColor: "#140026",
    fogDensity: 0.004,
    roadGloss: 0.92,
    lightingIntensity: 1.35,
    description: "High-speed sweeping causeway crossing Biscayne Bay connecting the islands."
  }
];

export class MapManager {
  constructor(gameEngine = null, onMapChange = null) {
    this.gameEngine = gameEngine;
    this.onMapChange = onMapChange;
    this.currentMapIndex = 0;
  }

  getCurrentMap() {
    return MAP_ZONES[this.currentMapIndex];
  }

  switchMap(index) {
    if (index >= 0 && index < MAP_ZONES.length) {
      this.currentMapIndex = index;
      const map = this.getCurrentMap();
      this.applyMapEnvironment(map);
      if (this.onMapChange) this.onMapChange(map);
      return map;
    }
    return null;
  }

  nextMap() {
    const nextIndex = (this.currentMapIndex + 1) % MAP_ZONES.length;
    return this.switchMap(nextIndex);
  }

  applyMapEnvironment(map) {
    console.log(`%c [MAP SWITCH]: ${map.name} `, 'background: #ff007f; color: #fff; font-weight: bold;');

    // 1. Reposition Player Vehicle if engine attached
    if (this.gameEngine) {
      try {
        if (this.gameEngine.drive && this.gameEngine.drive.car) {
          const car = this.gameEngine.drive.car;
          if (car.position) {
            car.position.set(map.coords.x, map.coords.y, map.coords.z);
          }
          if (car.rotation) {
            car.rotation.y = map.coords.angle;
          }
        }
        if (this.gameEngine.scene && this.gameEngine.scene.fog) {
          this.gameEngine.scene.fog.color.set(map.fogColor);
          this.gameEngine.scene.fog.density = map.fogDensity;
        }
      } catch (e) {
        console.warn('Map teleport error:', e);
      }
    }

    // 2. Update CSS theme variables for atmosphere
    document.documentElement.style.setProperty('--map-sky-top', map.skyTop);
    document.documentElement.style.setProperty('--map-sky-bottom', map.skyBottom);
    document.documentElement.style.setProperty('--map-fog', map.fogColor);
  }
}
