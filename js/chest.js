import { Projectile } from './projectile.js';

export class Chest {
    constructor(x, y, game) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.game = game;
        this.isOpen = false;
        this.openTime = 0;
        this.openDuration = 500; // Tempo de animação de abertura em ms
        this.collected = false;
        
        // Determina o item que estará no baú
        this.determineItem();
    }
    
    determineItem() {
        const rand = Math.random();
        
        if (rand < 0.15) {
            this.itemType = 'powerUp';
            this.itemName = '+1';
            this.itemDescription = 'Aumenta todos os poderes em 1';
        } else if (rand < 0.3) {
            this.itemType = 'ricochet';
            this.itemName = 'Ricochete';
            this.itemDescription = 'Projéteis ricocheteiam nas paredes';
        } else if (rand < 0.45) {
            this.itemType = 'fireball';
            this.itemName = 'Tiro de Canhão';
            this.itemDescription = 'Dispara uma bola de fogo na direção do cursor';
        } else if (rand < 0.6) {
            this.itemType = 'ice';
            this.itemName = 'Poder de Gelo';
            this.itemDescription = 'Tiro de gelo que diminui a velocidade dos inimigos';
        } else if (rand < 0.75) {
            this.itemType = 'aoe';
            this.itemName = 'Ataque em Área';
            this.itemDescription = 'Causa dano em área aos inimigos próximos';
        } else {
            this.itemType = 'cooldownReduction';
            this.itemName = 'Ampulheta Arcana';
            this.itemDescription = 'Reduz o tempo de recarga dos ataques em 30% permanentemente';
        }
    }
    
    update(deltaTime) {
        // Verifica se o jogador está colidindo com o baú
        if (!this.isOpen && this.game.checkCollision(this, this.game.player)) {
            console.log("Jogador colidiu com o baú!");
            this.open();
        }
        
        if (this.isOpen && !this.collected) {
            this.openTime += deltaTime;
            
            // Verifica se o jogador coletou o item
            if (this.game.checkCollision(this, this.game.player)) {
                this.collected = true;
                this.applyItemEffect();
            }
        }
    }
    
    draw(ctx) {
        ctx.save();
        
        // Efeito de brilho ao redor do baú para destacá-lo
        const glowSize = 20 + Math.sin(this.game.gameTime / 200) * 10;
        const glowOpacity = 0.5 + Math.sin(this.game.gameTime / 300) * 0.3;
        
        // Desenha o brilho
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, glowSize
        );
        gradient.addColorStop(0, `rgba(255, 215, 0, ${glowOpacity})`); // Dourado
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
        ctx.fill();
        
        if (!this.isOpen) {
            // Desenha o baú fechado
            ctx.fillStyle = '#8B4513'; // Marrom
            ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
            
            // Desenha detalhes do baú
            ctx.fillStyle = '#A0522D'; // Marrom mais escuro
            ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, 5); // Topo
            ctx.fillRect(this.x - this.width / 2, this.y + this.height / 2 - 5, this.width, 5); // Base
            
            // Desenha o cadeado
            ctx.fillStyle = '#FFD700'; // Dourado
            ctx.fillRect(this.x - 5, this.y - this.height / 2 - 5, 10, 10);
            
            // Efeito de brilho
            ctx.globalAlpha = 0.5 + Math.sin(this.game.gameTime / 200) * 0.3;
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - this.width / 2 - 2, this.y - this.height / 2 - 2, this.width + 4, this.height + 4);
            
            // Texto "TESOURO" flutuando acima do baú
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#FFD700';
            ctx.fillText('TESOURO', this.x, this.y - this.height / 2 - 15);
        } else if (!this.collected) {
            // Calcula a animação de abertura
            const openProgress = Math.min(1, this.openTime / this.openDuration);
            
            // Desenha o baú aberto
            ctx.fillStyle = '#8B4513'; // Marrom
            ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2 + (this.height * 0.3 * openProgress), this.width, this.height * (1 - 0.3 * openProgress));
            
            // Desenha a tampa do baú
            ctx.fillStyle = '#A0522D'; // Marrom mais escuro
            ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2 - 5 * openProgress, this.width, 10);
            
            // Desenha o item dentro do baú
            if (openProgress >= 0.5) {
                ctx.globalAlpha = (openProgress - 0.5) * 2; // Fade in do item
                
                // Cor baseada no tipo de item
                switch (this.itemType) {
                    case 'powerUp':
                        ctx.fillStyle = '#FF0000'; // Vermelho para +1
                        break;
                    case 'ricochet':
                        ctx.fillStyle = '#00FF00'; // Verde para ricochete
                        break;
                    case 'fireball':
                        ctx.fillStyle = '#FF0000'; // Vermelho para tiro de canhão
                        break;
                    case 'ice':
                        ctx.fillStyle = '#00FFFF'; // Ciano para poder de gelo
                        break;
                }
                
                // Desenha o item
                ctx.beginPath();
                ctx.arc(this.x, this.y - 5, 10, 0, Math.PI * 2);
                ctx.fill();
                
                // Texto do item
                ctx.fillStyle = '#FFFFFF';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(this.itemName, this.x, this.y - 5);
            }
            
            // Efeito de brilho
            ctx.globalAlpha = 0.5 + Math.sin(this.game.gameTime / 100) * 0.3;
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - this.width / 2 - 2, this.y - this.height / 2 - 2, this.width + 4, this.height + 4);
        }
        
        ctx.restore();
    }
    
    open() {
        if (!this.isOpen) {
            this.isOpen = true;
            this.openTime = 0;
            console.log("Baú aberto!");
            
            // Mostra uma mensagem com o item encontrado
            this.game.ui.showMessage(`Baú aberto! Você encontrou: ${this.itemName}`, 3000);
        }
    }
    
    applyItemEffect() {
        switch (this.itemType) {
            case 'powerUp':
                // Aumenta todos os poderes em 1
                this.game.player.powerMultiplier = (this.game.player.powerMultiplier || 1) + 1;
                this.game.ui.showMessage(`Poder +1! Todos os poderes aumentados!`, 3000);
                // Cria um alerta flutuante
                this.game.createFloatingAlert(`PODER +1`, this.x, this.y - 20, '#ff0000');
                break;
                
            case 'ricochet':
                // Ativa o ricochete para projéteis
                this.game.player.hasRicochet = true;
                this.game.ui.showMessage(`Ricochete! Seus projéteis agora ricocheteiam nas paredes!`, 3000);
                // Cria um alerta flutuante
                this.game.createFloatingAlert(`RICOCHETE`, this.x, this.y - 20, '#00ff00');
                break;
                
            case 'fireball':
                // Cria um alerta flutuante
                this.game.createFloatingAlert(`TIRO DE CANHÃO`, this.x, this.y - 20, '#ff0000');
                // Verifica se o poder é diferente do atual
                if (this.game.player.currentPower !== this.itemType) {
                    // Mostra a tela de troca de poderes
                    this.game.showPowerSwapModal(this.itemType);
                } else {
                    // Se for o mesmo poder, aumenta o tamanho do projétil
                    this.game.player.fireballSize += 2; // Aumenta 2 pixels
                    this.game.ui.showMessage(`Tiro de Canhão melhorado! Projétil maior!`, 3000);
                    this.game.createFloatingAlert(`PROJÉTIL +2`, this.x, this.y - 40, '#ff9900');
                }
                break;
                
            case 'ice':
                // Cria um alerta flutuante
                this.game.createFloatingAlert(`PODER DE GELO`, this.x, this.y - 20, '#00ffff');
                // Verifica se o poder é diferente do atual
                if (this.game.player.currentPower !== this.itemType) {
                    // Mostra a tela de troca de poderes
                    this.game.showPowerSwapModal(this.itemType);
                } else {
                    // Se for o mesmo poder, aumenta o tamanho do projétil
                    this.game.player.iceSize += 2; // Aumenta 2 pixels
                    this.game.ui.showMessage(`Poder de Gelo melhorado! Projétil maior!`, 3000);
                    this.game.createFloatingAlert(`PROJÉTIL +2`, this.x, this.y - 40, '#00ffff');
                }
                break;
                
            case 'aoe':
                // Cria um alerta flutuante
                this.game.createFloatingAlert(`ATAQUE EM ÁREA`, this.x, this.y - 20, '#ffa500');
                // Verifica se o poder é diferente do atual
                if (this.game.player.currentPower !== this.itemType) {
                    // Mostra a tela de troca de poderes
                    this.game.showPowerSwapModal(this.itemType);
                } else {
                    // Se for o mesmo poder, aumenta o raio do efeito
                    this.game.player.aoeSize += 10; // Aumenta 10 pixels no raio
                    this.game.ui.showMessage(`Ataque em Área melhorado! Área maior!`, 3000);
                    this.game.createFloatingAlert(`ÁREA +10`, this.x, this.y - 40, '#ffa500');
                }
                break;
                
            case 'cooldownReduction':
                // Aplica o efeito de redução de cooldown
                this.game.player.applyCooldownReduction(0.7, 0); // 30% de redução (0.7x) permanente
                this.game.ui.showMessage(`Ampulheta Arcana! Tempo de recarga reduzido em 30% permanentemente!`, 3000);
                // Cria um alerta flutuante
                this.game.createFloatingAlert(`-30% COOLDOWN`, this.x, this.y - 20, '#00ffff');
                break;
        }
    }
}

