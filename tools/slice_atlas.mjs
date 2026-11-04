#!/usr/bin/env node
/**
 * Separa os atlas gerados pelo Gemini em PNGs transparentes + manifest.
 *
 * Entrada:
 *   Gemini_Generated_Image_3makkn3makkn3mak.jpg  (tiles + UI antiga + esqueletos)
 *   Gemini_Generated_Image_75b3sj75b3sj75b3.jpg  (UI 4x4)
 *   Gemini_Generated_Image_8i8xvg8i8xvg8i8x.jpg  (overlays 2x2)
 *
 * Saída: assets/{board,overlays,ui,skeletons}/ + assets/manifest.json
 *
 * Requer ffmpeg/ffprobe no PATH. Sem dependências npm.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outRoot = path.join(root, 'assets');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'osso-atlas-'));

const SRC = {
  skeletons: path.join(root, 'Gemini_Generated_Image_3makkn3makkn3mak.jpg'),
  ui: path.join(root, 'Gemini_Generated_Image_75b3sj75b3sj75b3.jpg'),
  overlays: path.join(root, 'Gemini_Generated_Image_8i8xvg8i8xvg8i8x.jpg'),
};

const UI = [
  ['sound_on', 'Som ligado'],
  ['sound_off', 'Som desligado'],
  ['restart', 'Reiniciar'],
  ['back', 'Voltar'],
  ['map', 'Mapa'],
  ['museum', 'Museu'],
  ['settings', 'Configurações'],
  ['hint', 'Dica'],
  ['close', 'Fechar'],
  ['check', 'Confirmar'],
  ['star', 'Estrela'],
  ['lock', 'Bloqueado'],
  ['pickaxe', 'Picareta'],
  ['arrow_right', 'Avançar'],
  ['dust', 'Poeira'],
  ['sparkle', 'Brilho'],
];

const OVERLAYS = [
  ['bone', 'Osso'],
  ['bone_cracked', 'Osso trincado'],
  ['flag', 'Bandeira'],
  ['question', 'Interrogação'],
];

const BOARDS = [
  ['dirt_a', 'Terra A', 'dirt'],
  ['sand_a', 'Areia A', 'sand'],
  ['sand_b', 'Areia B', 'sand'],
  ['dirt_b', 'Terra B', 'dirt'],
  ['sand_c', 'Areia C', 'sand'],
];

const DINOS = {
  eoraptor: ['Eoraptor', 'Triássico', 'Um dos dinossauros mais antigos conhecidos; do tamanho de um cachorro médio.'],
  coelophysis: ['Coelophysis', 'Triássico', 'Magro e veloz; muitos indivíduos foram encontrados juntos.'],
  plateosaurus: ['Plateosaurus', 'Triássico', 'Pescoço longo e corpo robusto; um dos primeiros gigantes.'],
  archaeopteryx: ['Archaeopteryx', 'Jurássico', 'Ponte entre dinossauros e aves; tinha penas e dentes.'],
  stegosaurus: ['Stegosaurus', 'Jurássico', 'Placas ósseas nas costas e espinhos na cauda.'],
  brachiosaurus: ['Brachiosaurus', 'Jurássico', 'Pescoço muito longo para alcançar as copas.'],
  velociraptor: ['Velociraptor', 'Cretáceo', 'Pequeno, emplumado e com uma garra curvada em cada pé.'],
  triceratops: ['Triceratops', 'Cretáceo', 'Três chifres e um grande escudo ósseo.'],
  tyrannosaurus: ['Tyrannosaurus', 'Cretáceo', 'Um dos maiores predadores terrestres; mordida poderosa.'],
  ankylosaurus: ['Ankylosaurus', 'Cretáceo', 'Couraça óssea e clava na cauda.'],
  spinosaurus: ['Spinosaurus', 'Cretáceo', 'Vela nas costas e hábitos ligados à água.'],
  pteranodon: ['Pteranodon', 'Cretáceo', 'Não era dinossauro: era um pterossauro voador.'],
  velociraptor_alt: ['Velociraptor (variante extra)', 'Cretáceo', 'Segunda pose de Velociraptor; provavelmente duplicada.'],
  extra_small_theropod: ['Pequeno terópode extra', '—', 'Provável duplicata; não usado na campanha.'],
};

const run = (args) => {
  try {
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (error) {
    console.error(error.stderr?.toString() || error.message);
    throw error;
  }
};

const probe = (file) => {
  const out = execFileSync('ffprobe', [
    '-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height', '-of', 'csv=p=0', file,
  ]).toString().trim();
  const [w, h] = out.split(',').map(Number);
  return { w, h };
};

function analyze(file) {
  const { w, h } = probe(file);
  const rawPath = path.join(tmp, `${path.basename(file)}.rgba`);
  run(['-i', file, '-f', 'rawvideo', '-pix_fmt', 'rgba', rawPath]);
  const rgba = fs.readFileSync(rawPath);
  const total = w * h;
  const fg = new Uint8Array(total);

  for (let i = 0; i < total; i++) {
    const r = rgba[i * 4];
    const g = rgba[i * 4 + 1];
    const b = rgba[i * 4 + 2];
    // Fundo magenta + franja roxa de JPEG. O vermelho da bandeira tem b baixo
    // e o azul do mapa tem r baixo, então os dois continuam opacos.
    const isMagenta =
      r > 150 && b > 120 && g < 140 && b > g + 40 && r > g + 30;
    if (!isMagenta) fg[i] = 1;
  }

  const labels = new Int32Array(total);
  const stack = new Int32Array(total);
  const comps = [];
  let id = 0;

  for (let start = 0; start < total; start++) {
    if (!fg[start] || labels[start]) continue;
    id++;
    let top = 0;
    stack[top++] = start;
    labels[start] = id;
    let minX = w, minY = h, maxX = -1, maxY = -1, area = 0;

    while (top > 0) {
      const p = stack[--top];
      const x = p % w;
      const y = (p - x) / w;
      area++;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;

      if (x > 0) {
        const q = p - 1;
        if (fg[q] && !labels[q]) { labels[q] = id; stack[top++] = q; }
      }
      if (x + 1 < w) {
        const q = p + 1;
        if (fg[q] && !labels[q]) { labels[q] = id; stack[top++] = q; }
      }
      if (y > 0) {
        const q = p - w;
        if (fg[q] && !labels[q]) { labels[q] = id; stack[top++] = q; }
      }
      if (y + 1 < h) {
        const q = p + w;
        if (fg[q] && !labels[q]) { labels[q] = id; stack[top++] = q; }
      }
    }

    comps.push({ id, x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1, area });
  }

  return { file, w, h, total, rgba, labels, comps };
}

const byPosition = (a, b) => a.y - b.y || a.x - b.x;

function pick(image, opts = {}) {
  const {
    minArea = 5000, minW = 40, minH = 40,
    minAspect = 0.25, maxAspect = 6,
    region = null, excludeBorder = true,
  } = opts;

  return image.comps.filter((c) => {
    if (c.area < minArea || c.w < minW || c.h < minH) return false;
    const aspect = c.w / c.h;
    if (aspect < minAspect || aspect > maxAspect) return false;
    if (excludeBorder && (
      c.x <= 2 || c.y <= 2 ||
      c.x + c.w >= image.w - 2 || c.y + c.h >= image.h - 2
    )) return false;
    if (region && !region(c, image)) return false;
    return true;
  }).sort(byPosition);
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) {
    c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([length, typeBuf, data, crc]);
}

function writePng(file, width, height, rgba) {
  const stride = width * 4 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0;
    rgba.copy(raw, y * stride + 1, y * width * 4, (y + 1) * width * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const png = Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
  fs.writeFileSync(file, png);
}

/**
 * Recorta UM componente (ou grupo) e aplica um despill de magenta.
 * A máscara por componente é essencial nos esqueletos: as caixas se
 * sobrepõem, e o recorte de um traria pedaços do vizinho.
 */
