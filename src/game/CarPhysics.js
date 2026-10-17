/**
 * CarPhysics.js
 * Comprehensive vehicle dynamics engine implementing 8 authentic Cyberpunk vehicle specs,
 * 6-speed transmission, drift calculations, nitro boost, and realistic lateral tire slip.
 */

export const CAR_SPECS = {
  quadra: {
    id: "quadra",
    name: "Quadra Turbo-R",
    tagline: "The Legend of Night City",
    desc: "Tuned V8 mid-engine sports car with balanced torque, iconic wedge profile, and exceptional drifting dynamics.",
    mass: 1480,
    topSpeed: 245, // km/h
    acceleration: 3.2, // 0-100 km/h in seconds
    handling: 8.5,
    driftGrip: 1.15,
    redlineRpm: 8000,
    idleRpm: 900,
    bodyColor: "#00f3ff",
    underglowColor: "#00f3ff",
    finish: "metallic",
    dimensions: { length: 4.8, width: 2.1, height: 1.25 }
  },
  tsurugi: {
    id: "tsurugi",
    name: "Tsurugi Drift Custom",
    tagline: "Apex Twin-Turbo Tuner",
    desc: "High-revving 8,700 RPM drift master engineered for precision counter-steering and smoking street corners.",
    mass: 1330,
    topSpeed: 255,
    acceleration: 3.0,
    handling: 9.2,
    driftGrip: 1.35,
    redlineRpm: 8700,
    idleRpm: 1000,
    bodyColor: "#ff007f",
    underglowColor: "#ff007f",
    finish: "iridescent",
    dimensions: { length: 4.6, width: 2.05, height: 1.2 }
  },
  raijin: {
    id: "raijin",
    name: "Raijin Cyber-EV",
    tagline: "Instant Lightning Supercar",
    desc: "Quad-motor electric hypercar delivering 660Nm of instant torque and silent brutal acceleration.",
    mass: 1420,
    topSpeed: 265,
    acceleration: 2.6,
    handling: 8.9,
    driftGrip: 1.1,
    redlineRpm: 9500,
    idleRpm: 600,
    bodyColor: "#ffe600",
    underglowColor: "#ffe600",
    finish: "matte",
    dimensions: { length: 4.7, width: 2.1, height: 1.22 }
  },
  katana: {
    id: "katana",
    name: "Katana Precision",
    tagline: "Track Razor Interceptor",
    desc: "Ultra-rigid chassis with track suspension and razor-sharp steering feedback designed for tight industrial corners.",
    mass: 1280,
    topSpeed: 250,
    acceleration: 2.9,
    handling: 9.6,
    driftGrip: 1.25,
    redlineRpm: 8400,
    idleRpm: 950,
    bodyColor: "#00ff88",
    underglowColor: "#00ff88",
    finish: "metallic",
    dimensions: { length: 4.5, width: 2.0, height: 1.18 }
  },
  tachyon: {
    id: "tachyon",
    name: "Tachyon Widebody",
    tagline: "Aerodynamic Hyper-Prototype",
    desc: "Widebody stance with active ground-effect aerodynamics offering maximum high-speed highway stability.",
    mass: 1390,
    topSpeed: 275,
    acceleration: 2.7,
    handling: 9.0,
    driftGrip: 1.2,
    redlineRpm: 8200,
    idleRpm: 900,
    bodyColor: "#a855f7",
    underglowColor: "#a855f7",
    finish: "chrome",
    dimensions: { length: 4.9, width: 2.2, height: 1.15 }
  },
  velora: {
    id: "velora",
    name: "Velora Luxury GT",
    tagline: "Executive Neon Cruiser",
    desc: "Supple adaptive suspension and grand-touring V12 soundtrack built for high-roller expressway cruising.",
    mass: 1240,
    topSpeed: 235,
    acceleration: 3.5,
    handling: 8.2,
    driftGrip: 1.05,
    redlineRpm: 7600,
    idleRpm: 800,
    bodyColor: "#ffffff",
    underglowColor: "#00f3ff",
    finish: "metallic",
    dimensions: { length: 4.8, width: 2.05, height: 1.3 }
  },
  vanta: {
    id: "vanta",
    name: "Vanta Stealth",
    tagline: "Covert Blackout Roadster",
    desc: "Featherweight carbon tub chassis with radar-absorbent matte finish and ultra-nimble agility.",
    mass: 1150,
    topSpeed: 260,
    acceleration: 2.8,
    handling: 9.4,
    driftGrip: 1.22,
    redlineRpm: 8600,
    idleRpm: 950,
    bodyColor: "#111116",
    underglowColor: "#ff007f",
    finish: "matte",
    dimensions: { length: 4.4, width: 1.98, height: 1.18 }
  },
  chrysalis: {
    id: "chrysalis",
    name: "Chrysalis V-Spec",
    tagline: "Experimental Hypersport",
    desc: "Unrestricted prototype hypercar producing 720hp with an ear-piercing 9,000 RPM redline.",
    mass: 1180,
    topSpeed: 290,
    acceleration: 2.4,
    handling: 9.8,
    driftGrip: 1.4,
    redlineRpm: 9000,
    idleRpm: 1200,
    bodyColor: "#ff3366",
    underglowColor: "#00f3ff",
    finish: "iridescent",
    dimensions: { length: 4.75, width: 2.15, height: 1.14 }
  }
};

