// Hidden developer mode: type "dev" to toggle, then use the keys below.
//   ArrowRight / ArrowLeft : next / previous level
//   g : +1000 gold
//   l : +1 life
export class DevMode {
    constructor(game) {
        this.game = game;
        this.active = false;
        this._keySequence = '';
        this._bind();
    }

    _bind() {
        document.addEventListener('keypress', (e) => {
            this._keySequence = (this._keySequence + e.key).slice(-3);
            if (this._keySequence === 'dev') this._toggle();
        });

        document.addEventListener('keydown', (e) => {
            if (!this.active) return;
            switch (e.key) {
                case 'ArrowRight':
                    this.game.clearActiveEntities();
                    this.game.waves.jumpToLevel(this.game.waves.level + 1);
                    break;
                case 'ArrowLeft':
                    if (this.game.waves.level > 1) {
                        this.game.clearActiveEntities();
                        this.game.waves.jumpToLevel(this.game.waves.level - 1);
                    }
                    break;
                case 'g':
                    this.game.economy.add(1000);
                    break;
                case 'l':
                    this.game.lives++;
                    break;
            }
        });
    }

    _toggle() {
        this.active = !this.active;
        this._showStatus();
    }

    _showStatus() {
        const status = document.createElement('div');
        Object.assign(status.style, {
            position: 'fixed', top: '10px', left: '50%', transform: 'translateX(-50%)',
            padding: '10px', color: 'white', borderRadius: '5px', zIndex: '1000', opacity: '0.9',
            backgroundColor: this.active ? '#4CAF50' : '#f44336',
        });
        status.textContent = `Developer Mode: ${this.active ? 'ON' : 'OFF'}`;
        document.body.appendChild(status);
        setTimeout(() => status.remove(), 2000);
    }
}