function writeSprite(image, comp, pad, outPath, ids = [comp.id]) {
  const idSet = new Set(ids);
  const x = Math.max(0, comp.x - pad);
  const y = Math.max(0, comp.y - pad);
  const w = Math.min(image.w, comp.x + comp.w + pad) - x;
  const h = Math.min(image.h, comp.y + comp.h + pad) - y;
  const out = Buffer.alloc(w * h * 4);

  for (let yy = 0; yy < h; yy++) {
    const sourceRow = (y + yy) * image.w;
    for (let xx = 0; xx < w; xx++) {
      const sourceIndex = sourceRow + x + xx;
      const targetIndex = (yy * w + xx) * 4;

      if (!idSet.has(image.labels[sourceIndex])) {
        out[targetIndex + 3] = 0;
        continue;
      }

      let r = image.rgba[sourceIndex * 4];
      let g = image.rgba[sourceIndex * 4 + 1];
      let b = image.rgba[sourceIndex * 4 + 2];
      const spill = Math.min(r, b) - g;

      if (spill > 8) {
        // franja forte de JPEG: vira contorno escuro
        r = 27;
        g = 21;
        b = 16;
      } else if (spill > 0) {
        r = Math.max(g, r - spill);
        b = Math.max(g, b - spill);
      }

      out[targetIndex] = r;
      out[targetIndex + 1] = g;
      out[targetIndex + 2] = b;
      out[targetIndex + 3] = 255;
    }
  }

  writePng(outPath, w, h, out);
  return { w, h };
}

