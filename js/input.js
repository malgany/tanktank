export class InputHandler {
    constructor(game) {
        this.game = game;
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false,
            space: false,
            shift: false,
            // Teclas numéricas para seleção de poderes
            1: false,
            2: false,
            3: false
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
        
        // Tecla I para mostrar informações do jogador
        if (event.key.toLowerCase() === 'i') {
            this.game.togglePlayerInfo();
            event.preventDefault();
            return;
        }
        
        // Tecla P para mostrar informações do poder atual
        if (event.key.toLowerCase() === 'p') {
            this.game.ui.showPowerInfo();
            event.preventDefault();
            return;
        }
        
        // Apenas tecla de debug para mostrar posição atual
        if (event.key === '0') {
            console.log("Posição atual:", window.debugGame.getCurrentPosition());
            return;
        }
        
        // Teclas numéricas para seleção de poderes
        if (event.key === '1' || event.key === '2' || event.key === '3') {
            this.keys[event.key] = true;
            this.selectPower(parseInt(event.key));
            event.preventDefault();
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
        if (['w', 'a', 's', 'd', ' ', 'shift', 'm', 'i', 'p', '0', '1', '2', '3'].includes(event.key.toLowerCase())) {
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
            case '1':
            case '2':
            case '3':
                this.keys[event.key] = false;
                break;
        }
    }
    
    // Método para selecionar um poder com base na tecla numérica
    selectPower(keyNumber) {
        const player = this.game.player;
        
        switch (keyNumber) {
            case 1:
                // Usar o poder atual
                player.usePower();
                break;
            case 2:
                // Não faz nada no novo sistema
                break;
            case 3:
                // Não faz nada no novo sistema
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
            // Não chama mais usePower aqui, será chamado no processInput
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
        
        // Verifica se o botão do mouse está pressionado e tenta usar o poder
        if (this.mouseDown) {
            this.game.player.usePower();
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