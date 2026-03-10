import { AOEEffect } from '../combat/aoe.js';
import { CONFIG } from '../core/config.js';
import { normalizeVector, toFiniteNumber } from '../core/math.js';

export class Player {
    constructor(game) {
        this.game = game;
        
        // Posição e dimensões
        this.width = CONFIG.PLAYER.WIDTH;
        this.height = CONFIG.PLAYER.HEIGHT;
        
        // Posiciona o jogador no centro da tela
        this.x = game.canvas.width / 2 - this.width / 2;
        this.y = game.canvas.height / 2 - this.height / 2;
        
        // Movimento
        this.speed = CONFIG.PLAYER.SPEED;
        this.moveX = 0;
        this.moveY = 0;
        
        // Vida e XP
        this.health = CONFIG.PLAYER.MAX_HEALTH;
        this.maxHealth = CONFIG.PLAYER.MAX_HEALTH;
        this.xp = 0;
        this.level = 1;
        this.xpToNextLevel = CONFIG.PLAYER.XP_TO_NEXT_LEVEL;
        
        // Invulnerabilidade temporária após tomar dano
        this.invulnerableTime = 0;
        this.invulnerableDuration = CONFIG.PLAYER.INVULNERABLE_DURATION; // 1 segundo
        
        // Knockback
        this.knockbackX = 0;
        this.knockbackY = 0;
        this.knockbackDuration = 0;
        
        // Cooldowns de habilidades
        this.fireballCooldown = 0;
        this.fireballMaxCooldown = CONFIG.PLAYER.FIREBALL_MAX_COOLDOWN; // 0.5 segundos
        this.aoeCooldown = 0;
        this.aoeMaxCooldown = CONFIG.PLAYER.AOE_MAX_COOLDOWN; // 3 segundos
        this.iceCooldown = 0;
        this.iceMaxCooldown = CONFIG.PLAYER.ICE_MAX_COOLDOWN;
        this.poisonCooldown = 0;
        this.poisonMaxCooldown = CONFIG.PLAYER.POISON_MAX_COOLDOWN; // 1.5 segundos
        this.arrowCooldown = 0;
        this.arrowMaxCooldown = CONFIG.PLAYER.ARROW_MAX_COOLDOWN; // 0.25 segundos (metade do tiro de fogo)
        
        // Dano das habilidades
        this.fireballDamage = CONFIG.PLAYER.FIREBALL_DAMAGE;
        this.aoeDamage = CONFIG.PLAYER.AOE_DAMAGE;
        this.poisonDamage = CONFIG.PLAYER.POISON_DAMAGE; // Dano por segundo do veneno
        this.arrowDamage = CONFIG.PLAYER.ARROW_DAMAGE; // Dano das flechas
        
        // Tamanho dos projéteis
        this.fireballSize = CONFIG.PLAYER.FIREBALL_SIZE;
        this.iceSize = CONFIG.PLAYER.ICE_SIZE;
        this.poisonSize = CONFIG.PLAYER.POISON_SIZE;
        this.arrowSize = CONFIG.PLAYER.ARROW_SIZE;
        this.aoeSize = CONFIG.PLAYER.AOE_SIZE;
        
        // Duração do gelo
        this.iceDuration = CONFIG.PLAYER.ICE_DURATION;
        
        // Direção atual (para o disparo)
        this.direction = 'right'; // 'up', 'right', 'down', 'left'
        
        // Ângulo de rotação (em radianos)
        this.angle = 0;  // Ângulo do canhão (mouse)
        this.bodyAngle = 0; // Ângulo do corpo do tanque (movimento)
        
        // Sistema de rastros de rodas
        this.trackMarks = [];
        this.lastTrackTime = 0;
        this.trackInterval = 100; // Intervalo para criar novas marcas (ms)
        
        // Novos poderes e melhorias
        this.powerMultiplier = 1; // Multiplicador de poderes (item +1)
        this.hasRicochet = false; // Se tem a habilidade de ricochete
        
        // Sistema de congelamento de inimigos
        this.frozenEnemies = {}; // Armazena os inimigos congelados e seus tempos
        
        // Sistema de redução de cooldown
        this.cooldownMultiplier = 1; // Multiplicador de cooldown (1 = normal, < 1 = reduzido)
        this.cooldownReductionEndTime = 0; // Tempo em que o efeito de redução de cooldown termina
        
        // Configuração dos poderes disponíveis
        this.availablePowers = [
            {
                id: 'fireball',
                name: 'Tiro de Canhão',
                description: 'Dispara uma bola de fogo na direção do cursor',
                icon: '🔥',
                cooldown: 0,
                maxCooldown: this.fireballMaxCooldown
            },
            {
                id: 'ice',
                name: 'Gelo',
                description: 'Dispara um projétil de gelo que congela os inimigos',
                icon: '❄️',
                cooldown: 0,
                maxCooldown: 2000
            },
            {
                id: 'aoe',
                name: 'Ataque em Área',
                description: 'Cria uma explosão que causa dano em área',
                icon: '💥',
                cooldown: 0,
                maxCooldown: this.aoeMaxCooldown
            },
            {
                id: 'poison',
                name: 'Veneno',
                description: 'Dispara um projétil de veneno que causa dano ao longo do tempo',
                icon: '☠️',
                cooldown: 0,
                maxCooldown: this.poisonMaxCooldown
            },
            {
                id: 'arrow',
                name: 'Flechas',
                description: 'Dispara flechas rápidas com alcance limitado',
                icon: '🏹',
                cooldown: 0,
                maxCooldown: this.arrowMaxCooldown
            }
        ];
        
        // Seleciona um poder aleatório inicial
        const randomPowerIndex = Math.floor(Math.random() * this.availablePowers.length);
        this.currentPower = this.availablePowers[randomPowerIndex].id;
        
        // Atualiza o slot de poder na UI com o poder inicial
        this.updatePowerSlotUI();
        
        // Sistema de partículas para o efeito de redução de cooldown
        this.cooldownParticles = [];
        
        // Alcance das flechas
        this.arrowRange = 0; // Será calculado como metade da tela
        
        // Rastreamento de poderes acumulados
        this.powerStats = {
            powerMultiplier: 0,
            ricochet: 0,
            cooldownReduction: 0,
            totalCooldownReduction: 0,
            iceDuration: 0,
            poisonDamage: 0,
            arrowDamage: 0,
            aoeDamage: 0
        };
        
        // Ricochete
        this.ricochetCount = 0;
    }
    