function ensure(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function contactSheet(files, cols, rows, cell, outPath) {
  const dir = path.join(tmp, `contact-${path.basename(outPath, '.png')}`);
  fs.rmSync(dir, { recursive: true, force: true });
  ensure(dir);
  const inner = cell - 8;
  // Normaliza cada sprite antes: o filtro tile não lida bem com frames de
  // tamanhos diferentes.
  files.forEach((file, i) => {
    const out = path.join(dir, `${String(i + 1).padStart(2, '0')}.png`);
    // Achata sobre magenta: sem isso, os pixels transparentes guardam a cor
    // original e parecem "pedaços" do vizinho no contact sheet.
    run([
      '-f', 'lavfi', '-i', `color=c=0xFF00FF:s=${cell}x${cell}:d=1`,
      '-i', file,
      '-filter_complex',
      `[1:v]scale=${inner}:${inner}:force_original_aspect_ratio=decrease[s];` +
      `[0:v][s]overlay=(W-w)/2:(H-h)/2:format=auto`,
      '-frames:v', '1', '-pix_fmt', 'rgb24', out,
    ]);
  });
  run([
    '-pattern_type', 'glob', '-i', path.join(dir, '*.png'),
    '-vf', `tile=${cols}x${rows}`,
    '-frames:v', '1', outPath,
  ]);
}

fs.rmSync(outRoot, { recursive: true, force: true });
for (const dir of ['board', 'overlays', 'ui', 'skeletons']) ensure(path.join(outRoot, dir));

const sprites = [];

// ---------- esqueletos + tiles (mesma imagem) ----------
const sheet = analyze(SRC.skeletons);

const skelComps = pick(sheet, {
  region: (c, img) => c.y > img.h / 2,
  minArea: 20000, minW: 80, minH: 80,
  minAspect: 0.3, maxAspect: 5,
});
const q3 = skelComps.filter((c) => c.x < sheet.w / 2).sort(byPosition);
const q4 = skelComps.filter((c) => c.x >= sheet.w / 2).sort(byPosition);
console.log(`esqueletos: Q3=${q3.length} Q4=${q4.length}`);

// A ordem de recorte é por y/x, não pela ordem visual original.
// Este mapeamento foi conferido sprite a sprite no contact sheet.
const q3Names = ['coelophysis', 'plateosaurus', 'eoraptor', 'velociraptor_alt', 'brachiosaurus', 'archaeopteryx', 'stegosaurus'];
const q4Names = ['velociraptor', 'triceratops', 'tyrannosaurus', 'ankylosaurus', 'spinosaurus', 'pteranodon', 'extra_small_theropod'];
if (q3.length !== q3Names.length || q4.length !== q4Names.length) {
  console.warn('Aviso: contagem de esqueletos diferente do esperado; confira o contact sheet.');
}

const skelNamed = [
  ...q3.map((c, i) => ({ c, name: q3Names[i] || `q3_${i + 1}` })),
  ...q4.map((c, i) => ({ c, name: q4Names[i] || `q4_${i + 1}` })),
];

for (const { c, name } of skelNamed) {
  const file = `skeletons/${name}.png`;
  const out = path.join(outRoot, file);
  const size = writeSprite(sheet, c, 4, out);
  const [label, era, fact] = DINOS[name] || [name, '', ''];
  sprites.push({
    id: `skeleton_${name}`,
    file,
    group: 'skeleton',
    label,
    era,
    fact,
    source: path.basename(SRC.skeletons),
    sourceRect: { x: c.x, y: c.y, w: c.w, h: c.h },
    size,
    pedestal: true,
    extra: name === 'velociraptor_alt' || name === 'extra_small_theropod',
    ...(name === 'velociraptor_alt' ? { duplicateOf: 'velociraptor' } : {}),
  });
}

// tiles do canto superior esquerdo; os 4 overlays antigos são descartados
const boardComps = pick(sheet, {
  region: (c, img) => c.x < img.w / 2 && c.y < img.h / 2,
  minArea: 20000, minW: 80, minH: 80,
  minAspect: 0.5, maxAspect: 2,
});
console.log(`componentes no canto do tabuleiro: ${boardComps.length}`);
// Mapeia pelo centro na grade 3x3, não pela ordem do connected component.
// A ordem por y/x embaralha os tiles e trocava terra por areia.
const q1w = sheet.w / 2;
const q1h = sheet.h / 2;
const cellW = q1w / 3;
const cellH = q1h / 3;
const boardByCell = new Map();
for (const c of boardComps) {
  const cx = c.x + c.w / 2;
  const cy = c.y + c.h / 2;
  const col = Math.max(0, Math.min(2, Math.floor(cx / cellW)));
  const row = Math.max(0, Math.min(2, Math.floor(cy / cellH)));
  boardByCell.set(`${row},${col}`, c);
}
const boardCells = [[0, 0], [0, 2], [2, 0], [2, 1], [2, 2]];
const boardKept = boardCells.map(([r, c]) => boardByCell.get(`${r},${c}`)).filter(Boolean);
if (boardKept.length !== BOARDS.length) console.warn('Aviso: tiles do tabuleiro incompletos.');

boardKept.forEach((c, i) => {
  const [name, label, terrain] = BOARDS[i];
  const file = `board/${name}.png`;
  const out = path.join(outRoot, file);
  // 4 px de inset removem a franja rosa de JPEG na borda do tile.
  const tile = { x: c.x + 4, y: c.y + 4, w: c.w - 8, h: c.h - 8 };
  const size = writeSprite(sheet, tile, 0, out, [c.id]);
  sprites.push({
    id: `board_${name}`,
    file,
    group: 'board',
    label,
    terrain,
    source: path.basename(SRC.skeletons),
    sourceRect: { x: c.x, y: c.y, w: c.w, h: c.h },
    size,
  });
});

// ---------- UI ----------
const uiImage = analyze(SRC.ui);
const uiComps = pick(uiImage, {
  minArea: 20000, minW: 100, minH: 100,
  minAspect: 0.5, maxAspect: 1.5,
});
console.log(`UI: ${uiComps.length} componentes`);
if (uiComps.length !== UI.length) console.warn('Aviso: contagem de UI diferente de 16.');

uiComps.forEach((c, i) => {
  const [name, label] = UI[i] || [`ui_${i + 1}`, `UI ${i + 1}`];
  const file = `ui/${name}.png`;
  const out = path.join(outRoot, file);
  // 2 px de inset removem a franja rosa de JPEG na borda do botão.
  const button = { x: c.x + 2, y: c.y + 2, w: c.w - 4, h: c.h - 4 };
  const size = writeSprite(uiImage, button, 4, out, [c.id]);
  sprites.push({
    id: `ui_${name}`,
    file,
    group: 'ui',
    label,
    background: 'cream',
    source: path.basename(SRC.ui),
    sourceRect: { x: c.x, y: c.y, w: c.w, h: c.h },
    size,
  });
});

// ---------- overlays ----------
const overlayImage = analyze(SRC.overlays);
const overlayComps = pick(overlayImage, {
  minArea: 5000, minW: 60, minH: 60,
  minAspect: 0.3, maxAspect: 3,
});
console.log(`overlays: ${overlayComps.length} componentes (inclui partes separadas)`);

// A interrogação tem o ponto como componente solto. Agrupa por quadrante e
// usa a união das caixas para o ponto entrar no PNG final.
const overlayMap = new Map();
for (const c of overlayComps) {
  const qx = (c.x + c.w / 2) < overlayImage.w / 2 ? 0 : 1;
  const qy = (c.y + c.h / 2) < overlayImage.h / 2 ? 0 : 1;
  const key = `${qy}${qx}`;
  if (!overlayMap.has(key)) overlayMap.set(key, []);
  overlayMap.get(key).push(c);
}
const overlayGroups = [...overlayMap.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, comps]) => {
    const x = Math.min(...comps.map((c) => c.x));
    const y = Math.min(...comps.map((c) => c.y));
    const right = Math.max(...comps.map((c) => c.x + c.w));
    const bottom = Math.max(...comps.map((c) => c.y + c.h));
    return { x, y, w: right - x, h: bottom - y, ids: comps.map((c) => c.id) };
  });
