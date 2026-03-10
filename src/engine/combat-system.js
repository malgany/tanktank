import { Chest } from '../entities/chest.js';
import { isFiniteNumber } from '../core/math.js';

/**
 * Handles combat updates and keeps Game focused on orchestration.
 */
export class CombatSystem {
    /**
     * @param {import('./game.js').Game} game
     */
    constructor(game) {
        this.game = game;
    }

    updateEnemies(deltaTime) {
        const beforeCount = this.game.enemies.length;
        this.game.enemies = this.game.enemies.filter((enemy) => !enemy.dead && enemy.visible && isFiniteNumber(enemy.x) && isFiniteNumber(enemy.y));

        if (beforeCount !== this.game.enemies.length) {
            console.log(`Removidos ${beforeCount - this.game.enemies.length} inimigos mortos/invisíveis`);
        }

        for (let i = this.game.enemies.length - 1; i >= 0; i--) {
            const enemy = this.game.enemies[i];
            enemy.update(deltaTime, this.game.player, this.game);

            if (!isFiniteNumber(enemy.x) || !isFiniteNumber(enemy.y)) {
                enemy.dead = true;
                enemy.visible = false;
                continue;
            }

            enemy.draw(this.game.ctx);
            if (this.game.checkCollision(enemy, this.game.player) && enemy.collisionCooldown <= 0) {
                this.game.player.takeDamage(enemy.damage, this.game.player.x - enemy.x, this.game.player.y - enemy.y);
                enemy.applyCollisionCooldown();
            }

            this.game.keepEnemyInScreen(enemy);
        }

        if (this.game.enemies.length === 0 && !this.game.isScreenCleared(this.game.currentScreenX, this.game.currentScreenY)) {
            this.game.markScreenAsCleared();
            this.game.checkChestSpawn();
        }
    }

    updateProjectiles(deltaTime) {
        for (let i = this.game.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.game.projectiles[i];
            if (!projectile || typeof projectile.update !== 'function') {
                this.game.projectiles.splice(i, 1);
                continue;
            }

            projectile.update(deltaTime);
            if (projectile.x < 0 || projectile.x > this.game.canvas.width || projectile.y < 0 || projectile.y > this.game.canvas.height) {
                if (projectile.canRicochet && projectile.ricochetsLeft > 0) {
                    continue;
                }
                this.game.recycleProjectileAt(i);
                continue;
            }

            if (projectile.isEnemy) {
                if (this.game.checkCollision(projectile, this.game.player)) {
                    this.game.player.takeDamage(projectile.damage);
                    this.game.recycleProjectileAt(i);
                    continue;
                }
            } else {
                let consumed = false;
                for (let j = this.game.enemies.length - 1; j >= 0; j--) {
                    const enemy = this.game.enemies[j];
                    if (!this.game.checkCollision(projectile, enemy)) {
                        continue;
                    }

                    enemy.takeDamage(projectile.damage);
                    if (projectile.type === 'ice') {
                        this.game.player.freezeEnemy(enemy, this.game.player.iceDuration);
                    }
                    if (projectile.type === 'poison') {
                        this.game.player.poisonEnemy(enemy, projectile.poisonDamage, 5000);
                    }
                    this.game.recycleProjectileAt(i);
                    consumed = true;
                    break;
                }
                if (consumed) {
                    continue;
                }
            }

            if (i < this.game.projectiles.length) {
                projectile.draw(this.game.ctx);
            }
        }
    }

    updateAOEEffects(deltaTime) {
        for (let i = this.game.aoeEffects.length - 1; i >= 0; i--) {
            const aoe = this.game.aoeEffects[i];
            aoe.update(deltaTime);
            aoe.draw(this.game.ctx);

            if (aoe.active && !aoe.damageApplied) {
                for (const enemy of this.game.enemies) {
                    const dx = enemy.x - aoe.x;
                    const dy = enemy.y - aoe.y;
                    if (Math.hypot(dx, dy) < aoe.radius) {
                        enemy.takeDamage(aoe.damage);
                    }
                }
                aoe.damageApplied = true;
            }

            if (aoe.duration <= 0) {
                this.game.aoeEffects.splice(i, 1);
            }
        }
    }

    /**
     * @param {any} obj1
     * @param {any} obj2
     * @returns {boolean}
     */
    checkCollision(obj1, obj2) {
        if (obj1 instanceof Chest && obj2 === this.game.player) {
            obj1.open();
        }

        return (
            obj1.x < obj2.x + obj2.width &&
            obj1.x + obj1.width > obj2.x &&
            obj1.y < obj2.y + obj2.height &&
            obj1.y + obj1.height > obj2.y
        );
    }
}