    update(deltaTime) {
        // Posição anterior para comparação
        const oldX = this.x;
        const oldY = this.y;
        
        // Processa o knockback
        if (this.knockbackDuration > 0) {
            this.x += this.knockbackX;
            this.y += this.knockbackY;
            this.knockbackDuration -= deltaTime;
            
            // Limita o jogador às bordas do canvas durante o knockback
            this.x = Math.max(0, Math.min(this.x, this.game.canvas.width - this.width));
            this.y = Math.max(0, Math.min(this.y, this.game.canvas.height - this.height));
        } else {
            // Movimento normal
            this.x += this.moveX * this.speed;
            this.y += this.moveY * this.speed;
            
            //console.log('x: ' + this.x, 'y: ' + this.y, 'width: ' + this.width, 'height: ' + this.height, 'canvasWidth: ' + this.game.canvas.width, 'canvasHeight: ' + this.game.canvas.height);
            // Limita o jogador às bordas do canvas
            //this.x = Math.max(0, Math.min(this.x, this.game.canvas.width - this.width));
            //this.y = Math.max(0, Math.min(this.y, this.game.canvas.height - this.height));
        }
        
        // Reduz o tempo de invulnerabilidade
        if (this.invulnerableTime > 0) {
            this.invulnerableTime -= deltaTime;
        }
        
        // Atualiza as partículas do efeito de redução de cooldown
        if (this.cooldownParticles && this.cooldownParticles.length > 0) {
            this.updateCooldownParticles(deltaTime);
        }
        
        // Reduz os cooldowns dos poderes
        if (this.fireballCooldown > 0) {
            this.fireballCooldown -= deltaTime * (1 / this.cooldownMultiplier);
            if (this.fireballCooldown < 0) this.fireballCooldown = 0;
        }
        
        if (this.aoeCooldown > 0) {
            this.aoeCooldown -= deltaTime * (1 / this.cooldownMultiplier);
            if (this.aoeCooldown < 0) this.aoeCooldown = 0;
        }
        
        if (this.iceCooldown > 0) {
            this.iceCooldown -= deltaTime * (1 / this.cooldownMultiplier);
            if (this.iceCooldown < 0) this.iceCooldown = 0;
        }
        
        if (this.poisonCooldown > 0) {
            this.poisonCooldown -= deltaTime * (1 / this.cooldownMultiplier);
            if (this.poisonCooldown < 0) this.poisonCooldown = 0;
        }
        
        if (this.arrowCooldown > 0) {
            this.arrowCooldown -= deltaTime * (1 / this.cooldownMultiplier);
            if (this.arrowCooldown < 0) this.arrowCooldown = 0;
        }
        
        // Atualiza os inimigos congelados
        this.updateFrozenEnemies();
        
        // Cria marcas de rastro se o jogador estiver se movendo
        if (this.moveX !== 0 || this.moveY !== 0) {
            // Atualiza o ângulo do corpo com base na direção do movimento
            this.bodyAngle = Math.atan2(this.moveY, this.moveX);
            
            // Cria marcas de rastro periodicamente
            if (this.game.gameTime - this.lastTrackTime > this.trackInterval) {
                this.createTrackMarks();
                this.lastTrackTime = this.game.gameTime;
            }
        }
        
        // Atualiza o tempo de vida dos rastros e remove os expirados
        for (let i = this.trackMarks.length - 1; i >= 0; i--) {
            this.trackMarks[i].life -= deltaTime;
            if (this.trackMarks[i].life <= 0) {
                this.trackMarks.splice(i, 1);
            }
        }
    }
    
