# RPG Canvas

Um jogo de RPG simples desenvolvido com HTML5, JavaScript e CSS, utilizando Canvas para renderização dos elementos gráficos.

## Sobre o Jogo

Neste jogo, você controla um personagem que explora um mundo dividido em múltiplas "telas" ou mapas, formando uma grade 50x50. Cada tela representa uma área do mapa com características próprias, como planícies, florestas, montanhas e desertos.

## Características Principais

### Mundo
- O mundo é dividido em telas de 1x1 (Canvas), conectadas em uma grade 50x50.
- Cada tela tem características próprias (cor, elementos de cenário).
- Ao chegar na borda de uma tela, o personagem transiciona para a tela adjacente.

### Personagem
- Inicia no nível 1.
- Tem uma barra de vida (HP) visível no HUD.
- Pode usar um ataque de fogo (fireball) ao pressionar a Barra de Espaço.
- Ao atingir o nível 5, desbloqueia um poder de fogo em área (AOE) que pode ser usado pressionando Shift + Espaço.

### Inimigos
- Cada tela pode conter até 3 inimigos.
- Os inimigos se movem e causam dano ao jogador por contato.
- Quando derrotados, fornecem XP para o jogador.
- Quanto mais longe do centro do mapa, mais fortes são os inimigos.

### Sistema de Níveis
- O jogador ganha XP ao derrotar inimigos.
- Ao acumular XP suficiente, o jogador sobe de nível.
- A cada nível, o jogador fica mais forte.
- No nível 5, desbloqueia o ataque em área.

## Controles

- **W**: Mover para cima
- **A**: Mover para a esquerda
- **S**: Mover para baixo
- **D**: Mover para a direita
- **Espaço**: Usar ataque de fogo (fireball)
- **Shift + Espaço**: Usar ataque em área (disponível a partir do nível 5)

## Como Jogar

1. Abra o arquivo `index.html` em um navegador moderno.
2. Use as teclas WASD para mover o personagem pelo mundo.
3. Pressione Espaço para atacar inimigos com bolas de fogo.
4. Derrote inimigos para ganhar XP e subir de nível.
5. Ao atingir o nível 5, você desbloqueia o ataque em área (Shift + Espaço).
6. Explore o mundo e veja até onde consegue chegar!

## Desenvolvimento

Este jogo foi desenvolvido utilizando:
- HTML5 Canvas para renderização
- JavaScript para lógica do jogo
- CSS para estilização da interface

A estrutura do projeto é modular, com arquivos separados para cada componente do jogo:
- `game.js`: Controla o loop principal do jogo
- `player.js`: Gerencia o personagem do jogador
- `enemy.js`: Controla os inimigos
- `world.js`: Gerencia o mundo e suas telas
- `projectile.js`: Controla os projéteis (bolas de fogo)
- `aoe.js`: Gerencia os efeitos de área
- `input.js`: Processa a entrada do usuário
- `ui.js`: Atualiza a interface do usuário

## Divirta-se!

Explore o mundo, derrote inimigos e veja até onde consegue chegar. Boa sorte! 