console.log(`overlays: ${overlayGroups.length} sprites agrupados`);
if (overlayGroups.length !== OVERLAYS.length) console.warn('Aviso: contagem de overlays diferente de 4.');

overlayGroups.forEach((group, i) => {
  const [name, label] = OVERLAYS[i] || [`overlay_${i + 1}`, `Overlay ${i + 1}`];
  const file = `overlays/${name}.png`;
  const out = path.join(outRoot, file);
  const size = writeSprite(overlayImage, group, 4, out, group.ids);
  sprites.push({
    id: `overlay_${name}`,
    file,
    group: 'overlay',
    label,
    source: path.basename(SRC.overlays),
    sourceRect: { x: group.x, y: group.y, w: group.w, h: group.h },
    size,
  });
});

// ---------- contatos para conferência ----------
contactSheet(
  skelNamed.map(({ name }) => path.join(outRoot, 'skeletons', `${name}.png`)),
  5, 3, 256, path.join(outRoot, 'contact-skeletons.png'),
);
contactSheet(
  uiComps.map((_, i) => path.join(outRoot, 'ui', `${UI[i][0]}.png`)),
  4, 4, 128, path.join(outRoot, 'contact-ui.png'),
);
contactSheet(
  overlayGroups.map((_, i) => path.join(outRoot, 'overlays', `${OVERLAYS[i][0]}.png`)),
  2, 2, 256, path.join(outRoot, 'contact-overlays.png'),
);
contactSheet(
  boardKept.map((_, i) => path.join(outRoot, 'board', `${BOARDS[i][0]}.png`)),
  3, 2, 128, path.join(outRoot, 'contact-board.png'),
);