    createTrackMarks() {
        // Calcula a posição das rodas com base no ângulo do corpo do tanque
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        // Distância das rodas do centro do tanque
        const trackWidth = this.width * 0.8;
        const trackOffset = this.width * 0.3;
        
        // Calcula a posição das rodas perpendiculares à direção do tanque
        const perpAngle = this.bodyAngle + Math.PI / 2;
        
        // Posição da roda esquerda
        const leftTrackX = centerX + Math.cos(perpAngle) * trackOffset;
        const leftTrackY = centerY + Math.sin(perpAngle) * trackOffset;
        
        // Posição da roda direita
        const rightTrackX = centerX - Math.cos(perpAngle) * trackOffset;
        const rightTrackY = centerY - Math.sin(perpAngle) * trackOffset;
        
        // Adiciona as marcas de rodas
        this.trackMarks.push({
            x: leftTrackX,
            y: leftTrackY,
            angle: this.bodyAngle,
            life: 3000, // Duração em ms
            maxLife: 3000
        });
        
        this.trackMarks.push({
            x: rightTrackX,
            y: rightTrackY,
            angle: this.bodyAngle,
            life: 3000, // Duração em ms
            maxLife: 3000
        });
    }
    
    draw(ctx) {
        // Desenha os rastros de rodas primeiro (para ficarem atrás do tanque)
        this.drawTrackMarks(ctx);
        
        // Desenha as partículas do efeito de redução de cooldown (atrás do tanque)
        if (this.cooldownParticles && this.cooldownParticles.length > 0) {
            this.drawCooldownParticles(ctx);
        }
        
        // Desenha o indicador de redução de cooldown se estiver ativo
        if (this.cooldownReductionEndTime > this.game.gameTime) {
            this.drawCooldownReductionIndicator(ctx);
        }
        
        // Desenha o tanque
        ctx.save();
        
        // Aplica o efeito de invulnerabilidade (piscar)
        if (this.invulnerableTime > 0 && Math.floor(this.invulnerableTime / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        // Efeito visual de redução de cooldown ativo
        if (this.cooldownReductionEndTime > this.game.gameTime) {
            // Adiciona um brilho ciano ao redor do tanque
            ctx.shadowColor = '#00FFFF';
            ctx.shadowBlur = 10;
        }
        
        // Translada para o centro do tanque
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        ctx.translate(centerX, centerY);
        
        // Rotaciona o contexto de acordo com o ângulo do corpo do tanque
        ctx.rotate(this.bodyAngle);
        
        // Desenha o corpo do tanque (retângulo)
        ctx.fillStyle = '#3a7d44'; // Verde militar
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // Desenha as lagartas/rodas do tanque
        ctx.fillStyle = '#2c3e50'; // Cinza escuro
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height / 6); // Lagarta superior
        ctx.fillRect(-this.width / 2, this.height / 2 - this.height / 6, this.width, this.height / 6); // Lagarta inferior
        
        // Desenha a torre do tanque (não rotaciona com o corpo)
        ctx.save();
        // Desfaz a rotação do corpo para a torre ficar independente
        ctx.rotate(-this.bodyAngle);
        // Aplica a rotação do canhão (mouse)
        ctx.rotate(this.angle);
        
        // Desenha a torre
        ctx.fillStyle = '#2d572c'; // Verde mais escuro
        const towerSize = this.width * 0.7;
        ctx.fillRect(-towerSize / 2, -towerSize / 2, towerSize, towerSize);
        
        // Desenha o canhão
        ctx.fillStyle = '#1a1a1a'; // Quase preto
        const cannonLength = this.width * 0.8;
        const cannonWidth = this.height / 6;
        ctx.fillRect(0, -cannonWidth / 2, cannonLength, cannonWidth);
        
        ctx.restore(); // Restaura o contexto após desenhar a torre e o canhão
        
        ctx.restore(); // Restaura o contexto após desenhar o tanque
    }
    
    drawTrackMarks(ctx) {
        for (const track of this.trackMarks) {
            ctx.save();
            
            // Define a opacidade com base no tempo de vida restante
            const alpha = track.life / track.maxLife;
            ctx.globalAlpha = alpha;
            
            // Translada para a posição da marca
            ctx.translate(track.x, track.y);
            
            // Rotaciona de acordo com o ângulo do tanque quando a marca foi criada
            ctx.rotate(track.angle);
            
            // Desenha a marca da roda (pequeno retângulo)
            ctx.fillStyle = '#333333';
            ctx.fillRect(-2, -4, 4, 8);
            
            ctx.restore();
        }
    }
    
    drawCooldownParticles(ctx) {
        for (const particle of this.cooldownParticles) {
            ctx.save();
            
            // Define a opacidade com base no tempo de vida restante
            ctx.globalAlpha = particle.alpha;
            
            // Desenha a partícula (pequeno círculo com brilho)
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            
            // Adiciona um brilho ao redor da partícula
            ctx.shadowColor = '#00FFFF';
            ctx.shadowBlur = 5;
            
            // Preenche a partícula
            ctx.fillStyle = particle.color;
            ctx.fill();
            
            ctx.restore();
        }
    }
    
    drawCooldownReductionIndicator(ctx) {
        // Só desenha se houver redução de cooldown ativa
        if (this.cooldownMultiplier >= 1) return;
        
        // Calcula a redução percentual
        const reductionPercent = Math.round((1 - this.cooldownMultiplier) * 100);
        
        // Desenha um pequeno ícone de ampulheta acima do jogador
        ctx.save();
        
        // Posição acima do jogador
        const x = this.x + this.width / 2;
        const y = this.y - 20;
        
        // Desenha o ícone da ampulheta
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#00FFFF';
        ctx.fillText('⏱️', x, y);
        
        // Desenha o texto com a porcentagem de redução
        ctx.font = '12px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`-${reductionPercent}%`, x, y + 15);
        
        ctx.restore();
    }
    
    setDirection(direction) {
        this.direction = direction;
    }
    
    setMovement(x, y) {
        this.moveX = x;
        this.moveY = y;
    }
    
    fireProjectile() {
        if (this.fireballCooldown > 0) return;
        
        // Centro do jogador
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        // Velocidade do projétil
        const speed = 8;
        const velocityX = Math.cos(this.angle) * speed;
        const velocityY = Math.sin(this.angle) * speed;
        
        // Posição inicial do projétil (um pouco afastado do jogador)
        const distance = 20; // Distância do centro do jogador
        const x = centerX + Math.cos(this.angle) * distance - 5; // -5 para centralizar o projétil
        const y = centerY + Math.sin(this.angle) * distance - 5; // -5 para centralizar o projétil
        
        // Cria múltiplos projéteis com base no multiplicador de poder
        for (let i = 0; i < this.powerMultiplier; i++) {
            // Pequeno desvio para cada projétil adicional
            const angleOffset = i === 0 ? 0 : (Math.random() * 0.2 - 0.1);
            const adjustedVelocityX = Math.cos(this.angle + angleOffset) * speed;
            const adjustedVelocityY = Math.sin(this.angle + angleOffset) * speed;
            
            // Pequeno atraso para cada projétil adicional
            setTimeout(() => {
                const projectile = this.game.createProjectile('fireball', [
                    x,
                    y,
                    this.fireballSize,
                    this.fireballSize,
                    adjustedVelocityX,
                    adjustedVelocityY,
                    this.fireballDamage
                ]);
                
                // Aplica ricochete se o jogador tiver a habilidade
                if (this.hasRicochet) {
                    projectile.canRicochet = true;
                }
                
                this.game.addProjectile(projectile);
            }, i * 100); // 100ms de atraso entre cada projétil
        }
        
        // Define o cooldown (aplicando o multiplicador de cooldown)
        const power = this.availablePowers.find(p => p.id === 'fireball');
        this.fireballCooldown = power.maxCooldown * this.cooldownMultiplier;
        
        // Atualiza a UI
        this.updatePowerSlotUI();
    }
    
    fireAOE() {
        // Verifica se está em cooldown
        if (this.aoeCooldown > 0) {
            return;
        }
        
        console.log("Usando poder de AOE!");
        
        // Centro do jogador
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        // Cria múltiplos AOEs com base no multiplicador de poder
        for (let i = 0; i < this.powerMultiplier; i++) {
            // Posição do AOE (a uma distância fixa na direção do mouse)
            const distance = 80 + (i * 20); // Distância aumenta para cada AOE adicional
            const x = centerX + Math.cos(this.angle) * distance;
            const y = centerY + Math.sin(this.angle) * distance;
            
            // Pequeno atraso para cada AOE adicional
            setTimeout(() => {
                const aoe = new AOEEffect(
                    x, 
                    y, 
                    this.aoeSize, // raio personalizado
                    this.aoeDamage,
                    500 // duração em ms
                );
                
                this.game.addAOEEffect(aoe);
            }, i * 200); // 200ms de atraso entre cada AOE
        }
        
        // Define o cooldown (aplicando o multiplicador de cooldown)
        const power = this.availablePowers.find(p => p.id === 'aoe');
        this.aoeCooldown = power.maxCooldown * this.cooldownMultiplier;
        
        // Atualiza a UI
        this.updatePowerSlotUI();
    }
    
    fireIce() {
        // Verifica se o poder está em cooldown
        if (this.iceCooldown > 0) return;
        
        // Centro do jogador
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        // Velocidade do projétil
        const speed = 6; // Um pouco mais lento que a bola de fogo
        const velocityX = Math.cos(this.angle) * speed;
        const velocityY = Math.sin(this.angle) * speed;
        
        // Posição inicial do projétil (um pouco afastado do jogador)
        const distance = 20; // Distância do centro do jogador
        const x = centerX + Math.cos(this.angle) * distance - 5; // -5 para centralizar o projétil
        const y = centerY + Math.sin(this.angle) * distance - 5; // -5 para centralizar o projétil
        
        // Cria múltiplos projéteis de gelo com base no multiplicador de poder
        for (let i = 0; i < this.powerMultiplier; i++) {
            // Pequeno desvio para cada projétil adicional
            const angleOffset = i === 0 ? 0 : (Math.random() * 0.2 - 0.1);
            const adjustedVelocityX = Math.cos(this.angle + angleOffset) * speed;
            const adjustedVelocityY = Math.sin(this.angle + angleOffset) * speed;
            
            // Pequeno atraso para cada projétil adicional
            setTimeout(() => {
                const iceProjectile = this.game.createProjectile('ice', [
                    x,
                    y,
                    this.iceSize,
                    this.iceSize,
                    adjustedVelocityX,
                    adjustedVelocityY,
                    this.fireballDamage * 0.7
                ]);
                
                // Aplica ricochete se o jogador tiver a habilidade
                if (this.hasRicochet) {
                    iceProjectile.canRicochet = true;
                }
                
                this.game.addProjectile(iceProjectile);
            }, i * 100); // 100ms de atraso entre cada projétil
        }
        
        // Define o cooldown (aplicando o multiplicador de cooldown)
        const power = this.availablePowers.find(p => p.id === 'ice');
        this.iceCooldown = power.maxCooldown * this.cooldownMultiplier;
        
        // Atualiza a UI
        this.updatePowerSlotUI();
    }
    
    takeDamage(amount, knockbackX = 0, knockbackY = 0) {
        // Não toma dano se estiver invulnerável
        if (this.invulnerableTime > 0) return;
        
        this.health -= amount;
        this.health = Math.max(0, this.health);
        
        // Aplica knockback
        this.applyKnockback(knockbackX, knockbackY, 3); // Reduzido para 3 (era 5)
        
        // Torna o jogador invulnerável por um curto período
        this.invulnerableTime = 1000; // 1 segundo de invulnerabilidade
        
        this.game.eventBus.emit('player:stats-changed');
        
        // Verifica se o jogador morreu
        if (this.health <= 0) {
            console.log("Jogador morreu!");
            this.game.eventBus.emit('game:over');
        }
    }
    
    applyKnockback(directionX, directionY, force) {
        const normalizedDirection = normalizeVector(directionX, directionY, 0, 0);
        const knockbackForce = toFiniteNumber(force, 0);
        
        // Aplica o knockback
        this.knockbackX = normalizedDirection.x * knockbackForce;
        this.knockbackY = normalizedDirection.y * knockbackForce;
        this.knockbackDuration = 200; // 200ms de knockback
    }
    
    gainXP(amount) {
        console.log(`Jogador ganhou ${amount} XP!`);
        this.xp += amount;
        
        // Cria um alerta flutuante para o XP ganho
        this.game.createFloatingAlert(`+${amount} XP`, this.x + this.width / 2, this.y - 20, '#ffff00');
        
        // Verifica se subiu de nível
        if (this.xp >= this.xpToNextLevel) {
            // Corrigido: Agora só sobe um nível por vez para evitar pular níveis
            this.levelUp();
            // Ajusta o XP excedente para o próximo nível
            if (this.xp > this.xpToNextLevel) {
                const excessXP = this.xp - this.xpToNextLevel;
                this.xp = excessXP;
            }
        }
        
        this.game.eventBus.emit('player:stats-changed');
    }
    
    levelUp() {
        this.level++;
        // Não zera o XP aqui, pois já foi ajustado na função gainXP
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.2);
        
        // Aumenta os atributos
        this.maxHealth += 10;
        this.health = this.maxHealth; // Recupera toda a vida ao subir de nível
        this.fireballDamage += 2;
        this.speed += 0.1;
        
        // Cria um alerta flutuante para o level up
        this.game.createFloatingAlert(`NÍVEL ${this.level}!`, this.x + this.width / 2, this.y - 30, '#ffff00');
        
        console.log(`Nível ${this.level} alcançado!`);
        console.log(`Novo HP máximo: ${this.maxHealth}`);
        console.log(`Novo dano: ${this.fireballDamage}`);
        console.log(`Nova velocidade: ${this.speed.toFixed(1)}`);
        
        this.game.eventBus.emit('player:level-up', { level: this.level });
        this.game.eventBus.emit('player:stats-changed');
    }
    
