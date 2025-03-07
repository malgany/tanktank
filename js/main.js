import { Game } from './game.js';

// Inicializa o jogo quando a página carregar
window.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando o jogo...');
    const game = new Game();
    
    // Adiciona o jogo à janela para depuração
    window.debugGame = game;
    
    console.log('Jogo inicializado com sucesso!');
}); 