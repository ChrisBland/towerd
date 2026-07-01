import { ENEMIES, WAVES, SIM_STEP_MS } from '../config.js';

// An enemy walking the path. Holds movement + status-effect state only; all
// drawing is done by the Renderer.
export class Enemy {
    constructor(path, wave, type) {
        this.path = path;
        this.x = path[0].x;
        this.y = path[0].y;
        this.currentPathIndex = 0;
        this.type = type;

        const def = ENEMIES[type];
        const waveScaling = 1 + (wave - 1) * WAVES.healthScalingPerWave;
        this.baseSpeed = def.speed;
        this.health = def.baseHealth * waveScaling;
        this.maxHealth = this.health;

        this.speed = this.baseSpeed;
        this.reachedEnd = false;

        this.burnDamage = 0;       // damage per second
        this.burnDuration = 0;     // remaining burn time in ms
        this.slowAmount = 0;       // fraction of speed removed
        this.slowDuration = 0;     // remaining slow time in ms
        this.size = 30;
    }

    applySlow(amount, durationMs) {
        this.slowAmount = Math.max(this.slowAmount, amount); // strongest slow wins
        this.slowDuration = Math.max(this.slowDuration, durationMs);
    }

    applyBurn(dps, durationMs) {
        this.burnDamage = dps;
        this.burnDuration = durationMs;
    }

    update(dt) {
        if (this.currentPathIndex >= this.path.length - 1) {
            this.reachedEnd = true;
            return;
        }

        // Burn damage over time (frame-rate independent).
        if (this.burnDuration > 0) {
            this.health -= this.burnDamage * (dt / 1000);
            this.burnDuration -= dt;
            if (this.burnDuration <= 0) {
                this.burnDuration = 0;
                this.burnDamage = 0;
            }
        }

        // Slow effect.
        if (this.slowDuration > 0) {
            this.speed = this.baseSpeed * (1 - this.slowAmount);
            this.slowDuration -= dt;
        } else {
            this.speed = this.baseSpeed;
            this.slowAmount = 0;
        }

        const target = this.path[this.currentPathIndex + 1];
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const moveAmount = (this.speed * dt) / SIM_STEP_MS;

        if (distance < moveAmount) {
            this.currentPathIndex++;
        } else {
            this.x += (dx / distance) * moveAmount;
            this.y += (dy / distance) * moveAmount;
        }
    }
}