    // Limpa todas as marcas de rodas
    clearTrackMarks() {
        this.trackMarks = [];
    }
    
    // Método para congelar um inimigo
    freezeEnemy(enemy, duration) {
        const enemyId = enemy.id;
        
        // Verifica se o inimigo já está congelado
        if (this.frozenEnemies[enemyId]) {
            // Atualiza a duração do congelamento
            this.frozenEnemies[enemyId] = this.game.gameTime + duration;
        } else {
            // Congela o inimigo
            this.frozenEnemies[enemyId] = this.game.gameTime + duration;
            
            // Salva a velocidade original do inimigo
            enemy.originalSpeed = enemy.speed;
            
            // Congela o inimigo (velocidade zero)
            enemy.speed = 0;
            
            // Adiciona efeito visual de congelamento
            enemy.isFrozen = true;
            
            // Garante que o inimigo não se mova durante o congelamento
            enemy.moveDirection = 0;
            enemy.moveTimer = 0;
        }
    }
    
    // Método para diminuir a velocidade de um inimigo
    slowEnemy(enemy, slowFactor, duration) {
        // Salva a velocidade original do inimigo se ainda não tiver sido salva
        if (!enemy.originalSpeed) {
            enemy.originalSpeed = enemy.speed;
        }
        
        // Diminui a velocidade do inimigo
        enemy.speed = enemy.originalSpeed * slowFactor;
        
        // Adiciona efeito visual de lentidão
        enemy.isSlowed = true;
        
        // Define um temporizador para restaurar a velocidade
        setTimeout(() => {
            // Restaura a velocidade original apenas se o inimigo não estiver congelado
            if (!enemy.isFrozen) {
                enemy.speed = enemy.originalSpeed;
                enemy.isSlowed = false;
                
                // Limpa todas as partículas de gelo quando o efeito terminar
                enemy.iceParticles = [];
            }
        }, duration);
    }
    
