class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        this.gold = 5500;
        this.lives = 10;
        this.level = 1;
        this.wave = 1;
        this.towers = [];
        this.enemies = [];
        this.floatingTexts = [];
        this.selectedTowerType = null;
        this.selectedTower = null;
        this.path = this.generateLevel();
        
        this.waveInProgress = false;
        this.enemiesSpawned = 0;
        this.enemiesPerWave = 10;
        this.enemiesDefeatedInWave = 0;
        this.spawnInterval = null;
        this.gameOver = false;
        this.nextWaveCountdown = 0;
        
        this.speedMultiplier = 1;
        this.lastFrameTime = 0;
        
        this.sellingAnimations = [];
        
        this.towerCosts = {
            fire: 100,
            water: 150,
            earth: 125
        };

        // Add sprites
        this.sprites = {
            towers: {
                fire: new Image(),
                water: new Image(),
                earth: new Image()
            },
            enemies: {
                slow: new Image(),
                fast: new Image(),
                strong: new Image()
            }
        };

        // Set sprite sources
        this.sprites.towers.fire.src = 'sprites/fire-tower.svg';
        this.sprites.towers.water.src = 'sprites/water-tower.svg';
        this.sprites.towers.earth.src = 'sprites/earth-tower.svg';
        this.sprites.enemies.slow.src = 'sprites/enemy-slow.svg';
        this.sprites.enemies.fast.src = 'sprites/enemy-fast.svg';
        this.sprites.enemies.strong.src = 'sprites/enemy-strong.svg';

        this.spritesLoaded = 0;
        this.totalSprites = 6;

        this.devMode = false;
        this.setupDevMode();
        this.setupEventListeners();
        this.loadSprites();

        // Initialize HUD
        this.updateHUD();
        
        // Start game loop
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    loadSprites() {
        const loadSprite = (sprite, onComplete) => {
            sprite.onload = onComplete;
            sprite.onerror = () => {
                console.error('Failed to load sprite:', sprite.src);
                onComplete();
            };
        };

        let loadedCount = 0;
        const onSpriteLoad = () => {
            loadedCount++;
            if (loadedCount === this.totalSprites) {
                this.startGame();
            }
        };

        // Load all sprites
        Object.values(this.sprites.towers).forEach(sprite => loadSprite(sprite, onSpriteLoad));
        Object.values(this.sprites.enemies).forEach(sprite => loadSprite(sprite, onSpriteLoad));
    }

    startGame() {
        this.startInterestTimer();
        this.startWave();
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    generateLevel() {
        const layouts = [
            // Level 1: Simple S-shape (Beginner)
            [
                {x: 0, y: 100},
                {x: 600, y: 100},
                {x: 600, y: 400},
                {x: 200, y: 400},
                {x: 200, y: 250},
                {x: 800, y: 250}
            ],
            // Level 2: Zigzag (Easy)
            [
                {x: 0, y: 50},
                {x: 700, y: 50},
                {x: 700, y: 200},
                {x: 100, y: 200},
                {x: 100, y: 350},
                {x: 700, y: 350},
                {x: 700, y: 500},
                {x: 100, y: 500},
                {x: 800, y: 500}
            ],
            // Level 3: Spiral (Medium)
            [
                {x: 0, y: 50},
                {x: 750, y: 50},
                {x: 750, y: 550},
                {x: 50, y: 550},
                {x: 50, y: 150},
                {x: 650, y: 150},
                {x: 650, y: 450},
                {x: 150, y: 450},
                {x: 150, y: 250},
                {x: 800, y: 250}
            ],
            // Level 4: Double Cross (Hard)
            [
                {x: 0, y: 300},
                {x: 200, y: 300},
                {x: 200, y: 100},
                {x: 400, y: 100},
                {x: 400, y: 500},
                {x: 600, y: 500},
                {x: 600, y: 100},
                {x: 800, y: 100}
            ],
            // Level 5: Figure 8 (Challenging)
            [
                {x: 0, y: 300},
                {x: 200, y: 300},
                {x: 400, y: 100},
                {x: 600, y: 300},
                {x: 400, y: 500},
                {x: 200, y: 300},
                {x: 400, y: 100},
                {x: 800, y: 100}
            ],
            // Level 6: Maze (Very Hard)
            [
                {x: 0, y: 50},
                {x: 750, y: 50},
                {x: 750, y: 150},
                {x: 50, y: 150},
                {x: 50, y: 250},
                {x: 750, y: 250},
                {x: 750, y: 350},
                {x: 50, y: 350},
                {x: 50, y: 450},
                {x: 750, y: 450},
                {x: 750, y: 550},
                {x: 800, y: 550}
            ],
            // Level 7: Diamond Pattern (Expert)
            [
                {x: 0, y: 300},
                {x: 200, y: 100},
                {x: 400, y: 300},
                {x: 200, y: 500},
                {x: 400, y: 300},
                {x: 600, y: 100},
                {x: 800, y: 300}
            ],
            // Level 8: Dual Path Split (Master)
            [
                {x: 0, y: 300},
                {x: 200, y: 300},
                // Path splits here
                {x: 400, y: 100}, // Upper path
                {x: 600, y: 100},
                {x: 800, y: 300},
                // Lower path connects
                {x: 400, y: 500}, // Lower path
                {x: 600, y: 500},
                {x: 800, y: 300}
            ],
            // Level 9: Spiral Maze (Nightmare)
            [
                {x: 0, y: 300},
                {x: 700, y: 300},
                {x: 700, y: 100},
                {x: 100, y: 100},
                {x: 100, y: 500},
                {x: 600, y: 500},
                {x: 600, y: 200},
                {x: 200, y: 200},
                {x: 200, y: 400},
                {x: 500, y: 400},
                {x: 500, y: 300},
                {x: 800, y: 300}
            ],
            // Level 10: The Gauntlet (Ultimate)
            [
                {x: 0, y: 550},
                {x: 100, y: 550},
                {x: 100, y: 50},
                {x: 300, y: 50},
                {x: 300, y: 550},
                {x: 500, y: 550},
                {x: 500, y: 50},
                {x: 700, y: 50},
                {x: 700, y: 550},
                {x: 800, y: 550}
            ]
        ];

        // Add difficulty scaling
        const levelIndex = ((this.level - 1) % layouts.length);
        
        // Show level name when starting new level
        const levelNames = [
            "The Beginning",
            "Zigzag Valley",
            "Spiral Path",
            "Crossroads",
            "Figure Eight",
            "The Maze",
            "Diamond Rush",
            "Split Decision",
            "Spiral Madness",
            "The Gauntlet"
        ];

        if (levelIndex === 0 || this.devMode) {
            this.showFloatingText(
                levelNames[levelIndex],
                this.canvas.width/2,
                this.canvas.height/2 - 50,
                '#FFD700',
                2000
            );
        }

        return layouts[levelIndex];
    }

    startNewLevel(isDevMode = false) {
        if (!isDevMode) {
            // Normal level transition with animations
            this.showFloatingText(
                `Level ${this.level} Complete!`,
                this.canvas.width/2,
                this.canvas.height/2 - 100,
                'white',
                3000
            );

            // Sell all towers and calculate total value
            let totalSellValue = 0;
            this.towers.forEach(tower => {
                const sellPrice = Math.floor(this.towerCosts[tower.type] * tower.level * 0.6);
                totalSellValue += sellPrice;
                this.sellTower(tower, true);
            });

            // Show total gold earned from selling after a short delay
            if (totalSellValue > 0) {
                setTimeout(() => {
                    this.showFloatingText(
                        `Towers Sold: +${totalSellValue}`,
                        this.canvas.width/2,
                        this.canvas.height/2 - 50,
                        '#FFD700',
                        3000
                    );
                }, 500);
            }

            // Add level completion bonus after showing tower sale value
            setTimeout(() => {
                const levelBonus = 200 + (this.level * 100);
                this.gold += levelBonus;
                this.showFloatingText(
                    `Level Bonus: +${levelBonus}`,
                    this.canvas.width/2,
                    this.canvas.height/2,
                    '#FFD700',
                    3000
                );
            }, 1500);
        } else {
            // Immediate level transition for dev mode
            this.path = this.generateLevel();
            this.waveInProgress = false;
            this.nextWaveCountdown = 3;
            
            // Show dev mode level change message
            this.showFloatingText(
                `DEV: Level ${this.level}`,
                this.canvas.width/2,
                this.canvas.height/2,
                '#4CAF50',
                1500
            );
            
            this.startWaveCountdown();
        }

        // Update HUD to show current level
        this.updateHUD();
    }

    startInterestTimer() {
        setInterval(() => {
            const interest = Math.floor(this.gold * 0.07);
            this.gold += interest;
            this.updateHUD();
        }, 6000);
    }

    setupEventListeners() {
        document.querySelectorAll('.tower-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                if (this.gold >= this.towerCosts[type]) {
                    this.selectedTowerType = type;
                    this.selectedTower = null;
                }
            });
        });

        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (this.selectedTowerType) {
                if (this.canPlaceTower(x, y)) {
                    this.placeTower(x, y, this.selectedTowerType);
                    this.gold -= this.towerCosts[this.selectedTowerType];
                    this.updateHUD();
                    this.selectedTowerType = null;
                }
            } else {
                // Select tower for viewing range or selling/upgrading
                const clickedTower = this.towers.find(tower => {
                    const dx = x - tower.x;
                    const dy = y - tower.y;
                    return Math.sqrt(dx * dx + dy * dy) < 20;
                });

                if (clickedTower) {
                    this.selectedTower = clickedTower;
                    this.showTowerMenu(clickedTower);
                } else {
                    this.selectedTower = null;
                    this.hideTowerMenu();
                }
            }
        });

        // Deselect tower when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target !== this.canvas && !e.target.closest('.tower-menu')) {
                this.selectedTower = null;
                this.hideTowerMenu();
            }
        });

        // Add fast forward button listener
        const fastForwardBtn = document.getElementById('fast-forward');
        fastForwardBtn.addEventListener('click', () => {
            this.toggleSpeed();
        });
    }

    canPlaceTower(x, y) {
        for (let i = 0; i < this.path.length - 1; i++) {
            const start = this.path[i];
            const end = this.path[i + 1];
            const dist = this.pointToLineDistance(x, y, start.x, start.y, end.x, end.y);
            if (dist < 30) return false;
        }
        
        for (const tower of this.towers) {
            const dx = x - tower.x;
            const dy = y - tower.y;
            if (Math.sqrt(dx * dx + dy * dy) < 40) return false;
        }
        
        return true;
    }

    pointToLineDistance(x, y, x1, y1, x2, y2) {
        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) param = dot / lenSq;
        
        let xx, yy;
        
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        const dx = x - xx;
        const dy = y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    placeTower(x, y, type) {
        const tower = new Tower(x, y, type, this);
        this.towers.push(tower);
    }

    startWave() {
        if (this.waveInProgress || this.gameOver) return;
        
        this.waveInProgress = true;
        this.enemiesSpawned = 0;
        this.enemiesDefeatedInWave = 0;
        this.nextWaveCountdown = 0;
        
        if (this.spawnInterval) {
            clearInterval(this.spawnInterval);
        }
        
        this.spawnInterval = setInterval(() => {
            if (this.enemiesSpawned < this.enemiesPerWave) {
                this.spawnEnemy();
                this.enemiesSpawned++;
            } else {
                clearInterval(this.spawnInterval);
                this.spawnInterval = null;
            }
        }, 1000);
    }

    checkWaveComplete() {
        if (this.enemiesDefeatedInWave === this.enemiesPerWave) {
            this.waveInProgress = false;
            
            if (this.wave === 10) {
                this.startNewLevel();
            } else {
                this.wave++;
                this.nextWaveCountdown = 5;
                this.startWaveCountdown();
            }
            this.enemiesDefeatedInWave = 0;
        }
    }

    spawnEnemy() {
        // Random enemy type selection
        const types = ['slow', 'fast', 'strong'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        const enemy = new Enemy(this.path[0].x, this.path[0].y, this.path, this.wave, randomType, this);
        this.enemies.push(enemy);
    }

    loseLife() {
        this.lives--;
        if (this.lives <= 0) {
            this.gameOver = true;
            clearInterval(this.spawnInterval);
            this.showGameOver();
        }
    }

    showGameOver() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width/2, this.canvas.height/2 - 50);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Level reached: ${this.level}`, this.canvas.width/2, this.canvas.height/2 + 10);
        this.ctx.fillText(`Final gold: ${this.gold}`, this.canvas.width/2, this.canvas.height/2 + 50);
        
        this.ctx.font = '18px Arial';
        this.ctx.fillText('Click anywhere to restart', this.canvas.width/2, this.canvas.height/2 + 100);
        
        // Add click listener for restart
        const restartHandler = (e) => {
            document.removeEventListener('click', restartHandler);
            new Game();
        };
        document.addEventListener('click', restartHandler);
    }

    updateHUD() {
        document.getElementById('gold').textContent = this.gold;
        document.getElementById('round').textContent = `L${this.level}-W${this.wave}${this.devMode ? ' [DEV]' : ''}`;
        const livesSpan = document.getElementById('lives');
        if (!livesSpan) {
            const statsDiv = document.querySelector('.stats');
            const livesElement = document.createElement('span');
            livesElement.innerHTML = `Lives: <span id="lives">${this.lives}</span>`;
            statsDiv.appendChild(livesElement);
        } else {
            livesSpan.textContent = this.lives;
        }
    }

    gameLoop(timestamp) {
        if (!this.lastFrameTime) {
            this.lastFrameTime = timestamp;
        }

        const deltaTime = (timestamp - this.lastFrameTime) * this.speedMultiplier;
        this.lastFrameTime = timestamp;

        if (this.gameOver) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw path
        this.ctx.beginPath();
        this.ctx.moveTo(this.path[0].x, this.path[0].y);
        for (const point of this.path.slice(1)) {
            this.ctx.lineTo(point.x, point.y);
        }
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 40;
        this.ctx.stroke();
        
        // Update and draw towers
        for (const tower of this.towers) {
            tower.update(this.enemies, deltaTime, this.speedMultiplier);
            tower.draw(this.ctx, tower === this.selectedTower || tower.type === this.selectedTowerType);
        }
        
        // Update and draw enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(deltaTime);
            enemy.draw(this.ctx);
            
            if (enemy.health <= 0) {
                // Calculate gold reward based on level and wave
                const baseGold = this.level; // Base gold equals current level
                const goldReward = baseGold * this.wave; // Multiply by current wave
                this.gold += goldReward;
                
                // Show floating gold text
                this.showFloatingText(`+${goldReward}`, enemy.x, enemy.y, '#FFD700');
                
                this.enemies.splice(i, 1);
                this.enemiesDefeatedInWave++;
                this.updateHUD();
                this.checkWaveComplete();
            } else if (enemy.reachedEnd) {
                this.enemies.splice(i, 1);
                this.enemiesDefeatedInWave++;
                this.loseLife();
                this.updateHUD();
                this.checkWaveComplete();
            }
        }

        // Update and draw floating texts
        this.updateFloatingTexts(deltaTime);

        // Update and draw selling animations
        for (let i = this.sellingAnimations.length - 1; i >= 0; i--) {
            const anim = this.sellingAnimations[i];
            
            // Update animation
            anim.radius += deltaTime * 0.2;
            anim.alpha = Math.max(0, 1 - (anim.radius / anim.maxRadius));
            
            // Draw animation
            this.ctx.beginPath();
            this.ctx.arc(anim.x, anim.y, anim.radius, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(255, 215, 0, ${anim.alpha})`;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Remove completed animations
            if (anim.radius >= anim.maxRadius) {
                this.sellingAnimations.splice(i, 1);
            }
        }
        
        // Draw wave information
        this.ctx.font = '20px Arial';
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Enemies: ${this.enemiesDefeatedInWave}/${this.enemiesPerWave}`, 10, 580);
        
        // Draw current gold reward information
        const currentGoldReward = this.level * this.wave;
        this.ctx.fillText(`Gold per kill: ${currentGoldReward}`, 200, 580);
        
        if (this.nextWaveCountdown > 0) {
            this.ctx.font = 'bold 48px Arial';
            this.ctx.fillStyle = 'white';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`Next Wave in: ${Math.ceil(this.nextWaveCountdown)}`, this.canvas.width/2, this.canvas.height/2);
        }
        
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    startWaveCountdown() {
        const countdownInterval = setInterval(() => {
            this.nextWaveCountdown--;
            if (this.nextWaveCountdown <= 0) {
                clearInterval(countdownInterval);
                this.startWave();
            }
        }, 1000);
    }

    showTowerMenu(tower) {
        this.hideTowerMenu(); // Remove any existing menu

        const menu = document.createElement('div');
        menu.className = 'tower-menu';
        menu.style.position = 'absolute';
        menu.style.left = `${tower.x + this.canvas.offsetLeft}px`;
        menu.style.top = `${tower.y + this.canvas.offsetTop - 100}px`;

        const sellPrice = Math.floor(this.towerCosts[tower.type] * tower.level * 0.6);
        const upgradePrice = Math.floor(this.towerCosts[tower.type] * (tower.level + 1) * 1.5);

        // Check if tower can be upgraded
        const canUpgrade = tower.canUpgrade();
        const upgradeDisabled = !canUpgrade || this.gold < upgradePrice;
        const upgradeText = canUpgrade ? `Upgrade ($${upgradePrice})` : 'MAX LEVEL';

        menu.innerHTML = `
            <div class="tower-stats">
                <div>Level: ${tower.level}${tower.level === tower.maxLevel ? ' (MAX)' : ''}</div>
                <div>Damage: ${tower.damage}</div>
                <div>Range: ${tower.range}</div>
            </div>
            <button class="upgrade-btn" ${upgradeDisabled ? 'disabled' : ''}>
                ${upgradeText}
            </button>
            <button class="sell-btn">Sell ($${sellPrice})</button>
        `;

        menu.querySelector('.upgrade-btn').addEventListener('click', () => {
            if (!upgradeDisabled) {
                this.gold -= upgradePrice;
                tower.upgrade();
                this.updateHUD();
                this.showTowerMenu(tower); // Refresh menu with new values
            }
        });

        menu.querySelector('.sell-btn').addEventListener('click', () => {
            this.sellTower(tower, true);
            this.hideTowerMenu();
        });

        document.body.appendChild(menu);
    }

    hideTowerMenu() {
        const existingMenu = document.querySelector('.tower-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
    }

    toggleSpeed() {
        const btn = document.getElementById('fast-forward');
        const speedText = btn.querySelector('.speed-text');
        
        if (this.speedMultiplier === 1) {
            this.speedMultiplier = 2;
            btn.classList.add('active');
            speedText.textContent = '2x';
        } else {
            this.speedMultiplier = 1;
            btn.classList.remove('active');
            speedText.textContent = '1x';
        }
    }

    showFloatingText(text, x, y, color, duration = 1000) {
        this.floatingTexts.push({
            text,
            x,
            y,
            color,
            alpha: 1,
            velocity: -1, // Move upward
            life: duration // Configurable lifetime
        });
    }

    updateFloatingTexts(deltaTime) {
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const text = this.floatingTexts[i];
            
            // Update position and alpha
            text.y += text.velocity * (deltaTime / 16.67);
            text.life -= deltaTime;
            text.alpha = Math.max(0, text.life / 1000);
            
            // Draw text
            this.ctx.font = '16px Arial';
            this.ctx.fillStyle = `rgba(${this.hexToRgb(text.color)},${text.alpha})`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(text.text, text.x, text.y);
            
            // Remove if expired
            if (text.life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    hexToRgb(hex) {
        // Remove # if present
        hex = hex.replace('#', '');
        
        // Convert to RGB
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        return `${r},${g},${b}`;
    }

    setupDevMode() {
        // Secret key combination for dev mode: 'dev'
        let keySequence = '';
        document.addEventListener('keypress', (e) => {
            keySequence += e.key;
            if (keySequence.length > 3) {
                keySequence = keySequence.slice(-3);
            }
            if (keySequence === 'dev') {
                this.devMode = !this.devMode;
                this.showDevModeStatus();
            }
        });

        // Dev mode controls
        document.addEventListener('keydown', (e) => {
            if (!this.devMode) return;

            switch(e.key) {
                case 'ArrowRight':
                    // Next level
                    this.clearCurrentLevel();
                    this.level++;
                    this.startNewLevel(true);
                    break;
                case 'ArrowLeft':
                    // Previous level
                    if (this.level > 1) {
                        this.clearCurrentLevel();
                        this.level--;
                        this.startNewLevel(true);
                    }
                    break;
                case 'g':
                    // Add 1000 gold
                    this.gold += 1000;
                    this.updateHUD();
                    break;
                case 'l':
                    // Add a life
                    this.lives++;
                    this.updateHUD();
                    break;
            }
        });
    }

    showDevModeStatus() {
        const status = document.createElement('div');
        status.style.position = 'fixed';
        status.style.top = '10px';
        status.style.left = '50%';
        status.style.transform = 'translateX(-50%)';
        status.style.padding = '10px';
        status.style.backgroundColor = this.devMode ? '#4CAF50' : '#f44336';
        status.style.color = 'white';
        status.style.borderRadius = '5px';
        status.style.zIndex = '1000';
        status.style.opacity = '0.9';
        status.textContent = `Developer Mode: ${this.devMode ? 'ON' : 'OFF'}`;
        
        document.body.appendChild(status);
        setTimeout(() => status.remove(), 2000);
    }

    clearCurrentLevel() {
        // Clear all current level data
        this.towers = [];
        this.enemies = [];
        this.enemiesSpawned = 0;
        this.enemiesDefeatedInWave = 0;
        this.wave = 1;
        if (this.spawnInterval) {
            clearInterval(this.spawnInterval);
            this.spawnInterval = null;
        }
    }

    sellTower(tower, isAutoSell = false) {
        const index = this.towers.indexOf(tower);
        if (index > -1) {
            const sellPrice = Math.floor(this.towerCosts[tower.type] * tower.level * 0.6);
            this.gold += sellPrice;
            this.towers.splice(index, 1);
            this.updateHUD();

            if (!isAutoSell) {
                // Show floating text for manual sells
                this.showFloatingText(
                    `+${sellPrice}`,
                    tower.x,
                    tower.y,
                    '#FFD700'
                );
            }

            // Add selling animation
            this.sellingAnimations.push({
                x: tower.x,
                y: tower.y,
                radius: tower.size / 2,
                alpha: 1,
                maxRadius: tower.size * 1.5
            });
        }
    }
}

class Projectile {
    constructor(startX, startY, targetEnemy, type) {
        this.x = startX;
        this.y = startY;
        this.targetEnemy = targetEnemy;
        this.type = type;
        this.baseSpeed = 8;
        this.reached = false;
        this.radius = 5;
        this.trail = [];
        this.maxTrailLength = type === 'fire' ? 8 : 5;
    }

    update(deltaTime) {
        if (this.reached || !this.targetEnemy) return true;

        const dx = this.targetEnemy.x - this.x;
        const dy = this.targetEnemy.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        this.trail.unshift({x: this.x, y: this.y});
        if (this.trail.length > this.maxTrailLength) {
            this.trail.pop();
        }

        if (distance < this.baseSpeed * (deltaTime / 16.67)) {
            this.reached = true;
            return true;
        }

        const moveAmount = (this.baseSpeed * deltaTime) / 16.67;
        this.x += (dx / distance) * moveAmount;
        this.y += (dy / distance) * moveAmount;

        return false;
    }

    draw(ctx) {
        // Draw trail
        for (let i = 0; i < this.trail.length; i++) {
            const point = this.trail[i];
            const alpha = 1 - (i / this.trail.length);
            ctx.beginPath();
            ctx.arc(point.x, point.y, this.radius * (1 - i/this.trail.length), 0, Math.PI * 2);
            
            switch(this.type) {
                case 'fire':
                    ctx.fillStyle = `rgba(255, ${100 - i*10}, 0, ${alpha})`;
                    break;
                case 'water':
                    ctx.fillStyle = `rgba(0, 150, 255, ${alpha})`;
                    break;
                case 'earth':
                    ctx.fillStyle = `rgba(101, 67, 33, ${alpha})`;
                    break;
            }
            ctx.fill();
        }

        // Draw projectile
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        
        switch(this.type) {
            case 'fire':
                ctx.fillStyle = '#ff4400';
                break;
            case 'water':
                ctx.fillStyle = '#00aaff';
                break;
            case 'earth':
                ctx.fillStyle = '#654321';
                break;
        }
        ctx.fill();

        // Special effects based on type
        if (this.type === 'fire') {
            // Add glow effect for fire
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 100, 0, 0.2)';
            ctx.fill();
        } else if (this.type === 'water') {
            // Add droplet effect for water
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - this.radius);
            ctx.lineTo(this.x - this.radius/2, this.y);
            ctx.lineTo(this.x + this.radius/2, this.y);
            ctx.closePath();
            ctx.fillStyle = '#00aaff';
            ctx.fill();
        }
    }
}

class Tower {
    constructor(x, y, type, gameInstance) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.game = gameInstance;
        this.level = 1;
        this.maxLevel = 5;
        this.range = this.getRange();
        this.damage = this.getDamage();
        this.lastShot = 0;
        this.cooldown = this.getCooldown();
        this.projectiles = [];
        this.target = null;
        this.size = 40;
        
        // Special effects values
        this.slowAmount = this.getSlowAmount();
        this.slowDuration = this.getSlowDuration();
        this.burnMultiplier = this.getBurnMultiplier();
        
        // Load badge sprite
        this.badgeSprite = new Image();
        this.badgeSprite.src = 'sprites/tower-badge.svg';
    }

    getRange() {
        const baseRange = {
            fire: 100,
            water: 120,
            earth: 150
        };
        // 20% increase per level
        return baseRange[this.type] * (1 + (this.level - 1) * 0.2);
    }

    getDamage() {
        const baseDamage = {
            fire: 20,
            water: 15,
            earth: 40
        };
        // Exponential damage increase: damage * 1.5^(level-1)
        return Math.floor(baseDamage[this.type] * Math.pow(1.5, this.level - 1));
    }

    getCooldown() {
        const baseCooldown = {
            fire: 1000,   // 1 second
            water: 800,   // 0.8 seconds
            earth: 2000   // 2 seconds
        };
        // Cooldown reduces by 10% per level
        return baseCooldown[this.type] * (1 - (this.level - 1) * 0.2);
    }

    getSlowAmount() {
        if (this.type !== 'water') return 0;
        // Slow effect increases from 50% to 90% at max level
        return 0.5 + (this.level - 1) * 0.1;
    }

    getSlowDuration() {
        if (this.type !== 'water') return 0;
        // Duration increases by 0.5 seconds per level
        return 60 + (this.level - 1) * 30; // Base 1 second + 0.5s per level (in frames at 60fps)
    }

    getBurnMultiplier() {
        if (this.type !== 'fire') return 0;
        // Burn damage multiplier increases with level
        const multipliers = [0.5, 0.7, 0.9, 1.1, 1.3];
        return multipliers[this.level - 1];
    }

    shoot(target) {
        // Create new projectile
        this.projectiles.push(new Projectile(this.x, this.y, target, this.type));
        
        // Apply damage and effects based on tower type
        switch(this.type) {
            case 'fire':
                target.health -= this.damage;
                target.applyBurn(this.damage * this.burnMultiplier);
                break;
            case 'water':
                target.health -= this.damage;
                target.applySlow(this.damage, this.slowAmount, this.slowDuration);
                break;
            case 'earth':
                // Earth tower does pure damage with knockback
                target.health -= this.damage;
                break;
        }
    }

    upgrade() {
        if (this.canUpgrade()) {
            this.level++;
            // Update all stats
            this.range = this.getRange();
            this.damage = this.getDamage();
            this.cooldown = this.getCooldown();
            this.slowAmount = this.getSlowAmount();
            this.slowDuration = this.getSlowDuration();
            this.burnMultiplier = this.getBurnMultiplier();
        }
    }

    canUpgrade() {
        return this.level < this.maxLevel;
    }

    update(enemies, deltaTime, speedMultiplier) {
        // Update existing projectiles with deltaTime
        this.projectiles = this.projectiles.filter(proj => !proj.update(deltaTime));

        const now = Date.now();
        if (now - this.lastShot >= this.cooldown / speedMultiplier) {
            this.target = this.findTarget(enemies);
            if (this.target) {
                this.shoot(this.target);
                this.lastShot = now;
            }
        }
    }

    findTarget(enemies) {
        return enemies.find(enemy => {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            return Math.sqrt(dx * dx + dy * dy) <= this.range;
        });
    }

    draw(ctx, showRange) {
        // Draw range indicator if tower is selected
        if (showRange) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Draw tower sprite with level-based effects
        if (this.game.sprites.towers[this.type]) {
            ctx.save();
            
            // Apply scaling based on level
            const scale = 1 + (this.level - 1) * 0.1; // 10% larger per level
            ctx.translate(this.x, this.y);
            ctx.scale(scale, scale);
            ctx.translate(-this.x, -this.y);
            
            // Draw base tower
            ctx.drawImage(
                this.game.sprites.towers[this.type],
                this.x - this.size/2,
                this.y - this.size/2,
                this.size,
                this.size
            );

            // Add glow effect for higher levels
            if (this.level > 1) {
                ctx.globalAlpha = 0.3;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size/2 + (this.level - 1) * 3, 0, Math.PI * 2);
                const glowColor = this.getGlowColor();
                ctx.fillStyle = glowColor;
                ctx.fill();
                ctx.globalAlpha = 1;
            }

            ctx.restore();

            // Draw level badge
            if (this.level > 1) {
                const badgeSize = 20;
                ctx.drawImage(
                    this.badgeSprite,
                    this.x + this.size/3,
                    this.y - this.size/3,
                    badgeSize,
                    badgeSize
                );
                
                // Draw level number on badge
                ctx.font = 'bold 12px Arial';
                ctx.fillStyle = 'white';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.strokeStyle = '#B8860B';
                ctx.lineWidth = 2;
                ctx.strokeText(
                    this.level.toString(),
                    this.x + this.size/3 + badgeSize/2,
                    this.y - this.size/3 + badgeSize/2
                );
                ctx.fillText(
                    this.level.toString(),
                    this.x + this.size/3 + badgeSize/2,
                    this.y - this.size/3 + badgeSize/2
                );
            }

            // Add max level indicator
            if (this.level === this.maxLevel) {
                ctx.font = 'bold 14px Arial';
                ctx.fillStyle = '#FFD700';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 3;
                const maxText = '★ MAX';
                ctx.strokeText(maxText, this.x, this.y + this.size/2 + 20);
                ctx.fillText(maxText, this.x, this.y + this.size/2 + 20);
            }
        }

        // Draw all projectiles
        for (const projectile of this.projectiles) {
            projectile.draw(ctx);
        }
    }

    getGlowColor() {
        switch(this.type) {
            case 'fire':
                return 'rgba(255, 100, 0, 0.5)';
            case 'water':
                return 'rgba(0, 150, 255, 0.5)';
            case 'earth':
                return 'rgba(0, 200, 0, 0.5)';
            default:
                return 'rgba(255, 255, 255, 0.5)';
        }
    }
}

class Enemy {
    constructor(x, y, path, wave, type, gameInstance) {
        this.x = x;
        this.y = y;
        this.path = path;
        this.currentPathIndex = 0;
        this.type = type;
        this.game = gameInstance;
        
        // Set attributes based on type with slower health scaling
        const waveScaling = 1 + (wave - 1) * 0.1; // 10% increase per wave instead of 20%
        switch(type) {
            case 'slow':
                this.baseSpeed = 1;
                this.health = 80 * waveScaling;
                break;
            case 'fast':
                this.baseSpeed = 3;
                this.health = 30 * waveScaling;
                break;
            case 'strong':
                this.baseSpeed = 1.5;
                this.health = 150 * waveScaling;
                break;
        }
        
        this.speed = this.baseSpeed;
        this.maxHealth = this.health;
        this.reachedEnd = false;
        this.burnDamage = 0;
        this.burnTicks = 0;
        this.slowDuration = 0;
        this.size = 30;
    }

    applySlow(damage, amount, duration) {
        this.health -= damage;
        this.slowAmount = Math.max(this.slowAmount, amount); // Use the strongest slow
        this.slowDuration = Math.max(this.slowDuration, duration);
    }

    applyBurn(burnDamage) {
        this.burnDamage = burnDamage;
        this.burnTicks = 3;
    }

    update(deltaTime) {
        if (this.currentPathIndex >= this.path.length - 1) {
            this.reachedEnd = true;
            return;
        }

        // Apply burn damage
        if (this.burnTicks > 0) {
            this.health -= this.burnDamage * (deltaTime / 1000);
            this.burnTicks--;
            if (this.burnTicks === 0) {
                this.burnDamage = 0;
            }
        }

        // Apply slow effect
        if (this.slowDuration > 0) {
            this.speed = this.baseSpeed * (1 - this.slowAmount);
            this.slowDuration -= deltaTime / 16.67;
        } else {
            this.speed = this.baseSpeed;
            this.slowAmount = 0;
        }

        const target = this.path[this.currentPathIndex + 1];
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.speed * (deltaTime / 16.67)) {
            this.currentPathIndex++;
        } else {
            const moveAmount = (this.speed * deltaTime) / 16.67;
            this.x += (dx / distance) * moveAmount;
            this.y += (dy / distance) * moveAmount;
        }
    }

    draw(ctx) {
        // Draw enemy sprite
        const sprite = this.game.sprites.enemies[this.type];
        if (sprite) {
            ctx.drawImage(
                sprite,
                this.x - this.size/2,
                this.y - this.size/2,
                this.size,
                this.size
            );
        } else {
            // Fallback if sprite not loaded
            ctx.beginPath();
            ctx.arc(this.x, this.y, 15, 0, Math.PI * 2);
            ctx.fillStyle = this.type === 'slow' ? '#8844FF' : 
                          this.type === 'fast' ? '#FF4444' : '#44AA44';
            ctx.fill();
        }
        
        // Draw health bar with dynamic color based on health percentage
        const healthBarWidth = 40;
        const healthBarHeight = 4;
        const healthPercentage = this.health / this.maxHealth;
        
        // Background of health bar
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(this.x - healthBarWidth/2, this.y - this.size/2 - 8, healthBarWidth, healthBarHeight);
        
        // Health bar color transitions from green to yellow to red
        const hue = healthPercentage * 120; // 120 for green, 60 for yellow, 0 for red
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        ctx.fillRect(
            this.x - healthBarWidth/2,
            this.y - this.size/2 - 8,
            healthBarWidth * healthPercentage,
            healthBarHeight
        );

        // Draw status effect indicators
        if (this.burnTicks > 0) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size/2 + 5, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 100, 0, 0.5)';
            ctx.stroke();
        }
        if (this.slowDuration > 0) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size/2 + 3, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 150, 255, 0.5)';
            ctx.stroke();
        }
    }
}

new Game(); 