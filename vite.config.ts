import { defineConfig } from 'vite';

// publicDir: 'assets' serve os PNGs direto em /board, /overlays, /ui, /skeletons.
// base: './' funciona tanto na raiz quanto em /campo_minado_dino/ no GitHub Pages.
export default defineConfig({
  base: './',
  publicDir: 'assets',
  server: {
    host: true,
  },
});
