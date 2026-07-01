import './styles.css';
import { CANVAS } from './config.js';
import { loadSprites } from './systems/SpriteLoader.js';
import { Game } from './core/Game.js';

// Ensure webpack emits the sprite assets referenced by name at runtime.
import './sprites/fire-tower.svg';
import './sprites/water-tower.svg';
import './sprites/earth-tower.svg';
import './sprites/enemy-slow.svg';
import './sprites/enemy-fast.svg';
import './sprites/enemy-strong.svg';
import './sprites/tower-badge.svg';
import './sprites/gold-icon.svg';
import './sprites/level-icon.svg';
import './sprites/heart-icon.svg';

function boot() {
    const canvas = document.getElementById('gameCanvas');
    canvas.width = CANVAS.width;
    canvas.height = CANVAS.height;
    const ctx = canvas.getContext('2d');

    // Build the game only once the sprites are ready so the first frame draws
    // with real artwork. The Game owns its own loop from there.
    loadSprites((sprites) => new Game(canvas, ctx, sprites));
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
