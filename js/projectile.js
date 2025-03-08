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
        this.color = color || '#ff0000'; // Cor padrão vermelha
        this.timeAlive = 0;
    }
    
    update(deltaTime) {
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
        
        // Gera novas partículas
        if (Math.random() < 0.3) {
            this.addParticle();
        }
    }
    
    draw(ctx) {
        // Desenha o projétil inimigo
        ctx.fillStyle = this.color;
        
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
            color: this.color
        });
    }
} 