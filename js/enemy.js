import { EnemyProjectile } from './projectile.js';

export class Enemy {
    constructor(x, y, health, damage, xpValue, type = null, zone = 0, game = null) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 20;
        this.health = health;
        this.maxHealth = health;
        this.damage = damage;
        this.xpValue = xpValue;
        this.zone = zone;
        this.game = game;
        
        // Tipo de inimigo: 'broken', 'random', 'pursuer'
        this.type = type || this.determineType(zone);
        
        // Movimento
        this.speed = 1 + Math.random() * 1.5; // Velocidade aleatória
        this.originalSpeed = this.speed; // Armazena a velocidade original para efeitos de lentidão
        this.moveTimer = 0;
        this.moveInterval = 1000 + Math.random() * 2000; // Intervalo de movimento aleatório
        this.moveDirection = Math.random() * Math.PI * 2; // Direção aleatória
        this.rotation = this.moveDirection; // Inicializa a rotação com a direção de movimento
        
        // Ajusta velocidade e intervalo com base no tipo
        if (this.type === 'pursuer') {
            this.speed *= 1.2; // Perseguidores são mais rápidos
            this.originalSpeed = this.speed; // Atualiza a velocidade original
        } else if (this.type === 'random') {
            this.moveInterval *= 0.8; // Aleatórios mudam de direção mais frequentemente
        }
        
        // Distância de detecção para inimigos perseguidores
        this.detectionRange = 200;
        
        // Cooldown de tiro
        this.shootCooldown = 0;
        this.shootMaxCooldown = this.type === 'pursuer' ? 2000 : 1000; // Perseguidores têm cooldown maior
        
        // Cooldown de colisão com o player
        this.collisionCooldown = 0;
        this.collisionMaxCooldown = 500; // 500ms de cooldown após colidir com o player
        
        // Aparência
        this.color = this.generateColor();
        this.tankType = Math.floor(Math.random() * 3); // 0: leve, 1: médio, 2: pesado
        
        // Efeito de fumaça para inimigos quebrados
        this.smokeParticles = [];
        if (this.type === 'broken') {
            this.generateSmokeParticles();
        }
        
        // Detalhes visuais adicionais
        this.pulseRate = 0.5 + Math.random() * 1.5; // Taxa de pulsação
        this.pulseAmount = 0.05 + Math.random() * 0.1; // Quantidade de pulsação
        this.pulseOffset = Math.random() * Math.PI * 2; // Deslocamento da pulsação
        
        // Estado
        this.damageFlash = 0;
        this.knockbackX = 0;
        this.knockbackY = 0;
        this.knockbackDuration = 0;
        this.dead = false; // Flag para indicar se o inimigo está morto
        this.visible = true; // Adiciona a flag de visibilidade
        
        // Efeitos de status
        this.isSlowed = false; // Se está sob efeito de lentidão
        this.isFrozen = false; // Se está congelado
        this.iceParticles = []; // Partículas de gelo para efeito visual
        
        // ID único para o inimigo (para rastreamento de efeitos)
        this.id = Math.random().toString(36).substr(2, 9);
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
                x: this.x + this.width/2 + Math.random() * 10 - 5, // Posição inicial relativa ao inimigo
                y: this.y + this.height/2 + Math.random() * 10 - 5,
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
        // Atualiza o cooldown de tiro
        if (this.shootCooldown > 0) {
            this.shootCooldown -= deltaTime;
        }
        
        // Atualiza o cooldown de colisão
        if (this.collisionCooldown > 0) {
            this.collisionCooldown -= deltaTime;
            // Enquanto estiver em cooldown de colisão, a velocidade é reduzida
            this.speed = this.originalSpeed * 0.5;
        } else {
            // Restaura a velocidade original quando o cooldown terminar
            this.speed = this.originalSpeed;
        }
        
        // Atualiza o timer de movimento
        this.moveTimer += deltaTime;
        
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
                
                // Atualiza a rotação do tanque para apontar para o jogador quando atira
                this.rotation = angle;
                
                // Cria um projétil inimigo
                if (game) {
                    const projectileSpeed = 3;
                    
                    // Criar um projétil válido usando a classe Projectile
                    const enemyProjectile = new EnemyProjectile(
                        this.x + this.width/2,
                        this.y + this.height/2,
                        8,
                        8,
                        Math.cos(angle) * projectileSpeed,
                        Math.sin(angle) * projectileSpeed,
                        this.damage,
                        this.color
                    );
                    
                    // Adicionar o projétil usando o método addProjectile
                    game.addProjectile(enemyProjectile);
                }
                
