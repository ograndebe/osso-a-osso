# Prompt do atlas de assets

Prompt separado para colar no Gemini e gerar **uma única imagem** com todos os
sprites do jogo. O mapa de recorte usa coordenadas normalizadas (0–1), então
funciona tanto se o Gemini devolver 1024×1024 quanto 2048×2048.

## Como usar

1. Cole o bloco **PROMPT** inteiro no Gemini (ele está em inglês porque modelos
   de imagem seguem melhor; as instruções de recorte estão em português).
2. Peça a imagem em 1:1, de preferência 2048×2048. Se vier 1024×1024, tudo bem.
3. Confira se as quatro áreas e as grades foram respeitadas. Se o Gemini juntou
   sprites ou inventou uma cena, gere de novo com o mesmo prompt; atlas gerado
   por IA é frágil nesse ponto.
4. Recorte com o mapa abaixo. Os números 1–8 **não** vão na imagem: dígitos de
   IA costumam sair ilegíveis e serão desenhados com bitmap 5×7 no canvas.

---

## PROMPT

```text
Create ONE square production sprite atlas for a cozy pixel-art dinosaur excavation game. The image will be cropped by software, so layout precision matters more than decoration: four equal quadrants, each with its own fixed grid, every sprite isolated in its own slot. Do not turn it into a scene, mockup, poster, or UI screenshot.

FORMAT
- 1:1 square, 2048x2048 if possible (1024x1024 is acceptable).
- Flat solid magenta #FF00FF background in all empty space.
- No transparency, no gradients, no shadows, no background texture, no scenery.
- No visible grid lines, borders, frames, labels, text, letters, numbers, signatures or watermarks.
- Every sprite is fully inside its own slot, centered, with a clear magenta gutter; never touching another sprite or the image edge.
- The image is split into four equal quadrants at exactly 50% width and 50% height. Do not draw lines at those boundaries.

PIXEL ART RULES
- Chunky 16-bit pixel art. Hard edges, no anti-aliasing, no blur, no soft shading, no 3D rendering, no isometric perspective.
- Uniform logical pixel size across the entire sheet; every shape is built from solid square pixels.
- One-pixel dark outline (#1B1510) around every sprite and around major internal shapes.
- Use only this palette: outline #1B1510, deep brown #3A2A1E, dirt #6B4A2F, light dirt #A97C50, sand #D9C7A3, bone #F0E6CC, bone shadow #B8A888, flag red #C2452D, amber #E0A33A. Do not use magenta in any sprite.
- Cozy, earthy, museum field-journal mood; readable at small sizes.

TOP-LEFT QUADRANT - TERRAIN AND OVERLAYS - 3 columns x 3 rows, equal cells:
Row 1: three seamless top-down dirt tiles, edge-to-edge, no border, no vignette: (1) packed earth with tiny pebbles, (2) earth with small cracks and root fragments, (3) earth with scattered small stones.
Row 2: two seamless top-down excavated sand tiles, lighter and cleaner, edge-to-edge: (1) fine sand with tiny specks, (2) sand with a few small stones. Third cell: one complete fossil bone (generic femur) lying diagonally, ivory #F0E6CC with #B8A888 shading and dark outline, standalone on magenta, no tile behind it.
Row 3: (1) the same fossil bone with a visible dark crack and a missing chip, standalone; (2) a small wooden stake with a red ribbon flag, standalone overlay, no tile behind it, angled slightly to the right; (3) a hand-drawn chalk question mark in bone color, standalone overlay, no tile behind it.
All nine sprites centered with at least 15% empty margin inside their cells, except the five seamless tiles, which must fill the cell edge-to-edge.

TOP-RIGHT QUADRANT - UI ICONS - 4 columns x 4 rows, equal cells, 16 standalone icons, each drawn as a chunky 16x16 logical pixel icon, centered with generous margin, no tile backgrounds, no text:
Row 1: speaker with sound waves; speaker with an X (muted); circular restart arrow; left-pointing back arrow.
Row 2: folded excavation map; museum building with columns; gear/settings; lightbulb hint.
Row 3: close X; check mark; filled star; padlock.
Row 4: pickaxe; right-pointing arrow; small dust puff; four-point sparkle.
All icons use cream, amber, brown and dark outline only, in the same chunky pixel style.

BOTTOM-LEFT QUADRANT - SKELETONS 1-6 - 2 columns x 3 rows, equal cells:
Each cell contains ONE complete dinosaur skeleton, side view, facing right, museum mount pose, ivory #F0E6CC bones with #B8A888 shading and dark outline, no flesh, no skin, no feathers, no eyes, no ground shadow, centered, no text. Keep the same drawing style, line weight and scale in all six; each skeleton should occupy about 80% of its cell.
Row 1: Eoraptor (small slender early biped, short arms, long tail); Coelophysis (very slender biped, long neck, small head, long tail).
Row 2: Plateosaurus (bulky early sauropodomorph, long neck, small head, strong hind legs, long tail); Archaeopteryx (bird-like skeleton with spread wing bones, long bony tail, toothed skull).
Row 3: Stegosaurus (row of large back plates, spiked tail, small head); Brachiosaurus (very long neck, small head, massive body, long tail).

BOTTOM-RIGHT QUADRANT - SKELETONS 7-12 - 2 columns x 3 rows, equal cells:
Same style and rules as the previous quadrant.
Row 1: Velociraptor (small biped, long tail, raised sickle claw); Triceratops (large skull with three horns and neck frill, bulky body).
Row 2: Tyrannosaurus (massive skull, tiny arms, powerful legs, long tail); Ankylosaurus (low armored body, osteoderm plates, tail club).
Row 3: Spinosaurus (long crocodile-like snout, large sail on the back, long tail); Pteranodon (flying pterosaur skeleton, long beak, backward crest, wide wings, no teeth).

IMPORTANT
- Exactly four quadrants, each with the specified grid; keep every sprite fully inside its own cell.
- Do not add extra dinosaurs, extra icons, decorations, numbers or captions.
- If the 12 skeletons do not fit at full detail, keep the grid and simplify the skeletons rather than moving, merging or omitting cells.
- Avoid: text, numbers, labels, UI mockup, perspective, isometric, 3D render, photorealism, gradients, glow, drop shadows, anti-aliasing, overlapping sprites, cropped sprites, grid lines, frames, watermark.
```

