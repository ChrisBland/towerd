# Towerd Documentation

Design and engineering reference for Towerd, an endless single-screen tower
defense game built in vanilla ES modules and bundled with webpack.

## Documents

| Doc | What it covers |
|---|---|
| [**ENGINE.md**](./ENGINE.md) | The runtime engine: design goals, layered architecture, the fixed-timestep time model, the update & render pipelines, module contracts, testing/perf strategy, and a phased engine roadmap. |
| [**GAME_DESIGN.md**](./GAME_DESIGN.md) | The game: vision & pillars, the core loop, every mechanic and its formula, the full tower/enemy/level catalog, a quantitative balance analysis, and the content roadmap. |
| [**../ARCHITECTURE.md**](../ARCHITECTURE.md) | The audit of the original single-file code and the rationale for the refactor that produced the current engine. |

## Reading order

1. **ARCHITECTURE.md** — why the codebase looks the way it does (the audit).
2. **ENGINE.md** — how the engine works today and where it's headed.
3. **GAME_DESIGN.md** — what the game *is*, with the numbers.

## Conventions

- Proposals not yet built are tagged **[Target]** (a concrete intended design)
  or **[Roadmap]** (a future phase). Everything untagged describes the code as
  it exists in `src/`.
- All balance numbers derive from [`../src/config.js`](../src/config.js). If you
  change config, regenerate the tables in GAME_DESIGN.md.

## Source map

See [ENGINE.md §15](./ENGINE.md#15-file-map) for the annotated `src/` layout.
