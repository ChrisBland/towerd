// Translates DOM events into Game actions. Bound exactly once for the lifetime
// of the page, so restarts (which call game.reset()) never stack listeners.
export class InputManager {
    constructor(game, canvas) {
        this.game = game;
        this.canvas = canvas;
        this._bind();
    }

    _bind() {
        document.querySelectorAll('.tower-btn').forEach(btn => {
            btn.addEventListener('click', () => this.game.selectTowerType(btn.dataset.type));
        });

        this.canvas.addEventListener('click', (e) => {
            if (this.game.gameOver) {
                this.game.reset();
                return;
            }
            const rect = this.canvas.getBoundingClientRect();
            this.game.handleCanvasClick(e.clientX - rect.left, e.clientY - rect.top);
        });

        // Clicking outside the canvas/menu clears any tower selection.
        document.addEventListener('click', (e) => {
            if (e.target !== this.canvas && !e.target.closest('.tower-menu')) {
                this.game.deselectTower();
            }
        });

        const ff = document.getElementById('fast-forward');
        ff.addEventListener('click', () => {
            const speed = this.game.toggleSpeed();
            ff.classList.toggle('active', speed !== 1);
            ff.querySelector('.speed-text').textContent = `${speed}x`;
        });
    }
}
