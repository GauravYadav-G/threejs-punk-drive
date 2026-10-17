/**
 * HudOverlay.js
 * Controls high-performance HUD dashboard updates: Speedometer digits, Tachometer shift lights,
 * gear indicator, nitro bar, drift combo counter, mini-map radar, and notification toasts.
 */

export class HudOverlay {
  constructor() {
    // DOM Elements
    this.speedDisplay = document.getElementById('speed-display');
    this.gearDisplay = document.getElementById('gear-display');
    this.rpmDisplay = document.getElementById('rpm-display');
    this.nitroBarFill = document.getElementById('nitro-bar-fill');
    this.nitroPercent = document.getElementById('nitro-percent');
    this.currentCarName = document.getElementById('current-car-name');
    this.shiftLights = document.querySelectorAll('#shift-lights .sl');

    // Drift Banner
    this.driftDisplay = document.getElementById('drift-display');
    this.driftScore = document.getElementById('drift-score');
    this.driftMult = document.getElementById('drift-mult');
    this.driftBarFill = document.getElementById('drift-bar-fill');

    // Mini-map Radar
    this.radarCanvas = document.getElementById('radar-canvas');
    this.radarCtx = this.radarCanvas ? this.radarCanvas.getContext('2d') : null;
    this.coordsDisplay = document.getElementById('coords-display');

    // Toast
    this.toastElement = document.getElementById('cyber-toast');
    this.toastTitle = document.getElementById('toast-title');
    this.toastMsg = document.getElementById('toast-message');
    this.toastTimeout = null;

    // Objective
    this.objTitle = document.getElementById('obj-title');
    this.objProgressFill = document.getElementById('obj-progress-fill');

    // Radio Ticker
    this.radioCurrentTrack = document.getElementById('radio-current-track');
    this.fpsDisplay = document.getElementById('fps-display');
  }

  update(physics, sigils = []) {
    if (!physics) return;

    // 1. Speedometer Digits (Format: 045, 120, etc.)
    const speedInt = Math.floor(physics.speedKmh);
    if (this.speedDisplay) {
      this.speedDisplay.textContent = String(speedInt).padStart(3, '0');
    }

    // 2. Gear & RPM
    if (this.gearDisplay) {
      this.gearDisplay.textContent = physics.gear;
    }
    if (this.rpmDisplay) {
      this.rpmDisplay.textContent = (physics.rpm / 1000).toFixed(1);
    }

    // 3. Shift Lights (Progressive redline illumination)
    const rpmRatio = (physics.rpm - physics.spec.idleRpm) / (physics.spec.redlineRpm - physics.spec.idleRpm);
    const activeLights = Math.floor(Math.max(0, Math.min(6, rpmRatio * 6)));

    this.shiftLights.forEach((light, idx) => {
      if (idx < activeLights) {
        light.classList.add('active');
      } else {
        light.classList.remove('active');
      }
    });

    // 4. Nitro Boost Bar
    if (this.nitroBarFill && this.nitroPercent) {
      const nitroVal = Math.floor(physics.nitroPercent);
      this.nitroBarFill.style.width = `${nitroVal}%`;
      this.nitroPercent.textContent = `${nitroVal}%`;
    }

    // 5. Drift Combo Banner
    if (this.driftDisplay) {
      if (physics.isDrifting || physics.currentDriftPoints > 50) {
        this.driftDisplay.classList.remove('hidden');
        if (this.driftScore) {
          const totalPoints = Math.floor(physics.currentDriftPoints * physics.driftMultiplier);
          this.driftScore.textContent = totalPoints.toLocaleString();
        }
        if (this.driftMult) {
          this.driftMult.textContent = `x${physics.driftMultiplier.toFixed(1)}`;
        }
        if (this.driftBarFill) {
          const fillPct = Math.min(100, (physics.driftMultiplier / 4.0) * 100);
          this.driftBarFill.style.width = `${fillPct}%`;
        }
      } else {
        this.driftDisplay.classList.add('hidden');
      }
    }

    // 6. Mini-Map Radar Canvas
    if (this.radarCtx) {
      this.drawRadar(physics, sigils);
    }

    // 7. Coordinates Display
    if (this.coordsDisplay) {
      this.coordsDisplay.textContent = `X: ${Math.floor(physics.x)} Z: ${Math.floor(physics.z)}`;
    }
  }

  drawRadar(physics, sigils) {
    const ctx = this.radarCtx;
    const w = this.radarCanvas.width;
    const h = this.radarCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = 0.55; // Radar distance scale

    ctx.clearRect(0, 0, w, h);

    // Save and rotate context so North / Heading aligns
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-physics.angle);

    // Draw Highway road boundary
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-50 * scale, -200 * scale);
    ctx.lineTo(-50 * scale, 200 * scale);
    ctx.moveTo(50 * scale, -200 * scale);
    ctx.lineTo(50 * scale, 200 * scale);
    ctx.stroke();

    // Center Dashed Lane
    ctx.strokeStyle = 'rgba(255, 230, 0, 0.4)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, -200 * scale);
    ctx.lineTo(0, 200 * scale);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Collectible Sigils Blips
    sigils.forEach((sigil) => {
      if (!sigil.collected) {
        const relX = (sigil.x - physics.x) * scale;
        const relZ = (sigil.z - physics.z) * scale;

        // Only draw if within radar radius
        if (Math.hypot(relX, relZ) < 70) {
          ctx.fillStyle = `#${sigil.color.toString(16).padStart(6, '0')}`;
          ctx.beginPath();
          ctx.arc(relX, relZ, 3.5, 0, Math.PI * 2);
          ctx.fill();

          // Blip pulse ring
          ctx.strokeStyle = ctx.fillStyle;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(relX, relZ, 6, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    });

    ctx.restore();

    // Player Direction Arrow in Center
    ctx.fillStyle = '#00f3ff';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 6);
    ctx.lineTo(cx - 4, cy + 5);
    ctx.lineTo(cx, cy + 3);
    ctx.lineTo(cx + 4, cy + 5);
    ctx.closePath();
    ctx.fill();
  }

  showToast(title, message, duration = 3500) {
    if (!this.toastElement) return;

    if (this.toastTitle) this.toastTitle.textContent = title;
    if (this.toastMsg) this.toastMsg.textContent = message;

    this.toastElement.classList.remove('hidden');

    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toastElement.classList.add('hidden');
    }, duration);
  }

  setRadioTrack(trackTitle) {
    if (this.radioCurrentTrack) {
      this.radioCurrentTrack.textContent = trackTitle.toUpperCase();
    }
  }

  setCarName(name) {
    if (this.currentCarName) {
      this.currentCarName.textContent = name.toUpperCase();
    }
  }

  setFps(fps) {
    if (this.fpsDisplay) {
      this.fpsDisplay.textContent = fps;
    }
  }

  updateObjective(title, progressPercent) {
    if (this.objTitle) this.objTitle.textContent = title;
    if (this.objProgressFill) this.objProgressFill.style.width = `${progressPercent}%`;
  }
}
