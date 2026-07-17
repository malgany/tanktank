# TankTank

TankTank é um jogo de ação e exploração em visão superior, feito com Canvas, JavaScript e CSS. Você controla um tanque, atravessa um mundo dividido em telas, enfrenta outros tanques, sobe de nível e encontra baús com novos poderes e melhorias.

## Como o jogo funciona

O mundo atual tem 25 × 25 telas (625 áreas) e começa na coordenada `[12, 12]`. As regiões ficam mais perigosas conforme o jogador se afasta do centro:

1. Planície — região inicial e mais fácil.
2. Floresta — mais inimigos e maior variedade.
3. Montanhas — inimigos mais resistentes e perseguidores mais frequentes.
4. Deserto — região externa e mais difícil.

O mapa completo mostra a posição atual e marca as telas já limpas. Inimigos que continuam vivos mantêm vida, posição e tipo quando o jogador sai da tela e volta durante a mesma partida.

## Inimigos

Existem três comportamentos de tanque inimigo:

- Quebrado: fica parado, não atira e solta fumaça.
- Aleatório: circula em direções variáveis e atira quando o jogador se aproxima.
- Perseguidor: detecta, segue e atira no jogador dentro do seu alcance.

As zonas externas geram mais inimigos, aumentam vida, dano e XP, e elevam a chance de encontrar perseguidores.

## Poderes e progressão

Cada partida começa com um dos cinco poderes escolhido aleatoriamente:

- Tiro de Canhão: disparo rápido e direto.
- Gelo: causa dano e congela inimigos.
- Ataque em Área: explode na direção da mira e atinge vários alvos.
- Veneno: aplica dano ao longo do tempo.
- Flechas: disparos rápidos com alcance limitado.

Ao derrotar inimigos, o jogador ganha XP. Subir de nível recupera a vida, aumenta a vida máxima, a velocidade e o dano dos poderes.

Telas limpas podem gerar baús. Eles oferecem troca ou melhoria de poder, mais projéteis, ricochete e redução permanente do tempo de recarga. Inimigos também podem deixar bônus de vida, velocidade ou dano.

## Objetivo atual

O protótipo ainda não tem chefe final, condição de vitória, missões ou conclusão narrativa. O ciclo atual é aberto: explorar, limpar telas, fortalecer o tanque, alcançar regiões mais difíceis e sobreviver o máximo possível. A morte encerra a partida e permite reiniciar.

## Controles

- `W`, `A`, `S`, `D`: movimentar.
- Mouse: mirar.
- Clique esquerdo: usar o poder atual.
- `I`: abrir informações do jogador.
- `M`: abrir o mapa do mundo.
- `P`: mostrar o resumo das melhorias coletadas.
- `*`: abrir as configurações avançadas do protótipo.

Em telas menores, o jogo exibe dois controles virtuais: o esquerdo movimenta e o direito mira e atira.

## Desenvolvimento

Requisitos: Node.js e npm.

```bash
npm install
npm run dev
```

Verificações disponíveis:

```bash
npm run build
npx tsc --noEmit
```

O progresso da partida existe apenas em memória. Recarregar a página reinicia mapa explorado, nível, itens e inimigos; somente as configurações avançadas são mantidas no `localStorage`.
