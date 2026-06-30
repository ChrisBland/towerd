import { SIM_STEP_MS } from '../config.js';

// A visual projectile that homes toward its target. Damage is applied at fire
// time by the Tower; the projectile is purely cosmetic travel + trail.
export class Projectile {
    constructor(startX, startY, targetEnemy, type) {
        this.x = startX;
        this.y = startY;
        this.targetEnemy = targetEnemy;
        this.type = type;
        this.baseSpeed = 8;            // pixels per sim step
        this.reached = false;
        this.radius = 5;
        this.trail = [];
        this.maxTrailLength = type === 'fire' ? 8 : 5;
    }

    // Returns true when the projectile is spent and should be removed.
    update(dt) {
        if (this.reached || !this.targetEnemy) return true;

        const dx = this.targetEnemy.x - this.x;
        const dy = this.targetEnemy.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        this.trail.unshift({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.pop();
        }

        const moveAmount = (this.baseSpeed * dt) / SIM_STEP_MS;
        if (distance < moveAmount) {
            this.reached = true;
            return true;
        }

        this.x += (dx / distance) * moveAmount;
        this.y += (dy / distance) * moveAmount;
        return false;
    }
}
