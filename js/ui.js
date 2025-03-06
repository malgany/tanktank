export class UI {
    constructor(game) {
        this.game = game;
        
        // Elementos do HUD
        this.hpBar = document.getElementById('hpBar');
        this.hpValue = document.getElementById('hpValue');
        this.levelValue = document.getElementById('levelValue');
        this.xpBar = document.getElementById('xpBar');
        this.xpValue = document.getElementById('xpValue');
        this.fireballCooldown = document.getElementById('fireballCooldown');
        
        // Sistema de fila de mensagens
        this.messageQueue = [];
        this.isShowingMessage = false;
        
        // Inicializa a UI
        this.update();
    }
    
    update() {
        const player = this.game.player;
        
        // Atualiza a barra de vida
        const hpPercent = (player.health / player.maxHealth) * 100;
        this.hpBar.style.width = `${hpPercent}%`;
        this.hpValue.textContent = `${player.health}/${player.maxHealth}`;
        
        // Atualiza o nível
        this.levelValue.textContent = player.level;
        
        // Atualiza a barra de XP
        const xpPercent = (player.xp / player.xpToNextLevel) * 100;
        this.xpBar.style.width = `${xpPercent}%`;
        this.xpValue.textContent = `${player.xp}/${player.xpToNextLevel}`;
        
        // Atualiza os cooldowns
        const fireballCooldownPercent = (player.fireballCooldown / player.fireballMaxCooldown) * 100;
        this.fireballCooldown.style.height = `${fireballCooldownPercent}%`;
        
        // Atualiza o cooldown do AOE se o elemento existir
        const aoeCooldown = document.getElementById('aoeCooldown');
        if (aoeCooldown && player.aoeUnlocked) {
            const aoeCooldownPercent = (player.aoeCooldown / player.aoeMaxCooldown) * 100;
            aoeCooldown.style.height = `${aoeCooldownPercent}%`;
        }
    }
    
    showMessage(message, duration = 3000) {
        // Adiciona a mensagem à fila
        this.messageQueue.push({ message, duration });
        
        // Se não estiver mostrando uma mensagem, inicia o processo
        if (!this.isShowingMessage) {
            this.processMessageQueue();
        }
    }
    
    processMessageQueue() {
        // Se a fila estiver vazia ou já estiver mostrando uma mensagem, retorna
        if (this.messageQueue.length === 0 || this.isShowingMessage) {
            return;
        }
        
        // Marca que está mostrando uma mensagem
        this.isShowingMessage = true;
        
        // Pega a próxima mensagem da fila
        const { message, duration } = this.messageQueue.shift();
        
        // Cria um elemento de mensagem
        const messageElement = document.createElement('div');
        messageElement.className = 'game-message';
        messageElement.textContent = message;
        
        // Adiciona ao DOM
        document.querySelector('.game-container').appendChild(messageElement);
        
        // Remove após a duração especificada
        setTimeout(() => {
            messageElement.classList.add('fade-out');
            setTimeout(() => {
                messageElement.remove();
                
                // Marca que não está mais mostrando uma mensagem
                this.isShowingMessage = false;
                
                // Processa a próxima mensagem, se houver
                this.processMessageQueue();
            }, 500);
        }, duration);
    }
    
    showLevelUp(level) {
        this.showMessage(`Nível ${level} alcançado!`, 2000);
        
        // Efeito especial para o nível 5
        if (level === 5) {
            this.showMessage('Nova habilidade desbloqueada: Explosão de Fogo!', 4000);
        }
    }
} 