import { SIM_STEP_MS } from '../config.js';

// Transient visual effects: floating text (gold, bonuses, level names) and the
// expanding ring shown when a tower is sold. State only; the Renderer draws it.
export class EffectsManager {
    constructor() {
        this.texts = [];
        this.sellRings = [];
    }

    reset() {
        this.texts = [];
        this.sellRings = [];
    }

    addText(text, x, y, color, durationMs = 1000) {
        this.texts.push({
            text, x, y, color,
            alpha: 1,
            velocity: -1,        // drift upward (pixels per sim step)
            life: durationMs,
            maxLife: durationMs,
        });
    }

    addSellRing(x, y, startRadius, maxRadius) {
        this.sellRings.push({ x, y, radius: startRadius, maxRadius, alpha: 1 });
    }

    update(dt) {
        for (let i = this.texts.length - 1; i >= 0; i--) {
            const t = this.texts[i];
            t.y += t.velocity * (dt / SIM_STEP_MS);
            t.life -= dt;
            t.alpha = Math.max(0, t.life / 1000);
            if (t.life <= 0) this.texts.splice(i, 1);
        }

        for (let i = this.sellRings.length - 1; i >= 0; i--) {
            const r = this.sellRings[i];
            r.radius += dt * 0.2;
            r.alpha = Math.max(0, 1 - r.radius / r.maxRadius);
            if (r.radius >= r.maxRadius) this.sellRings.splice(i, 1);
        }
    }
}
