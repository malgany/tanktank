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
        
        // Cria o elemento de cooldown para o poder de gelo
        this.createIcePowerUI();
        
        // Sistema de fila de mensagens
        this.messageQueue = [];
        this.isShowingMessage = false;
        
        // Inicializa a UI
        this.update();
    }
    
    // Método para criar a UI do poder de gelo
    createIcePowerUI() {
        // Verifica se o elemento já existe
        if (document.getElementById('iceCooldown')) {
            return;
        }
        
        // Obtém o container de poderes
        const powersContainer = document.querySelector('.powers-container');
        
        // Cria o elemento do poder de gelo
        const icePowerElement = document.createElement('div');
        icePowerElement.className = 'power ice-power';
        icePowerElement.setAttribute('data-power-id', 'ice');
        icePowerElement.innerHTML = `
            <div class="power-icon">❄️</div>
            <div class="cooldown-bar">
                <div id="iceCooldown" class="cooldown"></div>
            </div>
            <div class="power-key">3</div>
        `;
        
        // Adiciona o elemento ao container
        powersContainer.appendChild(icePowerElement);
        
        // Inicialmente oculto até ser desbloqueado
        icePowerElement.style.display = 'none';
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
        if (aoeCooldown) {
            const aoeCooldownPercent = (player.aoeCooldown / player.aoeMaxCooldown) * 100;
            aoeCooldown.style.height = `${aoeCooldownPercent}%`;
            
            // Mostra o elemento se o poder estiver desbloqueado
            const aoePower = aoeCooldown.closest('.power');
            if (aoePower) {
                aoePower.style.display = player.aoeUnlocked ? 'flex' : 'none';
            }
        }
        
        // Atualiza o cooldown do poder de gelo se o elemento existir
        const iceCooldown = document.getElementById('iceCooldown');
        if (iceCooldown) {
            const iceCooldownPercent = (player.iceCooldown / player.iceMaxCooldown) * 100;
            iceCooldown.style.height = `${iceCooldownPercent}%`;
            
            // Mostra o elemento se o poder estiver desbloqueado
            const icePower = iceCooldown.closest('.power');
            if (icePower) {
                icePower.style.display = player.hasIcePower ? 'flex' : 'none';
            }
        }
        
        // Não destaca mais o poder selecionado, pois agora os poderes são usados diretamente
        // this.highlightSelectedPower(player.selectedPower);
    }
    
    // Método para destacar o poder selecionado
    highlightSelectedPower(powerId) {
        // Remove o destaque de todos os poderes
        const powers = document.querySelectorAll('.power');
        powers.forEach(power => {
            power.classList.remove('selected');
        });
        
        // Adiciona o destaque ao poder selecionado
        let powerElement;
        
        switch (powerId) {
            case 'fireball':
                powerElement = document.querySelector('.fireball-power');
                break;
            case 'aoe':
                powerElement = document.querySelector('.aoe-power');
                break;
            case 'ice':
                powerElement = document.querySelector('.ice-power');
                break;
        }
        
        if (powerElement) {
            powerElement.classList.add('selected');
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