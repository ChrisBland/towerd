import { LEVELS, WAVES, CANVAS } from '../config.js';
import { Enemy } from '../entities/Enemy.js';
import { ENEMY_TYPES } from '../config.js';

// Drives enemy spawning and wave/level progression. Every timer here is a
// millisecond counter advanced by update(dt), so it obeys pause and the speed
// multiplier and never leaks (unlike the original setInterval timers).
export class WaveManager {
    constructor(game) {
        this.game = game;
    }

    reset() {
        this.level = 1;
        this.wave = 1;
        this.enemiesPerWave = WAVES.enemiesPerWave;
        this.enemiesSpawned = 0;
        this.enemiesDefeatedInWave = 0;
        this.waveInProgress = false;
        this.spawnTimer = 0;
        this.countdownMs = 0;          // >0 while counting down to next wave
        this.path = this._layoutFor(this.level);
        this._announceLevel();
        this.startWave();
    }

    get nextWaveCountdownSec() {
        return this.countdownMs > 0 ? Math.ceil(this.countdownMs / 1000) : 0;
    }

    _layoutFor(level) {
        const idx = (level - 1) % LEVELS.layouts.length;
        return LEVELS.layouts[idx];
    }

    _announceLevel() {
        const idx = (this.level - 1) % LEVELS.names.length;
        this.game.effects.addText(
            LEVELS.names[idx], CANVAS.width / 2, CANVAS.height / 2 - 50, '#FFD700', 2000,
        );
    }

    startWave() {
        if (this.game.gameOver) return;
        this.waveInProgress = true;
        this.enemiesSpawned = 0;
        this.enemiesDefeatedInWave = 0;
        this.spawnTimer = 0;
        this.countdownMs = 0;
    }

    update(dt) {
        if (this.game.gameOver) return;

        // Counting down to the next wave.
        if (this.countdownMs > 0) {
            this.countdownMs -= dt;
            if (this.countdownMs <= 0) {
                this.countdownMs = 0;
                this.startWave();
            }
            return;
        }

        // Spawning enemies for the current wave.
        if (this.waveInProgress && this.enemiesSpawned < this.enemiesPerWave) {
            this.spawnTimer -= dt;
            if (this.spawnTimer <= 0) {
                this.spawnTimer += WAVES.spawnIntervalMs;
                this._spawnEnemy();
                this.enemiesSpawned++;
            }
        }
    }

    _spawnEnemy() {
        const type = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
        this.game.enemies.push(new Enemy(this.path, this.wave, type));
    }

    // Called by Game whenever an enemy leaves play (killed or reached the end).
    onEnemyResolved() {
        this.enemiesDefeatedInWave++;
        if (this.enemiesDefeatedInWave < this.enemiesPerWave) return;

        this.waveInProgress = false;
        if (this.wave >= WAVES.wavesPerLevel) {
            this._completeLevel();
        } else {
            this.wave++;
            this.countdownMs = WAVES.waveCountdownSec * 1000;
        }
    }

    _completeLevel() {
        const cx = CANVAS.width / 2;
        const cy = CANVAS.height / 2;
        this.game.effects.addText(`Level ${this.level} Complete!`, cx, cy - 100, 'white', 3000);

        // Auto-sell all towers and refund their value.
        const refund = this.game.sellAllTowers();
        if (refund > 0) {
            this.game.effects.addText(`Towers Sold: +${refund}`, cx, cy - 50, '#FFD700', 3000);
        }

        // Level-clear bonus.
        const bonus = this.game.economy.levelBonus(this.level);
        this.game.economy.add(bonus);
        this.game.effects.addText(`Level Bonus: +${bonus}`, cx, cy, '#FFD700', 3000);

        // Advance to the next level and count down into its first wave.
        this.level++;
        this.wave = 1;
        this.path = this._layoutFor(this.level);
        this._announceLevel();
        this.countdownMs = WAVES.waveCountdownSec * 1000;
        this.game.onLevelChanged();
    }

    // Dev-mode jump to an arbitrary level.
    jumpToLevel(level) {
        this.level = Math.max(1, level);
        this.wave = 1;
        this.path = this._layoutFor(this.level);
        this.enemiesSpawned = 0;
        this.enemiesDefeatedInWave = 0;
        this.waveInProgress = false;
        this.countdownMs = WAVES.waveCountdownSec * 1000;
        this.game.effects.addText(
            `DEV: Level ${this.level}`, CANVAS.width / 2, CANVAS.height / 2, '#4CAF50', 1500,
        );
        this.game.onLevelChanged();
    }
}