                // Reseta o cooldown
                this.shootCooldown = this.shootMaxCooldown;
            }
        }
        
        // Atualiza os efeitos visuais de gelo
        this.updateIceEffects(deltaTime);
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
                this.rotation = this.moveDirection; // Atualiza a rotação imediatamente
                this.moveTimer = 0; // Reseta o timer para continuar perseguindo
            }
        }
        
        // Muda de direção periodicamente (apenas para comportamento aleatório)
        if (this.type === 'random' && this.moveTimer >= this.moveInterval) {
            this.moveTimer = 0;
            this.moveDirection = Math.random() * Math.PI * 2;
            this.rotation = this.moveDirection; // Atualiza a rotação imediatamente
            
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
        // Se o inimigo estiver morto ou invisível, não desenha nada
        if (this.dead || !this.visible) {
            // Adiciona log para debug
            if (this.dead && (this.x > 0 || this.y > 0)) {
                console.log("Tentando desenhar inimigo morto:", this);
            }
            return; // Sai imediatamente sem desenhar nada
        }
        
        // Verifica se as coordenadas são válidas
        if (isNaN(this.x) || isNaN(this.y)) {
            console.log("Inimigo com coordenadas NaN:", this);
            // Corrige as coordenadas para evitar problemas
            this.x = 0;
            this.y = 0;
            this.dead = true;
            this.visible = false;
            return;
        }
        
        // Verifica se as coordenadas são válidas (não está no canto superior esquerdo)
        if (this.x < -100 || this.y < -100) {
            console.log("Inimigo fora da tela:", this);
            return; // Não desenha inimigos fora da tela
        }
        
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        // Calcula o fator de pulsação
        const time = Date.now() * 0.001; // Tempo em segundos
        const pulseFactor = 1 + Math.sin(time * this.pulseRate + this.pulseOffset) * this.pulseAmount;
        
        // Define a cor com base no estado de dano
        let baseColor = this.damageFlash > 0 ? '#ffffff' : this.color;
        
        // Modifica a cor se estiver congelado ou lento
        if (this.isFrozen) {
            baseColor = '#96D9FF'; // Azul claro para congelado
        } else if (this.isSlowed) {
            // Mistura a cor original com azul claro para efeito de lentidão
            const originalColor = this.damageFlash > 0 ? '#ffffff' : this.color;
            baseColor = this.blendColors(originalColor, '#96D9FF', 0.3);
        }
        
        // Salva o contexto para aplicar transformações
        ctx.save();
        ctx.translate(centerX, centerY);
        
        // Aplica tremor se estiver congelado
        if (this.isFrozen) {
            const shakeAmount = 0.5;
            ctx.translate(
                (Math.random() - 0.5) * shakeAmount,
                (Math.random() - 0.5) * shakeAmount
            );
        }
        
        ctx.rotate(this.rotation);
        ctx.scale(pulseFactor, pulseFactor);
        
        // Desenha os efeitos de gelo (atrás do tanque)
        this.drawIceEffects(ctx);
        
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
        
        // Canhão do tanque - Corrigido para evitar desenhar dois canhões
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
        // Se o inimigo estiver morto ou invisível, não desenha nada
        if (this.dead || !this.visible || this.smokeParticles.length === 0) {
            return;
        }
        
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
        // Não aplica dano se o inimigo já estiver morto
        if (this.dead) return;
        
        // Aplica o dano
        this.health -= amount;
        
        // Efeito visual de dano
        this.damageFlash = 100; // 100ms de flash
        
        // Verifica se o inimigo morreu
        if (this.health <= 0) {
            this.health = 0;
            this.dead = true;
            
            // Gera um drop aleatório
            const drop = this.generateDrop();
            if (drop && this.game) {
                this.game.drops.push(drop);
            }
            
            // Dá XP ao jogador
            if (this.game && this.game.player) {
                this.game.player.gainXP(this.xpValue);
            }
            
            // Verifica se este foi o último inimigo
            if (this.game && this.game.enemies.length === 1) { // Se só tem este inimigo (que acabou de morrer)
                console.log("Último inimigo derrotado! Verificando spawn de baú...");
                
                // Força a geração de um baú com 50% de chance
                if (Math.random() < 0.5) {
                    setTimeout(() => {
                        if (this.game.chests.length === 0) { // Só gera se não houver outros baús
                            this.game.forceChestSpawn();
                        }
                    }, 1000); // Espera 1 segundo para gerar o baú
                }
            }
        }
    }
    
    generateDrop() {
        // 30% de chance de gerar um drop
        if (Math.random() < 0.3) {
            // Determina o tipo de drop
            const dropType = Math.random() < 0.33 ? 'speed' : 
                             Math.random() < 0.66 ? 'damage' : 'health';
            
            // Cria o objeto de drop
            const drop = {
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                width: 15,
                height: 15,
                type: dropType,
                value: dropType === 'health' ? 10 : 0.5,
                collected: false
            };
            
            // Retorna o drop
            return drop;
        }
        
        // Retorna null se não gerar drop
        return null;
    }
    
    applyKnockback(directionX, directionY, force) {
        // Verifica se os parâmetros são números válidos
        if (isNaN(directionX) || isNaN(directionY) || isNaN(force)) {
            console.log("Tentativa de aplicar knockback com valores NaN:", {
                directionX, directionY, force, enemy: this
            });
            return; // Não aplica knockback com valores inválidos
        }
        
        // Normaliza a direção para evitar knockbacks extremos
        const length = Math.sqrt(directionX * directionX + directionY * directionY);
        if (length > 0) {
            directionX = directionX / length;
            directionY = directionY / length;
        } else {
            // Se não houver direção, usa uma direção padrão
            directionX = 0;
            directionY = -1; // Para cima
        }
        
        this.knockbackX = directionX * force;
        this.knockbackY = directionY * force;
        this.knockbackDuration = 100; // 100ms de knockback
    }
    
    // Método para atualizar os efeitos visuais de gelo
    updateIceEffects(deltaTime) {
        // Atualiza as partículas de gelo existentes
        for (let i = this.iceParticles.length - 1; i >= 0; i--) {
            const particle = this.iceParticles[i];
            
            // Reduz o tempo de vida
            particle.life -= deltaTime;
            
            // Remove partículas expiradas
            if (particle.life <= 0) {
                this.iceParticles.splice(i, 1);
            }
        }
        
        // Adiciona novas partículas de gelo se estiver congelado ou lento
        if (this.isFrozen || this.isSlowed) {
            // Adiciona menos partículas se estiver apenas lento
            const particleChance = this.isFrozen ? 0.3 : 0.1;
            
            if (Math.random() < particleChance) {
                this.addIceParticle();
            }
        }
    }
    
    // Método para adicionar uma partícula de gelo
    addIceParticle() {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        this.iceParticles.push({
            x: centerX + (Math.random() - 0.5) * this.width,
            y: centerY + (Math.random() - 0.5) * this.height,
            size: 1 + Math.random() * 3,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5 - 0.2, // Tendência a subir
            life: 500 + Math.random() * 1000,
            alpha: 0.7 + Math.random() * 0.3
        });
    }
    
    // Método para desenhar as partículas de gelo
    drawIceEffects(ctx) {
        // Não desenha se não houver efeitos
        if (!this.isSlowed && !this.isFrozen && this.iceParticles.length === 0) {
            return;
        }
        
        // Desenha um efeito de aura de gelo se estiver congelado
        if (this.isFrozen) {
            ctx.save();
            
            // Cria um gradiente radial para a aura de gelo
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(this.width, this.height) * 0.7);
            gradient.addColorStop(0, 'rgba(150, 217, 255, 0.6)');
            gradient.addColorStop(1, 'rgba(150, 217, 255, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, Math.max(this.width, this.height) * 0.7, 0, Math.PI * 2);
            ctx.fill();
            
            // Desenha cristais de gelo
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 1;
            
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const length = Math.max(this.width, this.height) * 0.5;
                
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
                ctx.stroke();
                
                // Desenha pequenos cristais nas pontas
                ctx.beginPath();
                ctx.moveTo(Math.cos(angle) * length * 0.7, Math.sin(angle) * length * 0.7);
                ctx.lineTo(Math.cos(angle + 0.2) * length * 0.9, Math.sin(angle + 0.2) * length * 0.9);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(Math.cos(angle) * length * 0.7, Math.sin(angle) * length * 0.7);
                ctx.lineTo(Math.cos(angle - 0.2) * length * 0.9, Math.sin(angle - 0.2) * length * 0.9);
                ctx.stroke();
            }
            
            ctx.restore();
        }
        // Desenha um efeito de aura de lentidão se estiver apenas lento
        else if (this.isSlowed) {
            ctx.save();
            
            // Cria um gradiente radial para a aura de lentidão
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(this.width, this.height) * 0.6);
            gradient.addColorStop(0, 'rgba(150, 217, 255, 0.3)');
            gradient.addColorStop(1, 'rgba(150, 217, 255, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, Math.max(this.width, this.height) * 0.6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
        
        // Desenha as partículas de gelo
        ctx.save();
        
        for (const particle of this.iceParticles) {
            const relativeX = particle.x - (this.x + this.width / 2);
            const relativeY = particle.y - (this.y + this.height / 2);
            
            ctx.fillStyle = `rgba(200, 240, 255, ${particle.alpha * (particle.life / 1500)})`;
            ctx.beginPath();
            ctx.arc(relativeX, relativeY, particle.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    // Método para misturar duas cores
    blendColors(color1, color2, ratio) {
        // Converte cores para RGB
        const parseColor = (color) => {
            if (color.startsWith('#')) {
                const r = parseInt(color.substr(1, 2), 16);
                const g = parseInt(color.substr(3, 2), 16);
                const b = parseInt(color.substr(5, 2), 16);
                return [r, g, b];
            }
            return [0, 0, 0]; // Fallback para preto
        };
        
        const [r1, g1, b1] = parseColor(color1);
        const [r2, g2, b2] = parseColor(color2);
        
        // Mistura as cores
        const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
        const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
        const b = Math.round(b1 * (1 - ratio) + b2 * ratio);
        
        // Converte de volta para hex
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    // Método para aplicar o cooldown de colisão
    applyCollisionCooldown() {
        this.collisionCooldown = this.collisionMaxCooldown;
    }
} 