    // Método para atualizar o estado dos inimigos congelados
    updateFrozenEnemies() {
        const currentTime = this.game.gameTime;
        
        for (const enemyId in this.frozenEnemies) {
            const thawTime = this.frozenEnemies[enemyId];
            
            // Verifica se o tempo de congelamento acabou
            if (currentTime >= thawTime) {
                // Encontra o inimigo
                const enemy = this.game.enemies.find(e => e.id === enemyId);
                
                // Restaura a velocidade do inimigo se ele ainda existir
                if (enemy) {
                    enemy.speed = enemy.originalSpeed;
                    enemy.isFrozen = false;
                    
                    // Limpa todas as partículas de gelo quando o efeito termina
                    enemy.iceParticles = [];
                    
                    // Reinicia o movimento do inimigo
                    if (enemy.type === 'random') {
                        enemy.moveDirection = Math.random() * Math.PI * 2;
                        enemy.moveTimer = 0;
                    }
                }
                
                // Remove o inimigo da lista de congelados
                delete this.frozenEnemies[enemyId];
            }
        }
    }
    
    // Método para atualizar o slot de poder na UI
    updatePowerSlotUI() {
        const power = this.availablePowers.find(p => p.id === this.currentPower);
        
        if (power) {
            // Atualiza a descrição com informações sobre o tamanho
            if (power.id === 'fireball') {
                power.description = `Dispara uma bola de fogo na direção do cursor (Tamanho: ${this.fireballSize})`;
            } else if (power.id === 'ice') {
                power.description = `Dispara um projétil de gelo que congela os inimigos (Tamanho: ${this.iceSize})`;
            } else if (power.id === 'aoe') {
                power.description = `Cria uma explosão que causa dano em área (Raio: ${this.aoeSize})`;
            }
        }

        this.game.eventBus.emit('player:power-changed', { powerId: this.currentPower });
    }
    
