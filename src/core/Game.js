import { ECONOMY } from '../config.js';
import { Tower } from '../entities/Tower.js';
import { Economy } from '../systems/Economy.js';
import { WaveManager } from '../systems/WaveManager.js';
import { EffectsManager } from '../systems/EffectsManager.js';
import { Renderer } from '../render/Renderer.js';
import { Hud } from '../ui/Hud.js';
import { TowerMenu } from '../ui/TowerMenu.js';
import { DevMode } from '../ui/DevMode.js';
import { InputManager } from '../input/InputManager.js';
import { GameLoop } from './GameLoop.js';

// Orchestrator. Owns game state and the subsystems, wires the single game loop,
// and exposes the actions input/UI need. It contains no canvas or DOM drawing
// (that lives in Renderer / the ui modules) and no balance numbers (config.js).
export class Game {
    constructor(canvas, ctx, sprites) {
        this.canvas = canvas;
        this.ctx = ctx;

        this.economy = new Economy();
        this.waves = new WaveManager(this);
        this.effects = new EffectsManager();
        this.renderer = new Renderer(ctx, sprites);
        this.hud = new Hud();
        this.towerMenu = new TowerMenu(this, canvas);
        this.devMode = new DevMode(this);

        this.towers = [];
        this.enemies = [];
        this.selectedTower = null;
        this.selectedTowerType = null;
        this.speedMultiplier = 1;
        this.gameOver = false;
        this.lives = ECONOMY.startingLives;

        // Bind input once for the lifetime of the page.
        this.input = new InputManager(this, canvas);

        this.reset();

        this.loop = new GameLoop(
            (dt) => this.update(dt),
            () => this.render(),
            () => (this.gameOver ? 0 : this.speedMultiplier),
        );
        this.loop.start();
    }

    reset() {
        this.towers = [];
        this.enemies = [];
        this.selectedTower = null;
        this.selectedTowerType = null;
        this.speedMultiplier = 1;
        this.gameOver = false;
        this.lives = ECONOMY.startingLives;

        this.economy.reset();
        this.effects.reset();
        this.waves.reset();
        this.towerMenu.hide();
        this._resetSpeedButton();
        this.hud.update(this);
    }

    // ---- simulation -------------------------------------------------------

    update(dt) {
        this.economy.update(dt);
        this.waves.update(dt);

        for (const tower of this.towers) tower.update(dt, this.enemies);

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(dt);

            if (enemy.health <= 0) {
                const reward = this.economy.killReward(this.waves.level, this.waves.wave);
                this.economy.add(reward);
                this.effects.addText(`+${reward}`, enemy.x, enemy.y, '#FFD700');
                this.enemies.splice(i, 1);
                this.waves.onEnemyResolved();
            } else if (enemy.reachedEnd) {
                this.enemies.splice(i, 1);
                this.loseLife();
                this.waves.onEnemyResolved();
            }
        }

        this.effects.update(dt);
        this.hud.update(this);
    }

    render() {
        const r = this.renderer;
        r.clear();
        r.drawPath(this.waves.path);
        for (const tower of this.towers) {
            const showRange = tower === this.selectedTower || tower.type === this.selectedTowerType;
            r.drawTower(tower, showRange);
        }
        for (const enemy of this.enemies) r.drawEnemy(enemy);
        r.drawEffects(this.effects);
        r.drawWaveInfo(this.waves, this.economy.killReward(this.waves.level, this.waves.wave));
        if (this.gameOver) r.drawGameOver(this.waves.level, this.economy.gold);
    }

    // ---- actions (called by input / ui) ----------------------------------

    selectTowerType(type) {
        if (this.economy.canAfford(this.economy.towerCost(type))) {
            this.selectedTowerType = type;
            this.selectedTower = null;
            this.towerMenu.hide();
        }
    }

    handleCanvasClick(x, y) {
        if (this.selectedTowerType) {
            if (this.canPlaceTower(x, y)) {
                this.placeTower(x, y, this.selectedTowerType);
                this.selectedTowerType = null;
            }
            return;
        }
        const clicked = this.towers.find(t => Math.hypot(x - t.x, y - t.y) < 20);
        if (clicked) {
            this.selectedTower = clicked;
            this.towerMenu.show(clicked);
        } else {
            this.deselectTower();
        }
    }

    deselectTower() {
        this.selectedTower = null;
        this.towerMenu.hide();
    }

    canPlaceTower(x, y) {
        const path = this.waves.path;
        for (let i = 0; i < path.length - 1; i++) {
            if (this._pointToSegment(x, y, path[i], path[i + 1]) < 30) return false;
        }
        for (const tower of this.towers) {
            if (Math.hypot(x - tower.x, y - tower.y) < 40) return false;
        }
        return true;
    }

    placeTower(x, y, type) {
        this.economy.spend(this.economy.towerCost(type));
        this.towers.push(new Tower(x, y, type));
        this.hud.update(this);
    }

    upgradeTower(tower) {
        const price = this.economy.upgradePrice(tower);
        if (!tower.canUpgrade() || !this.economy.canAfford(price)) return;
        this.economy.spend(price);
        tower.upgrade();
        this.hud.update(this);
    }

    sellTower(tower) {
        const idx = this.towers.indexOf(tower);
        if (idx === -1) return;
        const refund = this.economy.sellPrice(tower);
        this.economy.add(refund);
        tower.projectiles = [];
        this.towers.splice(idx, 1);
        if (this.selectedTower === tower) this.selectedTower = null;
        this.effects.addText(`+${refund}`, tower.x, tower.y, '#FFD700');
        this.effects.addSellRing(tower.x, tower.y, tower.size / 2, tower.size * 1.5);
        this.hud.update(this);
    }

    // Auto-sell every tower (level transition). Returns the total refund and
    // emits no per-tower floating text.
    sellAllTowers() {
        let total = 0;
        for (const tower of this.towers) {
            total += this.economy.sellPrice(tower);
            this.economy.add(this.economy.sellPrice(tower));
            this.effects.addSellRing(tower.x, tower.y, tower.size / 2, tower.size * 1.5);
        }
        this.towers = [];
        this.selectedTower = null;
        this.towerMenu.hide();
        this.hud.update(this);
        return total;
    }

    toggleSpeed() {
        this.speedMultiplier = this.speedMultiplier === 1 ? 2 : 1;
        return this.speedMultiplier;
    }

    loseLife() {
        this.lives--;
        if (this.lives <= 0) {
            this.lives = 0;
            this.gameOver = true;
            this.towerMenu.hide();
        }
        this.hud.update(this);
    }

    // Dev-mode helpers.
    clearActiveEntities() {
        this.towers = [];
        this.enemies = [];
        this.selectedTower = null;
        this.towerMenu.hide();
    }

    onLevelChanged() {
        this.deselectTower();
        this.hud.update(this);
    }

    // ---- helpers ----------------------------------------------------------

    _pointToSegment(px, py, a, b) {
        const C = b.x - a.x;
        const D = b.y - a.y;
        const lenSq = C * C + D * D;
        let t = lenSq !== 0 ? ((px - a.x) * C + (py - a.y) * D) / lenSq : -1;
        t = Math.max(0, Math.min(1, t));
        const xx = a.x + t * C;
        const yy = a.y + t * D;
        return Math.hypot(px - xx, py - yy);
    }

    _resetSpeedButton() {
        const ff = document.getElementById('fast-forward');
        if (!ff) return;
        ff.classList.remove('active');
        const txt = ff.querySelector('.speed-text');
        if (txt) txt.textContent = '1x';
    }
}
