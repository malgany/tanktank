import { UI } from './ui.js';

/**
 * DOM adapter that reacts to engine events and keeps HUD/modals in sync.
 */
export class UIManager {
    /**
     * @param {import('../engine/game.js').Game} game
     */
    constructor(game) {
        this.game = game;
        this.ui = new UI(game);
        this.gameOverOverlay = document.getElementById('gameOverOverlay');
        this.restartButton = document.getElementById('restartButton');
        this.powerSlot = document.getElementById('power-slot');
        this.powerName = document.getElementById('powerName');
        this.cooldownBar = document.getElementById('powerCooldown');
        this.bindEvents();
        this.renderPowerSlot();
    }

    bindEvents() {
        this.game.eventBus.on('ui:update', () => {
            this.update();
            this.renderPowerSlot();
        });
        this.game.eventBus.on('player:stats-changed', () => this.update());
        this.game.eventBus.on('player:power-changed', () => this.renderPowerSlot());
        this.game.eventBus.on('player:level-up', ({ level }) => this.showLevelUp(level));
        this.game.eventBus.on('ui:message', ({ message, duration }) => this.showMessage(message, duration));
        this.game.eventBus.on('game:over', () => this.showGameOver());
    }

    update() {
        this.ui.update();
    }

    /**
     * @param {string} message
     * @param {number} [duration]
     */
    showMessage(message, duration = 3000) {
        this.ui.showMessage(message, duration);
    }

    /**
     * @param {number} level
     */
    showLevelUp(level) {
        this.ui.showLevelUp(level);
    }

    renderPowerSlot() {
        const player = this.game.player;
        const power = player.availablePowers.find((entry) => entry.id === player.currentPower);
        if (!power || !this.powerSlot) {
            return;
        }

        const powerIcon = this.powerSlot.querySelector('.power-icon');
        if (powerIcon) {
            powerIcon.textContent = power.icon;
        }

        this.powerSlot.setAttribute('data-power-id', power.id);
        this.powerSlot.className = 'power';
        this.powerSlot.classList.add(`${power.id}-power`, 'selected');

        if (this.powerName) {
            this.powerName.textContent = power.name;
        }

        if (this.cooldownBar) {
            this.cooldownBar.style.height = `${this.getCooldownPercent(player, power.id)}%`;
        }
    }

    showGameOver() {
        if (!this.gameOverOverlay) {
            return;
        }

        this.gameOverOverlay.classList.add('visible');
        if (this.restartButton && !this.restartButton.dataset.boundReload) {
            this.restartButton.dataset.boundReload = 'true';
            this.restartButton.addEventListener('click', () => {
                window.location.reload();
            });
        }
    }

    /**
     * @param {import('../entities/player.js').Player} player
     * @param {string} powerId
     * @returns {number}
     */
    getCooldownPercent(player, powerId) {
        switch (powerId) {
            case 'fireball':
                return (player.fireballCooldown / player.fireballMaxCooldown) * 100;
            case 'aoe':
                return (player.aoeCooldown / player.aoeMaxCooldown) * 100;
            case 'ice':
                return (player.iceCooldown / player.iceMaxCooldown) * 100;
            case 'poison':
                return (player.poisonCooldown / player.poisonMaxCooldown) * 100;
            case 'arrow':
                return (player.arrowCooldown / player.arrowMaxCooldown) * 100;
            default:
                return 0;
        }
    }
}
