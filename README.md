# 🌴 GTA VI: Vice City — Cyberpunk Neon Drive (Three.js 3D)

A photorealistic, high-performance 3D open-world driving simulator built with **Three.js**, **WebGPU/WebGL**, and **Rapier Physics**, infused with an authentic **GTA VI: Vice City 1986** neon aesthetic.

🚀 **Live Production Deployment**: [https://threejs-punk-drive.vercel.app](https://threejs-punk-drive.vercel.app)  
📦 **GitHub Repository**: [https://github.com/GauravYadav-G/threejs-punk-drive](https://github.com/GauravYadav-G/threejs-punk-drive)

---

## 🌟 Key Features

### 🏎️ Vehicle Physics & Cockpit
- **8 Driveable Supercars**: All unlocked from start (Vanta Rig, Quadra Turbo, VCPD Cruiser, Cyber Coupe, and more).
- **Authentic Vehicle Dynamics**: Realistic acceleration, drift score counters, tire smoke particles, suspension simulation, and nitro boost.
- **3D VCPD Police Interceptor**: Autonomous police cruiser with active blue/red roof strobe lightbars, audible siren wails, and dynamic AI pursuit.

### 🎮 GTA VI Command Deck & Dynamic HUD
- **Driving Auto-Hide**: The top navigation deck automatically glides up off-screen when you drive, giving you an unobstructed cinematic windshield view.
- **Top-Edge Hover Reveal**: Gliding your mouse to the top edge of the screen instantly brings the full command deck back into view.
- **5-Star Wanted System**: Speeding over 200 km/h or aggressive drifting triggers police heat levels (Clear → Suspect → Pursuit → Armed Apprehend → SWAT Mobilized → Air-One). Click to clear with a bribe!
- **Vice Drift & Stunt Cash**: Earn stunt cash for high-speed runs and chained drift maneuvers.
- **Clean Radar & District HUD**: Circular radar minimap paired alongside live Vice City district names and radio tickers without overlapping.

### 📻 GTA VI YouTube Radio Station
- **Live YouTube Streaming**: Stream authentic GTA VI trailer tracks (*Tom Petty — Love Is A Long Road*, *The Weeknd — Blinding Lights*, *Flash FM 103.5*, *Wave 103*, *Vice City Nights*).
- **Custom YouTube Stream Input**: Paste ANY YouTube song URL directly into the in-game radio modal to play your own custom tracks while cruising through Vice City.
- **Dual-Channel SFX Engine**: Vehicle engine roars, screeching tires, rain drops, and sirens run on independent audio channels.

### 🏙️ Ultra-Sharp Graphics & Multi-Map Biomes
- **16x Anisotropic Filtering**: Full mipmap retention with crisp trilinear filtering on all city geometry, pavement, and vehicle chassis.
- **Vice City Sunset Grading**: Atmospheric radial glow grading inspired by the Grand Theft Auto VI official trailer.
- **4 Vice City Districts**: Explore Ocean Beach, Downtown Vice, Port Gellhorn, and Starfish Island.

---

## 🕹️ Keyboard Controls

| Key | Action |
| :--- | :--- |
| <kbd>W</kbd> / <kbd>▲</kbd> | Accelerate Throttle |
| <kbd>S</kbd> / <kbd>▼</kbd> | Brake / Reverse Gear |
| <kbd>A</kbd> <kbd>D</kbd> / <kbd>◀</kbd> <kbd>▶</kbd> | Steer Left / Right |
| <kbd>SPACE</kbd> | Handbrake (Initiate Drift) |
| <kbd>L-SHIFT</kbd> | Nitro Boost |
| <kbd>F</kbd> / <kbd>ENTER</kbd> | Enter / Exit Vehicle (Drive vs Foot Walk) |
| <kbd>E</kbd> | Toggle VCPD Police Siren & Lightbar Strobes |
| <kbd>C</kbd> | Cycle Camera Perspectives (Chase, Hood, Orbit) |
| <kbd>G</kbd> | Open Garage Vehicle Selector |
| <kbd>M</kbd> | Open GTA VI YouTube Radio Player |
| <kbd>N</kbd> | Next Radio Track |
| <kbd>R</kbd> | Reset Vehicle Position onto Highway |
| <kbd>H</kbd> | Toggle Keyboard Controls Help Card |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or 20+
- npm or pnpm

### Installation
```bash
# Clone the repository
git clone <REPO_URL>
cd threejs-punk-drive

# Install dependencies
npm install

# Start the local development server
npm run dev
```

Open `http://localhost:5173/` in your browser.

### Production Build
```bash
npm run build
npm run preview
```

---

## 🛠️ Built With
- **[Three.js](https://threejs.org/)** (v0.186+) — 3D Scene Graph, PBR Materials, Mesh Shaders
- **[Vite](https://vitejs.dev/)** — Ultra-fast frontend tooling
- **[Meshoptimizer](https://github.com/zeux/meshoptimizer)** — 3D Geometry compression
- **YouTube IFrame API** — Real-time in-game radio audio streaming
- **Vanilla CSS & JS** — Zero-dependency, responsive game HUD design
