export class Enemy {
    constructor(x, y, health, damage, xpValue, type = null, zone = 0) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 20;
        this.health = health;
        this.maxHealth = health;
        this.damage = damage;
        this.xpValue = xpValue;
        this.zone = zone;
        
        // Tipo de inimigo: 'broken', 'random', 'pursuer'
        this.type = type || this.determineType(zone);
        
        // Movimento
        this.speed = 1 + Math.random() * 1.5; // Velocidade aleatória
        this.moveTimer = 0;
        this.moveInterval = 1000 + Math.random() * 2000; // Intervalo de movimento aleatório
        this.moveDirection = Math.random() * Math.PI * 2; // Direção aleatória
        
        // Ajusta velocidade e intervalo com base no tipo
        if (this.type === 'pursuer') {
            this.speed *= 1.2; // Perseguidores são mais rápidos
        } else if (this.type === 'random') {
            this.moveInterval *= 0.8; // Aleatórios mudam de direção mais frequentemente
        }
        
        // Distância de detecção para inimigos perseguidores
        this.detectionRange = 200;
        
        // Cooldown de tiro
        this.shootCooldown = 0;
        this.shootMaxCooldown = this.type === 'pursuer' ? 2000 : 1000; // Perseguidores têm cooldown maior
        
        // Aparência
        this.color = this.generateColor();
        this.tankType = Math.floor(Math.random() * 3); // 0: leve, 1: médio, 2: pesado
        
        // Efeito de fumaça para inimigos quebrados
        this.smokeParticles = [];
        if (this.type === 'broken') {
            this.generateSmokeParticles();
        }
        
        // Detalhes visuais adicionais
        this.rotation = 0;
        this.pulseRate = 0.5 + Math.random() * 1.5; // Taxa de pulsação
        this.pulseAmount = 0.05 + Math.random() * 0.1; // Quantidade de pulsação
        this.pulseOffset = Math.random() * Math.PI * 2; // Deslocamento da pulsação
        
