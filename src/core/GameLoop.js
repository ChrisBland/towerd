import { SIM_STEP_MS } from '../config.js';

// A fixed-timestep game loop. The simulation always advances in discrete
// SIM_STEP_MS increments, which makes it deterministic and independent of the
// display's frame rate. The speed multiplier scales how much simulation time
// elapses per real frame; returning 0 (or while paused) simply stops stepping.
const MAX_FRAME_MS = 250; // clamp huge gaps (e.g. backgrounded tab) to avoid spirals

export class GameLoop {
    constructor(update, render, getSpeed) {
        this.update = update;        // (dtMs) => void
        this.render = render;        // () => void
        this.getSpeed = getSpeed;    // () => number
        this.accumulator = 0;
        this.lastTime = null;
        this._frame = this._frame.bind(this);
    }

    start() {
        this.lastTime = null;
        requestAnimationFrame(this._frame);
    }

    _frame(timestamp) {
        if (this.lastTime === null) this.lastTime = timestamp;
        const frameMs = Math.min(timestamp - this.lastTime, MAX_FRAME_MS);
        this.lastTime = timestamp;

        this.accumulator += frameMs * this.getSpeed();
        while (this.accumulator >= SIM_STEP_MS) {
            this.update(SIM_STEP_MS);
            this.accumulator -= SIM_STEP_MS;
        }

        this.render();
        requestAnimationFrame(this._frame);
    }
}