    // Método para trocar o poder atual
    changePower(newPowerId) {
        // Verifica se o poder é diferente do atual
        if (this.currentPower !== newPowerId) {
            this.currentPower = newPowerId;
            this.updatePowerSlotUI();
            this.game.eventBus.emit('ui:message', { message: `Poder alterado para: ${this.getPowerName(newPowerId)}`, duration: 2000 });
            
            // Atualiza as informações do jogador se a tela de informações estiver aberta
            if (this.game.isPlayerInfoVisible) {
                this.game.updatePlayerInfo();
            }
        }
    }
    
    // Método para obter o nome do poder pelo ID
    getPowerName(powerId) {
        const power = this.availablePowers.find(p => p.id === powerId);
        return power ? power.name : 'Desconhecido';
    }
    
    // Método para usar o poder atual
    usePower() {
        switch (this.currentPower) {
            case 'fireball':
                this.fireProjectile();
                break;
            case 'aoe':
                this.fireAOE();
                break;
            case 'ice':
                this.fireIce();
                break;
            case 'poison':
                this.firePoison();
                break;
            case 'arrow':
                this.fireArrow();
                break;
        }
    }
    
    // Método para aplicar redução de cooldown temporária
    applyCooldownReduction(multiplier, duration) {
        // Acumula o efeito de redução de cooldown (multiplicando o multiplicador atual)
        this.cooldownMultiplier *= multiplier; // Acumula o efeito multiplicando
        
        // Não definimos mais um tempo de expiração
        this.cooldownReductionEndTime = 0; // Zero indica que não expira
        
        // Atualiza as estatísticas
        this.powerStats.cooldownReduction++;
        this.powerStats.totalCooldownReduction += (1 - multiplier) * 100;
        
        // Atualiza visualmente os cooldowns na UI
        this.updatePowerSlotUI();
        
        // Adiciona efeito visual ao jogador
        this.addCooldownReductionEffect();
    }
    