        // Estado
        this.damageFlash = 0;
        this.knockbackX = 0;
        this.knockbackY = 0;
        this.knockbackDuration = 0;
        this.dead = false; // Flag para indicar se o inimigo está morto
    }
    
    determineType(zone) {
        // Probabilidades para cada tipo de inimigo com base na zona
        let brokenChance, randomChance, pursuerChance;
        
        switch (zone) {
            case 0: // Planícies
                brokenChance = 0.7;
                randomChance = 0.25;
                pursuerChance = 0.05;
                break;
            case 1: // Floresta
                brokenChance = 0.4;
                randomChance = 0.5;
                pursuerChance = 0.1;
                break;
            case 2: // Montanhas
                brokenChance = 0.2;
                randomChance = 0.5;
                pursuerChance = 0.3;
                break;
            case 3: // Deserto
                brokenChance = 0.1;
                randomChance = 0.4;
                pursuerChance = 0.5;
                break;
            default:
                brokenChance = 0.33;
                randomChance = 0.33;
                pursuerChance = 0.34;
        }
        
        const roll = Math.random();
        if (roll < brokenChance) {
            return 'broken';
        } else if (roll < brokenChance + randomChance) {
            return 'random';
        } else {
            return 'pursuer';
        }
    }
    
    generateSmokeParticles() {
        // Cria partículas de fumaça para inimigos quebrados
        for (let i = 0; i < 5; i++) {
            this.smokeParticles.push({
                x: Math.random() * 10 - 5, // Posição inicial aleatória em torno do centro
                y: Math.random() * 10 - 5,
                size: 3 + Math.random() * 5,
                speed: 0.2 + Math.random() * 0.3,
                angle: Math.random() * Math.PI * 2,
                opacity: 0.7 + Math.random() * 0.3,
                life: 0,
                maxLife: 1000 + Math.random() * 1000
            });
        }
    }
    
    generateColor() {
        // Gera uma cor aleatória para o inimigo com base no tipo e zona
        let r, g, b;
        
        if (this.zone === 3) { // Deserto - coloração avermelhada
            r = 200 + Math.floor(Math.random() * 55);
            g = 100 + Math.floor(Math.random() * 50);
            b = 50 + Math.floor(Math.random() * 50);
        } else {
            // Cores base para cada tipo
            switch (this.type) {
                case 'broken':
                    r = 100 + Math.floor(Math.random() * 50);
                    g = 100 + Math.floor(Math.random() * 50);
                    b = 100 + Math.floor(Math.random() * 50);
                    break;
                case 'random':
                    r = 50 + Math.floor(Math.random() * 50);
                    g = 100 + Math.floor(Math.random() * 100);
                    b = 50 + Math.floor(Math.random() * 50);
                    break;
                case 'pursuer':
                    r = 150 + Math.floor(Math.random() * 100);
                    g = 50 + Math.floor(Math.random() * 50);
                    b = 50 + Math.floor(Math.random() * 50);
                    break;
                default:
                    r = 100 + Math.floor(Math.random() * 155);
                    g = 100 + Math.floor(Math.random() * 155);
                    b = 100 + Math.floor(Math.random() * 155);
            }
        }
        
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    update(deltaTime, player, game) {
        // Se o inimigo estiver morto, não faz nada
        if (this.dead) return;
        
        // Atualiza o timer de movimento
        this.moveTimer += deltaTime;
        
        // Atualiza o cooldown de tiro
        if (this.shootCooldown > 0) {
            this.shootCooldown -= deltaTime;
        }
        
        // Processa o knockback
        if (this.knockbackDuration > 0) {
            this.x += this.knockbackX;
            this.y += this.knockbackY;
            this.knockbackDuration -= deltaTime;
        } else {
            // Movimento normal apenas se não estiver em knockback
            this.updateMovement(deltaTime, player);
        }
        
        // Reduz o efeito de flash de dano
        if (this.damageFlash > 0) {
            this.damageFlash -= deltaTime;
            if (this.damageFlash < 0) this.damageFlash = 0;
        }
        
        // Atualiza a rotação para inimigos em movimento
        if (this.type !== 'broken') {
            this.rotation = this.moveDirection; // Tanque aponta na direção do movimento
        }
        
        // Atualiza as partículas de fumaça para inimigos quebrados
        if (this.type === 'broken') {
            this.updateSmokeParticles(deltaTime);
        }
        
        // Verifica se deve atirar no jogador
        if (this.type !== 'broken' && this.shootCooldown <= 0) {
            const dx = player.x + player.width/2 - (this.x + this.width/2);
            const dy = player.y + player.height/2 - (this.y + this.height/2);
            const distanceToPlayer = Math.sqrt(dx * dx + dy * dy);
            
            // Inimigos aleatórios atiram se o jogador estiver próximo
            // Perseguidores atiram a qualquer distância dentro do alcance de detecção
            if ((this.type === 'random' && distanceToPlayer < 150) || 
                (this.type === 'pursuer' && distanceToPlayer < this.detectionRange)) {
                
                // Calcula a direção para o jogador
                const angle = Math.atan2(dy, dx);
                
                // Cria um projétil inimigo
                if (game) {
                    const projectileSpeed = 3;
                    const projectile = {
                        x: this.x + this.width/2,
                        y: this.y + this.height/2,
                        width: 8,
                        height: 8,
                        speedX: Math.cos(angle) * projectileSpeed,
                        speedY: Math.sin(angle) * projectileSpeed,
                        damage: this.damage,
                        isEnemy: true,
                        lifespan: 2000,
                        color: this.color
                    };
                    
                    game.projectiles.push(projectile);
                }
                
                // Reseta o cooldown
                this.shootCooldown = this.shootMaxCooldown;
            }
        }
    }
    
    updateSmokeParticles(deltaTime) {
        for (let i = 0; i < this.smokeParticles.length; i++) {
            const particle = this.smokeParticles[i];
            
            // Atualiza a vida da partícula
            particle.life += deltaTime;
            
            // Move a partícula
            particle.x += Math.cos(particle.angle) * particle.speed;
            particle.y += Math.sin(particle.angle) * particle.speed - 0.1; // Sobe levemente
            
            // Diminui a opacidade com o tempo
            particle.opacity = 0.7 * (1 - particle.life / particle.maxLife);
            
            // Reinicia a partícula se expirou
            if (particle.life >= particle.maxLife) {
                particle.life = 0;
                // Reinicia a partícula próxima ao centro do tanque
                // Usa a posição atual do inimigo como referência, não coordenadas absolutas
                particle.x = this.x + this.width/2 + Math.random() * 10 - 5;
                particle.y = this.y + this.height/2 + Math.random() * 10 - 5;
                particle.size = 3 + Math.random() * 5;
                particle.opacity = 0.7 + Math.random() * 0.3;
                particle.angle = Math.random() * Math.PI * 2;
            }
        }
    }
    
    updateMovement(deltaTime, player) {
        // Inimigos quebrados não se movem
        if (this.type === 'broken') {
            return;
        }
        
        // Inimigos perseguidores verificam a distância do jogador
        if (this.type === 'pursuer') {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distanceToPlayer = Math.sqrt(dx * dx + dy * dy);
            
            // Se o jogador estiver dentro do alcance de detecção, persegue-o
            if (distanceToPlayer < this.detectionRange) {
                this.moveDirection = Math.atan2(dy, dx);
                this.moveTimer = 0; // Reseta o timer para continuar perseguindo
            }
        }
        
        // Muda de direção periodicamente (apenas para comportamento aleatório)
        if (this.type === 'random' && this.moveTimer >= this.moveInterval) {
            this.moveTimer = 0;
            this.moveDirection = Math.random() * Math.PI * 2;
            
            // 50% de chance de ficar parado por um tempo
            if (Math.random() < 0.5) {
                this.moveInterval = 2000 + Math.random() * 3000; // Parado por mais tempo
                return; // Não se move neste ciclo
            } else {
                this.moveInterval = 1000 + Math.random() * 2000;
            }
        }
        
        // Move o inimigo
        const moveSpeed = (this.type === 'pursuer') ? this.speed * 1.2 : this.speed * 0.7;
        this.x += Math.cos(this.moveDirection) * moveSpeed;
        this.y += Math.sin(this.moveDirection) * moveSpeed;
    }
    
    draw(ctx) {
        // Se o inimigo estiver morto, não desenha
        if (this.dead) return;
        
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        // Calcula o fator de pulsação
        const time = Date.now() * 0.001; // Tempo em segundos
        const pulseFactor = 1 + Math.sin(time * this.pulseRate + this.pulseOffset) * this.pulseAmount;
        
        // Define a cor com base no estado de dano
        const baseColor = this.damageFlash > 0 ? '#ffffff' : this.color;
        
        // Salva o contexto para aplicar transformações
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.rotation);
        ctx.scale(pulseFactor, pulseFactor);
        
        // Desenha o tanque
        this.drawTank(ctx, baseColor);
        
        // Desenha as partículas de fumaça para inimigos quebrados
        if (this.type === 'broken') {
            this.drawSmokeParticles(ctx);
        }
        
        // Restaura o contexto
        ctx.restore();
        
        // Desenha a barra de vida
        this.drawHealthBar(ctx);
    }
    
    drawTank(ctx, color) {
        // Corpo do tanque
        ctx.fillStyle = color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // Detalhes do tanque com base no tipo
        ctx.strokeStyle = this.getDetailColor();
        ctx.lineWidth = 2;
        
        // Esteiras do tanque
        ctx.fillStyle = '#333';
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, -3);
        ctx.fillRect(-this.width / 2, this.height / 2, this.width, 3);
        
        // Torre do tanque
        const towerSize = this.width * 0.6;
        ctx.fillStyle = this.getDetailColor();
        ctx.beginPath();
        ctx.arc(0, 0, towerSize / 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Canhão do tanque
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(this.width / 2 + 10, 0);
        ctx.stroke();
        
        // Adiciona detalhes específicos com base no tipo de tanque
        switch (this.tankType) {
            case 0: // Tanque leve
                // Mais fino e com canhão mais longo
                break;
                
            case 1: // Tanque médio
                // Adiciona antena
                ctx.strokeStyle = '#666';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(-this.width / 3, -this.height);
                ctx.stroke();
                break;
                
            case 2: // Tanque pesado
                // Adiciona blindagem extra
                ctx.fillStyle = '#555';
                ctx.fillRect(-this.width / 3, -this.height / 3, this.width / 1.5, this.height / 1.5);
                break;
        }
    }
    
    drawSmokeParticles(ctx) {
        for (const particle of this.smokeParticles) {
            ctx.save();
            ctx.globalAlpha = particle.opacity;
            ctx.fillStyle = 'rgba(100, 100, 100, ' + particle.opacity + ')';
            ctx.beginPath();
            // Desenha a partícula em sua posição absoluta, não relativa ao inimigo
            ctx.arc(
                particle.x - this.x - this.width/2, 
                particle.y - this.y - this.height/4, 
                particle.size, 
                0, 
                Math.PI * 2
            );
            ctx.fill();
            ctx.restore();
        }
    }
    
    getDetailColor() {
        // Retorna uma cor de detalhe com base no tipo de inimigo
        switch (this.type) {
            case 'broken':
                return 'rgba(150, 150, 150, 0.8)';
            case 'random':
                return 'rgba(100, 200, 100, 0.8)';
            case 'pursuer':
                return 'rgba(255, 100, 100, 0.8)';
            default:
                return 'rgba(200, 200, 200, 0.8)';
        }
    }
    
    drawHealthBar(ctx) {
        const barWidth = this.width;
        const barHeight = 4;
        const x = this.x;
        const y = this.y - 8;
        const healthPercent = this.health / this.maxHealth;
        
        // Fundo da barra
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Barra de vida
        ctx.fillStyle = this.getHealthColor(healthPercent);
        ctx.fillRect(x, y, barWidth * healthPercent, barHeight);
    }
    
    getHealthColor(percent) {
        if (percent > 0.6) return '#00ff00';
        if (percent > 0.3) return '#ffff00';
        return '#ff0000';
    }
    
    takeDamage(amount) {
        this.health -= amount;
        this.damageFlash = 100; // 100ms de flash
        
        // Garante que a saúde não fique negativa
        if (this.health <= 0) {
            this.health = 0;
            this.dead = true; // Marca o inimigo como morto
        }
    }
    
    applyKnockback(directionX, directionY, force) {
        this.knockbackX = directionX * force;
        this.knockbackY = directionY * force;
        this.knockbackDuration = 100; // 100ms de knockback
    }
} 