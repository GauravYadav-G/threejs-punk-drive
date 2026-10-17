/**
 * SettingsModal.js
 * Controls graphics performance presets, CRT scanlines toggle,
 * camera speed zoom effects, and engine synthesizer audio drivers.
 */

export class SettingsModal {
  constructor(soundManager, onQualityChange) {
    this.sound = soundManager;
    this.onQualityChange = onQualityChange;

    this.modal = document.getElementById('modal-settings');
    this.container = document.getElementById('modal-container');
    this.qualityButtons = document.querySelectorAll('#graphics-preset-options .opt-btn');
    this.crtToggle = document.getElementById('crt-toggle');
    this.crtOverlay = document.getElementById('crt-overlay');
    this.fovToggle = document.getElementById('fov-toggle');

    this.useDynamicFov = true;
    this.init();
  }

  init() {
    this.qualityButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.qualityButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const quality = btn.dataset.quality;
        if (this.onQualityChange) {
          this.onQualityChange(quality);
        }
        this.sound?.playUiBeep(760);
      });
    });

    this.crtToggle?.addEventListener('change', (e) => {
      if (this.crtOverlay) {
        if (e.target.checked) {
          this.crtOverlay.classList.remove('disabled');
        } else {
          this.crtOverlay.classList.add('disabled');
        }
      }
      this.sound?.playUiBeep(640);
    });

    this.fovToggle?.addEventListener('change', (e) => {
      this.useDynamicFov = e.target.checked;
      this.sound?.playUiBeep(640);
    });
  }

  open() {
    this.modal?.classList.remove('hidden');
    this.container?.classList.remove('hidden');
    this.sound?.playUiBeep(520);
  }

  close() {
    this.modal?.classList.add('hidden');
    this.container?.classList.add('hidden');
  }
}
