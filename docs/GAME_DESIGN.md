# Towerd Game Design

The complete design of the game: vision, the moment-to-moment loop, every
mechanic and its formula, the full content catalog, a quantitative balance
analysis with the actual numbers, and a prioritized list of design issues and
content roadmap.

All numbers are sourced from [`../src/config.js`](../src/config.js); when the
config changes, this document's tables should be regenerated. Engine mechanics
referenced here are specified in [`ENGINE.md`](./ENGINE.md).

---

## 1. Vision & pillars

Towerd is a single-screen, endless tower-defense game about **spending a growing
bank wisely under spatial pressure**. The fantasy is the classic one — build
towers, melt waves — but the economy is the real game.

**Design pillars**

1. **Money is the protagonist.** Compound interest, kill bounties, and level
   bonuses mean the interesting decisions are economic: save vs. spend, few big
   towers vs. many small ones, when to upgrade.
2. **Every level is a fresh board, same wallet.** Towers are auto-sold and
   refunded at the end of each level (§6.4). You carry *money*, not *placements*,
   so each level is a new puzzle solved with a bigger budget.
3. **Readable depth.** Three elemental towers and three enemy archetypes, each
   with a distinct role, kept legible by strong visual feedback (range rings,
   health bars, status auras, floating numbers).
4. **Endless escalation.** Ten hand-authored paths cycle forever; the challenge
   is sustaining an economy and rebuilding efficiently, not reaching an ending.

---

## 2. Player core loop

```
        ┌────────────────────────────────────────────────┐
        │                                                  │
        ▼                                                  │
   Place / upgrade towers  ──►  Defend the wave  ──►  Earn gold (kills + interest)
        ▲                                                  │
        │                                                  ▼
        └────────  New wave / new level (rebuild) ◄──  Survive 10 waves → level clear
```

Second-to-second: pick a tower, find a spot off the path, watch range, commit.
Minute-to-minute: ride interest, decide when to stop hoarding and upgrade.
Per level: clear 10 waves, bank the bonus + refunds, rebuild on the next path.

---

## 3. Game states & flow

| State | Enters when | Player can | Sim |
|---|---|---|---|
| **Playing** | boot / restart | place, select, upgrade, sell, fast-forward, dev keys | running |
| **Wave countdown** | a wave is cleared (5 s) | everything above; next wave imminent | running |
| **Level transition** | wave 10 cleared | watch celebration; towers auto-sold | running |
| **Game over** | lives reach 0 | click to restart | paused (speed 0) |

There is intentionally **no victory state** — levels cycle (`level n` uses path
`(n-1) mod 10`), so the game is endless. (An explicit state machine and optional
victory/boss endgame are [Roadmap] — see ENGINE §10.1 and §15 here.)

---

## 4. Towers

Three elemental towers. Their **DPS curves are nearly identical by design** — a
tower is chosen for its *range* and *status effect*, not its raw damage.

### 4.1 Base stats (level 1)

| Tower | Cost | Range | Dmg | Cooldown | DPS | Role |
|---|---:|---:|---:|---:|---:|---|
| 🔥 Fire | 100 | 100 | 20 | 1.00 s | 20.0 | Cheap sustained DPS + burn DoT |
| 💧 Water | 150 | 120 | 15 | 0.80 s | 18.75 | Crowd control via slow |
| 🌍 Earth | 125 | 150 | 40 | 2.00 s | 20.0 | Long reach, big single hits |

### 4.2 Scaling formulas (shared)

For tower level `L` (1–5):

```
range(L)    = baseRange * (1 + (L-1) * 0.20)         // +20% per level
damage(L)   = floor(baseDamage * 1.5^(L-1))          // ×1.5 per level
cooldown(L) = baseCooldown * (1 - (L-1) * 0.20)      // −20% per level
```

DPS therefore scales by `1.5^(L-1) / (1 - (L-1)*0.2)` — a steep, **back-loaded
×25.3 from L1 to L5**:

| L | dmg ×1.5^ | cd factor | DPS multiplier |
|---|---:|---:|---:|
| 1 | 1.000 | 1.00 | 1.00× |
| 2 | 1.500 | 0.80 | 1.88× |
| 3 | 2.250 | 0.60 | 3.75× |
| 4 | 3.375 | 0.40 | 8.44× |
| 5 | 5.0625 | 0.20 | 25.31× |

