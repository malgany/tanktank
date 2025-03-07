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
        
        if (rand < 0.33) {
            this.itemType = 'powerUp';
            this.itemName = '+1';
            this.itemDescription = 'Aumenta todos os poderes em 1';
        } else if (rand < 0.66) {
            this.itemType = 'ricochet';
            this.itemName = 'Ricochete';
            this.itemDescription = 'Projéteis ricocheteiam nas paredes';
        } else {
            this.itemType = 'icePower';
            this.itemName = 'Poder de Gelo';
            this.itemDescription = 'Tiro de gelo que diminui a velocidade dos inimigos';
        }
    }
    
    update(deltaTime) {
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
        
        if (!this.isOpen) {
            // Desenha o baú fechado
            ctx.fillStyle = '#8B4513'; // Marrom
            ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
            
            // Desenha o cadeado
            ctx.fillStyle = '#FFD700'; // Dourado
            ctx.fillRect(this.x - 5, this.y - this.height / 2 - 5, 10, 10);
            
            // Efeito de brilho
            ctx.globalAlpha = 0.5 + Math.sin(this.game.gameTime / 200) * 0.3;
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - this.width / 2 - 2, this.y - this.height / 2 - 2, this.width + 4, this.height + 4);
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
                    case 'icePower':
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
        }
    }
    
    applyItemEffect() {
        switch (this.itemType) {
            case 'powerUp':
                // Aumenta todos os poderes em 1
                this.game.player.powerMultiplier = (this.game.player.powerMultiplier || 1) + 1;
                this.game.ui.showMessage(`Poder +1! Todos os poderes aumentados!`, 3000);
                break;
                
            case 'ricochet':
                // Ativa o ricochete para projéteis
                this.game.player.hasRicochet = true;
                this.game.ui.showMessage(`Ricochete! Seus projéteis agora ricocheteiam nas paredes!`, 3000);
                break;
                
            case 'icePower':
                // Adiciona o poder de gelo
                if (!this.game.player.hasIcePower) {
                    this.game.player.hasIcePower = true;
                    this.game.player.powers = this.game.player.powers || [];
                    this.game.player.powers.push({
                        id: 'ice',
                        name: 'Poder de Gelo',
                        description: 'Tiro de gelo que diminui a velocidade dos inimigos',
                        cooldown: 0,
                        maxCooldown: 2000
                    });
                    this.game.ui.showMessage(`Novo poder: Gelo! Use para congelar inimigos!`, 3000);
                }
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