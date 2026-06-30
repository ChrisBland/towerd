import {
    TOWERS, TOWER_MAX_LEVEL, TOWER_SCALING,
} from '../config.js';
import { Projectile } from './Projectile.js';

const RANGE_ANIM_MS = 1000;   // grow-the-range animation after an upgrade
const RANGE_ANIM_HOLD_MS = 500;

// A placed tower. Computes its stats from config + level, fires on a cooldown,
// and owns its in-flight projectiles. No canvas access.
export class Tower {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.config = TOWERS[type];
        this.level = 1;
        this.maxLevel = TOWER_MAX_LEVEL;
        this.size = 40;

        this.cooldownRemaining = 0;
        this.projectiles = [];
        this.target = null;

        // Range-upgrade animation state (driven by dt, drawn by Renderer).
        this.rangeAnimRemaining = 0;
        this.oldRange = this.range;

        this.recompute();
    }

    get range() {
        return this.config.range * (1 + (this.level - 1) * TOWER_SCALING.rangePerLevel);
    }

    get damage() {
        return Math.floor(this.config.damage * Math.pow(TOWER_SCALING.damageGrowth, this.level - 1));
    }

    get cooldown() {
        return this.config.cooldownMs * (1 - (this.level - 1) * TOWER_SCALING.cooldownReductionPerLevel);
    }

    // Cache values that callers read frequently. Getters above stay the source
    // of truth; this just refreshes the animation baseline.
    recompute() {
        this._range = this.range;
        this._damage = this.damage;
    }

    canUpgrade() {
        return this.level < this.maxLevel;
    }

    upgrade() {
        if (!this.canUpgrade()) return;
        this.oldRange = this.range;
        this.level++;
        this.recompute();
        this.rangeAnimRemaining = RANGE_ANIM_MS + RANGE_ANIM_HOLD_MS;
    }

    update(dt, enemies) {
        // Advance projectiles.
        this.projectiles = this.projectiles.filter(p => !p.update(dt));

        // Tick the range-upgrade animation.
        if (this.rangeAnimRemaining > 0) {
            this.rangeAnimRemaining = Math.max(0, this.rangeAnimRemaining - dt);
        }

        // Fire on cooldown.
        this.cooldownRemaining -= dt;
        if (this.cooldownRemaining <= 0) {
            this.target = this.findTarget(enemies);
            if (this.target) {
                this.shoot(this.target);
                this.cooldownRemaining = this.cooldown;
            } else {
                this.cooldownRemaining = 0; // ready to fire the instant a target appears
            }
        }
    }

    findTarget(enemies) {
        const range = this.range;
        return enemies.find(enemy => {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            return Math.sqrt(dx * dx + dy * dy) <= range;
        }) || null;
    }

    shoot(target) {
        this.projectiles.push(new Projectile(this.x, this.y, target, this.type));

        // Apply hit damage once, then any type-specific status effect.
        target.health -= this.damage;

        const i = this.level - 1;
        if (this.type === 'fire') {
            target.applyBurn(this.config.burnDpsByLevel[i], this.config.burnDurationMs);
        } else if (this.type === 'water') {
            target.applySlow(this.config.slowAmountByLevel[i], this.config.slowDurationByLevel[i]);
        }
    }

    // Progress (0..1) of the range-grow animation, for the Renderer.
    rangeAnimProgress() {
        if (this.rangeAnimRemaining <= 0) return 1;
        const elapsed = (RANGE_ANIM_MS + RANGE_ANIM_HOLD_MS) - this.rangeAnimRemaining;
        return Math.min(elapsed / RANGE_ANIM_MS, 1);
    }

    isAnimatingRange() {
        return this.rangeAnimRemaining > 0;
    }
}
