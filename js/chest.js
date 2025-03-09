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
        
        if (rand < 0.125) {
            this.itemType = 'powerUp';
            this.itemName = '+1';
            this.itemDescription = 'Aumenta todos os poderes em 1';
        } else if (rand < 0.25) {
            this.itemType = 'ricochet';
            this.itemName = 'Ricochete';
            this.itemDescription = 'Projéteis ricocheteiam nas paredes';
        } else if (rand < 0.375) {
            this.itemType = 'fireball';
            this.itemName = 'Tiro de Canhão';
            this.itemDescription = 'Dispara uma bola de fogo na direção do cursor';
        } else if (rand < 0.5) {
            this.itemType = 'ice';
            this.itemName = 'Poder de Gelo';
            this.itemDescription = 'Tiro de gelo que congela os inimigos por 2 segundos';
        } else if (rand < 0.625) {
            this.itemType = 'aoe';
            this.itemName = 'Ataque em Área';
            this.itemDescription = 'Causa dano em área aos inimigos próximos';
        } else if (rand < 0.75) {
            this.itemType = 'poison';
            this.itemName = 'Veneno';
            this.itemDescription = 'Dispara um projétil de veneno que causa dano ao longo do tempo';
        } else if (rand < 0.875) {
            this.itemType = 'arrow';
            this.itemName = 'Flechas';
            this.itemDescription = 'Dispara flechas rápidas com alcance limitado';
        } else {
            this.itemType = 'cooldownReduction';
            this.itemName = 'Ampulheta Arcana';
            this.itemDescription = 'Reduz o tempo de recarga dos ataques em 2.5% permanentemente';
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
                // Aumenta o multiplicador de poder
                this.game.player.powerMultiplier = (this.game.player.powerMultiplier || 1) + 1;
                // Atualiza as estatísticas
                this.game.player.powerStats.powerMultiplier++;
                // Aumenta o dano de todos os poderes, incluindo o veneno
                this.game.player.increaseDamage(1);
                this.game.ui.showMessage(`Poder +1! Todos os poderes aumentados!`, 3000);
                // Cria um alerta flutuante
                this.game.createFloatingAlert(`PODER +1`, this.x, this.y - 20, '#ff0000');
                break;
                
            case 'ricochet':
                // Ativa o ricochete para projéteis
                this.game.player.hasRicochet = true;
                // Atualiza as estatísticas
                this.game.player.powerStats.ricochet++;
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
                    // Se for o mesmo poder, aumenta o tamanho do projétil e a duração do congelamento
                    this.game.player.iceSize += 2; // Aumenta 2 pixels
                    this.game.player.iceDuration += 500; // Aumenta 0.5 segundos
                    this.game.player.powerStats.iceDuration += 500; // Atualiza as estatísticas
                    this.game.ui.showMessage(`Poder de Gelo melhorado! Projétil maior e congelamento mais longo!`, 3000);
                    this.game.createFloatingAlert(`PROJÉTIL +2, DURAÇÃO +0.5s`, this.x, this.y - 40, '#00ffff');
                    
                    // Atualiza as informações do jogador se a tela de informações estiver aberta
                    if (this.game.isPlayerInfoVisible) {
                        this.game.updatePlayerInfo();
                    }
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
                
            case 'poison':
                // Cria um alerta flutuante
                this.game.createFloatingAlert(`VENENO`, this.x, this.y - 20, '#ff00ff');
                // Verifica se o poder é diferente do atual
                if (this.game.player.currentPower !== this.itemType) {
                    // Mostra a tela de troca de poderes
                    this.game.showPowerSwapModal(this.itemType);
                } else {
                    // Se for o mesmo poder, aumenta o dano do veneno
                    this.game.player.increaseDamage(2);
                    this.game.ui.showMessage(`Veneno melhorado! Dano aumentado!`, 3000);
                    this.game.createFloatingAlert(`DANO +2`, this.x, this.y - 40, '#ff00ff');
                }
                break;
                
            case 'arrow':
                // Cria um alerta flutuante
                this.game.createFloatingAlert(`FLECHAS`, this.x, this.y - 20, '#ff0000');
                // Verifica se o poder é diferente do atual
                if (this.game.player.currentPower !== this.itemType) {
                    // Mostra a tela de troca de poderes
                    this.game.showPowerSwapModal(this.itemType);
                } else {
                    // Se for o mesmo poder, aumenta o alcance das flechas
                    this.game.player.arrowRange += 10; // Aumenta 10 pixels no alcance
                    this.game.ui.showMessage(`Flechas melhoradas! Alcance aumentado!`, 3000);
                    this.game.createFloatingAlert(`ALCANCE +10`, this.x, this.y - 40, '#ff0000');
                }
                break;
                
            case 'cooldownReduction':
                // Aplica o efeito de redução de cooldown
                this.game.player.applyCooldownReduction(0.975, 0); // 2.5% de redução (0.975x) permanente
                this.game.ui.showMessage(`Ampulheta Arcana! Tempo de recarga reduzido em 2.5% permanentemente!`, 3000);
                // Cria um alerta flutuante
                this.game.createFloatingAlert(`-2.5% COOLDOWN`, this.x, this.y - 20, '#00ffff');
                break;
        }
    }
} 