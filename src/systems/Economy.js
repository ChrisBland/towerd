import { ECONOMY, TOWERS } from '../config.js';

// Owns gold and all pricing/reward math. Interest accrues on a dt-driven timer
// so it respects pause and the speed multiplier.
export class Economy {
    constructor() {
        this.reset();
    }

    reset() {
        this.gold = ECONOMY.startingGold;
        this.interestTimer = ECONOMY.interestIntervalMs;
    }

    canAfford(amount) {
        return this.gold >= amount;
    }

    add(amount) {
        this.gold += amount;
    }

    spend(amount) {
        this.gold -= amount;
    }

    towerCost(type) {
        return TOWERS[type].cost;
    }

    sellPrice(tower) {
        return Math.floor(TOWERS[tower.type].cost * tower.level * ECONOMY.sellRatio);
    }

    upgradePrice(tower) {
        return Math.floor(TOWERS[tower.type].cost * (tower.level + 1) * ECONOMY.upgradeCostFactor);
    }

    killReward(level, wave) {
        return level * wave;
    }

    levelBonus(level) {
        return ECONOMY.levelBonusBase + level * ECONOMY.levelBonusPerLevel;
    }

    // Advances the interest timer; returns the interest paid this step (0 if
    // none) so the caller can surface it in the HUD/effects.
    update(dt) {
        this.interestTimer -= dt;
        if (this.interestTimer <= 0) {
            this.interestTimer += ECONOMY.interestIntervalMs;
            const interest = Math.floor(this.gold * ECONOMY.interestRate);
            this.gold += interest;
            return interest;
        }
        return 0;
    }
}
