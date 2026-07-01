import { CANVAS, TOWERS, ENEMIES } from '../config.js';

// The only module that draws to the 2D context. It reads game/entity state and
// paints it; it never mutates simulation state.
export class Renderer {
    constructor(ctx, sprites) {
        this.ctx = ctx;
        this.sprites = sprites;
    }

    clear() {
        this.ctx.clearRect(0, 0, CANVAS.width, CANVAS.height);
    }

    drawPath(path) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (const point of path.slice(1)) ctx.lineTo(point.x, point.y);
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 40;
        ctx.stroke();
    }

    drawTower(tower, showRange) {
        const ctx = this.ctx;
        const animating = tower.isAnimatingRange();

        if (showRange || animating) {
            let displayRange = tower.range;
            if (animating) {
                const eased = 1 - Math.pow(1 - tower.rangeAnimProgress(), 3);
                displayRange = tower.oldRange + (tower.range - tower.oldRange) * eased;
            }
            ctx.beginPath();
            ctx.arc(tower.x, tower.y, displayRange, 0, Math.PI * 2);
            if (animating) {
                ctx.strokeStyle = tower.config.rangeColor;
                ctx.lineWidth = 3;
                ctx.shadowColor = tower.config.glowColor;
                ctx.shadowBlur = 10;
            } else {
                ctx.strokeStyle = tower.config.rangeColor.replace('0.3', '0.15');
                ctx.lineWidth = 2;
                ctx.shadowBlur = 0;
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        const sprite = this.sprites.towers[tower.type];
        if (sprite) {
            ctx.save();
            const scale = 1 + (tower.level - 1) * 0.1;
            ctx.translate(tower.x, tower.y);
            ctx.scale(scale, scale);
            ctx.translate(-tower.x, -tower.y);
            ctx.drawImage(sprite, tower.x - tower.size / 2, tower.y - tower.size / 2, tower.size, tower.size);

            if (tower.level > 1) {
                ctx.globalAlpha = 0.3;
                ctx.beginPath();
                ctx.arc(tower.x, tower.y, tower.size / 2 + (tower.level - 1) * 3, 0, Math.PI * 2);
                ctx.fillStyle = tower.config.fillGlow;
                ctx.fill();
                ctx.globalAlpha = 1;
            }
            ctx.restore();

            if (tower.level > 1) this._drawLevelBadge(tower);
            if (tower.level === tower.maxLevel) this._drawMaxIndicator(tower);
        }

        for (const p of tower.projectiles) this.drawProjectile(p);
    }

    _drawLevelBadge(tower) {
        const ctx = this.ctx;
        const badgeSize = 20;
        const bx = tower.x + tower.size / 3;
        const by = tower.y - tower.size / 3;
        ctx.drawImage(this.sprites.badge, bx, by, badgeSize, badgeSize);
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 2;
        ctx.strokeText(tower.level, bx + badgeSize / 2, by + badgeSize / 2);
        ctx.fillText(tower.level, bx + badgeSize / 2, by + badgeSize / 2);
    }

    _drawMaxIndicator(tower) {
        const ctx = this.ctx;
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        const text = '★ MAX';
        ctx.strokeText(text, tower.x, tower.y + tower.size / 2 + 20);
        ctx.fillText(text, tower.x, tower.y + tower.size / 2 + 20);
    }

    drawProjectile(p) {
        const ctx = this.ctx;
        const cfg = TOWERS[p.type];
        for (let i = 0; i < p.trail.length; i++) {
            const point = p.trail[i];
            const alpha = 1 - i / p.trail.length;
            ctx.beginPath();
            ctx.arc(point.x, point.y, p.radius * (1 - i / p.trail.length), 0, Math.PI * 2);
            if (p.type === 'fire') ctx.fillStyle = `rgba(255, ${100 - i * 10}, 0, ${alpha})`;
            else if (p.type === 'water') ctx.fillStyle = `rgba(0, 150, 255, ${alpha})`;
            else ctx.fillStyle = `rgba(101, 67, 33, ${alpha})`;
            ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = cfg.projectileColor;
        ctx.fill();

        if (p.type === 'fire') {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * 2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 100, 0, 0.2)';
            ctx.fill();
        } else if (p.type === 'water') {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y - p.radius);
            ctx.lineTo(p.x - p.radius / 2, p.y);
            ctx.lineTo(p.x + p.radius / 2, p.y);
            ctx.closePath();
            ctx.fillStyle = '#00aaff';
            ctx.fill();
        }
    }

    drawEnemy(enemy) {
        const ctx = this.ctx;
        const sprite = this.sprites.enemies[enemy.type];
        if (sprite) {
            ctx.drawImage(sprite, enemy.x - enemy.size / 2, enemy.y - enemy.size / 2, enemy.size, enemy.size);
        } else {
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, 15, 0, Math.PI * 2);
            ctx.fillStyle = ENEMIES[enemy.type].fallbackColor;
            ctx.fill();
        }

        const w = 40;
        const h = 4;
        const pct = Math.max(0, enemy.health / enemy.maxHealth);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(enemy.x - w / 2, enemy.y - enemy.size / 2 - 8, w, h);
        ctx.fillStyle = `hsl(${pct * 120}, 100%, 50%)`;
        ctx.fillRect(enemy.x - w / 2, enemy.y - enemy.size / 2 - 8, w * pct, h);

        if (enemy.burnDuration > 0) {
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.size / 2 + 5, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 100, 0, 0.5)';
            ctx.stroke();
        }
        if (enemy.slowDuration > 0) {
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.size / 2 + 3, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 150, 255, 0.5)';
            ctx.stroke();
        }
    }

    drawEffects(effects) {
        const ctx = this.ctx;
        for (const t of effects.texts) {
            ctx.globalAlpha = t.alpha;
            ctx.font = '16px Arial';
            ctx.fillStyle = t.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText(t.text, t.x, t.y);
        }
        ctx.globalAlpha = 1;

        for (const r of effects.sellRings) {
            ctx.beginPath();
            ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 215, 0, ${r.alpha})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    drawWaveInfo(waves, goldPerKill) {
        const ctx = this.ctx;
        ctx.font = '20px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(`Enemies: ${waves.enemiesDefeatedInWave}/${waves.enemiesPerWave}`, 10, 580);
        ctx.fillText(`Gold per kill: ${goldPerKill}`, 200, 580);

        if (waves.nextWaveCountdownSec > 0) {
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`Next Wave in: ${waves.nextWaveCountdownSec}`, CANVAS.width / 2, CANVAS.height / 2);
        }
    }

    drawGameOver(level, gold) {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.font = '48px Arial';
        ctx.fillText('GAME OVER', CANVAS.width / 2, CANVAS.height / 2 - 50);
        ctx.font = '24px Arial';
        ctx.fillText(`Level reached: ${level}`, CANVAS.width / 2, CANVAS.height / 2 + 10);
        ctx.fillText(`Final gold: ${gold}`, CANVAS.width / 2, CANVAS.height / 2 + 50);
        ctx.font = '18px Arial';
        ctx.fillText('Click anywhere to restart', CANVAS.width / 2, CANVAS.height / 2 + 100);
    }
}
