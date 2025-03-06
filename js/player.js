import { Projectile } from './projectile.js';
import { AOEEffect } from './aoe.js';

export class Player {
    constructor(game) {
        this.game = game;
        
        // Posição e dimensões
        this.width = 30;
        this.height = 40; // Um pouco mais comprido para parecer um tanque
        this.x = game.canvas.width / 2 - this.width / 2;
        this.y = game.canvas.height / 2 - this.height / 2;
        
        // Movimento
        this.speed = 5;
        this.moveX = 0;
        this.moveY = 0;
        
        // Knockback
        this.knockbackX = 0;
        this.knockbackY = 0;
        this.knockbackDuration = 0;
        this.invulnerableTime = 0;
        
        // Atributos
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = 100;
        
        // Habilidades
        this.fireballDamage = 20;
        this.fireballCooldown = 0;
        this.fireballMaxCooldown = 1000; // 1 segundo
        
        this.aoeDamage = 40;
        this.aoeCooldown = 0;
        this.aoeMaxCooldown = 10000; // 10 segundos
        this.aoeUnlocked = false;
        
        // Direção atual (para o disparo)
        this.direction = 'right'; // 'up', 'right', 'down', 'left'
        
        // Ângulo de rotação (em radianos)
        this.angle = 0;  // Ângulo do canhão (mouse)
        this.bodyAngle = 0; // Ângulo do corpo do tanque (movimento)
        
        // Sistema de rastros de rodas
        this.trackMarks = [];
        this.lastTrackTime = 0;
        this.trackInterval = 100; // Intervalo para criar novas marcas (ms)
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
            // Movimento normal apenas se não estiver em knockback
            this.x += this.moveX * this.speed;
            this.y += this.moveY * this.speed;
            
            // Atualiza o ângulo do corpo do tanque com base na direção do movimento
            if (this.moveX !== 0 || this.moveY !== 0) {
                this.bodyAngle = Math.atan2(this.moveY, this.moveX);
                
                // Adiciona rastros de rodas se estiver se movendo
                if (this.game.gameTime - this.lastTrackTime > this.trackInterval) {
                    this.createTrackMarks();
                    this.lastTrackTime = this.game.gameTime;
                }
            }
        }
        
        // NÃO limita o jogador às bordas do canvas para permitir a transição entre telas
        // Essa verificação é feita na função checkScreenTransition do game.js
        
        // Reduz o tempo de invulnerabilidade
        if (this.invulnerableTime > 0) {
            this.invulnerableTime -= deltaTime;
            if (this.invulnerableTime < 0) this.invulnerableTime = 0;
        }
        
        // Log de depuração para posições próximas às bordas
        if (this.x < 10 || this.x > this.game.canvas.width - this.width - 10 ||
            this.y < 10 || this.y > this.game.canvas.height - this.height - 10) {
            console.log("Jogador próximo à borda:", this.x, this.y);
        }
        
        // Log quando o jogador sai da tela
        if (this.x < 0 || this.x > this.game.canvas.width ||
            this.y < 0 || this.y > this.game.canvas.height) {
            console.log("JOGADOR SAIU DA TELA:", this.x, this.y);
        }
        
        // Atualiza os cooldowns
        if (this.fireballCooldown > 0) {
            this.fireballCooldown -= deltaTime;
            if (this.fireballCooldown < 0) this.fireballCooldown = 0;
            
            // Atualiza a UI do cooldown
            document.getElementById('fireballCooldown').style.height = `${(this.fireballCooldown / this.fireballMaxCooldown) * 100}%`;
        }
        
        if (this.aoeCooldown > 0) {
            this.aoeCooldown -= deltaTime;
            if (this.aoeCooldown < 0) this.aoeCooldown = 0;
            
            // Atualiza a UI do cooldown
            const aoeCooldown = document.getElementById('aoeCooldown');
            if (aoeCooldown) {
                aoeCooldown.style.height = `${(this.aoeCooldown / this.aoeMaxCooldown) * 100}%`;
            }
        }
        
