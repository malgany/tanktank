/**
 * config.js - Arquivo de configuração centralizado
 * Este arquivo contém todas as configurações do jogo para facilitar ajustes e manutenção.
 */

export const CONFIG = {
    // Configurações do Mundo
    WORLD: {
        WIDTH: 25,
        HEIGHT: 25,
        INITIAL_SCREEN_X: 12,
        INITIAL_SCREEN_Y: 12
    },

    // Configurações do Jogador
    PLAYER: {
        // Dimensões do jogador
        WIDTH: 30,
        HEIGHT: 30,
        
        // Atributos básicos
        MAX_HEALTH: 100,
        SPEED: 3,
        XP_TO_NEXT_LEVEL: 100,
        
        // Invulnerabilidade
        INVULNERABLE_DURATION: 1000, // 1 segundo
        
        // Poderes - Bola de Fogo
        FIREBALL_MAX_COOLDOWN: 500, // 0.5 segundos
        FIREBALL_DAMAGE: 10,
        FIREBALL_SIZE: 10,
        
        // Poderes - AOE
        AOE_MAX_COOLDOWN: 3000, // 3 segundos
        AOE_DAMAGE: 15,
        AOE_SIZE: 80,
        
        // Poderes - Gelo
        ICE_MAX_COOLDOWN: 2000, // 2 segundos
        ICE_DAMAGE: 7,
        ICE_SIZE: 10,
        ICE_DURATION: 3000, // 3 segundos
        
        // Poderes - Veneno
        POISON_MAX_COOLDOWN: 1500, // 1.5 segundos
        POISON_DAMAGE: 0.5,
        POISON_SIZE: 10,
        
        // Poderes - Flecha
        ARROW_MAX_COOLDOWN: 250, // 0.25 segundos
        ARROW_DAMAGE: 12,
        ARROW_SIZE: 12
    },
    
    // Configurações de Baús
    CHEST: {
        SPAWN_CHANCE: 0.1, // 10% de chance de spawn
        MIN_SPAWN_INTERVAL: 30000, // 30 segundos
    },
    
    // Configurações de Inimigos
    ENEMY: {
        BASE_COUNT: 2,
        POWER_MULTIPLIER: 1,
    },
    
    // Carrega as configurações do localStorage, se existirem
    loadFromLocalStorage: function() {
        const savedConfig = localStorage.getItem('gameConfig');
        
        if (savedConfig) {
            try {
                const config = JSON.parse(savedConfig);
                
                // Aplica as configurações do jogador
                if (config.player) {
                    this.PLAYER.MAX_HEALTH = config.player.maxHealth || this.PLAYER.MAX_HEALTH;
                    this.PLAYER.SPEED = config.player.speed || this.PLAYER.SPEED;
                    this.PLAYER.XP_TO_NEXT_LEVEL = config.player.xpToNextLevel || this.PLAYER.XP_TO_NEXT_LEVEL;
                    this.PLAYER.INVULNERABLE_DURATION = config.player.invulnerableDuration || this.PLAYER.INVULNERABLE_DURATION;
                    
                    // Configurações dos poderes
                    this.PLAYER.FIREBALL_MAX_COOLDOWN = config.player.fireballMaxCooldown || this.PLAYER.FIREBALL_MAX_COOLDOWN;
                    this.PLAYER.FIREBALL_DAMAGE = config.player.fireballDamage || this.PLAYER.FIREBALL_DAMAGE;
                    this.PLAYER.FIREBALL_SIZE = config.player.fireballSize || this.PLAYER.FIREBALL_SIZE;
                    
                    this.PLAYER.AOE_MAX_COOLDOWN = config.player.aoeMaxCooldown || this.PLAYER.AOE_MAX_COOLDOWN;
                    this.PLAYER.AOE_DAMAGE = config.player.aoeDamage || this.PLAYER.AOE_DAMAGE;
                    this.PLAYER.AOE_SIZE = config.player.aoeSize || this.PLAYER.AOE_SIZE;
                    
                    this.PLAYER.POISON_MAX_COOLDOWN = config.player.poisonMaxCooldown || this.PLAYER.POISON_MAX_COOLDOWN;
                    this.PLAYER.POISON_DAMAGE = config.player.poisonDamage || this.PLAYER.POISON_DAMAGE;
                    this.PLAYER.POISON_SIZE = config.player.poisonSize || this.PLAYER.POISON_SIZE;
                    
                    this.PLAYER.ARROW_MAX_COOLDOWN = config.player.arrowMaxCooldown || this.PLAYER.ARROW_MAX_COOLDOWN;
                    this.PLAYER.ARROW_DAMAGE = config.player.arrowDamage || this.PLAYER.ARROW_DAMAGE;
                    this.PLAYER.ARROW_SIZE = config.player.arrowSize || this.PLAYER.ARROW_SIZE;
                }
                
                // Aplica as configurações do jogo
                if (config.game) {
                    this.CHEST.SPAWN_CHANCE = config.game.chestSpawnChance || this.CHEST.SPAWN_CHANCE;
                    this.CHEST.MIN_SPAWN_INTERVAL = config.game.minChestSpawnInterval || this.CHEST.MIN_SPAWN_INTERVAL;
                }
                
                console.log('Configurações carregadas com sucesso do localStorage');
            } catch (error) {
                console.error('Erro ao carregar configurações:', error);
            }
        }
        
        return this;
    },
    
    // Salva as configurações no localStorage
    saveToLocalStorage: function(config) {
        localStorage.setItem('gameConfig', JSON.stringify(config));
        return this;
    }
};

// Carrega as configurações do localStorage quando o arquivo é importado
CONFIG.loadFromLocalStorage(); 