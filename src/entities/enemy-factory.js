import { Enemy } from './enemy.js';

/**
 * Centralizes enemy creation and rehydration from saved screen state.
 */
export class EnemyFactory {
    /**
     * @param {import('../engine/game.js').Game} game
     */
    constructor(game) {
        this.game = game;
    }

    /**
     * @param {object} params
     * @param {number} params.x
     * @param {number} params.y
     * @param {number} params.health
     * @param {number} params.damage
     * @param {number} params.xpValue
     * @param {string | null} [params.type]
     * @param {number} [params.zone]
     * @returns {Enemy}
     */
    createEnemy({ x, y, health, damage, xpValue, type = null, zone = 0 }) {
        return new Enemy(x, y, health, damage, xpValue, type, zone, this.game);
    }

    /**
     * @param {any} data
     * @returns {Enemy}
     */
    createFromSavedState(data) {
        const enemy = this.createEnemy({
            x: data.x,
            y: data.y,
            health: data.health,
            damage: data.damage,
            xpValue: data.xpValue,
            type: data.type,
            zone: data.zone
        });

        enemy.maxHealth = data.maxHealth;
        enemy.behavior = data.behavior;
        enemy.shape = data.shape;
        enemy.color = data.color;
        enemy.width = data.width;
        enemy.height = data.height;
        return enemy;
    }
}
