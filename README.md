# Osso a Osso

**Jogar:** https://ograndebe.github.io/osso-a-osso/

Campo minado de escavação: limpe a terra, encontre os ossos e monte esqueletos
de dinossauros para completar o museu. A primeira escavação é sempre segura.

MVP com 12 sítios (Triássico, Jurássico, Cretáceo e Bônus), dificuldade
progressiva, bandeira/interrogação, chord por duplo clique/toque, recordes e
progresso salvo no `localStorage`.

**Controles:** clique/toque marca bandeira → interrogação → vazio; segure o
clique/toque (ou clique direito no desktop) para cavar; duplo clique/toque num
número com as bandeiras certas abre as células ao redor.

## Rodar

```bash
npm install
npm run dev
```

Abra o endereço que o Vite mostrar. O jogo foi feito para desktop e celular.

## Testar e buildar

```bash
npm test      # lógica pura do tabuleiro
npm run build # type-check + dist/
npm run preview
```

## Estrutura

- `src/board.ts` — geração do tabuleiro, primeira escavação segura, flood fill, chord, vitória/derrota.
- `src/render.ts` — canvas do tabuleiro.
- `src/main.ts` — telas, controles e progressão.
- `src/data.ts` — sítios e fichas dos dinos.
- `src/storage.ts` — save local.
- `assets/` — PNGs, `manifest.json` e contact sheets; é o `publicDir` do Vite e vira a raiz do site no build.
- `GAME_DESIGN.md` — especificação.
- `ASSET_PROMPT.md` — prompts e mapa de recorte dos atlas.

## Deploy no GitHub Pages

O `vite.config.ts` usa `base: './'`, então o build funciona em qualquer subpasta.
O workflow em `.github/workflows/deploy.yml` publica `dist/` no Pages a cada push
na branch `main`.

Se for publicar manualmente, rode `npm run build` e sirva a pasta `dist/`.

## Assets

Os sprites foram gerados por IA e separados por `tools/slice_atlas.mjs`
(requer `ffmpeg`/`ffprobe`). Para regerar:

```bash
node tools/slice_atlas.mjs
```

O script grava `assets/` e o `manifest.json`. O jogo usa apenas os 12 esqueletos
da campanha; `velociraptor_alt` e `extra_small_theropod` são extras.