export class IceProjectile extends Projectile {
    constructor(x, y, width, height, velocityX, velocityY, damage) {
        super(x, y, width, height, velocityX, velocityY, damage);
        this.type = 'ice';
        this.slowEffect = 0.5; // Reduz a velocidade do inimigo em 50%
        this.slowDuration = 3000; // Duração do efeito em ms
    }
    
    draw(ctx) {
        // Desenha o projétil de gelo
        ctx.fillStyle = '#00FFFF'; // Ciano
        
        // Desenha um círculo
        ctx.beginPath();
        ctx.arc(
            this.x + this.width / 2, 
            this.y + this.height / 2, 
            this.width / 2, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
        
        // Desenha um brilho interno
        const gradient = ctx.createRadialGradient(
            this.x + this.width / 2, 
            this.y + this.height / 2, 
            0,
            this.x + this.width / 2, 
            this.y + this.height / 2, 
            this.width / 2
        );
        
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(
            this.x + this.width / 2, 
            this.y + this.height / 2, 
            this.width / 2, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
        
        // Desenha as partículas
        this.drawParticles(ctx);
    }
    
    generateParticles() {
        // Gera partículas iniciais
        for (let i = 0; i < 10; i++) {
            this.addParticle();
        }
    }
    
    addParticle() {
        // Adiciona uma nova partícula
        this.particles.push({
            x: this.x + this.width / 2,
            y: this.y + this.height / 2,
            size: 1 + Math.random() * 3,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 100 + Math.random() * 200,
            color: Math.random() < 0.5 ? '#FFFFFF' : '#00FFFF'
        });
    }
} 