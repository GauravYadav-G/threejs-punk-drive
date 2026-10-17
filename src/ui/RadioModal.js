/**
 * RadioModal.js
 * Interactive Synthwave Radio player interface with real-time frequency spectrum visualizer,
 * track seeker, volume channels, and playlist selection.
 */

export class RadioModal {
  constructor(soundManager, onTrackChange) {
    this.sound = soundManager;
    this.onTrackChange = onTrackChange;

    this.modal = document.getElementById('modal-radio');
    this.container = document.getElementById('modal-container');

    // Controls
    this.playBtn = document.getElementById('radio-play-btn');
    this.prevBtn = document.getElementById('radio-prev-btn');
    this.nextBtn = document.getElementById('radio-next-btn');
    this.shuffleBtn = document.getElementById('radio-shuffle-btn');

    // Track Display
    this.titleEl = document.getElementById('radio-title');
    this.artistEl = document.getElementById('radio-artist');
    this.timeCur = document.getElementById('radio-time-cur');
    this.timeTotal = document.getElementById('radio-time-total');
    this.seekSlider = document.getElementById('radio-seek-slider');

    // Volume sliders
    this.volMusic = document.getElementById('vol-music');
    this.volSfx = document.getElementById('vol-sfx');

    // Playlist
    this.playlistContainer = document.getElementById('radio-playlist-items');

    // Visualizer Canvas
    this.vizCanvas = document.getElementById('radio-audio-canvas');
    this.vizCtx = this.vizCanvas ? this.vizCanvas.getContext('2d') : null;

    this.init();
  }

  init() {
    this.setupPlaylist();
    this.setupListeners();

    // Hook SoundManager track change callback
    this.sound.onTrackChangeCallback = (track, index) => {
      this.updateTrackInfo(track, index);
      if (this.onTrackChange) {
        this.onTrackChange(track);
      }
    };

    // Animation loop for audio visualizer
    this.renderVisualizer();
  }

  setupPlaylist() {
    if (!this.playlistContainer) return;
    this.playlistContainer.innerHTML = '';

    this.sound.playlist.forEach((track, idx) => {
      const row = document.createElement('div');
      row.className = `playlist-row ${idx === this.sound.currentTrackIndex ? 'active' : ''}`;
      row.dataset.index = idx;

      const mins = Math.floor(track.duration / 60);
      const secs = String(track.duration % 60).padStart(2, '0');

      row.innerHTML = `
        <div class="pl-meta">
          <div class="pl-name">${track.title}</div>
          <div class="pl-artist">${track.artist}</div>
        </div>
        <div class="pl-duration">${mins}:${secs}</div>
      `;

      row.addEventListener('click', () => {
        this.sound.loadTrack(idx);
        this.sound.playRadio();
        this.updatePlayBtn(true);
      });

      this.playlistContainer.appendChild(row);
    });
  }

  setupListeners() {
    this.playBtn?.addEventListener('click', () => {
      const isPlaying = this.sound.toggleRadio();
      this.updatePlayBtn(isPlaying);
    });

    this.prevBtn?.addEventListener('click', () => {
      this.sound.prevTrack();
      this.updatePlayBtn(true);
    });

    this.nextBtn?.addEventListener('click', () => {
      this.sound.nextTrack();
      this.updatePlayBtn(true);
    });

    this.shuffleBtn?.addEventListener('click', () => {
      this.sound.shuffleTrack();
      this.updatePlayBtn(true);
    });

    this.volMusic?.addEventListener('input', (e) => {
      this.sound.setMusicVolume(e.target.value / 100);
    });

    this.volSfx?.addEventListener('input', (e) => {
      this.sound.setSfxVolume(e.target.value / 100);
    });

    // Seeker input
    this.seekSlider?.addEventListener('input', (e) => {
      if (this.sound.audioElement.duration) {
        const targetTime = (e.target.value / 100) * this.sound.audioElement.duration;
        this.sound.audioElement.currentTime = targetTime;
      }
    });

    // Audio time update
    this.sound.audioElement.addEventListener('timeupdate', () => {
      const cur = this.sound.audioElement.currentTime || 0;
      const total = this.sound.audioElement.duration || this.sound.playlist[this.sound.currentTrackIndex]?.duration || 180;

      if (this.timeCur) {
        const cMin = Math.floor(cur / 60);
        const cSec = String(Math.floor(cur % 60)).padStart(2, '0');
        this.timeCur.textContent = `${cMin}:${cSec}`;
      }

      if (this.timeTotal) {
        const tMin = Math.floor(total / 60);
        const tSec = String(Math.floor(total % 60)).padStart(2, '0');
        this.timeTotal.textContent = `${tMin}:${tSec}`;
      }

      if (this.seekSlider && total > 0) {
        this.seekSlider.value = (cur / total) * 100;
      }
    });
  }

  updateTrackInfo(track, index) {
    if (this.titleEl) this.titleEl.textContent = track.title;
    if (this.artistEl) this.artistEl.textContent = track.artist.toUpperCase();

    // Highlight row in playlist
    document.querySelectorAll('.playlist-row').forEach((row, i) => {
      if (i === index) row.classList.add('active');
      else row.classList.remove('active');
    });
  }

  updatePlayBtn(isPlaying) {
    if (this.playBtn) {
      this.playBtn.textContent = isPlaying ? '⏸' : '▶';
    }
  }

  renderVisualizer() {
    requestAnimationFrame(() => this.renderVisualizer());
    if (!this.vizCtx || this.modal?.classList.contains('hidden')) return;

    const ctx = this.vizCtx;
    const w = this.vizCanvas.width;
    const h = this.vizCanvas.height;

    ctx.clearRect(0, 0, w, h);

    const freqData = this.sound.getFrequencyData();
    const barCount = 32;
    const barWidth = (w / barCount) - 2;

    const grad = ctx.createLinearGradient(0, h, 0, 0);
    grad.addColorStop(0, '#00f3ff');
    grad.addColorStop(0.7, '#ff007f');
    grad.addColorStop(1, '#ffe600');

    ctx.fillStyle = grad;

    for (let i = 0; i < barCount; i++) {
      let value = freqData[i] || 0;
      // If paused or offline, generate gentle simulated frequency rhythm
      if (!this.sound.isPlaying) {
        value = 10 + Math.sin((performance.now() * 0.003) + i * 0.4) * 8;
      }
      const barHeight = Math.max(3, (value / 255) * h);
      const x = i * (barWidth + 2);
      const y = h - barHeight;

      ctx.fillRect(x, y, barWidth, barHeight);
    }
  }

  open() {
    this.modal?.classList.remove('hidden');
    this.container?.classList.remove('hidden');
    this.sound.playUiBeep(580);
  }

  close() {
    this.modal?.classList.add('hidden');
    this.container?.classList.add('hidden');
  }
}