// ---------- manifest ----------
const manifest = {
  version: 1,
  generatedAt: new Date().toISOString(),
  sources: Object.fromEntries(Object.entries(SRC).map(([k, v]) => [k, path.basename(v)])),
  notes: [
    'UI inclui o quadrado creme de fundo; use como botão.',
    'Esqueletos incluem o pedestal de museu.',
    'São 12 esqueletos únicos + 2 extras: velociraptor_alt e extra_small_theropod.',
  ],
  sprites,
};
fs.writeFileSync(path.join(outRoot, 'manifest.json'), JSON.stringify(manifest, null, 2));

const count = (group) => sprites.filter((s) => s.group === group).length;
const readme = `# Assets

Gerado por \`tools/slice_atlas.mjs\`.

| Grupo | Qtd | Pasta |
|---|---:|---|
| Tabuleiro | ${count('board')} | \`board/\` |
| Overlays | ${count('overlay')} | \`overlays/\` |
| UI | ${count('ui')} | \`ui/\` |
| Esqueletos | ${count('skeleton')} (12 únicos + 2 extras) | \`skeletons/\` |

## Notas

- Os ícones de UI vêm com o quadrado creme de fundo; servem como botões.
- Os esqueletos incluem o pedestal de museu.
- \`velociraptor_alt.png\` é uma segunda pose do Velociraptor, provavelmente duplicada.
- \`extra_small_theropod.png\` é um pequeno terópode extra, provavelmente duplicado; não usar na campanha.
- \`question.png\` inclui o ponto da interrogação; os componentes soltos foram agrupados.
- \`manifest.json\` tem retângulo de origem, tamanho, era, dieta e curiosidade de cada esqueleto.

## Faltando

Nenhum sprite essencial. Fora do atlas:

- Números 1–8: bitmap 5×7 desenhado no canvas.
- Fonte pixel: Google Fonts (Silkscreen/Pixelify Sans) ou bitmap.
- Logo, badges de era e textos: HTML/CSS.
- Fundos das telas: CSS/padrões.
- SFX: WebAudio/jsfxr.
- Partes separadas dos esqueletos: opcional; a montagem pode usar o esqueleto inteiro + poeira.
`;
fs.writeFileSync(path.join(outRoot, 'README.md'), readme);

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\nOK: ${sprites.length} sprites em ${outRoot}`);
console.log(`Manifest: ${path.join(outRoot, 'manifest.json')}`);
