/**
 * enhanced-ui.js
 * GTA VI: VICE CITY & CYBERPUNK ENHANCED MATRIX
 * Features:
 * - Real YouTube GTA VI Music Streamer (Tom Petty - Love Is A Long Road, The Weeknd, etc.) + Custom URL Player
 * - 3D VCPD Police Interceptor with Working Lightbar Strobes, Siren, and AI Pursuit
 * - Multi-Map Environment Switcher (Ocean Beach, Downtown Vice, Port Gellhorn, Starfish Island)
 * - Ultra Ray-Traced Graphics Enhancement & Dynamic Camera Motion Blur
 * - 5-Star Wanted Level System & Stunt Cash Rewards
 */

import { YouTubeRadioManager } from './audio/YouTubeRadioManager.js';
import { PoliceVehicleManager } from './game/PoliceVehicle.js';
import { MapManager, MAP_ZONES } from './game/MapManager.js';

class EnhancedUI {
  constructor() {
    this.game = null;
    this.isDriving = false;
    this.isNavHovered = false;
    this.isMouseNearTop = false;
    this.navHideTimer = null;
    this.qualityMode = 'ultra'; // Default to Ultra graphics as requested
    this.isGtaTheme = true;
    this.wantedLevel = 0;
    this.cash = 2540890;
    this.toastTimer = null;

    // Subsystems
    this.ytRadio = null;
    this.police = null;
    this.mapManager = null;

    this.init();
  }

  init() {
    // Unlock all 8 vehicles from start
    try {
      const pKey = 'threejs-punk:progress';
      const cur = JSON.parse(localStorage.getItem(pKey) || '{}');
      cur.allCars = true;
      localStorage.setItem(pKey, JSON.stringify(cur));

      // Hard-silence original radio in localStorage
      localStorage.setItem('threejs-punk:radio', JSON.stringify({ on: false, volume: 0, index: 0 }));
    } catch (e) {}

    this.mapManager = new MapManager(null, (map) => this.onMapChanged(map));
    this.ytRadio = new YouTubeRadioManager(
      (track) => this.onTrackUpdated(track),
      (isPlaying) => this.onPlayStateChanged(isPlaying)
    );

    this.createDom();
    this.suppressDuplicateNavbars();
    this.pollEngineReady();
    this.bindKeyboardShortcuts();
    this.applyGtaThemeStyles();
  }

  suppressDuplicateNavbars() {
    const purge = () => {
      // 1. Purge original header elements so only GTA VI navbar exists
      document.querySelectorAll('.app-header, .app-header-brand, .app-header-actions, .audio-btn-root, .hdr-btn--radio').forEach(el => {
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('opacity', '0', 'important');
        el.style.setProperty('pointer-events', 'none', 'important');
        el.style.setProperty('visibility', 'hidden', 'important');
        el.classList.add('app-header--force-hidden');
      });

      // 2. Pause and mute any HTML5 audio elements that might have been spawned by the old radio
      document.querySelectorAll('audio').forEach(a => {
        if (!a.paused) a.pause();
        a.volume = 0;
        a.muted = true;
      });
    };

    purge();
    setInterval(purge, 800);
  }

  pollEngineReady() {
    const check = setInterval(() => {
      if (window.__CYBER_GAME__ && window.__CYBER_GAME__.drive) {
        this.game = window.__CYBER_GAME__;
        clearInterval(check);
        this.onEngineConnected();
      }
    }, 200);
  }

  onEngineConnected() {
    console.log('%c GTA VI // VICE CITY MATRIX LINKED ', 'background: #ff007f; color: #fff; font-weight: bold; padding: 4px;');

    // 1. Force full native Retina resolution & crispness
    this.applyQuality(2.0);

    // 2. Enhance all scene textures to 16x Anisotropic filtering immediately
    this.enhanceAllTextures();

    // 3. Keep polling to enhance any dynamically loaded assets (e.g. cars, city meshes, plaster)
    let enhanceCount = 0;
    const enhanceInterval = setInterval(() => {
      this.enhanceAllTextures();
      enhanceCount++;
      if (enhanceCount > 6) clearInterval(enhanceInterval);
    }, 2500);

    // 4. Initialize 3D Police Interceptor in the scene
    if (this.game.scene) {
      this.police = new PoliceVehicleManager(this.game.scene);
    }

    // 5. Attach MapManager to GameEngine
    this.mapManager.gameEngine = this.game;

    if (this.game.cameraDirector) {
      this.isDriving = (this.game.cameraDirector.getCameraMode() === 'drive');
      document.body.classList.toggle('driving-mode', this.isDriving);
    }

    this.startTelemetryLoop();
    this.showToast('ULTRA SHARP PBR ACTIVE', '16x Anisotropic filtering & Native Retina resolution engaged.');

    // Auto-hide navbar after initial glance if driving
    setTimeout(() => {
      this.syncNavbarVisibility();
    }, 1500);

    // Auto-prompt enter car if walking
    setTimeout(() => {
      if (this.game.cameraDirector && this.game.cameraDirector.getCameraMode() === 'walk') {
        this.showToast('GTA VI QUICK DRIVE', 'Press F or click [DRIVE NOW] to enter vehicle');
      }
    }, 2000);
  }