---

## Mapa do atlas

`W` e `H` são a largura e a altura da imagem devolvida. Todas as coordenadas são
frações de `W`/`H`.

### Q1 — terra e overlays (canto superior esquerdo, 3×3)

`x = col/6`, `y = row/6`, `w = h = 1/6`

| linha | col 0 | col 1 | col 2 |
|---|---|---|---|
| 0 | `dirt_a` | `dirt_b` | `dirt_c` |
| 1 | `sand_a` | `sand_b` | `bone` |
| 2 | `bone_cracked` | `flag` | `question` |

### Q2 — ícones de UI (canto superior direito, 4×4)

`x = 0.5 + col/8`, `y = row/8`, `w = h = 1/8`

| linha | col 0 | col 1 | col 2 | col 3 |
|---|---|---|---|---|
| 0 | `sound_on` | `sound_off` | `restart` | `back` |
| 1 | `map` | `museum` | `settings` | `hint` |
| 2 | `close` | `check` | `star` | `lock` |
| 3 | `pickaxe` | `arrow_right` | `dust` | `sparkle` |

### Q3 — esqueletos 1–6 (canto inferior esquerdo, 2×3)

`x = col/4`, `y = 0.5 + row/6`, `w = 1/4`, `h = 1/6`

| linha | col 0 | col 1 |
|---|---|---|
| 0 | `eoraptor` | `coelophysis` |
| 1 | `plateosaurus` | `archaeopteryx` |
| 2 | `stegosaurus` | `brachiosaurus` |

### Q4 — esqueletos 7–12 (canto inferior direito, 2×3)

`x = 0.5 + col/4`, `y = 0.5 + row/6`, `w = 1/4`, `h = 1/6`

| linha | col 0 | col 1 |
|---|---|---|
| 0 | `velociraptor` | `triceratops` |
| 1 | `tyrannosaurus` | `ankylosaurus` |
| 2 | `spinosaurus` | `pteranodon` |

São 37 sprites: 9 de tabuleiro, 16 de UI e 12 esqueletos.

## Pós-processamento

Para cada retângulo:

```bash
# exemplo: Q1, col 1, row 2, numa imagem 2048x2048
# x = 1/6*2048 = 341, y = 2/6*2048 = 682, w = h = 341
magick atlas.png -crop 341x341+341+682 +repage \
  -fuzz 8% -trim +repage \
  -resize 64x64 -filter point \
  sprite.png
```

