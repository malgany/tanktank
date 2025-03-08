import { Game } from './game.js';

// Inicializa o jogo quando a página carregar
window.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando o jogo...');
    const game = new Game();
    
    // Adiciona o jogo à janela para depuração
    if (!window.debugGame) {
        window.debugGame = {};
    }
    window.debugGame.instance = game;
    
    console.log('Jogo inicializado com sucesso!');
}); 