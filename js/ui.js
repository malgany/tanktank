export class UI {
    constructor(game) {
        this.game = game;
        
        // Elementos do HUD
        this.hpBar = document.getElementById('hpBar');
        this.hpValue = document.getElementById('hpValue');
        this.levelValue = document.getElementById('levelValue');
        this.xpBar = document.getElementById('xpBar');
        this.xpValue = document.getElementById('xpValue');
        this.powerCooldown = document.getElementById('powerCooldown');
        this.cooldownText = document.getElementById('cooldownText');
        
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
        
        // Atualiza o cooldown do poder atual
        let cooldownPercent = 0;
        let cooldownTime = 0;
        
        switch (player.currentPower) {
            case 'fireball':
                cooldownPercent = (player.fireballCooldown / player.fireballMaxCooldown) * 100;
                cooldownTime = player.fireballCooldown;
                break;
            case 'aoe':
                cooldownPercent = (player.aoeCooldown / player.aoeMaxCooldown) * 100;
                cooldownTime = player.aoeCooldown;
                break;
            case 'ice':
                cooldownPercent = (player.iceCooldown / player.iceMaxCooldown) * 100;
                cooldownTime = player.iceCooldown;
                break;
        }
        
        this.powerCooldown.style.height = `${cooldownPercent}%`;
        
        // Atualiza o texto de cooldown
        if (cooldownTime > 0) {
            // Converte o tempo de cooldown para segundos com uma casa decimal
            const cooldownSeconds = (cooldownTime / 1000).toFixed(1);
            this.cooldownText.textContent = cooldownSeconds + 's';
            this.cooldownText.style.display = 'block';
        } else {
            this.cooldownText.style.display = 'none';
        }
    }
    
    showMessage(message, duration = 3000) {
        // Verifica se a mensagem é de passagem de nível
        if (message.includes("Nível") && message.includes("alcançado")) {
            // Adiciona a mensagem à fila
            this.messageQueue.push({ message, duration });
            
            // Se não estiver mostrando uma mensagem, inicia o processo
            if (!this.isShowingMessage) {
                this.processMessageQueue();
            }
        }
        // Ignora todas as outras mensagens
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
    }
    
    // Método para mostrar informações do poder atual
    showPowerInfo() {
        const player = this.game.player;
        const power = player.availablePowers.find(p => p.id === player.currentPower);
        
        if (power) {
            let modifiers = [];
            
            // Adiciona informações sobre multiplicadores
            if (player.powerMultiplier > 1) {
                modifiers.push(`Multiplicador: x${player.powerMultiplier}`);
            }
            
            // Adiciona informações sobre ricochete
            if (player.hasRicochet) {
                modifiers.push("Ricochete: Ativo");
            }
            
            // Cria a mensagem
            let message = `Poder: ${power.name}\n`;
            
            if (modifiers.length > 0) {
                message += `Modificadores: ${modifiers.join(", ")}`;
            } else {
                message += "Sem modificadores ativos";
            }
            
            this.showMessage(message, 3000);
        }
    }
} 