    // Método para adicionar efeito visual de redução de cooldown
    addCooldownReductionEffect() {
        // Cria um efeito de partículas ao redor do jogador
        const particleCount = 20;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 20 + Math.random() * 30;
            
            const particle = {
                x: this.x + Math.cos(angle) * distance,
                y: this.y + Math.sin(angle) * distance,
                size: 2 + Math.random() * 3,
                color: '#00FFFF',
                alpha: 0.8,
                lifetime: 1000 + Math.random() * 1000,
                createdAt: this.game.gameTime,
                angle: angle,
                distance: distance
            };
            
            if (!this.cooldownParticles) {
                this.cooldownParticles = [];
            }
            
            this.cooldownParticles.push(particle);
        }
    }
    
    // Método para atualizar as partículas do efeito de redução de cooldown
    updateCooldownParticles(deltaTime) {
        // Atualiza cada partícula
        for (let i = this.cooldownParticles.length - 1; i >= 0; i--) {
            const particle = this.cooldownParticles[i];
            
            // Calcula o tempo de vida restante
            const elapsedTime = this.game.gameTime - particle.createdAt;
            
            // Remove partículas que expiraram
            if (elapsedTime >= particle.lifetime) {
                this.cooldownParticles.splice(i, 1);
                continue;
            }
            
            // Calcula a opacidade com base no tempo de vida
            particle.alpha = 0.8 * (1 - elapsedTime / particle.lifetime);
            
            // Faz as partículas orbitarem o jogador
            const orbitSpeed = 0.001; // Velocidade de órbita
            particle.angle += orbitSpeed * deltaTime;
            
            // Atualiza a posição da partícula para seguir o jogador
            particle.x = this.x + Math.cos(particle.angle) * particle.distance;
            particle.y = this.y + Math.sin(particle.angle) * particle.distance;
        }
        
        // Adiciona novas partículas periodicamente enquanto o efeito estiver ativo
        if (this.cooldownMultiplier < 1 && this.game.gameTime % 500 < 20) {
            this.addCooldownParticle();
        }
    }
    
    // Método para adicionar uma única partícula de efeito de cooldown
    addCooldownParticle() {
        const angle = Math.random() * Math.PI * 2;
        const distance = 20 + Math.random() * 30;
        
        const particle = {
            x: this.x + Math.cos(angle) * distance,
            y: this.y + Math.sin(angle) * distance,
            size: 2 + Math.random() * 3,
            color: '#00FFFF',
            alpha: 0.8,
            lifetime: 1000 + Math.random() * 1000,
            createdAt: this.game.gameTime,
            angle: angle,
            distance: distance
        };
        
        if (!this.cooldownParticles) {
            this.cooldownParticles = [];
        }
        
        this.cooldownParticles.push(particle);
    }
    
    // Método para envenenar um inimigo
    poisonEnemy(enemy, damage, duration) {
        const enemyId = enemy.id;
        
        // Verifica se o inimigo já está envenenado
        if (enemy.isPoisoned) {
            // Acumula o dano do veneno
            enemy.poisonDamage += damage;
            
            // Atualiza a duração do envenenamento
            enemy.poisonEndTime = Math.max(enemy.poisonEndTime, this.game.gameTime + duration);
        } else {
            // Envenena o inimigo
            enemy.isPoisoned = true;
            enemy.poisonDamage = damage;
            enemy.poisonEndTime = this.game.gameTime + duration;
            enemy.lastPoisonTick = this.game.gameTime;
        }
    }
    
    // Método para atirar projétil de veneno
    firePoison() {
        // Verifica se o poder está em cooldown
        if (this.poisonCooldown > 0) return;
        
        // Centro do jogador
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        // Velocidade do projétil
        const speed = 7; // Velocidade intermediária
        const velocityX = Math.cos(this.angle) * speed;
        const velocityY = Math.sin(this.angle) * speed;
        
        // Posição inicial do projétil (um pouco afastado do jogador)
        const distance = 20; // Distância do centro do jogador
        const x = centerX + Math.cos(this.angle) * distance - 5; // -5 para centralizar o projétil
        const y = centerY + Math.sin(this.angle) * distance - 5; // -5 para centralizar o projétil
        
        // Cria múltiplos projéteis de veneno com base no multiplicador de poder
        for (let i = 0; i < this.powerMultiplier; i++) {
            // Pequeno desvio para cada projétil adicional
            const angleOffset = i === 0 ? 0 : (Math.random() * 0.2 - 0.1);
            const adjustedVelocityX = Math.cos(this.angle + angleOffset) * speed;
            const adjustedVelocityY = Math.sin(this.angle + angleOffset) * speed;
            
            // Pequeno atraso para cada projétil adicional
            setTimeout(() => {
                const poisonProjectile = this.game.createProjectile('poison', [
                    x,
                    y,
                    this.poisonSize,
                    this.poisonSize,
                    adjustedVelocityX,
                    adjustedVelocityY,
                    this.poisonDamage
                ]);
                
                // Aplica ricochete se o jogador tiver a habilidade
                if (this.hasRicochet) {
                    poisonProjectile.canRicochet = true;
                }
                
                this.game.addProjectile(poisonProjectile);
            }, i * 100); // 100ms de atraso entre cada projétil
        }
        
        // Define o cooldown (aplicando o multiplicador de cooldown)
        const power = this.availablePowers.find(p => p.id === 'poison');
        this.poisonCooldown = power.maxCooldown * this.cooldownMultiplier;
        
        // Atualiza a UI
        this.updatePowerSlotUI();
    }
    
    // Método para atirar flechas
    fireArrow() {
        // Verifica se o poder está em cooldown
        if (this.arrowCooldown > 0) return;
        
        // Centro do jogador
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        // Velocidade do projétil
        const speed = 10; // Flechas são mais rápidas
        const velocityX = Math.cos(this.angle) * speed;
        const velocityY = Math.sin(this.angle) * speed;
        
        // Posição inicial do projétil (um pouco afastado do jogador)
        const distance = 20; // Distância do centro do jogador
        const x = centerX + Math.cos(this.angle) * distance - 5; // -5 para centralizar o projétil
        const y = centerY + Math.sin(this.angle) * distance - 5; // -5 para centralizar o projétil
        
        // Calcula a distância máxima (metade da tela)
        const maxDistance = Math.min(this.game.canvas.width, this.game.canvas.height) / 2;
        
        // Cria múltiplas flechas com base no multiplicador de poder
        for (let i = 0; i < this.powerMultiplier; i++) {
            // Pequeno desvio para cada projétil adicional
            const angleOffset = i === 0 ? 0 : (Math.random() * 0.1 - 0.05); // Desvio menor para flechas
            const adjustedVelocityX = Math.cos(this.angle + angleOffset) * speed;
            const adjustedVelocityY = Math.sin(this.angle + angleOffset) * speed;
            
            // Pequeno atraso para cada projétil adicional
            setTimeout(() => {
                const arrowProjectile = this.game.createProjectile('arrow', [
                    x,
                    y,
                    this.arrowSize,
                    this.arrowSize,
                    adjustedVelocityX,
                    adjustedVelocityY,
                    this.arrowDamage,
                    maxDistance
                ]);
                
                // Aplica ricochete se o jogador tiver a habilidade
                if (this.hasRicochet) {
                    arrowProjectile.canRicochet = true;
                }
                
                this.game.addProjectile(arrowProjectile);
            }, i * 50); // 50ms de atraso entre cada flecha (mais rápido que outros projéteis)
        }
        
        // Define o cooldown (aplicando o multiplicador de cooldown)
        const power = this.availablePowers.find(p => p.id === 'arrow');
        this.arrowCooldown = power.maxCooldown * this.cooldownMultiplier;
        
        // Atualiza a UI
        this.updatePowerSlotUI();
    }
    
    /**
     * Aumenta o dano de todos os poderes
     * @param {number} amount - Quantidade de dano a ser aumentada
     */
    increaseDamage(amount) {
        // Aumenta o dano de todos os poderes
        this.fireballDamage += amount;
        this.aoeDamage += amount;
        this.arrowDamage += amount;
        
        // Aumenta o dano do veneno proporcionalmente
        // O veneno causa dano ao longo do tempo, então o aumento é menor
        this.poisonDamage += amount * 0.5;
        
        // Atualiza as estatísticas
        this.powerStats.poisonDamage += amount * 0.5;
        
        // Atualiza a UI
        this.updatePowerSlotUI();
        
        // Cria um alerta flutuante
        this.game.createFloatingAlert(`DANO +${amount}`, this.x + this.width / 2, this.y - 20, '#ff0000');
        
        // Mostra uma mensagem
        this.game.eventBus.emit('ui:message', { message: `Dano aumentado em ${amount}!`, duration: 3000 });
    }
} 

