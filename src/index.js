import './styles.css';
import { Game } from './game';

// Import all sprites
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

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Game();
}); 