Concrete DPS (hit damage only; burn/slow on top):

| Tower | L1 | L2 | L3 | L4 | L5 |
|---|---:|---:|---:|---:|---:|
| Fire | 20.0 | 37.5 | 75.0 | 167.5 | 505.0 |
| Water | 18.8 | 34.4 | 68.8 | 156.3 | 468.8 |
| Earth | 20.0 | 37.5 | 75.0 | 168.8 | 505.0 |

Range by level:

| Tower | L1 | L2 | L3 | L4 | L5 |
|---|---:|---:|---:|---:|---:|
| Fire | 100 | 120 | 140 | 160 | 180 |
| Water | 120 | 144 | 168 | 192 | 216 |
| Earth | 150 | 180 | 210 | 240 | 270 |

### 4.3 Upgrade cost & cost-to-max

```
upgradePrice(L→L+1) = floor(cost * (L+1) * 1.5)
```

| Tower | L1→2 | L2→3 | L3→4 | L4→5 | Build+max total |
|---|---:|---:|---:|---:|---:|
| Fire (100) | 300 | 450 | 600 | 750 | 2,200 |
| Earth (125) | 375 | 562 | 750 | 937 | 2,749 |
| Water (150) | 450 | 675 | 900 | 1,125 | 3,300 |

So **+25× DPS costs ~22× the base price**, with the largest single jump (L4→5)
both the most expensive and the most powerful — a deliberate "go tall" payoff.

### 4.4 Status effects

**Burn (Fire).** On hit, applies a damage-over-time refreshed to 3 s. DPS by
tower level: `[10, 14, 18, 22, 26]`. Burn damage is `dps * dt/1000` per tick, so
it is frame-rate independent and stacks additively onto hit damage. Re-hitting
refreshes the 3 s window.

**Slow (Water).** On hit, reduces enemy speed by a fraction for a duration:

| Tower L | Slow | Duration |
|---|---:|---:|
| 1 | 50% | 1.0 s |
| 2 | 60% | 1.5 s |
| 3 | 70% | 2.0 s |
| 4 | 80% | 2.5 s |
| 5 | 90% | 3.0 s |

Stacking rule: **strongest slow wins** (`max`), duration also takes the `max`.
Slow deals no damage itself — water's damage is its hit only. (The original code
applied water damage twice; that double-hit was removed in the refactor.)

### 4.5 Targeting

A tower fires when its cooldown reaches zero and a target is in range. Target
selection is **"first enemy in spawn order still within range"** (`enemies` is
ordered oldest-first), which approximates "furthest along the path." This is
cheap and predictable. A pluggable target-priority (first/last/strongest/closest)
is a natural [Roadmap] upgrade.

---

## 5. Enemies

| Enemy | Speed (px/s) | Base HP | Role |
|---|---:|---:|---|
| 🟣 Slow | 60 | 80 | Tanky midline; soaks DPS |
| 🔴 Fast | 180 | 30 | Rushes the exit; punishes thin coverage |
| 🟢 Strong | 90 | 150 | Heavy bruiser; demands focus or slow |

Each wave spawns **10 enemies, one per second, of uniformly random type**.

### 5.1 Health scaling

```
health = baseHealth * (1 + (wave-1) * 0.10)     // +10% per wave, within a level
```

| Enemy | W1 | W5 | W10 |
|---|---:|---:|---:|
| Fast | 30 | 42 | 57 |
| Slow | 80 | 112 | 152 |
| Strong | 150 | 210 | 285 |

> **Important:** enemy stats scale with **wave only**, and reset to W1 at the
> start of every level. They do **not** scale with level. See the balance
> analysis (§9) — this is the single biggest tuning gap.

---

## 6. Economy

The economy is the design's center of gravity.

### 6.1 Sources & sinks

| Gold **in** | Formula |
|---|---|
| Kill bounty | `level * wave` per enemy killed |
| Compound interest | `floor(gold * 0.07)` every 6 s |
| Level-clear bonus | `200 + level * 100` |
| Tower auto-sell (level end) | `floor(cost * towerLevel * 0.6)` per tower |

| Gold **out** | Formula |
|---|---|
| Place tower | base `cost` (100 / 150 / 125) |
| Upgrade tower | `floor(cost * (L+1) * 1.5)` |

Manual sell (mid-level) refunds `floor(cost * L * 0.6)`.

### 6.2 Per-level gold from kills

