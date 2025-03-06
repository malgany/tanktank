export class InputHandler {
    constructor(game) {
        this.game = game;
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false,
            space: false,
            shift: false
        };
        
        // Posição do mouse
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseDown = false;
        
        // Adiciona os event listeners
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // Adiciona os event listeners do mouse
        this.game.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.game.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.game.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // Intervalo para verificar as teclas pressionadas
        this.inputInterval = setInterval(this.processInput.bind(this), 16);
    }
    
    handleKeyDown(event) {
        // Tecla M para mostrar o mapa completo
        if (event.key.toLowerCase() === 'm') {
            if (!this.game.isFullMapVisible) {
                this.game.showFullMap();
            } else {
                this.game.hideFullMap();
            }
            event.preventDefault();
            return;
        }
        
        // Apenas tecla de debug para mostrar posição atual
        if (event.key === '0') {
            console.log("Posição atual:", window.debugGame.getCurrentPosition());
            return;
        }
        
        // Atualiza o estado das teclas
        switch (event.key.toLowerCase()) {
            case 'w':
                this.keys.w = true;
                break;
            case 'a':
                this.keys.a = true;
                break;
            case 's':
                this.keys.s = true;
                break;
            case 'd':
                this.keys.d = true;
                break;
            case ' ':
                this.keys.space = true;
                break;
            case 'shift':
                this.keys.shift = true;
                break;
        }
        
        // Evita o comportamento padrão para as teclas do jogo
        if (['w', 'a', 's', 'd', ' ', 'shift', 'm', '0'].includes(event.key.toLowerCase())) {
            event.preventDefault();
        }
    }
    
    handleKeyUp(event) {
        // Atualiza o estado das teclas
        switch (event.key.toLowerCase()) {
            case 'w':
                this.keys.w = false;
                break;
            case 'a':
                this.keys.a = false;
                break;
            case 's':
                this.keys.s = false;
                break;
            case 'd':
                this.keys.d = false;
                break;
            case ' ':
                this.keys.space = false;
                break;
            case 'shift':
                this.keys.shift = false;
                break;
        }
    }
    
    handleMouseMove(event) {
        // Obtém a posição do mouse relativa ao canvas
        const rect = this.game.canvas.getBoundingClientRect();
        this.mouseX = event.clientX - rect.left;
        this.mouseY = event.clientY - rect.top;
        
        // Atualiza a direção do jogador para apontar para o mouse
        this.updatePlayerDirection();
    }
    
    handleMouseDown(event) {
        // Verifica se é o botão esquerdo (0)
        if (event.button === 0) {
            this.mouseDown = true;
        }
    }
    
    handleMouseUp(event) {
        // Verifica se é o botão esquerdo (0)
        if (event.button === 0) {
            this.mouseDown = false;
        }
    }
    
    updatePlayerDirection() {
        // Calcula o ângulo entre o jogador e o mouse
        const playerCenterX = this.game.player.x + this.game.player.width / 2;
        const playerCenterY = this.game.player.y + this.game.player.height / 2;
        
        // Calcula o ângulo em radianos
        const angleRad = Math.atan2(this.mouseY - playerCenterY, this.mouseX - playerCenterX);
        
        // Converte para graus
        const angleDeg = angleRad * 180 / Math.PI;
        
        // Define a direção com base no ângulo (para compatibilidade)
        if (angleDeg >= -45 && angleDeg < 45) {
            this.game.player.setDirection('right');
        } else if (angleDeg >= 45 && angleDeg < 135) {
            this.game.player.setDirection('down');
        } else if (angleDeg >= -135 && angleDeg < -45) {
            this.game.player.setDirection('up');
        } else {
            this.game.player.setDirection('left');
        }
        
        // Armazena o ângulo exato para uso no canhão
        this.game.player.angle = angleRad;
    }
    
    processInput() {
        // Processa o movimento
        let moveX = 0;
        let moveY = 0;
        
        if (this.keys.w) moveY = -1;
        if (this.keys.s) moveY = 1;
        if (this.keys.a) moveX = -1;
        if (this.keys.d) moveX = 1;
        
        // Atualiza o movimento do jogador
        this.game.player.setMovement(moveX, moveY);
        
        // Processa o ataque com o mouse
        if (this.mouseDown) {
            // Se Shift estiver pressionado e o jogador tiver nível 5+, usa o AOE
            if (this.keys.shift && this.game.player.level >= 5) {
                this.game.player.fireAOE();
            } else {
                this.game.player.fireProjectile();
            }
        }
        
        // Mantém a tecla de espaço para compatibilidade, mas não dispara mais
        if (this.keys.space) {
            this.keys.space = false;
        }
    }
    
    cleanup() {
        // Remove os event listeners e limpa o intervalo
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        this.game.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.game.canvas.removeEventListener('mousedown', this.handleMouseDown);
        this.game.canvas.removeEventListener('mouseup', this.handleMouseUp);
        clearInterval(this.inputInterval);
    }
} 