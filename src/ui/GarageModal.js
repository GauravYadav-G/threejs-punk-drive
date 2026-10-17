/**
 * GarageModal.js
 * Controls vehicle showroom selection, paint finishes, neon underglow colors,
 * and spec telemetry comparisons.
 */

import { CAR_SPECS } from '../game/CarPhysics.js';

export class GarageModal {
  constructor(onSelectCar, soundManager) {
    this.onSelectCar = onSelectCar;
    this.soundManager = soundManager;

    this.modal = document.getElementById('modal-garage');
    this.container = document.getElementById('modal-container');
    this.carSelector = document.getElementById('garage-car-selector');

    // Details elements
    this.carTitle = document.getElementById('g-car-title');
    this.carDesc = document.getElementById('g-car-desc');
    this.statSpeed = document.getElementById('stat-speed');
    this.statAccel = document.getElementById('stat-accel');
    this.statHandling = document.getElementById('stat-handling');
    this.statMass = document.getElementById('stat-mass');
    this.valSpeed = document.getElementById('val-speed');
    this.valAccel = document.getElementById('val-accel');
    this.valHandling = document.getElementById('val-handling');
    this.valMass = document.getElementById('val-mass');

    // Color swatches
    this.bodyPalette = document.getElementById('body-color-palette');
    this.underglowPalette = document.getElementById('underglow-palette');
    this.finishButtons = document.querySelectorAll('.finish-btn');
    this.driveBtn = document.getElementById('garage-select-btn');

    this.selectedCarId = 'quadra';
    this.selectedFinish = 'metallic';
    this.selectedBodyColor = null;
    this.selectedUnderglow = null;

    this.colorList = [
      '#00f3ff', // Cyan
      '#ff007f', // Pink
      '#ffe600', // Yellow
      '#00ff88', // Green
      '#a855f7', // Purple
      '#ff3366', // Red
      '#ffffff', // White
      '#111118'  // Black
    ];

    this.init();
  }

  init() {
    this.populateCarPills();
    this.populateColorPalettes();
    this.setupListeners();
    this.updateCarDetails(this.selectedCarId);
  }

  populateCarPills() {
    if (!this.carSelector) return;
    this.carSelector.innerHTML = '';

    Object.values(CAR_SPECS).forEach((spec) => {
      const pill = document.createElement('button');
      pill.className = `car-pill ${spec.id === this.selectedCarId ? 'selected' : ''}`;
      pill.dataset.id = spec.id;

      pill.innerHTML = `
        <span class="car-pill-tag">${spec.tagline.toUpperCase()}</span>
        <span class="car-pill-name">${spec.name.toUpperCase()}</span>
      `;

      pill.addEventListener('click', () => {
        this.selectedCarId = spec.id;
        this.soundManager?.playUiBeep(660);
        document.querySelectorAll('.car-pill').forEach(p => p.classList.remove('selected'));
        pill.classList.add('selected');
        this.updateCarDetails(spec.id);
      });

      this.carSelector.appendChild(pill);
    });
  }

  populateColorPalettes() {
    // Body Colors
    if (this.bodyPalette) {
      this.bodyPalette.innerHTML = '';
      this.colorList.forEach((hex, idx) => {
        const swatch = document.createElement('div');
        swatch.className = `color-swatch ${idx === 0 ? 'active' : ''}`;
        swatch.style.backgroundColor = hex;
        swatch.style.color = hex;
        swatch.addEventListener('click', () => {
          this.selectedBodyColor = hex;
          this.soundManager?.playUiBeep(880);
          this.bodyPalette.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
          swatch.classList.add('active');
        });
        this.bodyPalette.appendChild(swatch);
      });
    }

    // Underglow Colors
    if (this.underglowPalette) {
      this.underglowPalette.innerHTML = '';
      this.colorList.forEach((hex, idx) => {
        const swatch = document.createElement('div');
        swatch.className = `color-swatch ${idx === 0 ? 'active' : ''}`;
        swatch.style.backgroundColor = hex;
        swatch.style.color = hex;
        swatch.addEventListener('click', () => {
          this.selectedUnderglow = hex;
          this.soundManager?.playUiBeep(920);
          this.underglowPalette.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
          swatch.classList.add('active');
        });
        this.underglowPalette.appendChild(swatch);
      });
    }
  }

  setupListeners() {
    // Finish buttons
    this.finishButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.finishButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedFinish = btn.dataset.finish;
        this.soundManager?.playUiBeep(740);
      });
    });

    // Drive button
    if (this.driveBtn) {
      this.driveBtn.addEventListener('click', () => {
        this.soundManager?.playUiBeep(1200, 0.15);
        if (this.onSelectCar) {
          this.onSelectCar({
            carId: this.selectedCarId,
            finish: this.selectedFinish,
            bodyColor: this.selectedBodyColor,
            underglowColor: this.selectedUnderglow
          });
        }
        this.close();
      });
    }
  }

  updateCarDetails(carId) {
    const spec = CAR_SPECS[carId];
    if (!spec) return;

    if (this.carTitle) this.carTitle.textContent = spec.name.toUpperCase();
    if (this.carDesc) this.carDesc.textContent = spec.desc;

    // Stat bars
    const maxSpeed = 300;
    const speedPct = Math.min(100, (spec.topSpeed / maxSpeed) * 100);
    const accelPct = Math.min(100, (4.5 / spec.acceleration) * 65);
    const handlingPct = spec.handling * 10;
    const massPct = Math.min(100, (spec.mass / 1800) * 100);

    if (this.statSpeed) this.statSpeed.style.width = `${speedPct}%`;
    if (this.valSpeed) this.valSpeed.textContent = `${spec.topSpeed} KM/H`;

    if (this.statAccel) this.statAccel.style.width = `${accelPct}%`;
    if (this.valAccel) this.valAccel.textContent = `${spec.acceleration}s (0-100)`;

    if (this.statHandling) this.statHandling.style.width = `${handlingPct}%`;
    if (this.valHandling) this.valHandling.textContent = `${spec.handling}/10`;

    if (this.statMass) this.statMass.style.width = `${massPct}%`;
    if (this.valMass) this.valMass.textContent = `${spec.mass.toLocaleString()} KG`;
  }

  open() {
    this.modal?.classList.remove('hidden');
    this.container?.classList.remove('hidden');
    this.soundManager?.playUiBeep(520);
  }

  close() {
    this.modal?.classList.add('hidden');
    this.container?.classList.add('hidden');
  }
}
