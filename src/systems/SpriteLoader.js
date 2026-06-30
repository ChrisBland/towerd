// Loads all image assets up front and invokes a callback once every sprite has
// resolved (success or error). Returns the sprite registry synchronously so
// callers can hold the reference while loading completes.
export function loadSprites(onReady) {
    const sprites = {
        towers: { fire: new Image(), water: new Image(), earth: new Image() },
        enemies: { slow: new Image(), fast: new Image(), strong: new Image() },
        badge: new Image(),
    };

    sprites.towers.fire.src = 'sprites/fire-tower.svg';
    sprites.towers.water.src = 'sprites/water-tower.svg';
    sprites.towers.earth.src = 'sprites/earth-tower.svg';
    sprites.enemies.slow.src = 'sprites/enemy-slow.svg';
    sprites.enemies.fast.src = 'sprites/enemy-fast.svg';
    sprites.enemies.strong.src = 'sprites/enemy-strong.svg';
    sprites.badge.src = 'sprites/tower-badge.svg';

    const all = [
        sprites.towers.fire, sprites.towers.water, sprites.towers.earth,
        sprites.enemies.slow, sprites.enemies.fast, sprites.enemies.strong,
        sprites.badge,
    ];

    let remaining = all.length;
    const done = () => {
        remaining--;
        if (remaining === 0) onReady(sprites);
    };

    all.forEach(img => {
        img.onload = done;
        img.onerror = () => {
            console.error('Failed to load sprite:', img.src);
            done();
        };
    });

    return sprites;
}
