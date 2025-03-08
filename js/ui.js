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
        
        // Cria uma tabela HTML para mostrar o resumo dos poderes
        let tableHTML = `
        <div class="power-summary">
            <h3>Resumo de Poderes</h3>
            <table>
                <tr>
                    <th>Tipo</th>
                    <th>Quantidade</th>
                    <th>Total</th>
                </tr>`;
        
        // Adiciona linha para o multiplicador de poder
        if (player.powerStats.powerMultiplier > 0) {
            tableHTML += `
                <tr>
                    <td>Poder +1</td>
                    <td>${player.powerStats.powerMultiplier}</td>
                    <td>${player.powerMultiplier}x</td>
                </tr>`;
        }
        
        // Adiciona linha para o ricochete
        if (player.powerStats.ricochet > 0) {
            tableHTML += `
                <tr>
                    <td>Ricochete</td>
                    <td>${player.powerStats.ricochet}</td>
                    <td>${player.hasRicochet ? 'Ativo' : 'Inativo'}</td>
                </tr>`;
        }
        
        // Adiciona linha para a redução de cooldown
        if (player.powerStats.cooldownReduction > 0) {
            tableHTML += `
                <tr>
                    <td>Redução de Cooldown</td>
                    <td>${player.powerStats.cooldownReduction}</td>
                    <td>${player.powerStats.totalCooldownReduction.toFixed(1)}%</td>
                </tr>`;
        }
        
        // Fecha a tabela
        tableHTML += `
            </table>
        </div>`;
        
        // Cria um elemento para mostrar a tabela
        const messageElement = document.createElement('div');
        messageElement.className = 'game-message power-summary-message';
        messageElement.innerHTML = tableHTML;
        
        // Adiciona estilos CSS inline para a tabela
        const style = document.createElement('style');
        style.textContent = `
            .power-summary {
                background-color: rgba(0, 0, 0, 0.8);
                border-radius: 8px;
                padding: 10px;
                color: white;
            }
            .power-summary h3 {
                text-align: center;
                margin-top: 0;
                margin-bottom: 10px;
                color: #ffcc00;
            }
            .power-summary table {
                width: 100%;
                border-collapse: collapse;
            }
            .power-summary th, .power-summary td {
                padding: 5px;
                text-align: center;
                border-bottom: 1px solid #444;
            }
            .power-summary th {
                color: #ffcc00;
            }
            .power-summary-message {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 1000;
                max-width: 80%;
            }
        `;
        document.head.appendChild(style);
        
        // Adiciona ao DOM
        document.querySelector('.game-container').appendChild(messageElement);
        
        // Remove após a duração especificada
        setTimeout(() => {
            messageElement.classList.add('fade-out');
            setTimeout(() => {
                messageElement.remove();
                // Remove o estilo também
                style.remove();
            }, 500);
        }, 5000);
    }
} 