        // Atualiza os rastros de rodas
        for (let i = this.trackMarks.length - 1; i >= 0; i--) {
            const track = this.trackMarks[i];
            track.life -= deltaTime;
            
            if (track.life <= 0) {
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
        
        // Desenha o tanque
        ctx.save();
        
        // Aplica o efeito de invulnerabilidade (piscar)
        if (this.invulnerableTime > 0 && Math.floor(this.invulnerableTime / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
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
        
        const projectile = new Projectile(
            x, 
            y, 
            10, 
            10, 
            velocityX, 
            velocityY, 
            this.fireballDamage
        );
        
        this.game.addProjectile(projectile);
        this.fireballCooldown = this.fireballMaxCooldown;
        
        // Atualiza a UI do cooldown
        document.getElementById('fireballCooldown').style.height = '100%';
    }
    
    fireAOE() {
        if (!this.aoeUnlocked || this.aoeCooldown > 0) return;
        
        // Centro do jogador
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        // Posição do AOE (a uma distância fixa na direção do mouse)
        const distance = 80; // Distância do centro do jogador
        const x = centerX + Math.cos(this.angle) * distance;
        const y = centerY + Math.sin(this.angle) * distance;
        
        const aoe = new AOEEffect(
            x, 
            y, 
            80, // raio
            this.aoeDamage,
            500 // duração em ms
        );
        
        this.game.addAOEEffect(aoe);
        this.aoeCooldown = this.aoeMaxCooldown;
        
        // Atualiza a UI do cooldown
        const aoeCooldown = document.getElementById('aoeCooldown');
        if (aoeCooldown) {
            aoeCooldown.style.height = '100%';
        }
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
        
        // Atualiza a UI
        this.game.ui.update();
        
        // Verifica se o jogador morreu
        if (this.health <= 0) {
            console.log("Jogador morreu!");
            // Implementar lógica de morte
        }
    }
    
    applyKnockback(directionX, directionY, force) {
        // Normaliza a direção
        const length = Math.sqrt(directionX * directionX + directionY * directionY);
        if (length > 0) {
            directionX /= length;
            directionY /= length;
        }
        
        // Aplica o knockback
        this.knockbackX = directionX * force;
        this.knockbackY = directionY * force;
        this.knockbackDuration = 200; // 200ms de knockback
    }
    
    gainXP(amount) {
        this.xp += amount;
        
        // Verifica se subiu de nível
        while (this.xp >= this.xpToNextLevel) {
            this.levelUp();
        }
        
        // Atualiza a UI
        const xpPercent = (this.xp / this.xpToNextLevel) * 100;
        document.getElementById('xpBar').style.width = `${xpPercent}%`;
        document.getElementById('xpValue').textContent = `${this.xp}/${this.xpToNextLevel}`;
    }
    
    levelUp() {
        this.level++;
        this.xp = 0;
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5);
        
        // Aumenta os atributos
        this.maxHealth += 10;
        this.health = this.maxHealth; // Recupera toda a vida ao subir de nível
        this.fireballDamage += 2;
        this.speed += 0.1;
        
        console.log(`Nível ${this.level} alcançado!`);
        console.log(`Novo HP máximo: ${this.maxHealth}`);
        console.log(`Novo dano: ${this.fireballDamage}`);
        console.log(`Nova velocidade: ${this.speed.toFixed(1)}`);
        
        // Desbloqueia o poder de AOE no nível 5
        if (this.level === 5 && !this.aoeUnlocked) {
            this.aoeUnlocked = true;
            console.log("Poder de AOE desbloqueado!");
            
            // Atualiza o slot de habilidade na UI
            const aoeSkill = document.getElementById('aoeSkill');
            if (aoeSkill) {
                aoeSkill.classList.remove('empty');
                aoeSkill.querySelector('.skill-icon').textContent = '💥';
            }
            
            // Desbloqueia o poder na lista de poderes
            const aoePower = this.game.powersList.powers.find(p => p.id === 'aoe');
            if (aoePower) {
                aoePower.unlocked = true;
                
                // Atualiza o item na lista de poderes
                const powerItem = document.querySelector(`.power-item[data-powerId="${aoePower.id}"]`);
                if (powerItem) {
                    powerItem.classList.remove('disabled');
                    powerItem.draggable = true;
                    powerItem.addEventListener('dragstart', this.game.handleDragStart.bind(this.game));
                    powerItem.addEventListener('dragend', this.game.handleDragEnd.bind(this.game));
                }
            }
            
            // Primeiro mostra a mensagem de nível alcançado
            this.game.ui.showMessage(`Nível ${this.level} alcançado!`, 2000);
            
            // Depois mostra a mensagem de poder desbloqueado
            this.game.ui.showMessage("Novo poder desbloqueado: Dano em Área!", 3000);
        } else {
            // Se não desbloqueou nenhum poder, apenas mostra a mensagem de nível
            this.game.ui.showMessage(`Nível ${this.level} alcançado!`, 2000);
        }
        
        // Atualiza a UI
        this.game.ui.update();
    }
    
    // Limpa todas as marcas de rodas
    clearTrackMarks() {
        this.trackMarks = [];
    }
} 