/**
 * main.js
 * Application entry point for CYBERPUNK DRIVE // THREE.JS PUNK ENHANCED
 */

import './style.css';
import { GameEngine } from './game/GameEngine.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('webgl-canvas');
  if (!canvas) {
    console.error('WebGL canvas element not found');
    return;
  }

  // Initialize and launch the Cyberpunk Game Engine
  const game = new GameEngine(canvas);
  game.start();

  // Expose game instance for dev inspection
  window.cyberGame = game;
  console.log('%c CYBERPUNK DRIVE // THREE.JS PUNK ENHANCED READY ', 'background: #00f3ff; color: #000; font-weight: bold; padding: 4px;');
});
