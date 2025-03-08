export class Projectile {
    constructor(x, y, width, height, velocityX, velocityY, damage) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.damage = damage;
        this.isEnemy = false; // Por padrão, projéteis não são de inimigos
        
        // Efeitos visuais
        this.particles = [];
        this.generateParticles();
        
        // Propriedades de ricochete
        this.canRicochet = false;
        this.ricochetsLeft = 1; // Número de ricochetes permitidos
        this.hasRicocheted = false; // Se já ricocheteou
    }
    
    update(deltaTime) {
        // Move o projétil
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // Verifica ricochete nas paredes se tiver a habilidade
        if (this.canRicochet && this.ricochetsLeft > 0) {
            // Verifica colisão com as bordas do canvas
            const canvas = document.getElementById('gameCanvas');
            
            // Ricochete na borda esquerda
            if (this.x <= 0) {
                this.x = 0; // Corrige a posição para evitar que saia da tela
                this.velocityX = Math.abs(this.velocityX); // Garante que a velocidade seja positiva (para a direita)
                this.ricochetsLeft--;
                this.hasRicocheted = true;
                this.addRicochetEffect();
            }
            
            // Ricochete na borda direita
            if (this.x + this.width >= canvas.width) {
                this.x = canvas.width - this.width; // Corrige a posição
                this.velocityX = -Math.abs(this.velocityX); // Garante que a velocidade seja negativa (para a esquerda)
                this.ricochetsLeft--;
                this.hasRicocheted = true;
                this.addRicochetEffect();
            }
            
            // Ricochete na borda superior
            if (this.y <= 0) {
                this.y = 0; // Corrige a posição
                this.velocityY = Math.abs(this.velocityY); // Garante que a velocidade seja positiva (para baixo)
                this.ricochetsLeft--;
                this.hasRicocheted = true;
                this.addRicochetEffect();
            }
            
            // Ricochete na borda inferior
            if (this.y + this.height >= canvas.height) {
                this.y = canvas.height - this.height; // Corrige a posição
                this.velocityY = -Math.abs(this.velocityY); // Garante que a velocidade seja negativa (para cima)
                this.ricochetsLeft--;
                this.hasRicocheted = true;
                this.addRicochetEffect();
            }
        }
        
        // Atualiza as partículas
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Move a partícula
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Reduz o tempo de vida
            particle.life -= deltaTime;
            
            // Remove partículas expiradas
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        // Gera novas partículas
        if (Math.random() < 0.3) {
            this.addParticle();
        }
    }
    
    addRicochetEffect() {
        // Adiciona partículas extras no momento do ricochete
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                size: 2 + Math.random() * 4,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 200 + Math.random() * 300,
                color: '#ffffff'
            });
        }
    }
    
    draw(ctx) {
        // Desenha o projétil principal (bola de fogo)
        ctx.fillStyle = '#ff4500'; // Laranja avermelhado
        
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
        
        gradient.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
        
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
        
        // Se o projétil pode ricocheter, adiciona um efeito visual
        if (this.canRicochet && this.ricochetsLeft > 0) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(
                this.x + this.width / 2, 
                this.y + this.height / 2, 
                this.width / 2 + 2, 
                0, 
                Math.PI * 2
            );
            ctx.stroke();
        }
        
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
            color: Math.random() < 0.5 ? '#ffcc00' : '#ff4500'
        });
    }
    
    drawParticles(ctx) {
        // Desenha todas as partículas
        for (const particle of this.particles) {
            ctx.fillStyle = particle.color;
            ctx.globalAlpha = particle.life / 300; // Desaparece gradualmente
            
            ctx.beginPath();
            ctx.arc(
                particle.x, 
                particle.y, 
                particle.size, 
                0, 
                Math.PI * 2
            );
            ctx.fill();
        }
        
        // Restaura a opacidade
        ctx.globalAlpha = 1;
    }
}

export class EnemyProjectile extends Projectile {
    constructor(x, y, width, height, velocityX, velocityY, damage, color) {
        super(x, y, width, height, velocityX, velocityY, damage);
        this.isEnemy = true;
        this.lifespan = 2000; // Tempo de vida em ms
        
        // Cores de fogo para os projéteis inimigos
        const fireColors = ['#ff3300', '#ff6600', '#ff9900', '#ffcc00']; // Vermelho, laranja, laranja claro, amarelo
        this.color = fireColors[Math.floor(Math.random() * fireColors.length)]; // Escolhe uma cor aleatória
        
        this.timeAlive = 0;
        
        // Adiciona propriedades para efeito de fogo
        this.pulseRate = 0.1 + Math.random() * 0.2; // Taxa de pulsação
        this.pulseAmount = 0.2 + Math.random() * 0.3; // Quantidade de pulsação
        this.pulseOffset = Math.random() * Math.PI * 2; // Deslocamento da pulsação
        
        // Rastro de fogo
        this.trail = [];
        this.trailMaxLength = 10; // Número máximo de posições no rastro
    }
    
