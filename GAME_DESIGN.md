# Osso a Osso

**Campo minado + museu de dinossauros.** Título de trabalho.

Cada sítio de escavação é um tabuleiro de campo minado: os "ossos" ocupam o lugar
das bombas. Você limpa a terra sem quebrar o fóssil e, ao terminar, monta o
esqueleto e adiciona o dinossauro à coleção.

## Pilares

1. **Regra que todo mundo já sabe.** Nada de mecânica nova para aprender.
2. **Progressão por descoberta.** Sítios pequenos primeiro; dinossauros famosos depois.
3. **O prêmio é o esqueleto.** A montagem e a ficha do dino são o momento emocional.
4. **Sessões de 1 a 5 minutos, mobile-first.**

## Loop

Mapa/museu → escolher sítio → escavar e marcar → limpar toda a terra →
montagem do esqueleto → ficha → próximo sítio.

## Regras

- Tabuleiro `N×N` com `B` ossos escondidos.
- Célula aberta mostra quantos ossos existem nas 8 vizinhas (0 abre em cascata).
- Célula com osso nunca é segura: **cavar** nela trinca o fóssil e encerra a
  escavação. Retry imediato, sem penalidade permanente.
- Bandeira marca suspeita. Ciclo: bandeira → `?` → vazio.
- **Vitória:** todas as células sem osso reveladas. Os ossos restantes são
  escavados automaticamente e o esqueleto é montado.
- **Primeira escavação segura:** a área 3×3 ao redor da primeira célula cavada
  fica sem ossos. A primeira abertura sempre rende uma boa área e nunca perde de
  cara.
- **Chord:** num número revelado, se a quantidade de bandeiras vizinhas for igual
  ao número, revela as demais vizinhas. Desktop: duplo clique ou clique do meio.
  Mobile: duplo toque.
- Sem tempo limite. O cronômetro serve só para recorde.
- Ajuste de dificuldade (só se o playtest pedir): perdoar a primeira trinca.

## Controles

| Ação | Desktop | Mobile |
|---|---|---|
| Bandeira | clique esquerdo | toque |
| Cavar | segurar o clique esquerdo / clique direito | toque longo (~420 ms) |
| Chord | duplo clique / clique do meio | duplo toque |
| Reiniciar | `R` | botão |

Detalhes de implementação: `touch-action: none` no tabuleiro, bloquear menu de
contexto e seleção de texto, cancelar o toque longo se o dedo mover mais de
10 px. Feedback háptico com `navigator.vibrate` quando disponível.

## Progressão

Três eras, três dinossauros cada, mais três bônus. Desbloqueio linear; os bônus
aparecem ao completar os nove sítios.

| # | Era | Dino | Grade | Ossos | Densidade |
|---|---|---|---|---|---|
| 1 | Triássico | Eoraptor | 6×6 | 4 | 11% |
| 2 | Triássico | Coelophysis | 7×7 | 6 | 12% |
| 3 | Triássico | Plateosaurus | 8×8 | 8 | 12,5% |
| 4 | Jurássico | Archaeopteryx | 8×8 | 9 | 14% |
| 5 | Jurássico | Stegosaurus | 9×9 | 11 | 13,6% |
| 6 | Jurássico | Brachiosaurus | 10×10 | 14 | 14% |
| 7 | Cretáceo | Velociraptor | 9×9 | 12 | 14,8% |
| 8 | Cretáceo | Triceratops | 10×10 | 15 | 15% |
| 9 | Cretáceo | Tyrannosaurus | 12×12 | 20 | 13,9% |
| B1 | Bônus | Ankylosaurus | 10×10 | 16 | 16% |
| B2 | Bônus | Spinosaurus | 12×12 | 22 | 15,3% |
| B3 | Bônus | Pteranodon | 12×12 | 20 | 13,9% |

Para adicionar dinos sem rebalancear tudo: `lado ≈ arredondar(sqrt(ossos / 0,14))`.
Quanto mais ossos, maior o campo. Dinossauros maiores ganham mais peças.