export class CarPhysics {
  constructor(carId = "quadra") {
    this.spec = CAR_SPECS[carId] || CAR_SPECS.quadra;

    // Position & Orientation
    this.x = 0;
    this.y = -5.0;
    this.z = 0;
    this.angle = 0; // heading angle in radians (0 = along -Z)

    // Dynamics State
    this.speed = 0; // m/s
    this.speedKmh = 0;
    this.angularVelocity = 0;
    this.steerAngle = 0;

    // Lateral slip / Drift
    this.slipAngle = 0;
    this.isDrifting = false;
    this.driftScore = 0;
    this.currentDriftPoints = 0;
    this.driftMultiplier = 1.0;

    // Transmission & Engine
    this.gear = 1;
    this.rpm = this.spec.idleRpm;
    this.gearRatios = [3.8, 2.5, 1.8, 1.35, 1.05, 0.82]; // 1st to 6th
    this.reverseRatio = -3.4;

    // Nitro Injection
    this.nitroPercent = 100.0;
    this.isNitro = false;

    // Input States
    this.inputs = {
      throttle: 0,
      brake: 0,
      steer: 0,
      handbrake: false,
      nitro: false
    };

    // Body Tilt (Suspension Pitch and Roll)
    this.pitch = 0;
    this.roll = 0;

    // Track road limits
    this.minRoadX = -60;
    this.maxRoadX = 60;
  }

  setCar(carId) {
    if (CAR_SPECS[carId]) {
      this.spec = CAR_SPECS[carId];
    }
  }