    update(deltaTime) {
        // Salva a posição atual para o rastro
        this.trail.push({
            x: this.x + this.width / 2,
            y: this.y + this.height / 2,
            size: this.width / 2,
            age: 0
        });
        
        // Limita o tamanho do rastro
        if (this.trail.length > this.trailMaxLength) {
            this.trail.shift();
        }
        
        // Atualiza a idade de cada ponto do rastro
        for (const point of this.trail) {
            point.age += deltaTime;
        }
        
        // Atualiza a posição
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // Atualiza o tempo de vida
        this.timeAlive += deltaTime;
        if (this.timeAlive >= this.lifespan) {
            // Marca para remoção quando o tempo de vida acabar
            this.x = -100; // Move para fora da tela para ser removido
            this.y = -100;
        }
        
        // Atualiza as partículas
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Move a partícula
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Reduz o tempo de vida
            particle.life -= deltaTime;
            
            // Remove partículas expiradas
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        // Gera novas partículas com mais frequência para efeito de fogo
        if (Math.random() < 0.5) {
            this.addParticle();
        }
    }
    
    draw(ctx) {
        // Desenha o rastro de fogo
        this.drawTrail(ctx);
        
        // Calcula a pulsação para o efeito de fogo
        const gameTime = performance.now();
        const pulseFactor = 1 + Math.sin(gameTime * this.pulseRate + this.pulseOffset) * this.pulseAmount;
        const size = (this.width / 2) * pulseFactor;
        
        // Desenha o projétil inimigo com efeito de fogo
        ctx.fillStyle = this.color;
        
        // Desenha um círculo
        ctx.beginPath();
        ctx.arc(
            this.x + this.width / 2, 
            this.y + this.height / 2, 
            size, 
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
            size
        );
        
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        
        // Extrai os valores RGB da cor
        let r, g, b;
        if (this.color.startsWith('#')) {
            // Se for uma cor hexadecimal
            r = parseInt(this.color.slice(1, 3), 16);
            g = parseInt(this.color.slice(3, 5), 16);
            b = parseInt(this.color.slice(5, 7), 16);
        } else if (this.color.startsWith('rgb')) {
            // Se for uma cor RGB
            const rgbValues = this.color.match(/\d+/g);
            if (rgbValues && rgbValues.length >= 3) {
                r = parseInt(rgbValues[0]);
                g = parseInt(rgbValues[1]);
                b = parseInt(rgbValues[2]);
            } else {
                // Fallback para vermelho se não conseguir extrair os valores
                r = 255; g = 0; b = 0;
            }
        } else {
            // Fallback para vermelho
            r = 255; g = 0; b = 0;
        }
        
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(
            this.x + this.width / 2, 
            this.y + this.height / 2, 
            size, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
        
        // Desenha as partículas
        this.drawParticles(ctx);
    }
    
    // Método para desenhar o rastro de fogo
    drawTrail(ctx) {
        for (let i = 0; i < this.trail.length; i++) {
            const point = this.trail[i];
            const age = point.age / 200; // Normaliza a idade (0 a 1)
            const opacity = Math.max(0, 1 - age); // Opacidade diminui com a idade
            const size = point.size * (1 - age * 0.7); // Tamanho diminui com a idade
            
            // Escolhe a cor com base na idade (vai de amarelo para laranja para vermelho)
            let trailColor;
            if (age < 0.3) {
                trailColor = `rgba(255, 255, 0, ${opacity})`; // Amarelo
            } else if (age < 0.6) {
                trailColor = `rgba(255, 165, 0, ${opacity})`; // Laranja
            } else {
                trailColor = `rgba(255, 0, 0, ${opacity})`; // Vermelho
            }
            
            ctx.fillStyle = trailColor;
            ctx.beginPath();
            ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    generateParticles() {
        // Gera partículas iniciais
        for (let i = 0; i < 10; i++) { // Aumenta o número de partículas iniciais
            this.addParticle();
        }
    }
    
    addParticle() {
        // Cores de fogo para as partículas
        const fireColors = ['#ff3300', '#ff6600', '#ff9900', '#ffcc00', '#ffff00'];
        const particleColor = fireColors[Math.floor(Math.random() * fireColors.length)];
        
        this.particles.push({
            x: this.x + this.width / 2,
            y: this.y + this.height / 2,
            size: 1 + Math.random() * 3,
            color: particleColor,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 300 + Math.random() * 200
        });
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

export class PoisonProjectile extends Projectile {
    constructor(x, y, width, height, velocityX, velocityY, damage) {
        super(x, y, width, height, velocityX, velocityY, damage);
        this.type = 'poison';
        this.poisonDamage = damage; // Usa o dano passado como parâmetro
        this.poisonDuration = 5000; // Duração em ms (5 segundos)
    }
    
    draw(ctx) {
        // Desenha o projétil de veneno
        ctx.fillStyle = '#8A2BE2'; // Roxo
        
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
        gradient.addColorStop(1, 'rgba(138, 43, 226, 0)');
        
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
            color: Math.random() < 0.5 ? '#9932CC' : '#8A2BE2' // Tons de roxo
        });
    }
}

export class ArrowProjectile extends Projectile {
    constructor(x, y, width, height, velocityX, velocityY, damage, maxDistance) {
        super(x, y, width, height, velocityX, velocityY, damage);
        this.type = 'arrow';
        this.startX = x;
        this.startY = y;
        this.maxDistance = maxDistance; // Distância máxima que a flecha pode percorrer
        this.distanceTraveled = 0;
    }
    
    update(deltaTime) {
        // Posição anterior
        const oldX = this.x;
        const oldY = this.y;
        
        // Move o projétil
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // Calcula a distância percorrida neste frame
        const dx = this.x - oldX;
        const dy = this.y - oldY;
        this.distanceTraveled += Math.sqrt(dx * dx + dy * dy);
        
        // Se a flecha atingiu sua distância máxima, marca para remoção
        if (this.distanceTraveled >= this.maxDistance) {
            this.x = -100; // Move para fora da tela para ser removido
            this.y = -100;
            return;
        }
        
        // Verifica ricochete nas paredes se tiver a habilidade
        if (this.canRicochet && this.ricochetsLeft > 0) {
            // Código de ricochete existente...
            const canvas = document.getElementById('gameCanvas');
            
            // Ricochete na borda esquerda
            if (this.x <= 0) {
                this.x = 0;
                this.velocityX = Math.abs(this.velocityX);
                this.ricochetsLeft--;
                this.hasRicocheted = true;
                this.addRicochetEffect();
            }
            
            // Ricochete na borda direita
            if (this.x + this.width >= canvas.width) {
                this.x = canvas.width - this.width;
                this.velocityX = -Math.abs(this.velocityX);
                this.ricochetsLeft--;
                this.hasRicocheted = true;
                this.addRicochetEffect();
            }
            
            // Ricochete na borda superior
            if (this.y <= 0) {
                this.y = 0;
                this.velocityY = Math.abs(this.velocityY);
                this.ricochetsLeft--;
                this.hasRicocheted = true;
                this.addRicochetEffect();
            }
            
            // Ricochete na borda inferior
            if (this.y + this.height >= canvas.height) {
                this.y = canvas.height - this.height;
                this.velocityY = -Math.abs(this.velocityY);
                this.ricochetsLeft--;
                this.hasRicocheted = true;
                this.addRicochetEffect();
            }
        }
        
        // Atualiza as partículas
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Move a partícula
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Reduz o tempo de vida
            particle.life -= deltaTime;
            
            // Remove partículas expiradas
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        // Gera novas partículas
        if (Math.random() < 0.3) {
            this.addParticle();
        }
    }
    
    draw(ctx) {
        // Salva o contexto para aplicar rotação
        ctx.save();
        
        // Translada para o centro do projétil
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        
        // Calcula o ângulo da flecha com base na velocidade
        const angle = Math.atan2(this.velocityY, this.velocityX);
        ctx.rotate(angle);
        
        // Desenha a flecha
        ctx.fillStyle = '#8B4513'; // Marrom para a flecha
        
        // Corpo da flecha (retângulo)
        ctx.fillRect(-this.width / 2, -this.height / 4, this.width, this.height / 2);
        
        // Ponta da flecha (triângulo)
        ctx.beginPath();
        ctx.moveTo(this.width / 2, -this.height / 2);
        ctx.lineTo(this.width / 2 + this.height / 2, 0);
        ctx.lineTo(this.width / 2, this.height / 2);
        ctx.closePath();
        ctx.fillStyle = '#696969'; // Cinza escuro para a ponta
        ctx.fill();
        
        // Penas da flecha (na parte traseira)
        ctx.beginPath();
        ctx.moveTo(-this.width / 2, -this.height / 2);
        ctx.lineTo(-this.width / 2 - this.height / 3, 0);
        ctx.lineTo(-this.width / 2, this.height / 2);
        ctx.closePath();
        ctx.fillStyle = '#F5F5F5'; // Branco para as penas
        ctx.fill();
        
        // Restaura o contexto
        ctx.restore();
        
        // Desenha as partículas
        this.drawParticles(ctx);
    }
    
    generateParticles() {
        // Gera partículas iniciais (menos que outros projéteis)
        for (let i = 0; i < 5; i++) {
            this.addParticle();
        }
    }
    
    addParticle() {
        // Adiciona uma nova partícula
        this.particles.push({
            x: this.x + this.width / 2,
            y: this.y + this.height / 2,
            size: 1 + Math.random() * 2,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
            life: 50 + Math.random() * 100,
            color: Math.random() < 0.5 ? '#D2B48C' : '#8B4513' // Tons de marrom
        });
    }
} 