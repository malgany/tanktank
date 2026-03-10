/**
 * Coordinates screen transitions, enemy persistence and full-map rendering.
 */
export class MapManager {
    /**
     * @param {import('./game.js').Game} game
     */
    constructor(game) {
        this.game = game;
    }

    /** @param {string} screenType */
    getZoneForScreenType(screenType) {
        switch (screenType) {
            case 'plains':
                return 0;
            case 'forest':
                return 1;
            case 'mountains':
                return 2;
            case 'desert':
                return 3;
            default:
                return 0;
        }
    }

    /** @param {string} screenType */
    getScreenName(screenType) {
        switch (screenType) {
            case 'plains':
                return 'Planície';
            case 'forest':
                return 'Floresta';
            case 'mountains':
                return 'Montanhas';
            case 'desert':
                return 'Deserto';
            default:
                return 'Desconhecido';
        }
    }

    syncCurrentZone() {
        const screenType = this.game.world.getScreenType(this.game.currentScreenX, this.game.currentScreenY);
        const zone = this.getZoneForScreenType(screenType);
        this.game.currentZone = zone;
        return zone;
    }

    updateCoordinatesDisplay() {
        const screenType = this.game.world.getScreenType(this.game.currentScreenX, this.game.currentScreenY);
        const mapPosition = document.getElementById('mapPosition');
        if (mapPosition) {
            mapPosition.textContent = `[${this.game.currentScreenX}, ${this.game.currentScreenY}] - ${this.getScreenName(screenType)}`;
        }
    }

    generateEnemiesForCurrentScreen() {
        if (this.game.isScreenCleared(this.game.currentScreenX, this.game.currentScreenY)) {
            this.game.enemies = [];
            return;
        }

        const difficultyZone = this.syncCurrentZone();
        const baseEnemyCount = 2 + difficultyZone;
        const enemyCount = Math.min(8, baseEnemyCount + Math.floor(Math.random() * 2));
        const powerMultiplier = 1 + (difficultyZone * 0.75);

        for (let i = 0; i < enemyCount; i++) {
            let x;
            let y;
            do {
                x = Math.random() * (this.game.canvas.width - 40);
                y = Math.random() * (this.game.canvas.height - 40);
            } while (Math.abs(x - this.game.player.x) < 100 && Math.abs(y - this.game.player.y) < 100);

            const variationFactor = 0.8 + Math.random() * 0.4;
            const baseHealth = 20 + (difficultyZone * 15);
            const baseDamage = 5 + (difficultyZone * 3);
            const baseXP = 10 + (difficultyZone * 10);

            const enemy = this.game.enemyFactory.createEnemy({
                x,
                y,
                health: Math.floor(baseHealth * powerMultiplier * variationFactor),
                damage: Math.floor(baseDamage * powerMultiplier * variationFactor),
                xpValue: Math.floor(baseXP * powerMultiplier * variationFactor),
                zone: difficultyZone
            });

            const sizeIncrease = 1 + (difficultyZone * 0.1);
            enemy.width *= sizeIncrease;
            enemy.height *= sizeIncrease;
            this.game.enemies.push(enemy);
        }
    }

    showFullMap() {
        this.game.isFullMapVisible = true;
        this.game.fullMapContainer.style.display = 'flex';
        setTimeout(() => {
            this.game.fullMapCanvas.width = this.game.fullMapCanvas.clientWidth;
            this.game.fullMapCanvas.height = this.game.fullMapCanvas.clientHeight;
            this.drawFullMap();
        }, 10);
    }

    hideFullMap() {
        this.game.isFullMapVisible = false;
        this.game.fullMapContainer.style.display = 'none';
    }

