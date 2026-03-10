import { Projectile, EnemyProjectile, IceProjectile, PoisonProjectile, ArrowProjectile } from './projectile.js';

const PROJECTILE_TYPES = {
    fireball: Projectile,
    enemy: EnemyProjectile,
    ice: IceProjectile,
    poison: PoisonProjectile,
    arrow: ArrowProjectile
};

/**
 * Reuses projectile instances to reduce allocation churn.
 */
export class ProjectilePool {
    constructor() {
        /** @type {Map<string, Array<any>>} */
        this.pool = new Map();
    }

    /**
     * @param {'fireball' | 'enemy' | 'ice' | 'poison' | 'arrow'} type
     * @param {Array<any>} args
     * @returns {any}
     */
    acquire(type, args) {
        const available = this.pool.get(type);
        if (available && available.length > 0) {
            const projectile = available.pop();
            projectile.reset(...args);
            return projectile;
        }

        const ProjectileClass = PROJECTILE_TYPES[type];
        return new ProjectileClass(...args);
    }

    /**
     * @param {any} projectile
     */
    release(projectile) {
        if (!projectile) {
            return;
        }

        const type = projectile.poolType || projectile.type || (projectile.isEnemy ? 'enemy' : 'fireball');
        if (!this.pool.has(type)) {
            this.pool.set(type, []);
        }

        projectile.active = false;
        projectile.x = -1000;
        projectile.y = -1000;
        projectile.particles = [];
        if ('trail' in projectile) {
            projectile.trail = [];
        }
        this.pool.get(type).push(projectile);
    }
}
