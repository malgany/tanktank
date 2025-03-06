export class Projectile {
    constructor(x, y, width, height, velocityX, velocityY, damage) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.damage = damage;
        
        // Efeitos visuais
        this.particles = [];
        this.generateParticles();
    }
    
    update(deltaTime) {
        // Move o projétil
        this.x += this.velocityX;
        this.y += this.velocityY;
        
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