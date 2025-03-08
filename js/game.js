import { Player } from './player.js';
import { Enemy } from './enemy.js';
import { InputHandler } from './input.js';
import { Chest } from './chest.js';
import { Projectile, IceProjectile, PoisonProjectile, ArrowProjectile } from './projectile.js';
import { AOEEffect } from './aoe.js';
import { World } from './world.js';
import { UI } from './ui.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        
        // Inicializa o mundo primeiro
        this.world = new World(25, 25);
        console.log("Mundo inicializado:", {
            width: this.world.width,
            height: this.world.height,
            screenCount: this.world.screens.length
        });
        
        // Define a posição inicial do jogador no meio do mapa [12,12]
        this.currentScreenX = 12;
        this.currentScreenY = 12;
        
        this.player = new Player(this);
        this.ui = new UI(this);
        this.input = new InputHandler(this);
        
        this.enemies = [];
        this.projectiles = [];
        this.aoeEffects = [];
        this.drops = []; // Lista de drops de itens
        this.chests = []; // Lista de baús
        
        // Estado do jogo
        this.isPaused = false;
        
        // Obtém o tipo de terreno da tela inicial
        const initialScreenType = this.world.getScreenType(this.currentScreenX, this.currentScreenY);
        
        // Define a zona inicial com base no tipo de terreno
        let initialZone;
        
        switch (initialScreenType) {
            case 'plains':
                initialZone = 0; // Planície (fácil)
                break;
            case 'forest':
                initialZone = 1; // Floresta (médio)
                break;
            case 'mountains':
                initialZone = 2; // Montanhas (difícil)
                break;
            case 'desert':
                initialZone = 3; // Deserto (muito difícil)
                break;
            default:
                initialZone = 0;
        }
        
        this.currentZone = initialZone; // Zona atual
        this.lastZone = initialZone; // Última zona visitada
        
        // Sistema de memorização de inimigos
        this.clearedScreens = {}; // Armazena as telas que foram limpas de inimigos
        this.screenEnemies = {}; // Armazena os inimigos de cada tela
        
        this.lastTime = 0;
        this.gameTime = 0;
        
        // Configuração do mapa completo
        this.fullMapContainer = document.getElementById('fullMapContainer');
        this.fullMapCanvas = document.getElementById('fullMapCanvas');
        this.fullMapCtx = this.fullMapCanvas.getContext('2d');
        this.isFullMapVisible = false;
        
        // Configurar o tamanho do canvas do mapa
        this.fullMapCanvas.width = this.fullMapCanvas.clientWidth || 800;
        this.fullMapCanvas.height = this.fullMapCanvas.clientHeight || 600;
        
        // Configurar botão de fechar mapa
        document.getElementById('closeMapBtn').addEventListener('click', () => {
            this.hideFullMap();
        });
        
        // Configuração do modal de informações do jogador
        this.playerInfoModal = document.getElementById('playerInfoModal');
        this.isPlayerInfoVisible = false;
        
        // Configurar botão de fechar informações
        document.getElementById('closeInfoBtn').addEventListener('click', () => {
            this.hidePlayerInfo();
        });
        
        // Gera inimigos para a tela inicial
        this.generateEnemiesForCurrentScreen();
        
        // Mostra a mensagem de zona inicial
        const screenType = this.world.getScreenType(this.currentScreenX, this.currentScreenY);
        let screenName = '';
        
        switch (screenType) {
            case 'plains':
                screenName = 'Planície';
                break;
            case 'forest':
                screenName = 'Floresta';
                break;
            case 'mountains':
                screenName = 'Montanhas';
                break;
            case 'desert':
                screenName = 'Deserto';
                break;
            default:
                screenName = 'Desconhecido';
        }
        
        // Exibe mensagem de boas-vindas
        this.ui.showMessage(`Bem-vindo à ${screenName}! Você está no centro do mapa [${this.currentScreenX}, ${this.currentScreenY}]`, 5000);
        setTimeout(() => {
            this.ui.showMessage(`Use as teclas WASD para se mover. Vá até as bordas da tela para explorar outras áreas!`, 5000);
        }, 5500);
        
        // Atualiza a exibição das coordenadas
        this.updateCoordinatesDisplay();
        
        window.addEventListener('resize', () => {
            this.setupCanvas();
            // Atualiza o tamanho do mapa completo quando a janela é redimensionada
            if (this.isFullMapVisible) {
                this.fullMapCanvas.width = this.fullMapCanvas.clientWidth;
                this.fullMapCanvas.height = this.fullMapCanvas.clientHeight;
                this.drawFullMap();
            }
        });
        
        // Adiciona função de depuração ao objeto window
        if (!window.debugGame) {
            window.debugGame = {};
        }
        
        // Adiciona métodos de depuração
        window.debugGame.forceTransition = (direction) => this.forceTransition(direction);
        window.debugGame.getCurrentPosition = () => {
            return {
                screen: { x: this.currentScreenX, y: this.currentScreenY },
                player: { x: this.player.x, y: this.player.y },
                canvas: { width: this.canvas.width, height: this.canvas.height }
            };
        };
        
        // Exibe mensagem de ajuda no console
        console.log("Funções de depuração disponíveis:");
        console.log("- debugGame.forceTransition('up'|'down'|'left'|'right')");
        console.log("- debugGame.getCurrentPosition()");
        
        // Configuração de baús
        this.chestSpawnChance = 0.8; // Aumentado para 80% de chance (era 30%)
        this.lastChestSpawnTime = 0;
        this.minChestSpawnInterval = 10000; // Reduzido para 10 segundos (era 60000 = 1 minuto)
        
        // Cria o modal de informações do jogador
        this.createPlayerInfoModal();
        
        // Cria o modal de troca de poderes
        this.createPowerSwapModal();
        
        // Cria o modal de configuração
        this.createConfigModal();
        
        // Sistema de alertas temporários
        this.floatingAlerts = [];
        
        // Adiciona o listener para o atalho do modal de configuração (tecla *)
        document.addEventListener('keydown', (e) => {
            if (e.key === '*') {
                this.toggleConfigModal();
            }
        });
        
        // Carrega as configurações salvas do localStorage
        this.loadConfig();
        
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    setupCanvas() {
        // Ajusta o canvas para o tamanho da área de jogo
        const gameArea = this.canvas.parentElement;
        this.canvas.width = gameArea.clientWidth;
        this.canvas.height = gameArea.clientHeight;
    }
    
    gameLoop(timestamp) {
        // Calcula o delta time
        if (!this.lastTime) {
            this.lastTime = timestamp;
            this.gameTime = 0;
        }
        
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        this.gameTime += deltaTime;
        
        // Limpa o canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Desenha o fundo
        this.drawBackground();
        
        // Atualiza apenas se o jogo não estiver pausado
        if (!this.isPaused) {
            // Atualiza o jogador
            this.player.update(deltaTime);
            
            // Atualiza os inimigos
            this.updateEnemies(deltaTime);
            
            // Atualiza os projéteis
            this.updateProjectiles(deltaTime);
            
            // Atualiza os efeitos de AOE
            this.updateAOEEffects(deltaTime);
            
            // Atualiza os drops
            this.updateDrops(deltaTime);
            
            // Atualiza os baús
            this.updateChests(deltaTime);
            
            // Verifica transição de tela e armazena o resultado
            const transitionResult = this.checkScreenTransition();
            
            // Se houve transição, aplica as mudanças necessárias
            if (transitionResult) {
                console.log("Transição de tela detectada:", transitionResult);
                
                // Atualiza a UI após a transição
                this.ui.update();
                
                // Atualiza as coordenadas
                this.updateCoordinatesDisplay();
            }
        }
        
        // Desenha o jogador
        this.player.draw(this.ctx);
        
        // Atualiza a UI
        this.ui.update();
        
        // Atualiza as coordenadas
        this.updateCoordinatesDisplay();
        
        // Atualiza e desenha os alertas flutuantes
        this.updateFloatingAlerts(deltaTime);
        
        // Continua o loop
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    updateEnemies(deltaTime) {
        // Primeiro, remove todos os inimigos mortos ou invisíveis
        const beforeCount = this.enemies.length;
        
        // Verifica se há inimigos com coordenadas NaN antes de filtrar
        for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
            if (isNaN(enemy.x) || isNaN(enemy.y)) {
                console.log("Inimigo com coordenadas NaN antes de filtrar:", enemy);
                enemy.dead = true;
                enemy.visible = false;
            }
        }
        
        // Filtra os inimigos mortos ou invisíveis
        this.enemies = this.enemies.filter(enemy => {
            // Se o inimigo estiver morto ou invisível, remove-o
            if (enemy.dead || !enemy.visible) {
                return false;
            }
            
            // Verifica se as coordenadas são válidas
            if (isNaN(enemy.x) || isNaN(enemy.y)) {
                console.log("Inimigo com coordenadas NaN após filtro:", enemy);
                return false;
            }
            
            return true;
        });
        
        const afterCount = this.enemies.length;
        if (beforeCount !== afterCount) {
            console.log(`Removidos ${beforeCount - afterCount} inimigos mortos/invisíveis`);
        }
        
        // Depois, atualiza os inimigos restantes
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];

            // Atualiza o inimigo
            enemy.update(deltaTime, this.player, this);
            enemy.draw(this.ctx);
            
            // Verifica colisão com o jogador
            if (this.checkCollision(enemy, this.player)) {
                // Verifica se o inimigo não está em cooldown de colisão
                if (enemy.collisionCooldown <= 0) {
                    // Calcula a direção do knockback (do inimigo para o jogador)
                    const knockbackX = this.player.x - enemy.x;
                    const knockbackY = this.player.y - enemy.y;
                    
                    // Aplica dano ao jogador com knockback
                    this.player.takeDamage(enemy.damage, knockbackX, knockbackY);
                    
                    // Aplica cooldown de colisão ao inimigo
                    enemy.applyCollisionCooldown();
                }
            }
            
            // Mantém o inimigo dentro da tela
            this.keepEnemyInScreen(enemy);
        }
        
        // Verifica se todos os inimigos foram derrotados
        if (this.enemies.length === 0) {
            console.log("Todos os inimigos foram derrotados!");
            
            // Verifica se a tela já foi limpa antes
            if (!this.isScreenCleared(this.currentScreenX, this.currentScreenY)) {
                console.log("Marcando tela como limpa e verificando spawn de baú...");
                this.markScreenAsCleared();
                
                // Verifica se deve spawnar um baú após limpar a tela
                this.checkChestSpawn();
            } else {
                console.log("Tela já estava marcada como limpa anteriormente.");
            }
        }
    }
    
    updateProjectiles(deltaTime) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            // Verifica se o projétil tem o método update
            if (!projectile || typeof projectile.update !== 'function') {
                console.warn('Projétil inválido encontrado:', projectile);
                this.projectiles.splice(i, 1);
                continue;
            }
            
            // Atualiza o projétil
            projectile.update(deltaTime);
            
            // Verifica se o projétil saiu da tela
            if (projectile.x < 0 || projectile.x > this.canvas.width ||
                projectile.y < 0 || projectile.y > this.canvas.height) {
                
                // Se o projétil pode ricocheter e ainda tem ricochetes disponíveis, não o remove
                if (projectile.canRicochet && projectile.ricochetsLeft > 0) {
                    continue;
                }
                
                // Remove o projétil
                this.projectiles.splice(i, 1);
                continue;
            }
            
            // Verifica se é um projétil inimigo
            if (projectile.isEnemy) {
                // Log para depuração
                // console.log("Processando projétil inimigo:", projectile);
                
                // Verifica colisão com o jogador
                if (this.checkCollision(projectile, this.player)) {
                    console.log("Projétil inimigo atingiu o jogador!");
                    
                    // Aplica dano ao jogador
                    this.player.takeDamage(projectile.damage);
                    
                    // Remove o projétil
                    this.projectiles.splice(i, 1);
                    continue;
                }
            } else {
                // Se não for um projétil inimigo, verifica colisão com inimigos
                for (let j = this.enemies.length - 1; j >= 0; j--) {
                    const enemy = this.enemies[j];
                    
                    if (this.checkCollision(projectile, enemy)) {
                        // Log para depuração
                        // console.log("Projétil do jogador atingiu inimigo:", enemy);
                        
                        // Aplica dano ao inimigo
                        enemy.takeDamage(projectile.damage);
                        
                        // Se for um projétil de gelo, aplica o efeito de lentidão ou congelamento
                        if (projectile.type === 'ice') {
                            // Congela o inimigo por 2 segundos (2000ms)
                            this.player.freezeEnemy(enemy, 2000); // Congela por 2 segundos
                        }
                        
                        // Se for um projétil de veneno, aplica o efeito de envenenamento
                        if (projectile.type === 'poison') {
                            // Envenena o inimigo usando o dano do projétil
                            this.player.poisonEnemy(enemy, projectile.poisonDamage, 5000);
                        }
                        
                        // Remove o projétil
                        this.projectiles.splice(i, 1);
                        break;
                    }
                }
            }
            
            // Desenha o projétil se ainda existir
            if (i < this.projectiles.length) {
                projectile.draw(this.ctx);
            }
        }
    }
    
    updateAOEEffects(deltaTime) {
        for (let i = this.aoeEffects.length - 1; i >= 0; i--) {
            const aoe = this.aoeEffects[i];
            aoe.update(deltaTime);
            aoe.draw(this.ctx);
            
            // Aplica dano aos inimigos dentro da área
            if (aoe.active && !aoe.damageApplied) {
                for (const enemy of this.enemies) {
                    const dx = enemy.x - aoe.x;
                    const dy = enemy.y - aoe.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < aoe.radius) {
                        enemy.takeDamage(aoe.damage);
                    }
                }
                aoe.damageApplied = true;
            }
            
            // Remove efeitos expirados
            if (aoe.duration <= 0) {
                this.aoeEffects.splice(i, 1);
            }
        }
    }
    
    checkCollision(obj1, obj2) {
        // Se obj1 for um baú e obj2 for o jogador, abre o baú
        if (obj1 instanceof Chest && obj2 === this.player) {
            obj1.open();
        }
        
        return (
            obj1.x < obj2.x + obj2.width &&
            obj1.x + obj1.width > obj2.x &&
            obj1.y < obj2.y + obj2.height &&
            obj1.y + obj1.height > obj2.y
        );
    }
    
    checkScreenTransition() {
        let transitioned = false;
        let direction = '';
        
        // Verifica se o jogador saiu da tela
        console.log();
        if (this.player.x <= 0) {
            // Verifica se não está na borda do mundo
            if (this.currentScreenX > 0) {
                // Salva os inimigos da tela atual antes de transicionar
                this.saveCurrentScreenEnemies();
                
                // Transição para a esquerda
                this.currentScreenX--;
                this.player.x = this.canvas.width - this.player.width;
                transitioned = true;
                direction = 'left';
                console.log(`Transição para a esquerda. Nova posição: [${this.currentScreenX}, ${this.currentScreenY}]`);
            } else {
                // Impede o jogador de sair do mundo
                this.player.x = 0;
                this.ui.showMessage("Você atingiu o limite do mundo!", 2000);
            }
        } else if (this.player.x + this.player.width >= this.canvas.width) {
            // Verifica se não está na borda do mundo
            if (this.currentScreenX < this.world.width - 1) {
                // Salva os inimigos da tela atual antes de transicionar
                this.saveCurrentScreenEnemies();
                
                // Transição para a direita
                this.currentScreenX++;
                this.player.x = 0;
                transitioned = true;
                direction = 'right';
                console.log(`Transição para a direita. Nova posição: [${this.currentScreenX}, ${this.currentScreenY}]`);
            } else {
                // Impede o jogador de sair do mundo
                this.player.x = this.canvas.width - this.player.width;
                this.ui.showMessage("Você atingiu o limite do mundo!", 2000);
            }
        } else if (this.player.y <= 0) {
            // Verifica se não está na borda do mundo
            if (this.currentScreenY > 0) {
                // Salva os inimigos da tela atual antes de transicionar
                this.saveCurrentScreenEnemies();
                
                // Transição para cima
                this.currentScreenY--;
                this.player.y = this.canvas.height - this.player.height;
                transitioned = true;
                direction = 'up';
                console.log(`Transição para cima. Nova posição: [${this.currentScreenX}, ${this.currentScreenY}]`);
            } else {
                // Impede o jogador de sair do mundo
                this.player.y = 0;
                this.ui.showMessage("Você atingiu o limite do mundo!", 2000);
            }
        } else if (this.player.y + this.player.height >= this.canvas.height) {
            // Verifica se não está na borda do mundo
            if (this.currentScreenY < this.world.height - 1) {
                // Salva os inimigos da tela atual antes de transicionar
                this.saveCurrentScreenEnemies();
                
                // Transição para baixo
                this.currentScreenY++;
                this.player.y = 0;
                transitioned = true;
                direction = 'down';
                console.log(`Transição para baixo. Nova posição: [${this.currentScreenX}, ${this.currentScreenY}]`);
            } else {
                // Impede o jogador de sair do mundo
                this.player.y = this.canvas.height - this.player.height;
                this.ui.showMessage("Você atingiu o limite do mundo!", 2000);
            }
        }
        
        // Se houve transição, atualiza a tela
        if (transitioned) {
            console.log(`Transição de tela: ${direction}. Nova posição: [${this.currentScreenX}, ${this.currentScreenY}]`);
            
            // Limita as coordenadas da tela ao tamanho do mundo
            this.currentScreenX = Math.max(0, Math.min(this.currentScreenX, this.world.width - 1));
            this.currentScreenY = Math.max(0, Math.min(this.currentScreenY, this.world.height - 1));
            
            // Limpa os projéteis e efeitos AOE
            this.projectiles = [];
            this.aoeEffects = [];
            
            // Limpa as marcas de rodas do jogador
            this.player.clearTrackMarks();
            
            // Limpa os inimigos atuais antes de carregar novos
            this.enemies = [];
            this.drops = [];
            this.chests = []; // Limpa também os baús
            
            // Verifica se a tela já foi limpa de inimigos
            if (this.isScreenCleared(this.currentScreenX, this.currentScreenY)) {
                // Se a tela já foi limpa, não carrega inimigos
                console.log("Tela já limpa:", this.currentScreenX, this.currentScreenY);
            } else {
                // Verifica se há inimigos salvos para esta tela
                const screenKey = `${this.currentScreenX},${this.currentScreenY}`;
                if (this.screenEnemies[screenKey]) {
                    // Carrega os inimigos salvos
                    console.log("Carregando inimigos salvos:", screenKey);
                    this.loadScreenEnemies(this.currentScreenX, this.currentScreenY);
                } else {
                    // Gera novos inimigos para a tela
                    console.log("Gerando novos inimigos:", screenKey);
                    this.generateEnemiesForCurrentScreen();
                }
            }
            
            // Verifica se deve gerar um baú na nova tela
            this.checkChestSpawn();
            
            // Atualiza a exibição das coordenadas
            this.updateCoordinatesDisplay();
            
            // Exibe uma mensagem informando a nova tela
            const screenType = this.world.getScreenType(this.currentScreenX, this.currentScreenY);
            
            // Define a zona com base no tipo de terreno
            let newZone;
            let screenName = '';
            
            switch (screenType) {
                case 'plains':
                    newZone = 0;
                    screenName = 'Planície';
                    break;
                case 'forest':
                    newZone = 1;
                    screenName = 'Floresta';
                    break;
                case 'mountains':
                    newZone = 2;
                    screenName = 'Montanhas';
                    break;
                case 'desert':
                    newZone = 3;
                    screenName = 'Deserto';
                    break;
                default:
                    newZone = 0;
                    screenName = 'Desconhecido';
            }
            
            // Verifica se houve mudança de zona
            if (newZone !== this.lastZone) {
                // Mostra mensagem apenas se a zona mudou
                this.ui.showMessage(`Zona ${newZone + 1} - ${screenName}`, 3000);
            }
            
            // Atualiza as zonas
            this.currentZone = newZone;
            this.lastZone = newZone;
            
            return {
                newScreen: { x: this.currentScreenX, y: this.currentScreenY },
                screenType: screenType,
                direction: direction
            };
        }
        
        return null;
    }
    
    generateEnemiesForCurrentScreen() {
        // Verifica se a tela já foi limpa
        if (this.isScreenCleared(this.currentScreenX, this.currentScreenY)) {
            this.enemies = [];
            return;
        }
        
        // Obtém o tipo de terreno da tela atual
        const screenType = this.world.getScreenType(this.currentScreenX, this.currentScreenY);
        
        // Define a zona de dificuldade com base no tipo de terreno
        let difficultyZone;
        
        switch (screenType) {
            case 'plains':
                difficultyZone = 0; // Planície (fácil)
                break;
            case 'forest':
                difficultyZone = 1; // Floresta (médio)
                break;
            case 'mountains':
                difficultyZone = 2; // Montanhas (difícil)
                break;
            case 'desert':
                difficultyZone = 3; // Deserto (muito difícil)
                break;
            default:
                difficultyZone = 0;
        }
        
        this.currentZone = difficultyZone;
        
        // Quanto mais difícil a zona, mais inimigos e mais fortes
        const baseEnemyCount = 2 + difficultyZone;
        const enemyCount = Math.min(8, baseEnemyCount + Math.floor(Math.random() * 2));
        
        // Multiplicador de poder baseado na zona de dificuldade
        // Zona 0: 1x, Zona 1: 1.5x, Zona 2: 2x, Zona 3: 3x
        const powerMultiplier = 1 + (difficultyZone * 0.75);
        
        console.log(`Gerando ${enemyCount} inimigos na zona ${difficultyZone} (multiplicador: ${powerMultiplier.toFixed(1)}x)`);
        
        for (let i = 0; i < enemyCount; i++) {
            // Evita gerar inimigos muito próximos do jogador
            let x, y;
            do {
                x = Math.random() * (this.canvas.width - 40);
                y = Math.random() * (this.canvas.height - 40);
            } while (
                Math.abs(x - this.player.x) < 100 && 
                Math.abs(y - this.player.y) < 100
            );
            
            // Adiciona variação aos atributos dos inimigos
            const variationFactor = 0.8 + Math.random() * 0.4; // 80% a 120% do valor base
            
            // Calcula os atributos com base na zona de dificuldade
            const baseHealth = 20 + (difficultyZone * 15);
            const baseDamage = 5 + (difficultyZone * 3);
            const baseXP = 10 + (difficultyZone * 10);
            
            // Cria o inimigo passando a zona atual
            const enemy = new Enemy(
                x, 
                y, 
                Math.floor(baseHealth * powerMultiplier * variationFactor), // HP
                Math.floor(baseDamage * powerMultiplier * variationFactor), // Dano
                Math.floor(baseXP * powerMultiplier * variationFactor),     // XP
                null,                                                       // Tipo (será determinado pelo inimigo)
                difficultyZone,                                             // Zona
                this                                                        // Referência ao jogo
            );
            
            // Aumenta o tamanho dos inimigos mais fortes
            const sizeIncrease = 1 + (difficultyZone * 0.1);
            enemy.width *= sizeIncrease;
            enemy.height *= sizeIncrease;
            
            this.enemies.push(enemy);
        }
    }
    
    updateCoordinatesDisplay() {
        // Obtém o tipo de terreno da tela atual
        const screenType = this.world.getScreenType(this.currentScreenX, this.currentScreenY);
        let screenName = '';
        
        switch (screenType) {
            case 'plains':
                screenName = 'Planície';
                break;
            case 'forest':
                screenName = 'Floresta';
                break;
            case 'mountains':
                screenName = 'Montanhas';
                break;
            case 'desert':
                screenName = 'Deserto';
                break;
            default:
                screenName = 'Desconhecido';
        }
        
        // Atualiza a posição do mapa no canto superior esquerdo
        document.getElementById('mapPosition').textContent = `[${this.currentScreenX}, ${this.currentScreenY}] - ${screenName}`;
    }
    
    addProjectile(projectile) {
        // Verifica se o projétil é válido antes de adicioná-lo
        if (!projectile || typeof projectile.update !== 'function') {
            console.warn('Tentativa de adicionar um projétil inválido:', projectile);
            return;
        }
        this.projectiles.push(projectile);
    }
    
    addAOEEffect(aoe) {
        this.aoeEffects.push(aoe);
    }
    
    addDrop(drop) {
        this.drops.push(drop);
    }
    
    updateDrops(deltaTime) {
        for (let i = this.drops.length - 1; i >= 0; i--) {
            const drop = this.drops[i];
            
            // Verifica colisão com o jogador
            if (this.checkCollision(drop, this.player) && !drop.collected) {
                drop.collected = true;
                
                // Aplica o efeito do drop
                switch (drop.type) {
                    case 'speed':
                        this.player.speed += drop.value;
                        this.ui.showMessage(`Velocidade +${drop.value}!`, 2000);
                        // Cria um alerta flutuante
                        this.createFloatingAlert(`+${drop.value} VEL`, drop.x, drop.y - 20, '#00ff00');
                        break;
                    case 'damage':
                        this.player.fireballDamage += drop.value;
                        this.ui.showMessage(`Dano +${drop.value}!`, 2000);
                        // Cria um alerta flutuante
                        this.createFloatingAlert(`+${drop.value} DANO`, drop.x, drop.y - 20, '#ff9900');
                        break;
                    case 'health':
                        this.player.health = Math.min(this.player.health + drop.value, this.player.maxHealth);
                        this.ui.showMessage(`Vida +${drop.value}!`, 2000);
                        // Cria um alerta flutuante
                        this.createFloatingAlert(`+${drop.value} VIDA`, drop.x, drop.y - 20, '#ff0000');
                        break;
                }
                
                // Remove o drop
                this.drops.splice(i, 1);
            }
            
            // Desenha o drop
            this.ctx.save();
            
            // Cor baseada no tipo
            switch (drop.type) {
                case 'speed':
                    this.ctx.fillStyle = '#00ff00'; // Verde para velocidade
                    break;
                case 'damage':
                    this.ctx.fillStyle = '#000000'; // Preto para dano
                    break;
                case 'health':
                    this.ctx.fillStyle = '#ff0000'; // Vermelho para vida
                    break;
            }
            
            // Desenha o item
            this.ctx.fillRect(drop.x - drop.width / 2, drop.y - drop.height / 2, drop.width, drop.height);
            
            // Adiciona um efeito de brilho
            this.ctx.globalAlpha = 0.5 + Math.sin(this.gameTime / 200) * 0.3;
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(drop.x - drop.width / 2 - 2, drop.y - drop.height / 2 - 2, drop.width + 4, drop.height + 4);
            
            this.ctx.restore();
        }
    }
    
    forceTransition(direction) {
        console.log("Forçando transição para:", direction);
        
        // Verifica se está no deserto e se ainda há inimigos
        if (this.world.getScreenType(this.currentScreenX, this.currentScreenY) === 'desert' && this.enemies.length > 0) {
            // Impede a transição e mostra uma mensagem
            this.ui.showMessage("Elimine todos os inimigos para avançar!", 2000);
            return null;
        }
        
        // Salva os inimigos da tela atual antes de transicionar
        this.saveCurrentScreenEnemies();
        
        switch(direction) {
            case 'up':
                this.currentScreenY--;
                this.player.y = this.canvas.height - this.player.height - 20;
                break;
            case 'down':
                this.currentScreenY++;
                this.player.y = 20;
                break;
            case 'left':
                this.currentScreenX--;
                this.player.x = this.canvas.width - this.player.width - 20;
                break;
            case 'right':
                this.currentScreenX++;
                this.player.x = 20;
                break;
        }
        
        // Limita as coordenadas da tela ao tamanho do mundo
        this.currentScreenX = Math.max(0, Math.min(this.currentScreenX, this.world.width - 1));
        this.currentScreenY = Math.max(0, Math.min(this.currentScreenY, this.world.height - 1));
        
        // Limpa os elementos da tela anterior
        this.enemies = [];
        this.projectiles = [];
        this.aoeEffects = [];
        this.drops = [];
        this.chests = []; // Limpa também os baús
        
        // Verifica se a tela já foi limpa de inimigos
        if (this.isScreenCleared(this.currentScreenX, this.currentScreenY)) {
            // Se a tela já foi limpa, não carrega inimigos
            console.log("Tela já limpa:", this.currentScreenX, this.currentScreenY);
        } else {
            // Verifica se há inimigos salvos para esta tela
            const screenKey = `${this.currentScreenX},${this.currentScreenY}`;
            if (this.screenEnemies[screenKey]) {
                // Carrega os inimigos salvos
                console.log("Carregando inimigos salvos:", screenKey);
                this.loadScreenEnemies(this.currentScreenX, this.currentScreenY);
            } else {
                // Gera novos inimigos para a tela
                console.log("Gerando novos inimigos:", screenKey);
                this.generateEnemiesForCurrentScreen();
            }
        }
        
        // Verifica se deve gerar um baú na nova tela
        this.checkChestSpawn();
        
        // Atualiza a exibição das coordenadas
        this.updateCoordinatesDisplay();
        
        // Exibe uma mensagem informando a nova tela
        const screenType = this.world.getScreenType(this.currentScreenX, this.currentScreenY);
        
        // Define a zona com base no tipo de terreno
        let newZone;
        let screenName = '';
        
        switch (screenType) {
            case 'plains':
                newZone = 0;
                screenName = 'Planície';
                break;
            case 'forest':
                newZone = 1;
                screenName = 'Floresta';
                break;
            case 'mountains':
                newZone = 2;
                screenName = 'Montanhas';
                break;
            case 'desert':
                newZone = 3;
                screenName = 'Deserto';
                break;
            default:
                newZone = 0;
                screenName = 'Desconhecido';
        }
        
        // Verifica se houve mudança de zona
        if (newZone !== this.lastZone) {
            // Mostra mensagem apenas se a zona mudou
            this.ui.showMessage(`Zona ${newZone + 1} - ${screenName}`, 3000);
        }
        
        // Atualiza as zonas
        this.currentZone = newZone;
        this.lastZone = newZone;
        
        return {
            newScreen: { x: this.currentScreenX, y: this.currentScreenY },
            screenType: screenType,
            direction: direction
        };
    }
    
    // Método para mostrar/ocultar a lista de poderes
    togglePowersList() {
        // Método removido - não é mais necessário com o novo sistema de poderes
        this.ui.showMessage("Sistema de poderes atualizado!", 2000);
    }
    
    // Método para mostrar o mapa completo
    showFullMap() {
        this.isFullMapVisible = true;
        this.fullMapContainer.style.display = 'flex';
        
        // Certifica-se de que o canvas do mapa tenha as dimensões corretas
        setTimeout(() => {
            // Usar setTimeout para garantir que o container já esteja visível
            this.fullMapCanvas.width = this.fullMapCanvas.clientWidth;
            this.fullMapCanvas.height = this.fullMapCanvas.clientHeight;
            this.drawFullMap();
        }, 10);
    }
    
    // Método para esconder o mapa completo
    hideFullMap() {
        this.isFullMapVisible = false;
        this.fullMapContainer.style.display = 'none';
    }
    
    // Método para mostrar/ocultar as informações do jogador
    togglePlayerInfo() {
        if (this.isPlayerInfoVisible) {
            this.hidePlayerInfo();
        } else {
            this.showPlayerInfo();
        }
    }
    
    // Método para mostrar as informações do jogador
    showPlayerInfo() {
        this.isPlayerInfoVisible = true;
        this.playerInfoModal.style.display = 'flex';
        this.updatePlayerInfo();
        
        // Pausa o jogo enquanto a tela de informações está aberta
        this.isPaused = true;
    }
    
    // Método para ocultar as informações do jogador
    hidePlayerInfo() {
        this.isPlayerInfoVisible = false;
        this.playerInfoModal.style.display = 'none';
        
        // Retoma o jogo quando a tela de informações é fechada
        this.isPaused = false;
    }
    
    // Método para atualizar as informações do jogador no modal
    updatePlayerInfo() {
        const player = this.player;
        
        // Atualiza os valores no modal
        document.getElementById('infoLevel').textContent = player.level;
        document.getElementById('infoHealth').textContent = `${player.health}/${player.maxHealth}`;
        document.getElementById('infoXP').textContent = `${player.xp}/${player.xpToNextLevel}`;
        document.getElementById('infoDamage').textContent = player.fireballDamage;
        document.getElementById('infoSpeed').textContent = player.speed.toFixed(1);
        
        // Atualiza o dano em área e mostra/oculta a linha com base no desbloqueio
        const aoeInfoRow = document.getElementById('aoeInfoRow');
        if (player.currentPower === 'aoe') {
            document.getElementById('infoAOEDamage').textContent = player.aoeDamage;
            aoeInfoRow.style.display = 'flex';
        } else {
            aoeInfoRow.style.display = 'none';
        }
    }
    
    // Método para desenhar o mapa completo
    drawFullMap() {
        const ctx = this.fullMapCtx;
        const canvas = this.fullMapCanvas;
        
        // Certifica-se de que o canvas tenha as dimensões corretas
        if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
        }
        
        // Limpa o canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Desenha um fundo para garantir que o canvas não fique preto
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Calcula o tamanho de cada célula do mapa
        const cellWidth = canvas.width / this.world.width;
        const cellHeight = canvas.height / this.world.height;
        
        // Desenha cada célula do mapa
        for (let y = 0; y < this.world.height; y++) {
            for (let x = 0; x < this.world.width; x++) {
                const screenType = this.world.getScreenType(x, y);
                const colorVariation = this.world.getScreenColorVariation(x, y);
                
                // Define a cor com base no tipo de tela
                let baseColor;
                let zone;
                
                switch (screenType) {
                    case 'plains':
                        baseColor = [120, 200, 80]; // Verde claro
                        zone = 0;
                        break;
                    case 'forest':
                        baseColor = [34, 139, 34]; // Verde floresta
                        zone = 1;
                        break;
                    case 'mountains':
                        baseColor = [139, 137, 137]; // Cinza
                        zone = 2;
                        break;
                    case 'desert':
                        baseColor = [210, 180, 140]; // Bege
                        zone = 3;
                        break;
                    default:
                        baseColor = [50, 50, 50]; // Cinza escuro (vazio)
                        zone = 0;
                }
                
                // Aplica a variação de cor
                const adjustedColor = baseColor.map(c => {
                    const adjusted = c * (1 + colorVariation);
                    return Math.max(0, Math.min(255, adjusted));
                });
                
                // Desenha a célula
                ctx.fillStyle = `rgb(${adjustedColor[0]}, ${adjustedColor[1]}, ${adjustedColor[2]})`;
                ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
                
                // Adiciona uma borda para melhor visualização
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
                ctx.strokeRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
                
                // Se a tela foi limpa, adiciona uma marca
                if (this.isScreenCleared(x, y)) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.beginPath();
                    ctx.arc(
                        (x + 0.5) * cellWidth,
                        (y + 0.5) * cellHeight,
                        cellWidth / 4,
                        0,
                        Math.PI * 2
                    );
                    ctx.fill();
                }
            }
        }
        
        // Desenha a posição atual do jogador
        ctx.fillStyle = '#3498db'; // Azul (cor do jogador)
        ctx.beginPath();
        ctx.arc(
            (this.currentScreenX + 0.5) * cellWidth,
            (this.currentScreenY + 0.5) * cellHeight,
            Math.max(cellWidth / 2, 5), // Garante um tamanho mínimo visível
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Adiciona uma borda branca para destacar
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Adiciona um ponto central para melhor visualização
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(
            (this.currentScreenX + 0.5) * cellWidth,
            (this.currentScreenY + 0.5) * cellHeight,
            Math.max(cellWidth / 6, 2), // Garante um tamanho mínimo visível
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
    
    // Método para manter os inimigos dentro da tela atual
    keepEnemyInScreen(enemy) {
        // Verifica se as coordenadas são válidas
        if (isNaN(enemy.x) || isNaN(enemy.y)) {
            console.log("Tentando manter inimigo com coordenadas NaN dentro da tela:", enemy);
            // Corrige as coordenadas para evitar problemas
            enemy.x = this.canvas.width / 2;
            enemy.y = this.canvas.height / 2;
            return;
        }
        
        let colisaoDetectada = false;
        
        // Limita o inimigo às bordas do canvas
        if (enemy.x < 0) {
            enemy.x = 0;
            colisaoDetectada = true;
        } else if (enemy.x + enemy.width > this.canvas.width) {
            enemy.x = this.canvas.width - enemy.width;
            colisaoDetectada = true;
        }
        
        if (enemy.y < 0) {
            enemy.y = 0;
            colisaoDetectada = true;
        } else if (enemy.y + enemy.height > this.canvas.height) {
            enemy.y = this.canvas.height - enemy.height;
            colisaoDetectada = true;
        }
        
        // Se detectou colisão com a parede, muda a direção do inimigo
        if (colisaoDetectada) {
            // Adiciona um pequeno timer para evitar que o inimigo fique preso
            if (!enemy.wallCollisionTimer || enemy.wallCollisionTimer <= 0) {
                // Inverte a direção do movimento (180 graus)
                enemy.moveDirection = (enemy.moveDirection + Math.PI) % (Math.PI * 2);
                
                // Adiciona uma pequena variação aleatória para evitar ficar preso
                enemy.moveDirection += (Math.random() - 0.5) * Math.PI / 2;
                
                // Define um timer para evitar mudanças de direção muito frequentes
                enemy.wallCollisionTimer = 1000; // 1 segundo
                
                // Força um pequeno movimento na nova direção para sair da parede
                const moveSpeed = enemy.speed * 2;
                enemy.x += Math.cos(enemy.moveDirection) * moveSpeed;
                enemy.y += Math.sin(enemy.moveDirection) * moveSpeed;
            }
        } else if (enemy.wallCollisionTimer > 0) {
            // Reduz o timer se não estiver colidindo
            enemy.wallCollisionTimer -= 16; // Aproximadamente um frame a 60fps
        }
    }
    
    // Marca a tela atual como limpa de inimigos
    markScreenAsCleared() {
        const screenKey = `${this.currentScreenX},${this.currentScreenY}`;
        this.clearedScreens[screenKey] = true;
        
        console.log(`Tela ${screenKey} marcada como limpa de inimigos.`);
        
        // Força a verificação de spawn de baú
        this.checkChestSpawn();
    }
    
    // Verifica se a tela está limpa de inimigos
    isScreenCleared(x, y) {
        const screenKey = `${x},${y}`;
        return this.clearedScreens[screenKey] === true;
    }
    
    // Salva os inimigos da tela atual
    saveCurrentScreenEnemies() {
        const screenKey = `${this.currentScreenX},${this.currentScreenY}`;
        
        // Salva apenas se houver inimigos na tela atual
        if (this.enemies.length > 0) {
            this.screenEnemies[screenKey] = this.enemies.map(enemy => ({
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
        } else {
            // Se não há inimigos, verifica se a tela já foi limpa
            if (!this.isScreenCleared(this.currentScreenX, this.currentScreenY)) {
                // Se não foi limpa e não há inimigos, marca como limpa
                this.markScreenAsCleared();
            }
            
            // Remove os inimigos salvos para esta tela, se houver
            if (this.screenEnemies[screenKey]) {
                delete this.screenEnemies[screenKey];
            }
        }
    }
    
    // Carrega os inimigos da tela especificada
    loadScreenEnemies(x, y) {
        const screenKey = `${x},${y}`;
        if (this.screenEnemies[screenKey]) {
            this.enemies = this.screenEnemies[screenKey].map(data => {
                const enemy = new Enemy(
                    data.x,
                    data.y,
                    data.health,
                    data.damage,
                    data.xpValue,
                    data.type,  // Passando o tipo
                    data.zone,  // Passando a zona
                    this        // Passando a referência ao jogo
                );
                
                // Restaura as propriedades adicionais
                enemy.maxHealth = data.maxHealth;
                enemy.behavior = data.behavior;
                enemy.shape = data.shape;
                enemy.color = data.color;
                enemy.width = data.width;
                enemy.height = data.height;
                
                return enemy;
            });
            
            // Não remove da memória após carregar, mantém os inimigos salvos
            // para que não sejam gerados novamente se o jogador voltar
        }
    }
    
    // Método para desenhar a lista de poderes (não é mais necessário, agora é HTML)
    drawPowersList() {
        // Método removido - não é mais necessário com o novo sistema de poderes
    }
    
    // Método para desenhar o fundo da tela atual
    drawBackground() {
        // Desenha o mundo
        this.world.draw(this.ctx, this.canvas, this.currentScreenX, this.currentScreenY);
    }
    
    // Método para verificar se deve spawnar um baú
    checkChestSpawn() {
        // Chance de 30% de spawnar um baú após matar todos os inimigos
        const randomValue = Math.random();
        
        if (randomValue < 0.3) {
            console.log("Baú gerado após eliminar todos os inimigos!");
            
            // Spawna um baú em uma posição aleatória na tela (não muito perto das bordas)
            const margin = 100; // Margem para evitar que o baú fique muito perto das bordas
            const x = margin + Math.random() * (this.canvas.width - 2 * margin);
            const y = margin + Math.random() * (this.canvas.height - 2 * margin);
            
            // Cria o baú
            const chest = new Chest(x, y, this);
            this.chests.push(chest);
            
            // Atualiza o tempo do último spawn
            this.lastChestSpawnTime = this.gameTime;
        }
    }
    
    // Método para atualizar os baús
    updateChests(deltaTime) {
        for (let i = this.chests.length - 1; i >= 0; i--) {
            const chest = this.chests[i];
            
            // Atualiza o baú
            chest.update(deltaTime);
            
            // Desenha o baú
            chest.draw(this.ctx);
            
            // Remove baús coletados
            if (chest.collected) {
                this.chests.splice(i, 1);
            }
        }
    }
    
    // Método para forçar a geração de um baú
    forceChestSpawn() {
        // Spawna um baú em uma posição aleatória na tela (não muito perto das bordas)
        const margin = 100; // Margem para evitar que o baú fique muito perto das bordas
        const x = margin + Math.random() * (this.canvas.width - 2 * margin);
        const y = margin + Math.random() * (this.canvas.height - 2 * margin);
        
        const chest = new Chest(x, y, this);
        this.chests.push(chest);
        
        // Atualiza o tempo do último baú
        this.lastChestSpawnTime = this.gameTime;
        
        // Mostra uma mensagem
        this.ui.showMessage("Um baú misterioso apareceu!", 3000);
        console.log("Baú gerado com sucesso (forçado)!");
    }
    
    // Método para criar o modal de informações do jogador
    createPlayerInfoModal() {
        // Verifica se o modal já existe no DOM
        if (document.getElementById('playerInfoModal')) {
            this.playerInfoModal = document.getElementById('playerInfoModal');
            return;
        }
        
        // Cria o modal de informações do jogador
        this.playerInfoModal = document.createElement('div');
        this.playerInfoModal.id = 'playerInfoModal';
        this.playerInfoModal.className = 'modal';
        this.playerInfoModal.style.display = 'none';
        
        // Conteúdo do modal
        this.playerInfoModal.innerHTML = `
            <div class="modal-content">
                <h2>Informações do Jogador</h2>
                <button id="closeInfoBtn" class="close-btn">×</button>
                <div class="player-info">
                    <div class="info-row">
                        <span class="info-label">Nível:</span>
                        <span id="infoLevel" class="info-value">1</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Vida:</span>
                        <span id="infoHealth" class="info-value">50/50</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Experiência:</span>
                        <span id="infoXP" class="info-value">0/50</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Dano:</span>
                        <span id="infoDamage" class="info-value">20</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Velocidade:</span>
                        <span id="infoSpeed" class="info-value">2.0</span>
                    </div>
                    <div id="aoeInfoRow" class="info-row">
                        <span class="info-label">Dano em Área:</span>
                        <span id="infoAOEDamage" class="info-value">40</span>
                    </div>
                    <div id="iceInfoRow" class="info-row">
                        <span class="info-label">Duração do Gelo:</span>
                        <span id="infoIceDuration" class="info-value">3.0s</span>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.playerInfoModal);
        
        // Adiciona o event listener para o botão de fechar
        document.getElementById('closeInfoBtn').addEventListener('click', () => {
            this.hidePlayerInfo();
        });
    }
    
    // Método para criar o modal de troca de poderes
    createPowerSwapModal() {
        // Cria o modal de troca de poderes
        this.powerSwapModal = document.createElement('div');
        this.powerSwapModal.id = 'powerSwapModal';
        this.powerSwapModal.className = 'modal';
        this.powerSwapModal.style.display = 'none';
        
        // Conteúdo do modal
        this.powerSwapModal.innerHTML = `
            <div class="modal-content">
                <h2>Trocar Poder?</h2>
                <div class="power-comparison">
                    <div class="current-power">
                        <h3>Poder Atual</h3>
                        <div id="currentPowerIcon" class="power-icon"></div>
                        <div id="currentPowerName" class="power-name"></div>
                    </div>
                    <div class="swap-arrow">⟷</div>
                    <div class="new-power">
                        <h3>Novo Poder</h3>
                        <div id="newPowerIcon" class="power-icon"></div>
                        <div id="newPowerName" class="power-name"></div>
                    </div>
                </div>
                <div class="power-description" id="newPowerDescription"></div>
                <div class="modal-buttons">
                    <button id="confirmSwapBtn">Trocar</button>
                    <button id="cancelSwapBtn">Manter Atual</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.powerSwapModal);
        
        // Adiciona os event listeners para os botões
        document.getElementById('confirmSwapBtn').addEventListener('click', () => {
            this.confirmPowerSwap();
        });
        
        document.getElementById('cancelSwapBtn').addEventListener('click', () => {
            this.cancelPowerSwap();
        });
    }
    
    // Método para mostrar o modal de troca de poderes
    showPowerSwapModal(newPowerId) {
        this.isPaused = true;
        this.newPowerToSwap = newPowerId;
        
        // Exibe o modal
        this.powerSwapModal.style.display = 'flex';
        
        // Atualiza as informações no modal
        const currentPower = this.player.availablePowers.find(p => p.id === this.player.currentPower);
        const newPower = this.player.availablePowers.find(p => p.id === newPowerId);
        
        document.getElementById('currentPowerIcon').textContent = currentPower.icon;
        document.getElementById('currentPowerName').textContent = currentPower.name;
        
        document.getElementById('newPowerIcon').textContent = newPower.icon;
        document.getElementById('newPowerName').textContent = newPower.name;
        document.getElementById('newPowerDescription').textContent = newPower.description;
        
        // Adiciona classes específicas para estilização
        document.getElementById('currentPowerIcon').className = 'power-icon';
        document.getElementById('currentPowerIcon').classList.add(`${currentPower.id}-power`);
        
        document.getElementById('newPowerIcon').className = 'power-icon';
        document.getElementById('newPowerIcon').classList.add(`${newPower.id}-power`);
    }
    
    // Método para confirmar a troca de poder
    confirmPowerSwap() {
        // Troca para o novo poder
        this.player.changePower(this.newPowerToSwap);
        
        // Exibe mensagem de confirmação
        this.ui.showMessage(`Poder alterado para: ${this.player.getPowerName(this.newPowerToSwap)}`, 2000);
        
        // Fecha o modal e retoma o jogo
        this.powerSwapModal.style.display = 'none';
        this.isPaused = false;
        this.newPowerToSwap = null;
    }
    
    // Método para cancelar a troca de poder
    cancelPowerSwap() {
        // Exibe mensagem de cancelamento
        this.ui.showMessage(`Você manteve o poder: ${this.player.getPowerName(this.player.currentPower)}`, 2000);
        
        // Fecha o modal e retoma o jogo
        this.powerSwapModal.style.display = 'none';
        this.isPaused = false;
        this.newPowerToSwap = null;
    }
    
    // Método para criar um alerta flutuante
    createFloatingAlert(text, x, y, color = '#FFFFFF') {
        this.floatingAlerts.push({
            text: text,
            x: x,
            y: y,
            color: color,
            alpha: 1,
            scale: 0,
            maxScale: 1.2,
            scaleSpeed: 0.1,
            fadeSpeed: 0.03,
            createdAt: this.gameTime,
            lifetime: 800 // Duração total em ms
        });
    }
    
    // Método para atualizar e desenhar os alertas flutuantes
    updateFloatingAlerts(deltaTime) {
        for (let i = this.floatingAlerts.length - 1; i >= 0; i--) {
            const alert = this.floatingAlerts[i];
            
            // Calcula o tempo de vida
            const elapsedTime = this.gameTime - alert.createdAt;
            
            // Remove alertas expirados
            if (elapsedTime >= alert.lifetime) {
                this.floatingAlerts.splice(i, 1);
                continue;
            }
            
            // Atualiza a escala (crescimento rápido no início)
            if (alert.scale < alert.maxScale) {
                alert.scale += alert.scaleSpeed;
            }
            
            // Atualiza a opacidade (fade out gradual)
            if (elapsedTime > alert.lifetime * 0.5) {
                alert.alpha -= alert.fadeSpeed;
                if (alert.alpha < 0) alert.alpha = 0;
            }
            
            // Move o alerta para cima lentamente
            alert.y -= 0.5;
            
            // Desenha o alerta
            this.ctx.save();
            this.ctx.globalAlpha = alert.alpha;
            this.ctx.font = `bold ${16 * alert.scale}px Arial`;
            this.ctx.fillStyle = alert.color;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(alert.text, alert.x, alert.y);
            this.ctx.restore();
        }
    }
    
    // Método para criar o modal de configuração
    createConfigModal() {
        // Verifica se o modal já existe no DOM
        if (document.getElementById('configModal')) {
            this.configModal = document.getElementById('configModal');
            return;
        }
        
        // Cria o modal de configuração
        this.configModal = document.createElement('div');
        this.configModal.id = 'configModal';
        this.configModal.className = 'modal';
        this.configModal.style.display = 'none';
        
        // Conteúdo do modal
        this.configModal.innerHTML = `
            <div class="modal-content config-modal">
                <div class="modal-header">
                    <h2>Configurações do Jogo</h2>
                    <button id="closeConfigBtn" class="close-btn">×</button>
                </div>
                
                <div class="config-tabs">
                    <button class="tab-btn active" data-tab="player">Jogador</button>
                    <button class="tab-btn" data-tab="enemies">Inimigos</button>
                    <button class="tab-btn" data-tab="powers">Poderes</button>
                    <button class="tab-btn" data-tab="items">Itens</button>
                    <button class="tab-btn" data-tab="world">Mundo</button>
                </div>
                
                <div class="config-content">
                    <!-- Configurações do Jogador -->
                    <div class="tab-content active" id="player-tab">
                        <h3>Atributos do Jogador</h3>
                        <div class="config-group">
                            <div class="config-item">
                                <label for="playerHealth">Vida Máxima:</label>
                                <input type="number" id="playerHealth" value="${this.player.maxHealth}">
                            </div>
                            <div class="config-item">
                                <label for="playerSpeed">Velocidade:</label>
                                <input type="number" id="playerSpeed" value="${this.player.speed}" step="0.1">
                            </div>
                            <div class="config-item">
                                <label for="playerXpToNextLevel">XP para Próximo Nível:</label>
                                <input type="number" id="playerXpToNextLevel" value="${this.player.xpToNextLevel}">
                            </div>
                            <div class="config-item">
                                <label for="playerInvulnerableDuration">Duração de Invulnerabilidade (ms):</label>
                                <input type="number" id="playerInvulnerableDuration" value="${this.player.invulnerableDuration}">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Configurações dos Inimigos -->
                    <div class="tab-content" id="enemies-tab">
                        <h3>Geração de Inimigos</h3>
                        <div class="config-group">
                            <div class="config-item">
                                <label for="baseEnemyCount">Quantidade Base de Inimigos:</label>
                                <input type="number" id="baseEnemyCount" value="2" min="1" max="10">
                            </div>
                            <div class="config-item">
                                <label for="enemyPowerMultiplier">Multiplicador de Poder:</label>
                                <input type="number" id="enemyPowerMultiplier" value="1" step="0.1" min="0.1">
                            </div>
                        </div>
                        
                        <h3>Atributos dos Inimigos por Zona</h3>
                        <div class="config-group">
                            <table class="config-table">
                                <thead>
                                    <tr>
                                        <th>Zona</th>
                                        <th>Vida Base</th>
                                        <th>Dano Base</th>
                                        <th>XP Base</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Planície (0)</td>
                                        <td><input type="number" id="zone0Health" value="20"></td>
                                        <td><input type="number" id="zone0Damage" value="5"></td>
                                        <td><input type="number" id="zone0XP" value="10"></td>
                                    </tr>
                                    <tr>
                                        <td>Floresta (1)</td>
                                        <td><input type="number" id="zone1Health" value="35"></td>
                                        <td><input type="number" id="zone1Damage" value="8"></td>
                                        <td><input type="number" id="zone1XP" value="20"></td>
                                    </tr>
                                    <tr>
                                        <td>Montanhas (2)</td>
                                        <td><input type="number" id="zone2Health" value="50"></td>
                                        <td><input type="number" id="zone2Damage" value="11"></td>
                                        <td><input type="number" id="zone2XP" value="30"></td>
                                    </tr>
                                    <tr>
                                        <td>Deserto (3)</td>
                                        <td><input type="number" id="zone3Health" value="65"></td>
                                        <td><input type="number" id="zone3Damage" value="14"></td>
                                        <td><input type="number" id="zone3XP" value="40"></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <!-- Configurações dos Poderes -->
                    <div class="tab-content" id="powers-tab">
                        <h3>Cooldowns e Danos</h3>
                        <div class="config-group">
                            <table class="config-table">
                                <thead>
                                    <tr>
                                        <th>Poder</th>
                                        <th>Cooldown (ms)</th>
                                        <th>Dano</th>
                                        <th>Tamanho</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Tiro de Canhão</td>
                                        <td><input type="number" id="fireballCooldown" value="${this.player.fireballMaxCooldown}"></td>
                                        <td><input type="number" id="fireballDamage" value="${this.player.fireballDamage}"></td>
                                        <td><input type="number" id="fireballSize" value="${this.player.fireballSize}"></td>
                                    </tr>
                                    <tr>
                                        <td>Gelo</td>
                                        <td><input type="number" id="iceCooldown" value="2000"></td>
                                        <td><input type="number" id="iceDamage" value="${this.player.fireballDamage * 0.7}"></td>
                                        <td><input type="number" id="iceSize" value="${this.player.iceSize}"></td>
                                    </tr>
                                    <tr>
                                        <td>Ataque em Área</td>
                                        <td><input type="number" id="aoeCooldown" value="${this.player.aoeMaxCooldown}"></td>
                                        <td><input type="number" id="aoeDamage" value="${this.player.aoeDamage}"></td>
                                        <td><input type="number" id="aoeSize" value="${this.player.aoeSize}"></td>
                                    </tr>
                                    <tr>
                                        <td>Veneno</td>
                                        <td><input type="number" id="poisonCooldown" value="${this.player.poisonMaxCooldown}"></td>
                                        <td><input type="number" id="poisonDamage" value="${this.player.poisonDamage}"></td>
                                        <td><input type="number" id="poisonSize" value="${this.player.poisonSize}"></td>
                                    </tr>
                                    <tr>
                                        <td>Flechas</td>
                                        <td><input type="number" id="arrowCooldown" value="${this.player.arrowMaxCooldown}"></td>
                                        <td><input type="number" id="arrowDamage" value="${this.player.arrowDamage}"></td>
                                        <td><input type="number" id="arrowSize" value="${this.player.arrowSize}"></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        
                        <h3>Efeitos Especiais</h3>
                        <div class="config-group">
                            <div class="config-item">
                                <label for="iceFreezeTime">Tempo de Congelamento (ms):</label>
                                <input type="number" id="iceFreezeTime" value="2000">
                            </div>
                            <div class="config-item">
                                <label for="poisonDuration">Duração do Veneno (ms):</label>
                                <input type="number" id="poisonDuration" value="5000">
                            </div>
                            <div class="config-item">
                                <label for="arrowRange">Alcance das Flechas (% da tela):</label>
                                <input type="number" id="arrowRange" value="50" min="10" max="100">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Configurações dos Itens -->
                    <div class="tab-content" id="items-tab">
                        <h3>Baús</h3>
                        <div class="config-group">
                            <div class="config-item">
                                <label for="chestSpawnChance">Chance de Spawn (%):</label>
                                <input type="number" id="chestSpawnChance" value="${this.chestSpawnChance * 100}" min="0" max="100">
                            </div>
                            <div class="config-item">
                                <label for="minChestSpawnInterval">Intervalo Mínimo (ms):</label>
                                <input type="number" id="minChestSpawnInterval" value="${this.minChestSpawnInterval}">
                            </div>
                        </div>
                        
                        <h3>Probabilidades de Itens</h3>
                        <div class="config-group">
                            <table class="config-table">
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th>Probabilidade (%)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Poder +1</td>
                                        <td><input type="number" id="powerUpChance" value="12.5" min="0" max="100" step="0.1"></td>
                                    </tr>
                                    <tr>
                                        <td>Ricochete</td>
                                        <td><input type="number" id="ricochetChance" value="12.5" min="0" max="100" step="0.1"></td>
                                    </tr>
                                    <tr>
                                        <td>Tiro de Canhão</td>
                                        <td><input type="number" id="fireballChance" value="12.5" min="0" max="100" step="0.1"></td>
                                    </tr>
                                    <tr>
                                        <td>Gelo</td>
                                        <td><input type="number" id="iceChance" value="12.5" min="0" max="100" step="0.1"></td>
                                    </tr>
                                    <tr>
                                        <td>Ataque em Área</td>
                                        <td><input type="number" id="aoeChance" value="12.5" min="0" max="100" step="0.1"></td>
                                    </tr>
                                    <tr>
                                        <td>Veneno</td>
                                        <td><input type="number" id="poisonChance" value="12.5" min="0" max="100" step="0.1"></td>
                                    </tr>
                                    <tr>
                                        <td>Flechas</td>
                                        <td><input type="number" id="arrowChance" value="12.5" min="0" max="100" step="0.1"></td>
                                    </tr>
                                    <tr>
                                        <td>Redução de Cooldown</td>
                                        <td><input type="number" id="cooldownReductionChance" value="12.5" min="0" max="100" step="0.1"></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        
                        <h3>Melhorias</h3>
                        <div class="config-group">
                            <div class="config-item">
                                <label for="cooldownReductionValue">Redução de Cooldown (%):</label>
                                <input type="number" id="cooldownReductionValue" value="2.5" min="0.1" max="50" step="0.1">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Configurações do Mundo -->
                    <div class="tab-content" id="world-tab">
                        <h3>Geração do Mundo</h3>
                        <div class="config-group">
                            <div class="config-item">
                                <label for="worldSize">Tamanho do Mundo:</label>
                                <input type="number" id="worldSize" value="20" min="5" max="100">
                            </div>
                            <div class="config-item">
                                <label for="plainsChance">Chance de Planície (%):</label>
                                <input type="number" id="plainsChance" value="40" min="0" max="100">
                            </div>
                            <div class="config-item">
                                <label for="forestChance">Chance de Floresta (%):</label>
                                <input type="number" id="forestChance" value="30" min="0" max="100">
                            </div>
                            <div class="config-item">
                                <label for="mountainsChance">Chance de Montanhas (%):</label>
                                <input type="number" id="mountainsChance" value="20" min="0" max="100">
                            </div>
                            <div class="config-item">
                                <label for="desertChance">Chance de Deserto (%):</label>
                                <input type="number" id="desertChance" value="10" min="0" max="100">
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button id="saveConfigBtn" class="btn">Salvar Configurações</button>
                    <button id="resetConfigBtn" class="btn">Restaurar Padrões</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.configModal);
        
        // Adiciona estilos CSS para o modal
        const style = document.createElement('style');
        style.textContent = `
            .config-modal {
                max-width: 1000px;
                max-height: 90vh;
                overflow-y: auto;
                background-color: #1a1a2e;
                color: #e6e6e6;
                border-radius: 10px;
                box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
                width: 90%;
            }
            
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                border-bottom: 1px solid #333;
                background-color: #16213e;
                border-radius: 10px 10px 0 0;
            }
            
            .modal-header h2 {
                margin: 0;
                color: #00b4d8;
                font-size: 28px;
            }
            
            .close-btn {
                background: none;
                border: none;
                color: #e6e6e6;
                font-size: 24px;
                cursor: pointer;
                transition: color 0.3s;
            }
            
            .close-btn:hover {
                color: #ff6b6b;
            }
            
            .config-tabs {
                display: flex;
                background-color: #16213e;
                border-bottom: 1px solid #333;
                overflow-x: auto;
                padding: 0 10px;
            }
            
            .tab-btn {
                padding: 10px 20px;
                background: none;
                border: none;
                color: #e6e6e6;
                cursor: pointer;
                transition: all 0.3s;
                font-size: 16px;
                white-space: nowrap;
            }
            
            .tab-btn:hover {
                color: #00b4d8;
            }
            
            .tab-btn.active {
                color: #00b4d8;
                border-bottom: 2px solid #00b4d8;
            }
            
            .config-content {
                padding: 30px;
            }
            
            .tab-content {
                display: none;
            }
            
            .tab-content.active {
                display: block;
            }
            
            .config-group {
                margin-bottom: 25px;
                background-color: #1e2a3a;
                padding: 20px;
                border-radius: 8px;
            }
            
            .config-item {
                margin-bottom: 10px;
                display: flex;
                align-items: center;
            }
            
            .config-item label {
                flex: 1;
                margin-right: 10px;
            }
            
            .config-item input, .config-item select {
                width: 150px;
                padding: 8px;
                background-color: #2a3950;
                border: 1px solid #3a4a60;
                color: #e6e6e6;
                border-radius: 4px;
            }
            
            .config-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 10px;
            }
            
            .config-table th, .config-table td {
                padding: 10px 15px;
                text-align: left;
                border-bottom: 1px solid #333;
            }
            
            .config-table th {
                color: #00b4d8;
                font-weight: bold;
            }
            
            .config-table input {
                width: 100px;
                padding: 6px;
                background-color: #2a3950;
                border: 1px solid #3a4a60;
                color: #e6e6e6;
                border-radius: 4px;
            }
            
            h3 {
                color: #00b4d8;
                margin-top: 0;
                margin-bottom: 20px;
                font-size: 22px;
                border-bottom: 1px solid #333;
                padding-bottom: 10px;
            }
            
            .modal-footer {
                padding: 15px 20px;
                border-top: 1px solid #333;
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            }
            
            .btn {
                padding: 10px 20px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 16px;
                transition: all 0.3s;
            }
            
            #saveConfigBtn {
                background-color: #00b4d8;
                color: #fff;
            }
            
            #saveConfigBtn:hover {
                background-color: #0096c7;
            }
            
            #resetConfigBtn {
                background-color: #3a4a60;
                color: #e6e6e6;
            }
            
            #resetConfigBtn:hover {
                background-color: #4a5a70;
            }
        `;
        document.head.appendChild(style);
        
        // Adiciona os event listeners para as abas
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove a classe active de todos os botões e conteúdos
                tabButtons.forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                
                // Adiciona a classe active ao botão clicado e ao conteúdo correspondente
                button.classList.add('active');
                document.getElementById(`${button.dataset.tab}-tab`).classList.add('active');
            });
        });
        
        // Adiciona o event listener para o botão de fechar
        document.getElementById('closeConfigBtn').addEventListener('click', () => {
            this.hideConfigModal();
        });
        
        // Adiciona o event listener para o botão de salvar
        document.getElementById('saveConfigBtn').addEventListener('click', () => {
            this.saveConfig();
        });
        
        // Adiciona o event listener para o botão de restaurar padrões
        document.getElementById('resetConfigBtn').addEventListener('click', () => {
            this.resetConfig();
        });
    }
    
    // Método para mostrar o modal de configuração
    showConfigModal() {
        this.isConfigVisible = true;
        this.configModal.style.display = 'flex';
        
        // Atualiza os valores dos campos do formulário com os valores atuais do jogo
        this.updateConfigModalValues();
    }
    
    // Método para atualizar os valores dos campos do formulário com os valores atuais do jogo
    updateConfigModalValues() {
        // Configurações do jogador
        document.getElementById('playerHealth').value = this.player.maxHealth;
        document.getElementById('playerSpeed').value = this.player.speed;
        document.getElementById('playerXpToNextLevel').value = this.player.xpToNextLevel;
        document.getElementById('playerInvulnerableDuration').value = this.player.invulnerableDuration;
        
        // Configurações dos poderes
        document.getElementById('fireballCooldown').value = this.player.fireballMaxCooldown;
        document.getElementById('fireballDamage').value = this.player.fireballDamage;
        document.getElementById('fireballSize').value = this.player.fireballSize;
        
        // Verifica se os elementos existem antes de tentar definir seus valores
        if (document.getElementById('iceCooldown')) {
            const icePower = this.player.availablePowers.find(p => p.id === 'ice');
            document.getElementById('iceCooldown').value = icePower ? icePower.maxCooldown : 2000;
            document.getElementById('iceDamage').value = this.player.fireballDamage * 0.7;
            document.getElementById('iceSize').value = this.player.iceSize;
        }
        
        document.getElementById('aoeCooldown').value = this.player.aoeMaxCooldown;
        document.getElementById('aoeDamage').value = this.player.aoeDamage;
        document.getElementById('aoeSize').value = this.player.aoeSize;
        
        if (document.getElementById('poisonCooldown')) {
            document.getElementById('poisonCooldown').value = this.player.poisonMaxCooldown;
            document.getElementById('poisonDamage').value = this.player.poisonDamage;
            document.getElementById('poisonSize').value = this.player.poisonSize;
        }
        
        if (document.getElementById('arrowCooldown')) {
            document.getElementById('arrowCooldown').value = this.player.arrowMaxCooldown;
            document.getElementById('arrowDamage').value = this.player.arrowDamage;
            document.getElementById('arrowSize').value = this.player.arrowSize;
        }
        
        // Configurações de baús
        document.getElementById('chestSpawnChance').value = this.chestSpawnChance * 100;
        document.getElementById('minChestSpawnInterval').value = this.minChestSpawnInterval;
    }
    
    // Método para ocultar o modal de configuração
    hideConfigModal() {
        this.isConfigVisible = false;
        this.configModal.style.display = 'none';
        
        // Retoma o jogo quando o modal é fechado
        this.isPaused = false;
    }
    
    // Método para alternar o modal de configuração
    toggleConfigModal() {
        if (this.isConfigVisible) {
            this.hideConfigModal();
        } else {
            this.showConfigModal();
        }
    }
    
    // Método para salvar as configurações
    saveConfig() {
        // Configurações do jogador
        this.player.maxHealth = parseInt(document.getElementById('playerHealth').value) || this.player.maxHealth;
        this.player.health = Math.min(this.player.health, this.player.maxHealth);
        this.player.speed = parseFloat(document.getElementById('playerSpeed').value) || this.player.speed;
        this.player.xpToNextLevel = parseInt(document.getElementById('playerXpToNextLevel').value) || this.player.xpToNextLevel;
        this.player.invulnerableDuration = parseInt(document.getElementById('playerInvulnerableDuration').value) || this.player.invulnerableDuration;
        
        // Configurações dos poderes
        const fireballCooldown = parseInt(document.getElementById('fireballCooldown').value);
        if (!isNaN(fireballCooldown)) {
            this.player.fireballMaxCooldown = fireballCooldown;
            const fireballPower = this.player.availablePowers.find(p => p.id === 'fireball');
            if (fireballPower) fireballPower.maxCooldown = fireballCooldown;
        }
        
        const fireballDamage = parseInt(document.getElementById('fireballDamage').value);
        if (!isNaN(fireballDamage)) {
            this.player.fireballDamage = fireballDamage;
        }
        
        const fireballSize = parseInt(document.getElementById('fireballSize').value);
        if (!isNaN(fireballSize)) {
            this.player.fireballSize = fireballSize;
        }
        
        // Gelo
        const iceCooldown = parseInt(document.getElementById('iceCooldown').value);
        if (!isNaN(iceCooldown)) {
            const icePower = this.player.availablePowers.find(p => p.id === 'ice');
            if (icePower) icePower.maxCooldown = iceCooldown;
        }
        
        const iceSize = parseInt(document.getElementById('iceSize').value);
        if (!isNaN(iceSize)) {
            this.player.iceSize = iceSize;
        }
        
        // AOE
        const aoeCooldown = parseInt(document.getElementById('aoeCooldown').value);
        if (!isNaN(aoeCooldown)) {
            this.player.aoeMaxCooldown = aoeCooldown;
            const aoePower = this.player.availablePowers.find(p => p.id === 'aoe');
            if (aoePower) aoePower.maxCooldown = aoeCooldown;
        }
        
        const aoeDamage = parseInt(document.getElementById('aoeDamage').value);
        if (!isNaN(aoeDamage)) {
            this.player.aoeDamage = aoeDamage;
        }
        
        const aoeSize = parseInt(document.getElementById('aoeSize').value);
        if (!isNaN(aoeSize)) {
            this.player.aoeSize = aoeSize;
        }
        
        // Veneno
        const poisonCooldown = parseInt(document.getElementById('poisonCooldown').value);
        if (!isNaN(poisonCooldown)) {
            this.player.poisonMaxCooldown = poisonCooldown;
            const poisonPower = this.player.availablePowers.find(p => p.id === 'poison');
            if (poisonPower) poisonPower.maxCooldown = poisonCooldown;
        }
        
        const poisonDamage = parseFloat(document.getElementById('poisonDamage').value);
        if (!isNaN(poisonDamage)) {
            this.player.poisonDamage = poisonDamage;
        }
        
        const poisonSize = parseInt(document.getElementById('poisonSize').value);
        if (!isNaN(poisonSize)) {
            this.player.poisonSize = poisonSize;
        }
        
        // Flechas
        const arrowCooldown = parseInt(document.getElementById('arrowCooldown').value);
        if (!isNaN(arrowCooldown)) {
            this.player.arrowMaxCooldown = arrowCooldown;
            const arrowPower = this.player.availablePowers.find(p => p.id === 'arrow');
            if (arrowPower) arrowPower.maxCooldown = arrowCooldown;
        }
        
        const arrowDamage = parseInt(document.getElementById('arrowDamage').value);
        if (!isNaN(arrowDamage)) {
            this.player.arrowDamage = arrowDamage;
        }
        
        const arrowSize = parseInt(document.getElementById('arrowSize').value);
        if (!isNaN(arrowSize)) {
            this.player.arrowSize = arrowSize;
        }
        
        // Configurações de baús
        const chestSpawnChance = parseFloat(document.getElementById('chestSpawnChance').value);
        if (!isNaN(chestSpawnChance)) {
            this.chestSpawnChance = chestSpawnChance / 100;
        }
        
        const minChestSpawnInterval = parseInt(document.getElementById('minChestSpawnInterval').value);
        if (!isNaN(minChestSpawnInterval)) {
            this.minChestSpawnInterval = minChestSpawnInterval;
        }
        
        // Salva as configurações no localStorage para persistência
        const config = {
            player: {
                maxHealth: this.player.maxHealth,
                speed: this.player.speed,
                xpToNextLevel: this.player.xpToNextLevel,
                invulnerableDuration: this.player.invulnerableDuration,
                fireballMaxCooldown: this.player.fireballMaxCooldown,
                fireballDamage: this.player.fireballDamage,
                fireballSize: this.player.fireballSize,
                aoeMaxCooldown: this.player.aoeMaxCooldown,
                aoeDamage: this.player.aoeDamage,
                aoeSize: this.player.aoeSize,
                poisonMaxCooldown: this.player.poisonMaxCooldown,
                poisonDamage: this.player.poisonDamage,
                poisonSize: this.player.poisonSize,
                arrowMaxCooldown: this.player.arrowMaxCooldown,
                arrowDamage: this.player.arrowDamage,
                arrowSize: this.player.arrowSize
            },
            game: {
                chestSpawnChance: this.chestSpawnChance,
                minChestSpawnInterval: this.minChestSpawnInterval
            }
        };
        
        localStorage.setItem('gameConfig', JSON.stringify(config));
        
        // Exibe uma mensagem de confirmação
        this.createFloatingAlert('Configurações salvas com sucesso!', this.canvas.width / 2, this.canvas.height / 2, '#00b4d8');
        
        // Fecha o modal
        this.hideConfigModal();
        
        // Recarrega a página para aplicar as novas configurações
        setTimeout(() => {
            window.location.reload();
        }, 1000); // Espera 1 segundo para que o usuário veja a mensagem de confirmação
    }
    
    // Método para carregar as configurações do localStorage
    loadConfig() {
        const savedConfig = localStorage.getItem('gameConfig');
        
        if (savedConfig) {
            try {
                const config = JSON.parse(savedConfig);
                
                // Aplica as configurações do jogador
                if (config.player) {
                    this.player.maxHealth = config.player.maxHealth || this.player.maxHealth;
                    this.player.health = config.player.maxHealth || this.player.health; // Restaura a vida para o máximo
                    this.player.speed = config.player.speed || this.player.speed;
                    this.player.xpToNextLevel = config.player.xpToNextLevel || this.player.xpToNextLevel;
                    this.player.invulnerableDuration = config.player.invulnerableDuration || this.player.invulnerableDuration;
                    
                    // Configurações dos poderes
                    this.player.fireballMaxCooldown = config.player.fireballMaxCooldown || this.player.fireballMaxCooldown;
                    this.player.fireballDamage = config.player.fireballDamage || this.player.fireballDamage;
                    this.player.fireballSize = config.player.fireballSize || this.player.fireballSize;
                    
                    this.player.aoeMaxCooldown = config.player.aoeMaxCooldown || this.player.aoeMaxCooldown;
                    this.player.aoeDamage = config.player.aoeDamage || this.player.aoeDamage;
                    this.player.aoeSize = config.player.aoeSize || this.player.aoeSize;
                    
                    this.player.poisonMaxCooldown = config.player.poisonMaxCooldown || this.player.poisonMaxCooldown;
                    this.player.poisonDamage = config.player.poisonDamage || this.player.poisonDamage;
                    this.player.poisonSize = config.player.poisonSize || this.player.poisonSize;
                    
                    this.player.arrowMaxCooldown = config.player.arrowMaxCooldown || this.player.arrowMaxCooldown;
                    this.player.arrowDamage = config.player.arrowDamage || this.player.arrowDamage;
                    this.player.arrowSize = config.player.arrowSize || this.player.arrowSize;
                    
                    // Atualiza os poderes disponíveis
                    const fireballPower = this.player.availablePowers.find(p => p.id === 'fireball');
                    if (fireballPower) fireballPower.maxCooldown = this.player.fireballMaxCooldown;
                    
                    const aoePower = this.player.availablePowers.find(p => p.id === 'aoe');
                    if (aoePower) aoePower.maxCooldown = this.player.aoeMaxCooldown;
                    
                    const poisonPower = this.player.availablePowers.find(p => p.id === 'poison');
                    if (poisonPower) poisonPower.maxCooldown = this.player.poisonMaxCooldown;
                    
                    const arrowPower = this.player.availablePowers.find(p => p.id === 'arrow');
                    if (arrowPower) arrowPower.maxCooldown = this.player.arrowMaxCooldown;
                }
                
                // Aplica as configurações do jogo
                if (config.game) {
                    this.chestSpawnChance = config.game.chestSpawnChance || this.chestSpawnChance;
                    this.minChestSpawnInterval = config.game.minChestSpawnInterval || this.minChestSpawnInterval;
                }
                
                console.log('Configurações carregadas com sucesso do localStorage');
            } catch (error) {
                console.error('Erro ao carregar configurações:', error);
            }
        }
    }
    
    // Métodos auxiliares para obter valores dos inputs com tratamento de erro
    getInputValueInt(id, defaultValue) {
        const element = document.getElementById(id);
        if (element) {
            return parseInt(element.value) || defaultValue;
        }
        return defaultValue;
    }
    
    getInputValueFloat(id, defaultValue) {
        const element = document.getElementById(id);
        if (element) {
            return parseFloat(element.value) || defaultValue;
        }
        return defaultValue;
    }
    
    // Método para restaurar as configurações padrão
    resetConfig() {
        // Valores padrão do jogador
        document.getElementById('playerHealth').value = 100;
        document.getElementById('playerSpeed').value = 3;
        document.getElementById('playerXpToNextLevel').value = 100;
        document.getElementById('playerInvulnerableDuration').value = 1000;
        
        // Valores padrão dos poderes
        document.getElementById('fireballCooldown').value = 500;
        document.getElementById('fireballDamage').value = 10;
        document.getElementById('fireballSize').value = 10;
        
        document.getElementById('iceCooldown').value = 2000;
        document.getElementById('iceDamage').value = 7;
        document.getElementById('iceSize').value = 10;
        
        document.getElementById('aoeCooldown').value = 3000;
        document.getElementById('aoeDamage').value = 15;
        document.getElementById('aoeSize').value = 80;
        
        document.getElementById('poisonCooldown').value = 1500;
        document.getElementById('poisonDamage').value = 0.5;
        document.getElementById('poisonSize').value = 10;
        
        document.getElementById('arrowCooldown').value = 250;
        document.getElementById('arrowDamage').value = 12;
        document.getElementById('arrowSize').value = 12;
        
        // Valores padrão de efeitos especiais
        document.getElementById('iceFreezeTime').value = 2000;
        document.getElementById('poisonDuration').value = 5000;
        document.getElementById('arrowRange').value = 50;
        
        // Valores padrão de baús
        document.getElementById('chestSpawnChance').value = 80;
        document.getElementById('minChestSpawnInterval').value = 10000;
        
        // Valores padrão de probabilidades de itens
        document.getElementById('powerUpChance').value = 12.5;
        document.getElementById('ricochetChance').value = 12.5;
        document.getElementById('fireballChance').value = 12.5;
        document.getElementById('iceChance').value = 12.5;
        document.getElementById('aoeChance').value = 12.5;
        document.getElementById('poisonChance').value = 12.5;
        document.getElementById('arrowChance').value = 12.5;
        document.getElementById('cooldownReductionChance').value = 12.5;
        
        // Valores padrão de melhorias
        document.getElementById('cooldownReductionValue').value = 2.5;
        
        // Remove as configurações do localStorage
        localStorage.removeItem('gameConfig');
        
        // Exibe uma mensagem de confirmação
        this.createFloatingAlert('Configurações restauradas para os valores padrão!', this.canvas.width / 2, this.canvas.height / 2, '#00b4d8');
        
        // Recarrega a página para aplicar as configurações padrão
        setTimeout(() => {
            window.location.reload();
        }, 1000); // Espera 1 segundo para que o usuário veja a mensagem de confirmação
    }
} 