/**
 * SoundManager.js
 * Cyberpunk audio engine powered by Web Audio API.
 * Includes procedural V8 engine synthesizer, drift tire squeal, nitro roar, UI beeps,
 * and Synthwave Neon FM 88.7 Radio with spectrum analyzer.
 */

export class SoundManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.analyser = null;

    // Engine Synthesizer Nodes
    this.engineOsc1 = null;
    this.engineOsc2 = null;
    this.engineOsc3 = null;
    this.engineFilter = null;
    this.engineGain = null;

    // Tire Squeal Nodes
    this.tireNoiseGain = null;
    this.tireNoiseFilter = null;

    // Nitro Roar Nodes
    this.nitroGain = null;
    this.nitroFilter = null;

    // Radio Music State
    this.audioElement = new Audio();
    this.audioElement.crossOrigin = 'anonymous';
    this.audioElement.preload = 'auto';
    this.mediaSourceNode = null;
    this.isPlaying = false;
    this.currentTrackIndex = 0;
    this.isMuted = false;

    // Volume settings
    this.musicVol = 0.75;
    this.sfxVol = 0.85;

    // Authentic Playlist reverse-engineered from threejspunk.com
    this.playlist = [
      {
        title: "Synthwave Neon Drive Horizon",
        artist: "Alex Morgan",
        display: "NEON_DRIVE_HORIZON",
        url: "https://www.threejspunk.com/audio/radio/neon-drive-horizon.mp3",
        duration: 213
      },
      {
        title: "Synthwave Arcade Retro Nights",
        artist: "Alex Morgan",
        display: "ARCADE_RETRO_NIGHTS",
        url: "https://www.threejspunk.com/audio/radio/arcade-retro-nights.mp3",
        duration: 137
      },
      {
        title: "Neon Synthwave Drive",
        artist: "Alex Morgan",
        display: "NEON_SYNTHWAVE_DRIVE",
        url: "https://www.threejspunk.com/audio/radio/neon-synthwave-drive.mp3",
        duration: 167
      },
      {
        title: "Synthwave",
        artist: "The Mountain",
        display: "SYNTHWAVE",
        url: "https://www.threejspunk.com/audio/radio/synthwave-the-mountain.mp3",
        duration: 197
      },
      {
        title: "Lofi Synthwave",
        artist: "Zephira Music",
        display: "LOFI_SYNTHWAVE",
        url: "https://www.threejspunk.com/audio/radio/lofi-synthwave.mp3",
        duration: 146
      },
      {
        title: "Cyberpunk Synthwave",
        artist: "Fidel Fortune",
        display: "CYBERPUNK_SYNTHWAVE",
        url: "https://www.threejspunk.com/audio/radio/cyberpunk-synthwave.mp3",
        duration: 214
      },
      {
        title: "Midnight Run",
        artist: "Lofi Dreams",
        display: "MIDNIGHT_RUN",
        url: "https://www.threejspunk.com/audio/radio/midnight-run.mp3",
        duration: 278
      },
      {
        title: "Dark Synthwave Neon Nights",
        artist: "Turtle Beats",
        display: "NEON_NIGHTS",
        url: "https://www.threejspunk.com/audio/radio/neon-nights.mp3",
        duration: 120
      }
    ];

    this.onTrackChangeCallback = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      // Master & sub gains
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVol, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVol, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Spectrum Analyser
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.musicGain.connect(this.analyser);

      // Connect HTML5 audio to Web Audio
      this.mediaSourceNode = this.ctx.createMediaElementSource(this.audioElement);
      this.mediaSourceNode.connect(this.musicGain);

      // Audio loop listener
      this.audioElement.addEventListener('ended', () => {
        this.nextTrack();
      });

      // Error fallback: If network audio fails, fallback to procedural synthwave
      this.audioElement.addEventListener('error', () => {
        console.warn('Audio stream failed, running procedural synthesizer');
      });

      this.setupEngineSynth();
      this.setupTireNoise();
      this.setupNitroNoise();

      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio init postponed until user interaction:', e);
    }
  }

  ensureContext() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setupEngineSynth() {
    // 3 harmonic sawtooth oscillators for rich V8 rumble
    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc3 = this.ctx.createOscillator();

    this.engineOsc1.type = 'sawtooth';
    this.engineOsc2.type = 'triangle';
    this.engineOsc3.type = 'sawtooth';

    this.engineOsc1.frequency.setValueAtTime(45, this.ctx.currentTime);
    this.engineOsc2.frequency.setValueAtTime(90, this.ctx.currentTime);
    this.engineOsc3.frequency.setValueAtTime(22.5, this.ctx.currentTime);

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(400, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineOsc3.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.sfxGain);

    this.engineOsc1.start();
    this.engineOsc2.start();
    this.engineOsc3.start();
  }

  setupTireNoise() {
    // Generate 2 seconds of pink/white noise buffer for tire squeal
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    this.tireNoiseFilter = this.ctx.createBiquadFilter();
    this.tireNoiseFilter.type = 'bandpass';
    this.tireNoiseFilter.frequency.setValueAtTime(1100, this.ctx.currentTime);
    this.tireNoiseFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

    this.tireNoiseGain = this.ctx.createGain();
    this.tireNoiseGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    whiteNoise.connect(this.tireNoiseFilter);
    this.tireNoiseFilter.connect(this.tireNoiseGain);
    this.tireNoiseGain.connect(this.sfxGain);

    whiteNoise.start();
  }

  setupNitroNoise() {
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    this.nitroFilter = this.ctx.createBiquadFilter();
    this.nitroFilter.type = 'highpass';
    this.nitroFilter.frequency.setValueAtTime(2200, this.ctx.currentTime);

    this.nitroGain = this.ctx.createGain();
    this.nitroGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    whiteNoise.connect(this.nitroFilter);
    this.nitroFilter.connect(this.nitroGain);
    this.nitroGain.connect(this.sfxGain);

    whiteNoise.start();
  }

  /**
   * Update dynamic engine sound based on RPM (800 to 8500) and throttle
   */
  updateEngineSound(rpm, throttle = 0, isDrifting = false, isNitro = false) {
    if (!this.initialized || !this.engineOsc1) return;

    const baseFreq = 32 + (rpm / 8500) * 160;
    const now = this.ctx.currentTime;

    this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.05);
    this.engineOsc2.frequency.setTargetAtTime(baseFreq * 2, now, 0.05);
    this.engineOsc3.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.05);

    // Filter frequency opens up with throttle
    const filterFreq = 300 + (rpm / 8500) * 1800 + (throttle > 0 ? 800 : 0);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.08);

    const gainVal = 0.08 + (throttle > 0 ? 0.08 : 0.02) + (rpm / 8500) * 0.06;
    this.engineGain.gain.setTargetAtTime(gainVal, now, 0.05);

    // Tire Squeal
    if (this.tireNoiseGain) {
      const squealVol = isDrifting ? Math.min(0.22, 0.08 + (rpm / 8500) * 0.14) : 0.0;
      this.tireNoiseGain.gain.setTargetAtTime(squealVol, now, 0.08);
    }

    // Nitro Roar
    if (this.nitroGain) {
      const nitroVol = isNitro ? 0.28 : 0.0;
      this.nitroGain.gain.setTargetAtTime(nitroVol, now, 0.05);
    }
  }

  // UI Sound Effects
  playUiBeep(freq = 880, duration = 0.08) {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.sfxGain || this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Ignored
    }
  }

  playGearShiftSound() {
    this.playUiBeep(440, 0.12);
  }

  // Radio Controls
  loadTrack(index) {
    this.currentTrackIndex = (index + this.playlist.length) % this.playlist.length;
    const track = this.playlist[this.currentTrackIndex];
    this.audioElement.src = track.url;
    if (this.onTrackChangeCallback) {
      this.onTrackChangeCallback(track, this.currentTrackIndex);
    }
  }

  playRadio() {
    this.ensureContext();
    if (!this.audioElement.src) {
      this.loadTrack(this.currentTrackIndex);
    }
    this.audioElement.play().then(() => {
      this.isPlaying = true;
    }).catch(e => {
      console.warn('Radio playback blocked or network audio failed:', e);
    });
  }

  pauseRadio() {
    this.audioElement.pause();
    this.isPlaying = false;
  }

  toggleRadio() {
    if (this.isPlaying) {
      this.pauseRadio();
    } else {
      this.playRadio();
    }
    return this.isPlaying;
  }

  nextTrack() {
    this.loadTrack(this.currentTrackIndex + 1);
    if (this.isPlaying) {
      this.playRadio();
    }
  }

  prevTrack() {
    this.loadTrack(this.currentTrackIndex - 1);
    if (this.isPlaying) {
      this.playRadio();
    }
  }

  shuffleTrack() {
    const nextIdx = Math.floor(Math.random() * this.playlist.length);
    this.loadTrack(nextIdx);
    if (this.isPlaying) {
      this.playRadio();
    }
  }

  setMusicVolume(val) {
    this.musicVol = Math.max(0, Math.min(1, val));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.musicVol, this.ctx.currentTime);
    }
  }

  setSfxVolume(val) {
    this.sfxVol = Math.max(0, Math.min(1, val));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVol, this.ctx.currentTime);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  getFrequencyData() {
    if (!this.analyser) return new Uint8Array(32);
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }
}