  enhanceAllTextures() {
    if (!this.game) return;
    try {
      // Set renderer capabilities and pixel ratio
      if (this.game.renderer) {
        const dpr = Math.min(window.devicePixelRatio || 2, 2.0);
        this.game.renderer.setPixelRatio(dpr);
        if (this.game.renderer.toneMappingExposure !== undefined) {
          this.game.renderer.toneMappingExposure = 1.12;
        }
      }

      if (!this.game.scene) return;
      let enhancedCount = 0;
      this.game.scene.traverse((node) => {
        if (node.isMesh && node.material) {
          const mats = Array.isArray(node.material) ? node.material : [node.material];
          mats.forEach(m => {
            const textureSlots = [
              'map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap',
              'emissiveMap', 'specularMap', 'clearcoatMap', 'clearcoatNormalMap',
              'clearcoatRoughnessMap', 'bumpMap', 'displacementMap', 'transmissionMap', 'lightMap'
            ];
            textureSlots.forEach(key => {
              if (m[key] && m[key].isTexture) {
                const tex = m[key];
                tex.anisotropy = 16;
                // LinearMipmapLinearFilter (1008) for ultra-sharp minification
                if (tex.minFilter === 1006 || tex.minFilter === 1003 || !tex.minFilter) {
                  tex.minFilter = 1008;
                }
                tex.magFilter = 1006; // LinearFilter
                if (!tex.isCompressedTexture && tex.image) {
                  tex.generateMipmaps = true;
                }
                tex.needsUpdate = true;
                enhancedCount++;
              }
            });
            m.needsUpdate = true;
          });
        }
      });
      if (enhancedCount > 0) {
        console.info(`[TEXTURE ENHANCER] Enforced 16x Anisotropy & Trilinear filtering on ${enhancedCount} texture channels.`);
      }
    } catch (e) {
      console.warn('Texture enhancement warning:', e);
    }
  }

