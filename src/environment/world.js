export class World {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.screens = this.generateWorld();
    }
    
    generateWorld() {
        const screens = [];
        
        // Cria uma matriz 2D para armazenar os tipos de tela
        for (let y = 0; y < this.height; y++) {
            const row = [];
            for (let x = 0; x < this.width; x++) {
                // Calcula a distância do centro (12,12)
                const distanceFromCenter = Math.sqrt(
                    Math.pow(x - 12, 2) + 
                    Math.pow(y - 12, 2)
                );
                
                // Define o tipo de tela com base na distância
                let type;
                if (distanceFromCenter < 3) {
                    type = 'plains'; // Planície (centro)
                } else if (distanceFromCenter < 6) {
                    type = 'forest'; // Floresta
                } else if (distanceFromCenter < 10) {
                    type = 'mountains'; // Montanhas
                } else {
                    type = 'desert'; // Deserto (bordas)
                }
                
                // Adiciona uma pequena variação de cor para cada tela
                const colorVariation = Math.random() * 0.2 - 0.1; // -0.1 a 0.1
                
                row.push({
                    type: type,
                    colorVariation: colorVariation,
                    cleared: false // Indica se a tela foi limpa de inimigos
                });
            }
            screens.push(row);
        }
        
        return screens;
    }
    
    getScreenType(x, y) {
        // Verifica se as coordenadas estão dentro dos limites
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return 'void';
        }
        
        return this.screens[y][x].type;
    }
    
    getScreenColorVariation(x, y) {
        // Verifica se as coordenadas estão dentro dos limites
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return 0;
        }
        
        return this.screens[y][x].colorVariation;
    }
    
    draw(ctx, canvas, screenX, screenY) {
        const screenType = this.getScreenType(screenX, screenY);
        const colorVariation = this.getScreenColorVariation(screenX, screenY);
        
        // Define a cor de fundo com base no tipo de tela
        let baseColor;
        switch (screenType) {
            case 'plains':
                baseColor = [120, 200, 80]; // Verde claro
                break;
            case 'forest':
                baseColor = [34, 139, 34]; // Verde floresta
                break;
            case 'mountains':
                baseColor = [139, 137, 137]; // Cinza
                break;
            case 'desert':
                baseColor = [210, 180, 140]; // Bege
                break;
            default:
                baseColor = [0, 0, 0]; // Preto (vazio)
        }
        
        // Aplica a variação de cor
        const adjustedColor = baseColor.map(c => {
            const adjusted = c * (1 + colorVariation);
            return Math.max(0, Math.min(255, adjusted));
        });
        
        // Preenche o fundo
        ctx.fillStyle = `rgb(${adjustedColor[0]}, ${adjustedColor[1]}, ${adjustedColor[2]})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Desenha elementos adicionais com base no tipo de tela
        this.drawScreenElements(ctx, canvas, screenType, adjustedColor);
    }
    
    drawScreenElements(ctx, canvas, screenType, baseColor) {
        // Número de elementos a desenhar
        let elementCount = 0;
        
        switch (screenType) {
            case 'plains':
                elementCount = 10; // Algumas gramas
                break;
            case 'forest':
                elementCount = 20; // Várias árvores
                break;
            case 'mountains':
                elementCount = 15; // Algumas rochas
                break;
            case 'desert':
                elementCount = 8; // Poucos cactos
                break;
            default:
                return; // Nada a desenhar
        }
        
        // Gera uma seed para posicionamento consistente dos elementos
        const seed = this.width * this.height;
        
        // Desenha os elementos
        for (let i = 0; i < elementCount; i++) {
            const x = (Math.sin(seed * i) * 0.5 + 0.5) * canvas.width;
            const y = (Math.cos(seed * i * 1.5) * 0.5 + 0.5) * canvas.height;
            
            switch (screenType) {
                case 'plains':
                    this.drawGrass(ctx, x, y, baseColor);
                    break;
                case 'forest':
                    this.drawTree(ctx, x, y, baseColor);
                    break;
                case 'mountains':
                    this.drawRock(ctx, x, y, baseColor);
                    break;
                case 'desert':
                    this.drawCactus(ctx, x, y, baseColor);
                    break;
            }
        }
    }
    
    drawGrass(ctx, x, y, baseColor) {
        // Desenha um tufo de grama
        const height = 10 + Math.random() * 10;
        const width = 5 + Math.random() * 5;
        
        // Cor mais clara que o fundo
        ctx.fillStyle = `rgb(${baseColor[0] + 30}, ${baseColor[1] + 30}, ${baseColor[2]})`;
        
        // Desenha várias linhas para formar o tufo
        for (let i = 0; i < 3; i++) {
            const offsetX = (i - 1) * width / 3;
            
            ctx.beginPath();
            ctx.moveTo(x + offsetX, y + height);
            ctx.lineTo(x + offsetX, y);
            ctx.lineTo(x + offsetX + width / 3, y + height / 3);
            ctx.fill();
        }
    }
    
    drawTree(ctx, x, y, baseColor) {
        // Tronco
        ctx.fillStyle = `rgb(101, 67, 33)`;
        ctx.fillRect(x - 5, y, 10, 30);
        
        // Copa (mais escura que o fundo)
        ctx.fillStyle = `rgb(${baseColor[0] - 20}, ${baseColor[1] - 10}, ${baseColor[2] - 20})`;
        
        // Desenha um triângulo para a copa
        ctx.beginPath();
        ctx.moveTo(x, y - 40);
        ctx.lineTo(x - 20, y + 10);
        ctx.lineTo(x + 20, y + 10);
        ctx.fill();
    }
    
    drawRock(ctx, x, y, baseColor) {
        // Desenha uma rocha (polígono irregular)
        const size = 15 + Math.random() * 15;
        
        // Cor mais escura que o fundo
        ctx.fillStyle = `rgb(${baseColor[0] - 30}, ${baseColor[1] - 30}, ${baseColor[2] - 30})`;
        
        ctx.beginPath();
        ctx.moveTo(x, y - size / 2);
        ctx.lineTo(x + size / 2, y - size / 4);
        ctx.lineTo(x + size / 2, y + size / 3);
        ctx.lineTo(x, y + size / 2);
        ctx.lineTo(x - size / 2, y + size / 4);
        ctx.lineTo(x - size / 3, y - size / 3);
        ctx.closePath();
        ctx.fill();
    }
    
    drawCactus(ctx, x, y, baseColor) {
        // Desenha um cacto
        const height = 20 + Math.random() * 20;
        
        // Cor mais escura que o fundo
        ctx.fillStyle = `rgb(${baseColor[0] - 50}, ${baseColor[1] + 20}, ${baseColor[2] - 50})`;
        
        // Corpo principal
        ctx.fillRect(x - 5, y, 10, height);
        
        // Braços (50% de chance para cada braço)
        if (Math.random() > 0.5) {
            ctx.fillRect(x - 15, y + height / 3, 10, height / 3);
        }
        
        if (Math.random() > 0.5) {
            ctx.fillRect(x + 5, y + height / 2, 10, height / 4);
        }
    }
} 