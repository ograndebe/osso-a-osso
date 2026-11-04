# Assets

Gerado por `tools/slice_atlas.mjs`.

| Grupo | Qtd | Pasta |
|---|---:|---|
| Tabuleiro | 5 | `board/` |
| Overlays | 4 | `overlays/` |
| UI | 16 | `ui/` |
| Esqueletos | 14 (12 únicos + 2 extras) | `skeletons/` |

## Notas

- Os ícones de UI vêm com o quadrado creme de fundo; servem como botões.
- Os esqueletos incluem o pedestal de museu.
- `velociraptor_alt.png` é uma segunda pose do Velociraptor, provavelmente duplicada.
- `extra_small_theropod.png` é um pequeno terópode extra, provavelmente duplicado; não usar na campanha.
- `question.png` inclui o ponto da interrogação; os componentes soltos foram agrupados.
- `manifest.json` tem retângulo de origem, tamanho, era, dieta e curiosidade de cada esqueleto.

## Faltando

Nenhum sprite essencial. Fora do atlas:

- Números 1–8: bitmap 5×7 desenhado no canvas.
- Fonte pixel: Google Fonts (Silkscreen/Pixelify Sans) ou bitmap.
- Logo, badges de era e textos: HTML/CSS.
- Fundos das telas: CSS/padrões.
- SFX: WebAudio/jsfxr.
- Partes separadas dos esqueletos: opcional; a montagem pode usar o esqueleto inteiro + poeira.