Os tabuleiros são gerados por tentativa (layout aleatório), não são fases fixas.
Com 11–15% de densidade e a abertura 3×3 segura, a maioria dos tabuleiros sai no
raciocínio. Garantia matemática de "sem chute" exige um solver; fica para depois.

### Fichas (conteúdo)

Cada card mostra nome, era, tamanho, dieta, curiosidade e o esqueleto. Exemplos:

- **Eoraptor** — um dos dinossauros mais antigos conhecidos; do tamanho de um cachorro.
- **Archaeopteryx** — ponte entre dinossauros e aves; tinha penas e dentes.
- **Velociraptor** — pequeno, emplumado, com uma garra curvada em cada pé.
- **Pteranodon** — não era dinossauro: era um pterossauro voador.

## Telas

1. **Expedição** — eras em trilha vertical, cards de sítios. Bloqueado = silhueta + `???`.
2. **Escavação** — tabuleiro + HUD: nome do dino, ossos restantes, cronômetro, reiniciar, voltar.
3. **Montagem** — o esqueleto se monta peça por peça, com poeira e o nome revelado.
   Botões: "Guardar no museu" / "Ver coleção".
4. **Coleção** — progresso `x/12`, filtro por era, ficha individual com recorde.
5. **Ajustes** — som, resetar progresso.

Derrota: tabuleiro revela os ossos, o clicado aparece trincado, botões
"Escavar de novo" e "Mapa". Sem tela de game over elaborada.

## Direção de arte

- **Base 16×16 px**, escala inteira (2×/3×/4×), `image-rendering: pixelated`.
- Uma paleta só, 10–12 cores, com um acento por era:
  - contorno `#1b1510`, terra escura `#3a2a1e`, terra `#6b4a2f`,
    terra clara `#a97c50`, areia `#d9c7a3`, osso `#f0e6cc`,
    sombra de osso `#b8a888`, acento/bandeira `#c2452d`, âmbar `#e0a33a`.
  - Triássico: deserto vermelho. Jurássico: verde samambaia. Cretáceo: costa clara.
- Célula fechada = terra escura texturizada (2–3 variantes). Célula aberta = areia clara.
  Números em tinta escura, dígitos desenhados com bitmap 5×7 no canvas para não borrar.
- Bandeira = estaca de madeira com fita vermelha. `?` = marca de giz.
- Esqueletos em marfim com contorno escuro, estilo prancha de museu.
- UI com cara de caderno de campo: papel, carimbos, etiquetas. Sem excesso de molduras.

## Stack

**Vite + TypeScript + Canvas 2D + DOM. Zero dependências de runtime.**

- Tabuleiro e esqueleto no canvas; menus, cards e modais em DOM/CSS.
- Por que não uma engine: o jogo é turnos, grade e UI. Phaser 3 adiciona ~1 MB e
  vários conceitos para entregar pouco aqui. Se você quiser scenes/tweens/áudio
  prontos, Phaser é a escolha open source óbvia; a animação de montagem são ~50
  linhas de tween manual.
- Persistência: `localStorage`, chave `osso-a-osso:v1`.
- Deploy: GitHub Actions → GitHub Pages. `base: './'` no Vite para funcionar em
  qualquer subpasta. Sem backend, sem login, sem multiplayer.
- Teste: lógica pura do tabuleiro em `board.test.ts` com `node --test` (Node 26
  roda TypeScript nativamente) ou Vitest se der atrito.

Estrutura inicial sugerida:

```text
index.html
src/main.ts          # telas, loop de UI
src/board.ts         # geração, reveal, flood fill, chord, vitória/derrota
src/render.ts        # canvas do tabuleiro
src/skeleton.ts      # receitas + desenho + animação
src/dinos.ts         # dados e fichas
src/state.ts         # progresso no localStorage
src/audio.ts         # SFX sintetizados
src/board.test.ts    # checagem da lógica
```

## Assets: caminhos criativos

Prompt pronto para gerar o atlas de sprites no Gemini, com mapa de recorte:
[`ASSET_PROMPT.md`](ASSET_PROMPT.md).

### 1. Esqueletos gerados por código (recomendado)