    drawFullMap() {
        const ctx = this.game.fullMapCtx;
        const canvas = this.game.fullMapCanvas;
        if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const cellWidth = canvas.width / this.game.world.width;
        const cellHeight = canvas.height / this.game.world.height;

        for (let y = 0; y < this.game.world.height; y++) {
            for (let x = 0; x < this.game.world.width; x++) {
                const screenType = this.game.world.getScreenType(x, y);
                const colorVariation = this.game.world.getScreenColorVariation(x, y);
                const palette = this.getBaseColor(screenType).map((value) => {
                    const adjusted = value * (1 + colorVariation);
                    return Math.max(0, Math.min(255, adjusted));
                });

                ctx.fillStyle = `rgb(${palette[0]}, ${palette[1]}, ${palette[2]})`;
                ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
                ctx.strokeRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);

                if (this.game.isScreenCleared(x, y)) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.beginPath();
                    ctx.arc((x + 0.5) * cellWidth, (y + 0.5) * cellHeight, cellWidth / 4, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.arc((this.game.currentScreenX + 0.5) * cellWidth, (this.game.currentScreenY + 0.5) * cellHeight, Math.max(cellWidth / 2, 5), 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc((this.game.currentScreenX + 0.5) * cellWidth, (this.game.currentScreenY + 0.5) * cellHeight, Math.max(cellWidth / 6, 2), 0, Math.PI * 2);
        ctx.fill();
    }

    /** @param {string} screenType */
    getBaseColor(screenType) {
        switch (screenType) {
            case 'plains':
                return [120, 200, 80];
            case 'forest':
                return [34, 139, 34];
            case 'mountains':
                return [139, 137, 137];
            case 'desert':
                return [210, 180, 140];
            default:
                return [50, 50, 50];
        }
    }

    saveCurrentScreenEnemies() {
        const screenKey = `${this.game.currentScreenX},${this.game.currentScreenY}`;
        if (this.game.enemies.length > 0) {
            this.game.screenEnemies[screenKey] = this.game.enemies.map((enemy) => ({
                x: enemy.x,
                y: enemy.y,
                health: enemy.health,
                maxHealth: enemy.maxHealth,
                damage: enemy.damage,
                xpValue: enemy.xpValue,
                behavior: enemy.behavior,
                shape: enemy.shape,
                color: enemy.color,
                width: enemy.width,
                height: enemy.height,
                type: enemy.type,
                zone: enemy.zone
            }));
            return;
        }

        if (!this.game.isScreenCleared(this.game.currentScreenX, this.game.currentScreenY)) {
            this.game.markScreenAsCleared();
        }

        delete this.game.screenEnemies[screenKey];
    }

    /** @param {number} x @param {number} y */
    loadScreenEnemies(x, y) {
        const screenKey = `${x},${y}`;
        if (!this.game.screenEnemies[screenKey]) {
            return;
        }

        this.game.enemies = this.game.screenEnemies[screenKey].map((data) => this.game.enemyFactory.createFromSavedState(data));
    }

    /** @param {'up' | 'down' | 'left' | 'right'} direction */
    forceTransition(direction) {
        if (this.game.world.getScreenType(this.game.currentScreenX, this.game.currentScreenY) === 'desert' && this.game.enemies.length > 0) {
            this.game.ui.showMessage('Elimine todos os inimigos para avançar!', 2000);
            return null;
        }

        this.saveCurrentScreenEnemies();
        switch (direction) {
            case 'up':
                this.game.currentScreenY--;
                this.game.player.y = this.game.canvas.height - this.game.player.height - 20;
                break;
            case 'down':
                this.game.currentScreenY++;
                this.game.player.y = 20;
                break;
            case 'left':
                this.game.currentScreenX--;
                this.game.player.x = this.game.canvas.width - this.game.player.width - 20;
                break;
            case 'right':
                this.game.currentScreenX++;
                this.game.player.x = 20;
                break;
        }

        this.game.currentScreenX = Math.max(0, Math.min(this.game.currentScreenX, this.game.world.width - 1));
        this.game.currentScreenY = Math.max(0, Math.min(this.game.currentScreenY, this.game.world.height - 1));
        this.game.clearScreenEntities();

        const screenKey = `${this.game.currentScreenX},${this.game.currentScreenY}`;
        if (!this.game.isScreenCleared(this.game.currentScreenX, this.game.currentScreenY)) {
            if (this.game.screenEnemies[screenKey]) {
                this.loadScreenEnemies(this.game.currentScreenX, this.game.currentScreenY);
            } else {
                this.generateEnemiesForCurrentScreen();
            }
        }

        this.game.checkChestSpawn();
        this.updateCoordinatesDisplay();

        const screenType = this.game.world.getScreenType(this.game.currentScreenX, this.game.currentScreenY);
        const newZone = this.getZoneForScreenType(screenType);
        if (newZone !== this.game.lastZone) {
            this.game.ui.showMessage(`Zona ${newZone + 1} - ${this.getScreenName(screenType)}`, 3000);
        }
        this.game.currentZone = newZone;
        this.game.lastZone = newZone;

        return {
            newScreen: { x: this.game.currentScreenX, y: this.game.currentScreenY },
            screenType,
            direction
        };
    }
}
