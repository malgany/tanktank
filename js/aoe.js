export class AOEEffect {
    constructor(x, y, radius, damage, duration) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.damage = damage;
        this.duration = duration;
        this.maxDuration = duration;
        this.active = true;
        this.damageApplied = false;
        
        // Efeitos visuais
        this.particles = [];
        this.generateParticles();
    }
    
    update(deltaTime) {
        // Reduz a duração
        this.duration -= deltaTime;
        
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
        
        // Gera novas partículas enquanto o efeito estiver ativo
        if (this.duration > 0 && Math.random() < 0.3) {
            this.addParticle();
        }
    }
    
    draw(ctx) {
        // Desenha o círculo de efeito
        const alpha = this.duration / this.maxDuration;
        
        // Círculo externo (onda de choque)
        ctx.strokeStyle = `rgba(255, 165, 0, ${alpha * 0.8})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * (1 - alpha * 0.3), 0, Math.PI * 2);
        ctx.stroke();
        
        // Círculo interno (área de efeito)
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius * 0.7
        );
        
        gradient.addColorStop(0, `rgba(255, 255, 0, ${alpha * 0.7})`);
        gradient.addColorStop(0.7, `rgba(255, 69, 0, ${alpha * 0.5})`);
        gradient.addColorStop(1, `rgba(255, 0, 0, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.7, 0, Math.PI * 2);
        ctx.fill();
        
        // Desenha as partículas
        this.drawParticles(ctx, alpha);
    }
    
    generateParticles() {
        // Gera partículas iniciais
        for (let i = 0; i < 50; i++) {
            this.addParticle();
        }
    }
    
    addParticle() {
        // Calcula uma posição aleatória dentro do raio
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * this.radius;
        
        const x = this.x + Math.cos(angle) * distance;
        const y = this.y + Math.sin(angle) * distance;
        
        // Adiciona uma nova partícula
        this.particles.push({
            x: x,
            y: y,
            size: 1 + Math.random() * 4,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            life: 100 + Math.random() * 300,
            color: this.getRandomFireColor()
        });
    }
    
    getRandomFireColor() {
        const colors = [
            '#ff4500', // Vermelho-laranja
            '#ff6600', // Laranja
            '#ffcc00', // Amarelo
            '#ff3300', // Vermelho
            '#ff9900'  // Laranja escuro
        ];
        
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    drawParticles(ctx, alpha) {
        // Desenha todas as partículas
        for (const particle of this.particles) {
            ctx.fillStyle = particle.color;
            ctx.globalAlpha = (particle.life / 300) * alpha; // Desaparece gradualmente
            
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