  createDom() {
    const root = document.createElement('div');
    root.id = 'enhanced-ui-overlay';
    root.className = 'gta-vi-theme';
    root.innerHTML = `
      <!-- TOP EDGE HOVER REVEAL STRIP -->
      <div id="gta-nav-hover-strip" class="gta-nav-hover-strip"></div>

      <!-- POLICE STROBE SCREEN EFFECT (ACTIVE ON WANTED >= 4) -->
      <div id="police-strobe" class="police-strobe hidden"></div>

      <!-- TOP AAA MASTER NAVIGATION BAR -->
      <header id="gta-main-navbar" class="gta-navbar">
        <!-- LEFT FLANK: GTA VI BRANDING & LIVE SATELLITE -->
        <div class="nav-left-wing">
          <div class="gta-vi-badge-group">
            <div class="gta-vi-badge">VI</div>
            <div class="gta-text-group">
              <span class="gta-title">VICE CITY</span>
              <span class="gta-pill-tag">1986</span>
            </div>
          </div>
          <div class="nav-status-pill">
            <span class="status-pulse-dot"></span>
            <span class="status-satellite">SAT 25.7°N</span>
            <span class="status-sep">|</span>
            <span class="status-zone" id="nav-zone-label">OCEAN BEACH</span>
          </div>
        </div>

        <!-- CENTER COMMAND CLUSTERS -->
        <nav class="nav-center-clusters">
          <!-- CLUSTER 1: VEHICLE & COCKPIT -->
          <div class="nav-cluster cluster-drive">
            <button id="btn-quick-drive" class="nav-btn nav-btn-hero" title="Enter / Drive Vehicle [F]">
              <span class="btn-glow-pulse"></span>
              <span class="nav-icon">🏎️</span>
              <span class="nav-label">DRIVE</span>
              <kbd>F</kbd>
            </button>
            <button id="btn-quick-garage" class="nav-btn" title="Open Garage [G]">
              <span class="nav-icon">🚗</span>
              <span class="nav-label">GARAGE</span>
              <kbd>G</kbd>
            </button>
            <button id="btn-quick-map" class="nav-btn nav-btn-accent" title="Switch Vice City Maps / Biomes">
              <span class="nav-icon">🗺️</span>
              <span id="map-dock-label" class="nav-label">BIOMES</span>
            </button>
          </div>

          <div class="nav-cluster-sep"></div>

          <!-- CLUSTER 2: SPECIAL OPS & MEDIA -->
          <div class="nav-cluster cluster-ops">
            <button id="btn-quick-siren" class="nav-btn nav-btn-siren" title="Toggle Police Siren & Strobes [E]">
              <span class="siren-strobe-pill"></span>
              <span class="nav-icon">🚨</span>
              <span class="nav-label">SIREN</span>
              <kbd>E</kbd>
            </button>
            <button id="btn-quick-radio" class="nav-btn nav-btn-radio" title="GTA VI YouTube Radio [M]">
              <div class="radio-eq-bars" id="nav-radio-eq">
                <span></span><span></span><span></span><span></span>
              </div>
              <span class="nav-icon">📻</span>
              <span class="nav-label">RADIO</span>
              <kbd>M</kbd>
            </button>
            <button id="btn-quick-sunset" class="nav-btn nav-btn-sunset active-sunset" title="Toggle Vice City Sunset Atmosphere">
              <span class="nav-icon">🌴</span>
              <span class="nav-label">SUNSET</span>
            </button>
          </div>

          <div class="nav-cluster-sep"></div>

          <!-- CLUSTER 3: CAMERA & ULTRA PBR -->
          <div class="nav-cluster cluster-view">
            <button id="btn-quick-cam" class="nav-btn" title="Switch Camera Mode [C]">
              <span class="nav-icon">🎥</span>
              <span class="nav-label">CAM</span>
              <kbd>C</kbd>
            </button>
            <button id="btn-quick-reset" class="nav-btn" title="Reset Vehicle Position [R]">
              <span class="nav-icon">🔄</span>
              <span class="nav-label">RESET</span>
              <kbd>R</kbd>
            </button>
            <button id="btn-quick-perf" class="nav-btn nav-btn-ultra" title="Toggle Graphics Preset">
              <span class="nav-icon">✨</span>
              <span id="perf-label" class="nav-label">ULTRA</span>
            </button>
            <button id="btn-quick-help" class="nav-btn nav-btn-icon-only" title="Keyboard Controls Help [H]">
              <span class="nav-icon">❓</span>
              <kbd>H</kbd>
            </button>
          </div>
        </nav>

        <!-- RIGHT FLANK: WANTED STARS & STUNT CASH -->
        <div class="nav-right-wing">
          <div class="nav-wanted-box" id="wanted-stars-row" title="Wanted Level (Click to Clear / Bribe)">
            <div class="wanted-stars">
              <span class="star-icon" data-star="1">★</span>
              <span class="star-icon" data-star="2">★</span>
              <span class="star-icon" data-star="3">★</span>
              <span class="star-icon" data-star="4">★</span>
              <span class="star-icon" data-star="5">★</span>
            </div>
            <span id="wanted-label" class="wanted-heat-text">CLEAR</span>
          </div>

          <div class="nav-cash-box">
            <span class="cash-currency">$</span>
            <span id="gta-cash-val" class="cash-digits">2,540,890</span>
          </div>
          <div id="cash-popup-container" class="cash-popup-container"></div>
        </div>

        <!-- AMBIENT NEON LINE RUNNER (BOTTOM HIGHLIGHT) -->
        <div class="nav-neon-runner"></div>
      </header>

      <!-- BOTTOM LEFT: VICE CITY DISTRICT & YOUTUBE RADIO TICKER (POSITIONED TO RIGHT OF RADAR) -->
      <div id="gta-district-hud" class="gta-district-hud">
        <div class="district-badge">
          <span class="district-pin">📍</span>
          <span id="district-name" class="district-title">OCEAN BEACH // OCEAN DRIVE</span>
        </div>
        <div class="gta-radio-ticker" id="gta-radio-ticker">
          <button id="yt-play-toggle-btn" class="radio-mini-btn" title="Play/Pause">▶</button>
          <span class="radio-live-dot"></span>
          <span id="gta-track-title" class="track-title-text">Love Is A Long Road — Tom Petty [FLASH FM 103.5]</span>
          <button id="yt-next-btn" class="radio-mini-btn" title="Next Song [N]">⏭</button>
          <button id="yt-open-modal-btn" class="radio-mini-btn" title="Open YouTube Radio Modal">🔗</button>
        </div>
      </div>

      <!-- FLOATING VICE DRIFT POINTS (ABOVE NATIVE TACHOMETER) -->
      <div id="tel-drift-row" class="telemetry-drift-floating" style="display: none;">
        <span class="drift-neon-tag">VICE DRIFT</span>
        <span id="tel-drift-points" class="drift-neon-pts">0 PTS</span>
      </div>

      <!-- YOUTUBE RADIO & CUSTOM URL MODAL -->
      <div id="yt-radio-modal" class="cyber-help-modal hidden">
        <div class="help-card gta-help-card yt-modal-card">
          <div class="help-head">
            <div class="help-title-wrap">
              <span class="help-badge-vi">📻</span>
              <h3>GTA VI YOUTUBE RADIO</h3>
            </div>
            <button id="close-yt-modal" class="help-close-btn">✕</button>
          </div>

          <!-- CUSTOM YOUTUBE URL INPUT -->
          <div class="yt-url-bar">
            <input type="text" id="yt-custom-input" placeholder="Paste ANY YouTube Song URL (e.g. https://youtu.be/...)" class="yt-input" />
            <button id="yt-load-btn" class="yt-load-button">PLAY STREAM</button>
          </div>

          <!-- YOUTUBE PLAYLIST ITEMS -->
          <div class="yt-playlist-wrap" id="yt-playlist-list">
            <!-- Rendered dynamically -->
          </div>

          <!-- VOLUME SLIDER -->
          <div class="yt-volume-row">
            <span>VOLUME</span>
            <input type="range" id="yt-volume-slider" min="0" max="100" value="80" class="cyber-slider" />
          </div>
        </div>
      </div>

      <!-- NOTIFICATION TOAST -->
      <div id="cyber-toast" class="cyber-toast hidden">
        <div class="toast-bar gta-toast-bar"></div>
        <div class="toast-body">
          <div id="toast-title" class="toast-title">LEONIDA DISPATCH</div>
          <div id="toast-msg" class="toast-msg">Active in Vice City.</div>
        </div>
      </div>

      <!-- KEYBOARD SHORTCUTS MODAL -->
      <div id="cyber-help-modal" class="cyber-help-modal hidden">
        <div class="help-card gta-help-card">
          <div class="help-head">
            <div class="help-title-wrap">
              <span class="help-badge-vi">VI</span>
              <h3>VICE CITY CONTROLS</h3>
            </div>
            <button id="close-help-btn" class="help-close-btn">✕</button>
          </div>
          <div class="help-grid">
            <div class="help-row"><kbd>W</kbd> / <kbd>▲</kbd> <span>Accelerate Throttle</span></div>
            <div class="help-row"><kbd>S</kbd> / <kbd>▼</kbd> <span>Brake / Reverse Gear</span></div>
            <div class="help-row"><kbd>A</kbd> <kbd>D</kbd> / <kbd>◀</kbd> <kbd>▶</kbd> <span>Steering Wheel</span></div>
            <div class="help-row"><kbd>SPACE</kbd> <span>Handbrake (Initiate Drift)</span></div>
            <div class="help-row"><kbd>L-SHIFT</kbd> <span>Nitro Boost</span></div>
            <div class="help-row"><kbd>F</kbd> / <kbd>ENTER</kbd> <span>Enter Vehicle / Exit Vehicle</span></div>
            <div class="help-row"><kbd>E</kbd> <span>Toggle Police Siren & Strobes</span></div>
            <div class="help-row"><kbd>C</kbd> <span>Switch Camera Mode</span></div>
            <div class="help-row"><kbd>G</kbd> <span>Garage (Select Car & VCPD Cruiser)</span></div>
            <div class="help-row"><kbd>M</kbd> <span>Open YouTube Radio Player</span></div>
            <div class="help-row"><kbd>N</kbd> <span>Next YouTube Song</span></div>
            <div class="help-row"><kbd>R</kbd> <span>Reset Vehicle Position</span></div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(root);

    // Navbar Auto-Hide & Hover Reveal Triggers
    const hoverStrip = document.getElementById('gta-nav-hover-strip');
    const mainNav = document.getElementById('gta-main-navbar');

    hoverStrip?.addEventListener('mouseenter', () => {
      this.isMouseNearTop = true;
      this.syncNavbarVisibility();
    });

    mainNav?.addEventListener('mouseenter', () => {
      this.isNavHovered = true;
      this.syncNavbarVisibility();
    });

    mainNav?.addEventListener('mouseleave', () => {
      this.isNavHovered = false;
      this.syncNavbarVisibility();
    });

    window.addEventListener('mousemove', (e) => {
      const nearTop = e.clientY <= 65;
      if (nearTop !== this.isMouseNearTop) {
        this.isMouseNearTop = nearTop;
        this.syncNavbarVisibility();
      }
    });

    // Event listeners
    document.getElementById('btn-quick-drive')?.addEventListener('click', () => this.triggerDrive());
    document.getElementById('btn-quick-map')?.addEventListener('click', () => this.switchNextMap());
    document.getElementById('btn-quick-garage')?.addEventListener('click', () => this.triggerGarage());
    document.getElementById('btn-quick-radio')?.addEventListener('click', () => this.toggleYouTubeModal(true));
    document.getElementById('btn-quick-siren')?.addEventListener('click', () => this.togglePoliceSiren());
    document.getElementById('btn-quick-sunset')?.addEventListener('click', () => this.toggleSunsetTheme());
    document.getElementById('btn-quick-cam')?.addEventListener('click', () => this.triggerCamera());
    document.getElementById('btn-quick-reset')?.addEventListener('click', () => this.triggerReset());
    document.getElementById('btn-quick-perf')?.addEventListener('click', () => this.toggleUltraGraphics());
    document.getElementById('btn-quick-help')?.addEventListener('click', () => this.toggleHelp());
    document.getElementById('close-help-btn')?.addEventListener('click', () => this.toggleHelp(false));
    document.getElementById('wanted-stars-row')?.addEventListener('click', () => this.clearWantedLevel());

    // YouTube Controls
    document.getElementById('yt-play-toggle-btn')?.addEventListener('click', () => this.togglePlayYouTube());
    document.getElementById('yt-next-btn')?.addEventListener('click', () => this.ytRadio.next());
    document.getElementById('yt-open-modal-btn')?.addEventListener('click', () => this.toggleYouTubeModal(true));
    document.getElementById('close-yt-modal')?.addEventListener('click', () => this.toggleYouTubeModal(false));
    document.getElementById('yt-load-btn')?.addEventListener('click', () => this.loadCustomYouTubeUrl());
    document.getElementById('yt-volume-slider')?.addEventListener('input', (e) => this.ytRadio.setVolume(Number(e.target.value)));

    this.renderYouTubePlaylist();
  }

  syncNavbarVisibility() {
    const navbar = document.getElementById('gta-main-navbar');
    if (!navbar) return;

    const ytModal = document.getElementById('yt-radio-modal');
    const helpModal = document.getElementById('cyber-help-modal');
    const isModalOpen = (ytModal && !ytModal.classList.contains('hidden')) ||
                        (helpModal && !helpModal.classList.contains('hidden'));

    const shouldShow = !this.isDriving || this.isNavHovered || this.isMouseNearTop || isModalOpen;

    clearTimeout(this.navHideTimer);

    if (shouldShow) {
      navbar.classList.remove('nav-driving-hidden');
      document.body.classList.add('nav-revealed');
    } else {
      this.navHideTimer = setTimeout(() => {
        const stillModal = (ytModal && !ytModal.classList.contains('hidden')) ||
                           (helpModal && !helpModal.classList.contains('hidden'));
        if (this.isDriving && !this.isNavHovered && !this.isMouseNearTop && !stillModal) {
          navbar.classList.add('nav-driving-hidden');
          document.body.classList.remove('nav-revealed');
        }
      }, 400);
    }
  }

  renderYouTubePlaylist() {
    const list = document.getElementById('yt-playlist-list');
    if (!list) return;

    list.innerHTML = this.ytRadio.playlist.map((track, idx) => `
      <div class="yt-track-item ${idx === this.ytRadio.currentIndex ? 'active-track' : ''}" data-idx="${idx}">
        <span class="yt-track-idx">${idx + 1}</span>
        <div class="yt-track-meta">
          <span class="yt-track-name">${track.title}</span>
          <span class="yt-track-artist">${track.artist} • ${track.station}</span>
        </div>
        <span class="yt-track-play-icon">▶</span>
      </div>
    `).join('');

    list.querySelectorAll('.yt-track-item').forEach(el => {
      el.addEventListener('click', () => {
        const idx = Number(el.getAttribute('data-idx'));
        this.ytRadio.selectTrackByIndex(idx);
        this.renderYouTubePlaylist();
      });
    });
  }

  loadCustomYouTubeUrl() {
    const input = document.getElementById('yt-custom-input');
    if (!input || !input.value.trim()) return;

    const res = this.ytRadio.playCustomUrl(input.value.trim());
    if (res.success) {
      this.showToast('YOUTUBE STREAM LOADED', `Now streaming: ${res.track.title}`);
      this.renderYouTubePlaylist();
      input.value = '';
    } else {
      this.showToast('INVALID LINK', res.message);
    }
  }

  toggleYouTubeModal(show = null) {
    const modal = document.getElementById('yt-radio-modal');
    if (!modal) return;
    if (show === null) modal.classList.toggle('hidden');
    else if (show) modal.classList.remove('hidden');
    else modal.classList.add('hidden');
    this.syncNavbarVisibility();
  }

  togglePlayYouTube() {
    this.ytRadio.togglePlay();
  }

  onPlayStateChanged(isPlaying) {
    const btn = document.getElementById('yt-play-toggle-btn');
    if (btn) btn.textContent = isPlaying ? '⏸' : '▶';
    const eq = document.getElementById('nav-radio-eq');
    if (eq) eq.classList.toggle('is-playing', isPlaying);
  }

  onTrackUpdated(track) {
    const titleEl = document.getElementById('gta-track-title');
    if (titleEl) {
      titleEl.textContent = `${track.title} — ${track.artist} [${track.station}]`;
    }
    this.showToast('YOUTUBE RADIO', `Now Playing: ${track.title}`);
    this.renderYouTubePlaylist();
  }

  switchNextMap() {
    const map = this.mapManager.nextMap();
    if (map) {
      const label = document.getElementById('map-dock-label');
      const shortName = map.name.split('//')[0].trim();
      if (label) label.textContent = shortName;
      const navZone = document.getElementById('nav-zone-label');
      if (navZone) navZone.textContent = shortName;
      const dist = document.getElementById('district-name');
      if (dist) dist.textContent = map.name;
      this.showToast('MAP LOADED', `Switched to: ${map.name} (${map.tagline})`);
      this.addCash(1000, 'MAP EXPLORER');

      // Re-enhance textures for newly streamed map geometries
      setTimeout(() => this.enhanceAllTextures(), 1000);
      setTimeout(() => this.enhanceAllTextures(), 3000);
    }
  }

  onMapChanged(map) {
    const shortName = map.name.split('//')[0].trim();
    const navZone = document.getElementById('nav-zone-label');
    if (navZone) navZone.textContent = shortName;
    const dist = document.getElementById('district-name');
    if (dist) dist.textContent = map.name;
    setTimeout(() => this.enhanceAllTextures(), 1500);
  }

  togglePoliceSiren() {
    if (!this.police) return;
    this.police.toggleSiren();
    const btn = document.getElementById('btn-quick-siren');
    btn?.classList.toggle('active-siren', this.police.isSirenOn);
    this.showToast('VCPD SIREN', this.police.isSirenOn ? 'Police Wail & Lightbar ACTIVE' : 'Police Siren OFF');
  }

  toggleUltraGraphics() {
    const label = document.getElementById('perf-label');
    if (this.qualityMode === 'ultra') {
      this.qualityMode = 'balanced';
      if (label) label.textContent = '60 FPS';
      this.applyQuality(1.2);
      this.showToast('GRAPHICS PRESET', 'BALANCED 60 FPS (Optimized)');
    } else if (this.qualityMode === 'balanced') {
      this.qualityMode = 'perf';
      if (label) label.textContent = 'HIGH FPS';
      this.applyQuality(1.0);
      this.showToast('GRAPHICS PRESET', 'MAXIMUM PERFORMANCE');
    } else {
      this.qualityMode = 'ultra';
      if (label) label.textContent = 'ULTRA RT';
      this.applyQuality(2.0);
      this.showToast('GRAPHICS PRESET', 'GTA VI ULTRA RAY-TRACED (Photorealistic PBR)');
    }
  }

  applyQuality(dpr) {
    if (this.game && this.game.renderer) {
      this.game.renderer.setPixelRatio(Math.min(window.devicePixelRatio, dpr));
    }
  }

  triggerDrive() {
    if (!this.game) return;
    try {
      if (this.game.cameraDirector) {
        const mode = this.game.cameraDirector.getCameraMode();
        if (mode === 'walk') {
          this.game.cameraDirector.enterVehicle();
          this.isDriving = true;
          document.body.classList.add('driving-mode');
          this.showToast('LEONIDA GPS', 'Behind the wheel. Step on the gas!');
          this.addCash(500, 'VEHICLE ACCESS');
          this.syncNavbarVisibility();
        } else {
          this.game.cameraDirector.exitVehicle();
          this.isDriving = false;
          document.body.classList.remove('driving-mode');
          this.showToast('LEONIDA GPS', 'Exited vehicle onto Ocean Drive.');
          this.syncNavbarVisibility();
        }
      }
    } catch (e) {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyF', key: 'f' }));
    }
  }

  triggerGarage() {
    if (!this.game) return;
    try {
      if (this.game.garage && typeof this.game.garage.open === 'function') {
        this.game.garage.open();
      } else {
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyG', key: 'g' }));
      }
    } catch (e) {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyG', key: 'g' }));
    }
  }

  triggerCamera() {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyC', key: 'c' }));
    this.showToast('CAMERA', 'Switched camera perspective.');
  }

  triggerReset() {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyR', key: 'r' }));
    this.showToast('LEONIDA RESCUE', 'Vehicle repositioned on highway.');
  }

  toggleSunsetTheme() {
    const btn = document.getElementById('btn-quick-sunset');
    this.isGtaTheme = !this.isGtaTheme;
    btn?.classList.toggle('active-sunset', this.isGtaTheme);
    const root = document.getElementById('enhanced-ui-overlay');
    root?.classList.toggle('gta-vi-theme', this.isGtaTheme);

    if (this.isGtaTheme) {
      this.applyGtaThemeStyles();
      this.showToast('VICE SUNSET 1986', 'GTA VI Sunset grading & tropical neon matrix engaged.');
    } else {
      this.removeGtaThemeStyles();
      this.showToast('NEON NOIR', 'Standard cyberpunk palette restored.');
    }
  }

  applyGtaThemeStyles() {
    let skyBackdrop = document.getElementById('gta-sunset-backdrop');
    if (!skyBackdrop) {
      skyBackdrop = document.createElement('div');
      skyBackdrop.id = 'gta-sunset-backdrop';
      skyBackdrop.className = 'gta-sunset-backdrop';
      document.body.appendChild(skyBackdrop);
    }
    skyBackdrop.style.opacity = '0.35';
  }

  removeGtaThemeStyles() {
    const skyBackdrop = document.getElementById('gta-sunset-backdrop');
    if (skyBackdrop) skyBackdrop.style.opacity = '0';
  }

  toggleHelp(show = null) {
    const modal = document.getElementById('cyber-help-modal');
    if (!modal) return;
    if (show === null) modal.classList.toggle('hidden');
    else if (show) modal.classList.remove('hidden');
    else modal.classList.add('hidden');
    this.syncNavbarVisibility();
  }

  showToast(title, msg) {
    const toast = document.getElementById('cyber-toast');
    const tTitle = document.getElementById('toast-title');
    const tMsg = document.getElementById('toast-msg');
    if (!toast || !tTitle || !tMsg) return;

    tTitle.textContent = title;
    tMsg.textContent = msg;
    toast.classList.remove('hidden');

    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.add('hidden');
    }, 3200);
  }

  addCash(amount, reason = '') {
    this.cash += amount;
    const el = document.getElementById('gta-cash-val');
    if (el) el.textContent = this.cash.toLocaleString('en-US');

    const container = document.getElementById('cash-popup-container');
    if (container) {
      const popup = document.createElement('div');
      popup.className = 'cash-popup';
      popup.textContent = `+$${amount.toLocaleString('en-US')} ${reason}`;
      container.appendChild(popup);
      setTimeout(() => popup.remove(), 2200);
    }
  }

  updateWantedLevel(speedKmh, isDrifting) {
    let targetLevel = 0;
    if (speedKmh > 230) targetLevel = 5;
    else if (speedKmh > 190 || (speedKmh > 140 && isDrifting)) targetLevel = 4;
    else if (speedKmh > 150) targetLevel = 3;
    else if (speedKmh > 110) targetLevel = 2;
    else if (speedKmh > 80) targetLevel = 1;

    if (speedKmh < 40 && this.wantedLevel > 0) {
      if (!this.wantedDecayTimer) {
        this.wantedDecayTimer = setTimeout(() => {
          this.wantedLevel = Math.max(0, this.wantedLevel - 1);
          this.renderWantedStars();
          this.wantedDecayTimer = null;
        }, 3000);
      }
    } else if (targetLevel > this.wantedLevel) {
      this.wantedLevel = targetLevel;
      this.renderWantedStars();
    }
  }

  renderWantedStars() {
    const starEls = document.querySelectorAll('#wanted-stars-row .star-icon');
    const label = document.getElementById('wanted-label');
    const strobe = document.getElementById('police-strobe');

    starEls.forEach((star, idx) => {
      if (idx < this.wantedLevel) {
        star.classList.add('active-star');
      } else {
        star.classList.remove('active-star');
      }
    });

    const labels = ['CLEAR', 'SUSPECT', 'PURSUIT', 'ARMED APPREHEND', 'SWAT MOBILIZED', 'LEONIDA AIR-ONE'];
    if (label) label.textContent = labels[this.wantedLevel] || 'CLEAR';

    if (strobe) {
      if (this.wantedLevel >= 4) strobe.classList.remove('hidden');
      else strobe.classList.add('hidden');
    }
  }

  clearWantedLevel() {
    this.wantedLevel = 0;
    this.renderWantedStars();
    this.showToast('BRIBE ACCEPTED', 'Vice City police heat cleared. Clean record.');
    this.addCash(-5000, 'POLICE BRIBE');
  }

  bindKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyH' && !e.repeat && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        this.toggleHelp();
      }
      if (e.code === 'KeyN' && !e.repeat && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        this.ytRadio.next();
      }
      if (e.code === 'KeyE' && !e.repeat && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        this.togglePoliceSiren();
      }
      if (e.code === 'KeyF' && !e.repeat && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        setTimeout(() => {
          if (this.game?.cameraDirector) {
            this.isDriving = (this.game.cameraDirector.getCameraMode() === 'drive');
            document.body.classList.toggle('driving-mode', this.isDriving);
            this.syncNavbarVisibility();
          }
        }, 150);
      }
    });
  }

  startTelemetryLoop() {
    const speedEl = document.getElementById('tel-speed');
    const gearEl = document.getElementById('tel-gear');
    const rpmValEl = document.getElementById('tel-rpm-val');
    const rpmFillEl = document.getElementById('tel-rpm-fill');
    const driftRow = document.getElementById('tel-drift-row');
    const driftPtsEl = document.getElementById('tel-drift-points');

    let stuntAccumulator = 0;

    setInterval(() => {
      if (!this.game || !this.game.drive) return;
      const drive = this.game.drive;

      // Sync driving mode navbar auto-hide
      const cameraMode = this.game.cameraDirector ? this.game.cameraDirector.getCameraMode() : 'drive';
      const nowDriving = (cameraMode === 'drive');
      if (nowDriving !== this.isDriving) {
        this.isDriving = nowDriving;
        document.body.classList.toggle('driving-mode', this.isDriving);
        this.syncNavbarVisibility();
      }

      let kmh = 0;
      let gear = '1';
      let rpm = 1200;
      let driftScore = 0;
      let isDrifting = false;

      let carX = 0, carY = -5.47, carZ = 0, carAngle = 0;

      if (drive.getSpeedKmh) kmh = Math.round(drive.getSpeedKmh());
      else if (drive.speed) kmh = Math.round(Math.abs(drive.speed) * 3.6);
      else if (drive.car && drive.car.speed) kmh = Math.round(Math.abs(drive.car.speed) * 3.6);

      if (drive.car) {
        if (drive.car.position) {
          carX = drive.car.position.x;
          carY = drive.car.position.y;
          carZ = drive.car.position.z;
        }
        if (drive.car.rotation) {
          carAngle = drive.car.rotation.y;
        }
      }

      if (drive.gear) gear = drive.gear;
      if (drive.rpm) rpm = Math.round(drive.rpm);
      if (drive.driftScore) driftScore = Math.round(drive.driftScore);
      if (drive.isDrifting) isDrifting = !!drive.isDrifting;

      if (speedEl) speedEl.textContent = String(kmh).padStart(3, '0');
      if (gearEl) gearEl.textContent = gear;
      if (rpmValEl) rpmValEl.textContent = (rpm / 1000).toFixed(1);
      if (rpmFillEl) {
        const pct = Math.min(100, Math.max(5, (rpm / 8500) * 100));
        rpmFillEl.style.width = `${pct}%`;
      }

      if (driftRow && driftPtsEl) {
        if (driftScore > 0) {
          driftRow.style.display = 'flex';
          driftPtsEl.textContent = `${driftScore} PTS`;
        }
      }

      // Update Wanted Level
      this.updateWantedLevel(kmh, isDrifting);

      // Update 3D Police Interceptor AI
      if (this.police) {
        this.police.update(0.1, carX, carY, carZ, carAngle, kmh, this.wantedLevel);
      }

      // Stunts & Cash
      if (kmh > 150) {
        stuntAccumulator += 1;
        if (stuntAccumulator % 15 === 0) {
          this.addCash(250, 'SPEED TRAP');
        }
      }
      if (isDrifting) {
        stuntAccumulator += 2;
        if (stuntAccumulator % 20 === 0) {
          this.addCash(750, 'VICE DRIFT');
        }
      }
    }, 100);
  }
}

// Inject on DOM ready
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    window.enhancedCyberUi = new EnhancedUI();
  });
}