Killing every enemy of a level yields
`Σ_{w=1..10} 10 * (level * w) = 550 * level` gold:

| Level | 1 | 2 | 3 | 5 | 10 |
|---|---:|---:|---:|---:|---:|
| Kill gold | 550 | 1,100 | 1,650 | 2,750 | 5,500 |

### 6.3 Interest is the dominant force

At 7% per 6 s, idle gold compounds by `1.07^10 ≈ 1.967×` **per minute** — it
nearly doubles every 60 s with no action. Starting from 300:

| Minutes idle | Gold (from 300) |
|---|---:|
| 1 | 585 |
| 2 | 1,142 |
| 3 | 2,237 |
| 5 | 8,639 |

This dwarfs kill bounties at low levels and makes **hoarding strictly strong**.
It is flagged as the top balance risk in §9.

### 6.4 The auto-sell pillar

At the end of each level, **all towers are sold and refunded** (60% of invested
cost), then the level bonus is paid, then the next path loads. The player keeps
**money, not placements**. This is a deliberate pillar:

- Each level is a fresh spatial puzzle on a new path.
- Investment is never "lost" — 60% comes back, plus bonus — so going tall is not
  punished across levels, only taxed.
- It creates a satisfying "cash out and rebuild bigger" rhythm.

Trade-off: it also means tower placement skill doesn't compound across levels,
and combined with non-scaling enemies (§5.1) it can make later levels *easier*
than early ones. See §9.

---

## 7. Waves & levels

- **Wave:** 10 enemies, 1/s, random types. Cleared when all 10 are resolved
  (killed or leaked). 5 s countdown to the next wave.
- **Level:** 10 waves. After wave 10: celebration → auto-sell → bonus → next
  path. Levels cycle `(level-1) mod 10`.
- **Lives:** start at 10; −1 per enemy that reaches the end; 0 = game over.

### 7.1 Level catalog

| # | Name | Theme / shape | Intended difficulty |
|---|---|---|---|
| 1 | The Beginning | Simple S-shape | Beginner |
| 2 | Zigzag Valley | Horizontal zigzag | Easy |
| 3 | Spiral Path | Inward spiral | Medium |
| 4 | Crossroads | Double cross | Hard |
| 5 | Figure Eight | Crossing loops | Challenging |
| 6 | The Maze | Tight switchbacks | Very hard |
| 7 | Diamond Rush | Diamond weave | Expert |
| 8 | Split Decision | Dual-path split | Master |
| 9 | Spiral Madness | Spiral maze | Nightmare |
| 10 | The Gauntlet | Long serpentine | Ultimate |

Difficulty here is **purely geometric** (path length, how much buildable area
sits within tower range of the road). Because enemy stats don't scale by level,
the named difficulty is aspirational rather than mechanical — see §9.

### 7.2 Pacing

≈10 s of spawns + travel + a 5 s countdown ⇒ **~15 s/wave**, **~2.5 min/level**
minimum at 1×, halved at 2× fast-forward. A full 10-level cycle is ~25 min of
active play.

---

## 8. Controls & UX

| Input | Effect |
|---|---|
| Click a tower button | Arm that tower type (if affordable) |
| Click empty buildable tile | Place the armed tower |
| Click a placed tower | Open its upgrade/sell menu + show range |
| Click elsewhere | Deselect / close menu |
| ⏩ button | Toggle 1× / 2× game speed |
| Click after game over | Restart |
| Type `dev` | Toggle developer mode |
| Dev: ←/→ | Previous / next level |
| Dev: `g` / `l` | +1000 gold / +1 life |

**HUD:** lives, `L{level}-W{wave}`, gold (top bar); per-frame "enemies x/10",
"gold per kill", and a "Next Wave in: n" banner on the canvas.

**Build rules:** towers can't be placed within 30 px of the path or within
40 px of another tower.

---

## 9. Balance analysis & issues

A quantitative read of the current numbers, most-impactful first.

### 9.1 Enemies don't scale across levels — difficulty inverts
Enemy HP scales only with **wave** (+10%/wave, reset each level), never with
level. Meanwhile the player's **budget** grows every level (kill gold `550×level`,
bonus `200+100×level`, refunds, and interest). Net effect: a level-5 board faces
the *same* enemy stats as level 1 but with a far larger wallet, so later levels
trend **easier**, contradicting the "Nightmare/Ultimate" labels.
**Recommend:** add a level scalar to enemy HP/speed and/or wave size, e.g.
`health *= 1 + (level-1)*0.15`, and grow `enemiesPerWave` with level.

