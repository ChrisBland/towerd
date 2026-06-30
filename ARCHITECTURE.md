# Architecture Audit & Redesign

## 1. Audit of the original design

The original game lived almost entirely in a single ~1,400-line `src/game.js`
containing a `Game` god-object plus `Tower`, `Enemy`, and `Projectile`. It
worked, but several structural problems made it fragile and hard to extend.

### 1.1 `Game` was a god object
A single class owned state, the render loop, canvas drawing, DOM/HUD updates,
input handling, wave orchestration, the economy, dev mode, and animation. Any
change touched everything, and there was no seam for testing.

### 1.2 Three competing notions of time
This was the root cause of most of the gameplay bugs:

- **`requestAnimationFrame` deltas** drove enemy/projectile movement.
- **`Date.now()`** drove tower cooldowns and the upgrade range animation.
- **`setInterval`** drove enemy spawning, the interest timer, and the wave
  countdown.

Because these clocks were independent, the speed multiplier and "game over"
only affected *some* of them. `setInterval` timers ignored pause/speed and
leaked past the game's lifetime (they were never tracked or cleared), and
frame-coupled effects like burn expired in a few frames instead of seconds.

### 1.3 Rendering was fused to simulation
`Tower`, `Enemy`, and `Projectile` each carried a `draw(ctx, …)` method, and
the loop interleaved "move things" with "paint things". You could not simulate
without a canvas, change the look without touching game logic, or reason about
update order independently of paint order.

### 1.4 Balance constants were scattered
Tower ranges/damage/cooldowns, enemy stats, costs, interest, and bonuses were
hardcoded inside methods spread across the file. Tuning the game meant hunting
through logic.

### 1.5 No real lifecycle
"Restart" was `new Game()` from inside a click handler, which left the old
instance's event listeners and intervals attached. Successive restarts stacked
duplicate listeners and timers fighting over the same DOM nodes.

## 2. Target design

A small simulation/render/IO split with a single authoritative clock. No new
runtime dependencies — still vanilla ES modules bundled by webpack.

```
src/
  index.js              Bootstrap: build Game, start loop
  config.js             ALL balance + level data in one place
  core/
    Game.js             Orchestrator: owns state + systems + lifecycle
    GameLoop.js         Fixed-timestep rAF loop -> update(dt) / render()
  entities/
    Tower.js            State + behaviour only (no canvas)
    Enemy.js
    Projectile.js
  systems/
    WaveManager.js      Spawning + wave/level progression (time-based)
    Economy.js          Gold, interest, pricing, rewards
    EffectsManager.js   Floating text + sell-ring animations
    SpriteLoader.js     Async sprite loading
  render/
    Renderer.js         The ONLY module that touches the 2D context
  ui/
    Hud.js              DOM stat readouts
    TowerMenu.js        DOM upgrade/sell menu
    DevMode.js          Dev key handling
  input/
    InputManager.js     Canvas/button events -> Game actions
```

### Key decisions

- **One clock.** `GameLoop` runs a fixed-timestep accumulator (60 Hz sim
  steps). The speed multiplier scales how much simulation time elapses per real
  frame; pause/game-over simply stops stepping. Every timer (cooldowns,
  spawning, interest, countdown, upgrade animation) is now a value decremented
  by `dt`, so they all obey speed and pause and cannot leak.
- **Simulation vs rendering.** Entities and systems only mutate state.
  `Renderer` reads that state and draws it. Entities no longer import or know
  about the canvas.
- **Config-driven balance.** All tunable numbers live in `config.js`.
- **Single instance, real reset.** `Game` is constructed once, listeners bind
  once, and "restart" calls `game.reset()` rather than building a new instance.

### Behaviour preserved
Gameplay matches the (bug-fixed) original: same towers, enemies, levels,
upgrade/sell economics, dev mode, and visuals. The one intentional balance
change is the starting gold, which was left at a debug value of `5500` and is
now a sane `300` in `config.js`.
