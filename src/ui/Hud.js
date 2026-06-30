// Mirrors game state into the DOM HUD elements. The level/wave readout emits
// only the numeric portion because index.html already renders a literal "L".
export class Hud {
    constructor() {
        this.goldEl = document.getElementById('gold');
        this.roundEl = document.getElementById('round');
        this.livesEl = document.getElementById('lives');
    }

    update(game) {
        this.goldEl.textContent = game.economy.gold;
        this.livesEl.textContent = game.lives;
        const dev = game.devMode.active ? ' [DEV]' : '';
        this.roundEl.textContent = `${game.waves.level}-W${game.waves.wave}${dev}`;
    }
}
