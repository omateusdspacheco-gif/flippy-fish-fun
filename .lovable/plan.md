

# 🐟 Flappy Fish - Jogo Web

Um jogo estilo Flappy Bird ambientado no fundo do mar, com um peixe como personagem principal.

## Gameplay
- O peixe nada automaticamente para frente (cenário se move da direita para esquerda)
- Clicar/tocar na tela faz o peixe "pular" para cima
- A gravidade puxa o peixe para baixo continuamente
- Obstáculos (corais/algas) aparecem da direita com aberturas para passar
- O jogador ganha pontos ao passar por cada obstáculo
- O jogo termina ao colidir com um obstáculo ou sair da tela

## Visual
- **Cenário**: Fundo do mar com gradiente azul profundo, bolhas flutuantes e areia no fundo
- **Personagem**: Peixe colorido (laranja/amarelo) com animação simples
- **Obstáculos**: Corais/algas verdes e roxos (cima e baixo, como os canos do Flappy Bird)
- **Cores vibrantes**: Tons de azul, turquesa, coral, laranja e verde

## Telas
1. **Tela Inicial**: Título "Flappy Fish", peixe animado, botão "Jogar"
2. **Tela de Jogo**: Cenário animado, pontuação no topo
3. **Game Over**: Pontuação final, melhor pontuação (salva localmente), botão "Jogar Novamente"

## Funcionalidades
- Controle por clique (desktop) e toque (mobile)
- Pontuação em tempo real
- Melhor pontuação salva no localStorage
- Dificuldade progressiva (obstáculos ficam levemente mais rápidos)
- Animações suaves com Canvas ou CSS
- Responsivo para mobile e desktop