Cada dino é uma **receita de partes** desenhada com primitivas no canvas:
crânio, mandíbula, vértebras, costelas, pelve, cauda, patas, braços, placas,
chifres, vela. Um pouco de ruído com seed dá aparência de fóssil real, não de
clip-art.

```ts
type Part = {
  kind: 'skull' | 'spine' | 'rib' | 'leg' | 'tail' | 'plate' | 'horn' | 'sail';
  x: number; y: number; angle?: number; scale?: number;
};

const TREX: Part[] = [
  { kind: 'skull', x: 74, y: 18 },
  { kind: 'spine', x: 52, y: 26, angle: -6 },
  { kind: 'rib',   x: 48, y: 30 },
  // ...
];
```

Vantagens: original (zero licença), consistente, barato de produzir e a mesma
lista de partes alimenta a animação de montagem. É o maior ganho de esforço
deste projeto.

### 2. Referência de domínio público

Pranchas anatômicas antigas (Marsh, 1800s) no Wikimedia Commons são domínio
público: use como referência para traçar silhuetas. Reconstruções modernas como
as de Scott Hartman são CC BY-SA (atribuição + compartilha igual); se usar,
cumpra a licença. Na dúvida, trace só a pose e redesenhe no seu estilo.

### 3. Foto → textura pixel

Fotografe terra, pedra e areia (fácil de fazer você mesmo, CC0), recorte 16×16
e quantize para a paleta:

```bash
magick textura.jpg -resize 16x16! -colors 6 -dither None tile.png
```

Depois escale com vizinho mais próximo. Dá um tabuleiro tátil e único sem
desenhar tile por tile.

### 4. Ferramentas

- **Piskel** (web, grátis) e **LibreSprite** (fork livre do Aseprite) para retoques.
- **Aseprite** se quiser o editor pago; **Krita** para pintura maior.
- **Lospec** para paletas prontas e estudo de cor.
- **Kenney** (CC0) para ícones de UI, cursores e prompts de input.
- Fonte pixel: **Silkscreen** ou **Pixelify Sans**; para os números do tabuleiro,
  bitmap 5×7 desenhado no código é mais nítido que qualquer fonte.

### 5. IA como rascunho, não como pipeline

Gere silhuetas e moodboards para explorar poses, depois reduza para a paleta,
alinhe na grade de 16 px e limpe manualmente. Pixel art de IA costuma misturar
tamanhos de pixel e quebrar a consistência. Use para referência, não para o
asset final.

### 6. Áudio sem arquivos

WebAudio ou `jsfxr` para gerar: escavação (ruído filtrado), bandeira (madeira),
revelação (tick), vitória (arpejo curto), derrota (baque + trinca). Zero
download, zero licença. Música só depois; se entrar, um loop CC0 curto.

### 7. O truque de consistência

Uma paleta, um tamanho de pixel, um contorno escuro. Se todo asset respeitar
esses três, o jogo parece feito por uma pessoa só, mesmo com técnicas mistas
(canvas procedural + textura fotografada + UI em CSS).

## Escopo do MVP

1. Um sítio jogável: 6×6, 4 ossos, primeira escavação segura, flood fill,
   bandeira, chord, vitória/derrota.
2. Eoraptor com esqueleto procedural e montagem.
3. Save local + tela de coleção simples.
4. Paleta, fonte e HUD.
5. Deploy no Pages.

Depois: mais dinos, eras, fichas, áudio, polimento da montagem, bônus.
Fora de escopo por enquanto: backend, contas, multiplayer, daily challenge,
solver "sem chute", editor de fases, PWA.

## Riscos e ajustes

- **Derrota instantânea frustra?** Testar uma trinca perdoada. É uma constante.
- **Tabuleiro exige chute?** Aceitável no casual; se incomodar, adicionar 1 dica
  por sítio ou gerador com solver.
- **Duplo toque no iOS** conflita com zoom; testar cedo com `touch-action`.
- **Conteúdo é o custo real**, não o código. Começar com 3 dinos e só expandir
  quando o loop estiver divertido.