- **Tiles**: recorte exato da célula, sem `-trim` nas bordas; reduza para 16×16
  com `-filter point`. Se aparecer uma linha magenta na borda, corte 1–2 px.
- **Overlays e ícones**: use `-trim` para remover o magenta e deixar transparente;
  reduza para 16×16 (ícones) ou para o tamanho que o HUD pedir.
- **Esqueletos**: `-trim` para pegar só o conteúdo e reduza com nearest-neighbor
  para ~64×64 ou ~96×72, conforme o card. Mantenha a proporção.
- **Paleta**: se o Gemini inventar cores, quantize para as 9 cores do jogo
  (`-colors 12` ou um mapa de paleta) antes de reduzir.

## Se o atlas sair ruim

Uma imagem única é o pipeline mais frágil. O layout já separa o tabuleiro/UI
(Q1+Q2) dos esqueletos (Q3+Q4); se o Gemini não respeitar as 12 células, peça
duas imagens: uma só com Q1+Q2 e outra só com Q3+Q4. E se os esqueletos não
ficarem consistentes, mantenha a rota procedural do `GAME_DESIGN.md` e use esta
folha apenas para tabuleiro e UI. As duas abordagens são compatíveis.

---

## Correção v2 — depois da primeira geração

A primeira folha acertou os esqueletos e os tiles, mas não a grade. Não regere
tudo: aproveite os esqueletos e os tiles e peça só as duas folhas abaixo.

### Prompt A — overlays (2×2)

```text
Create ONE square 1024x1024 pixel-art overlay sheet with a strict 2x2 grid of equal cells and a flat solid magenta #FF00FF background. No text, no labels, no grid lines, no shadows, no gradients, no tile backgrounds, no scenery. Each sprite is isolated and centered in its cell with generous magenta margin. Chunky 16-bit pixel art, hard edges, no anti-aliasing, 1px dark outline (#1B1510). Palette only: #1B1510, #F0E6CC, #B8A888, #C2452D, #6B4A2F, #3A2A1E, #E0A33A.

Top-left: one complete fossil bone (femur) lying diagonally, ivory, standalone.
Top-right: the same bone with a clear dark crack and a small missing chip, standalone.
Bottom-left: a wooden stake with a red ribbon flag, standalone, slightly angled.
Bottom-right: a hand-drawn chalk question mark in bone color, standalone.

Every sprite must sit directly on the magenta background with no square behind it. Do not add extra sprites. Do not draw a scene or a frame.
```

Recorte: `x = col/2`, `y = row/2`, `w = h = 1/2`. São 4 sprites: osso, osso
trincado, bandeira e interrogação.

### Prompt B — UI (4×4)

```text
Create ONE square 1024x1024 pixel-art UI icon sheet with a strict 4x4 grid of 16 equal cells and a flat solid magenta #FF00FF background. No text, no letters, no numbers, no labels, no grid lines, no shadows, no gradients, no tile backgrounds. Each icon is isolated, centered, and drawn as a chunky 16x16 logical pixel icon with a 1px dark outline (#1B1510). Palette only: #1B1510, #F0E6CC, #B8A888, #6B4A2F, #A97C50, #E0A33A, #C2452D.

Row 1: speaker with sound waves; speaker with an X (muted); circular restart arrow; left-pointing back arrow.
Row 2: folded excavation map; museum building with columns; gear/settings; lightbulb hint.
Row 3: close X; check mark; filled star; padlock.
Row 4: pickaxe; right-pointing arrow; small dust puff; four-point sparkle.

Do not add extra icons. Do not make a scene, mockup, or frame.
```

Recorte: `x = col/4`, `y = row/4`, `w = h = 1/4`. São 16 ícones.

### O que fazer com a primeira folha

- **Esqueletos**: são 12 únicos + 1 duplicado. Recorte por conteúdo (bounding
  box), não pela grade; a composição é livre. O pedestal pode virar placa de
  museu ou ser cortado.
- **Tiles**: aproveite 2 de terra e 2 de areia; os 3 de areia são variações.
- **Ferramentas**: os 17 ícones servem como decoração/HUD (picareta, pincel,
  mapa, lupa, mochila), mas não substituem os controles da UI.