### 9.2 Interest is overpowered and rewards passivity
`1.07^10 ≈ 1.97×` per minute makes hoarding the dominant strategy and trivializes
the economy after a few minutes. **Recommend:** drop to ~2–3% per 8–10 s, and/or
cap interest per tick, and/or only accrue between waves — so saving is a choice,
not a free exponential.

### 9.3 The L4→L5 power spike is extreme
The combined `1.5^(L-1)/(1-(L-1)*0.2)` curve yields **×25 DPS** at L5 (×3 just
from L4→L5). One maxed tower can erase a wave. This is a fun "win button" but
flattens build diversity. **Recommend:** soften the cooldown term (e.g.
−15%/level, floored) or the damage growth (×1.4) so max towers are strong, not
absolute.

### 9.4 Towers are under-differentiated on damage
All three share an identical DPS curve; only range and effect differ. Water even
trails slightly on raw DPS. That's defensible (role-based identity), but Earth
(longest range *and* tied for top DPS *and* cheaper than Water) is arguably the
strict best generalist. **Recommend:** lean into roles — e.g. Earth slower but
heavier single hits (anti-Strong), Fire lower hit but stronger burn (anti-swarm),
Water lowest damage but team-multiplier slow.

### 9.5 Static wave size & composition
Every wave is exactly 10 enemies of uniformly random type, at every level. No
escalation in count, no telegraphed compositions, no boss. **Recommend:**
scale count with level and introduce authored compositions (rush waves, tank
waves) and a per-level boss.

### 9.6 No fail-state pressure curve / no victory
10 flat lives and infinite cycling means runs end by attrition or boredom rather
than a designed climax. **Recommend:** a score/highscore, an endless ramp after
level 10, or a boss-gated victory.

---

## 10. Tuning levers → config map

Every lever maps to a field in `src/config.js`:

| Lever | Field |
|---|---|
| Starting economy | `ECONOMY.startingGold`, `startingLives` |
| Interest strength | `ECONOMY.interestRate`, `interestIntervalMs` |
| Sell / upgrade pricing | `ECONOMY.sellRatio`, `upgradeCostFactor` |
| Level reward | `ECONOMY.levelBonusBase`, `levelBonusPerLevel` |
| Wave size & cadence | `WAVES.enemiesPerWave`, `spawnIntervalMs`, `waveCountdownSec` |
| Enemy ramp | `WAVES.healthScalingPerWave` *(+ a proposed level scalar)* |
| Tower power curve | `TOWER_SCALING.*`, `TOWER_MAX_LEVEL` |
| Per-tower identity | `TOWERS.<type>.*` (cost/range/damage/cooldown/effects) |
| Enemy identity | `ENEMIES.<type>.*` |
| Levels | `LEVELS.layouts`, `LEVELS.names` |

---

## 11. Content & feature roadmap

Ordered by player-value:

1. **Difficulty fix** (§9.1–9.2): level-scaled enemies + rebalanced interest.
   The single highest-impact change.
2. **Target priority selector** per tower (first/last/strong/close).
3. **New towers** with genuinely distinct mechanics: ⚡ Lightning (chain),
   ❄️ Ice (AoE slow field), 💨 Air (anti-fast, knockback).
4. **Bosses & authored waves**: scripted compositions, a level-10 boss.
5. **Score & persistence**: highscore, then save/load (cheap — all state is
   plain data; see ENGINE §13 Phase 4).
6. **Endless mode** past level 10 with a continuous difficulty ramp.
7. **Meta-progression**: between-run unlocks/upgrades.
8. **Audio & juice**: SFX, hit feedback, screen shake on leaks.

---

## 12. Open design questions

- Should towers **persist across levels** (placement skill compounds) instead of
  auto-selling? This trades the "fresh puzzle" pillar for long-term board-building
  and changes the entire economy. Currently auto-sell is the chosen pillar (§6.4);
  worth prototyping the alternative.
- Is **interest** the right primary economy, or should kills/bonuses lead with
  interest as a minor smoothing mechanic?
- How much **build space** should each path deny? Tuning the 30 px path / 40 px
  tower spacing per level is an untapped difficulty lever.
- Should **lives** scale or be earnable, to support an endless ramp?
