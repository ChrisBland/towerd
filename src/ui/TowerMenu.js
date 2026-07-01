// The floating upgrade/sell menu shown when a placed tower is selected. Builds
// a DOM node positioned next to the tower and wires its buttons back to Game.
export class TowerMenu {
    constructor(game, canvas) {
        this.game = game;
        this.canvas = canvas;
    }

    show(tower) {
        if (!this.game.towers.includes(tower)) {
            this.hide();
            return;
        }
        this.hide();

        const menu = document.createElement('div');
        menu.className = 'tower-menu';
        menu.style.position = 'absolute';
        menu.style.left = `${tower.x + this.canvas.offsetLeft}px`;
        menu.style.top = `${tower.y + this.canvas.offsetTop - 100}px`;

        const sellPrice = this.game.economy.sellPrice(tower);
        const upgradePrice = this.game.economy.upgradePrice(tower);
        const canUpgrade = tower.canUpgrade();
        const upgradeDisabled = !canUpgrade || !this.game.economy.canAfford(upgradePrice);
        const upgradeText = canUpgrade ? `Upgrade ($${upgradePrice})` : 'MAX LEVEL';

        menu.innerHTML = `
            <div class="tower-stats">
                <div>Level: ${tower.level}${tower.level === tower.maxLevel ? ' (MAX)' : ''}</div>
                <div>Damage: ${tower.damage}</div>
                <div>Range: ${Math.round(tower.range)}</div>
            </div>
            <button class="upgrade-btn" ${upgradeDisabled ? 'disabled' : ''}>${upgradeText}</button>
            <button class="sell-btn">Sell ($${sellPrice})</button>
        `;

        menu.querySelector('.upgrade-btn').addEventListener('click', () => {
            if (upgradeDisabled) return;
            this.game.upgradeTower(tower);
            this.show(tower); // refresh with new values
        });

        menu.querySelector('.sell-btn').addEventListener('click', () => {
            this.game.sellTower(tower);
            this.hide();
        });

        document.body.appendChild(menu);
    }

    hide() {
        const existing = document.querySelector('.tower-menu');
        if (existing) existing.remove();
    }
}