  update(dt) {
    if (dt <= 0 || dt > 0.1) dt = 0.016; // Clamp large delta frames

    // 1. Process Inputs & Nitro Boost
    let effectiveThrottle = this.inputs.throttle;
    this.isNitro = false;

    if (this.inputs.nitro && this.nitroPercent > 5 && effectiveThrottle > 0) {
      this.isNitro = true;
      this.nitroPercent = Math.max(0, this.nitroPercent - dt * 30);
      effectiveThrottle *= 1.45; // Nitro power boost
    } else {
      // Regenerate nitro slowly when not in use
      this.nitroPercent = Math.min(100, this.nitroPercent + dt * 8);
    }

    // 2. Acceleration and Braking Forces
    const maxSpeedMs = (this.spec.topSpeed * 1000) / 3600;
    const accelBase = (100 / this.spec.acceleration) / 3.6; // m/s^2 equivalent

    if (effectiveThrottle > 0) {
      if (this.speed >= 0) {
        const speedRatio = Math.max(0, 1 - (this.speed / maxSpeedMs));
        this.speed += effectiveThrottle * accelBase * speedRatio * dt;
      } else {
        // Braking while going in reverse
        this.speed += 18 * dt;
      }
    } else if (this.inputs.brake > 0) {
      if (this.speed > 0.5) {
        // Regular forward brake
        this.speed = Math.max(0, this.speed - this.inputs.brake * 22 * dt);
      } else {
        // Reverse gear
        this.speed -= this.inputs.brake * (accelBase * 0.45) * dt;
        this.speed = Math.max(-15, this.speed); // Max reverse speed ~54 km/h
      }
    } else {
      // Natural rolling resistance and aerodynamic drag
      const drag = 0.35 + 0.0018 * (this.speed * this.speed);
      if (this.speed > 0) {
        this.speed = Math.max(0, this.speed - drag * dt);
      } else if (this.speed < 0) {
        this.speed = Math.min(0, this.speed + drag * dt);
      }
    }

    // 3. Handbrake Force
    if (this.inputs.handbrake && Math.abs(this.speed) > 2) {
      this.speed = Math.max(0, this.speed - 12 * dt);
    }

    // 4. Steering and Angular Mechanics
    const speedFactor = Math.min(1.0, Math.max(0.12, Math.abs(this.speed) / 25));
    // High speed dampening for stable control
    const highSpeedDamp = Math.max(0.35, 1 - (Math.abs(this.speed) / maxSpeedMs) * 0.65);
    const targetSteer = this.inputs.steer * (0.55 * highSpeedDamp);
    this.steerAngle += (targetSteer - this.steerAngle) * Math.min(1, dt * 10);

    // Lateral Slip / Drifting Calculation
    const turnRate = this.steerAngle * speedFactor * 2.8;
    this.isDrifting = false;

    if (this.inputs.handbrake || (Math.abs(this.steerAngle) > 0.28 && this.speed > 16)) {
      this.isDrifting = true;
      this.slipAngle = (this.steerAngle * 1.6 * this.spec.driftGrip);
      this.angularVelocity = turnRate * 1.45;

      // Accumulate drift points
      const currentDriftRate = Math.abs(this.slipAngle) * (this.speed * 3.6) * 1.5;
      this.currentDriftPoints += currentDriftRate * dt;
      this.driftMultiplier = Math.min(4.0, this.driftMultiplier + dt * 0.35);
    } else {
      this.slipAngle += (0 - this.slipAngle) * Math.min(1, dt * 6);
      this.angularVelocity = turnRate;

      // Bank drift points if drift just finished
      if (this.currentDriftPoints > 50) {
        this.driftScore += Math.floor(this.currentDriftPoints * this.driftMultiplier);
      }
      this.currentDriftPoints = 0;
      this.driftMultiplier = 1.0;
    }

    this.angle += this.angularVelocity * dt;

    // 5. Update Global Cartesian Position (X, Z)
    const effectiveHeading = this.angle + this.slipAngle * 0.55;
    const moveX = Math.sin(effectiveHeading) * this.speed * dt;
    const moveZ = -Math.cos(effectiveHeading) * this.speed * dt;

    this.x += moveX;
    this.z += moveZ;

    // Road Bounds & Collision Soft Bounce
    if (this.x < this.minRoadX) {
      this.x = this.minRoadX;
      this.speed *= 0.85;
      this.angle += 0.08;
    } else if (this.x > this.maxRoadX) {
      this.x = this.maxRoadX;
      this.speed *= 0.85;
      this.angle -= 0.08;
    }

    // 6. Update Transmission Gear and RPM
    this.speedKmh = Math.abs(this.speed) * 3.6;

    if (this.speed < -0.2) {
      this.gear = "R";
      this.rpm = Math.min(this.spec.redlineRpm, this.spec.idleRpm + Math.abs(this.speed) * 350);
    } else {
      // 6-speed automatic transmission calculation
      const speedPct = this.speedKmh / this.spec.topSpeed;
      if (speedPct < 0.16) this.gear = 1;
      else if (speedPct < 0.32) this.gear = 2;
      else if (speedPct < 0.50) this.gear = 3;
      else if (speedPct < 0.70) this.gear = 4;
      else if (speedPct < 0.88) this.gear = 5;
      else this.gear = 6;

      const currentRatio = this.gearRatios[this.gear - 1];
      const targetRpm = this.spec.idleRpm + (this.speedKmh * currentRatio * 18);
      this.rpm += (Math.min(this.spec.redlineRpm, Math.max(this.spec.idleRpm, targetRpm)) - this.rpm) * Math.min(1, dt * 12);
    }

    // 7. Suspension Pitch & Roll Dynamics
    const targetPitch = (effectiveThrottle > 0 ? -0.04 : (this.inputs.brake > 0 ? 0.06 : 0));
    const targetRoll = -this.steerAngle * 0.12 * Math.min(1, this.speed / 20);

    this.pitch += (targetPitch - this.pitch) * Math.min(1, dt * 8);
    this.roll += (targetRoll - this.roll) * Math.min(1, dt * 8);
  }

  resetPosition() {
    this.x = 0;
    this.y = -5.0;
    this.angle = 0;
    this.speed = 0;
    this.angularVelocity = 0;
    this.steerAngle = 0;
    this.slipAngle = 0;
    this.rpm = this.spec.idleRpm;
    this.gear = 1;
  }
}
