import { adjacentBones, type Game } from './board.ts';

export interface BoardAssets {
  dirt: HTMLImageElement[];
  sand: HTMLImageElement[];
  bone: HTMLImageElement;
  cracked: HTMLImageElement;
  flag: HTMLImageElement;
  question: HTMLImageElement;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(image);
    image.src = src;
  });
}

export async function loadBoardAssets(): Promise<BoardAssets> {
  const [
    dirtA,
    dirtB,
    sandA,
    sandB,
    sandC,
    bone,
    cracked,
    flag,
    question,
  ] = await Promise.all([
    loadImage('./board/dirt_a.png'),
    loadImage('./board/dirt_b.png'),
    loadImage('./board/sand_a.png'),
    loadImage('./board/sand_b.png'),
    loadImage('./board/sand_c.png'),
    loadImage('./overlays/bone.png'),
    loadImage('./overlays/bone_cracked.png'),
    loadImage('./overlays/flag.png'),
    loadImage('./overlays/question.png'),
  ]);

  return {
    dirt: [dirtA, dirtB],
    sand: [sandA, sandB, sandC],
    bone,
    cracked,
    flag,
    question,
  };
}

const DIGITS: Record<number, string[]> = {
  1: ['010', '110', '010', '010', '111'],
  2: ['111', '001', '111', '100', '111'],
  3: ['111', '001', '111', '001', '111'],
  4: ['101', '101', '111', '001', '001'],
  5: ['111', '100', '111', '001', '111'],
  6: ['111', '100', '111', '101', '111'],
  7: ['111', '001', '010', '010', '010'],
  8: ['111', '101', '111', '101', '111'],
};

const DIGIT_COLORS: Record<number, string> = {
  1: '#4b2f1b',
  2: '#2f4a22',
  3: '#8a2418',
  4: '#24435f',
  5: '#5a2d16',
  6: '#2f5a58',
  7: '#1b1510',
  8: '#3f2f4f',
};

function tileVariant(index: number, count: number): number {
  let hash = Math.imul(index + 1, 0x9e3779b1);
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash ^= hash >>> 16;
  return (hash >>> 0) % count;
}

function drawTile(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  size: number,
  fallback: string,
): void {
  if (image.complete && image.naturalWidth > 0) {
    ctx.drawImage(image, x, y, size, size);
  } else {
    ctx.fillStyle = fallback;
    ctx.fillRect(x, y, size, size);
  }
}

function drawContained(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  cell: number,
  scale: number,
): void {
  if (!image.complete || image.naturalWidth === 0) return;

  const max = cell * scale;
  const ratio = Math.min(max / image.naturalWidth, max / image.naturalHeight);
  const width = image.naturalWidth * ratio;
  const height = image.naturalHeight * ratio;
  ctx.drawImage(
    image,
    x + (cell - width) / 2,
    y + (cell - height) / 2,
    width,
    height,
  );
}

function drawDigit(
  ctx: CanvasRenderingContext2D,
  value: number,
  x: number,
  y: number,
  cell: number,
): void {
  const pattern = DIGITS[value];
  if (!pattern) return;

  const scale = Math.max(1, Math.min(8, Math.floor(cell / 7)));
  const width = 3 * scale;
  const height = 5 * scale;
  const originX = x + (cell - width) / 2;
  const originY = y + (cell - height) / 2;

  ctx.fillStyle = DIGIT_COLORS[value] ?? '#1b1510';
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 3; col++) {
      if (pattern[row][col] === '1') {
        ctx.fillRect(originX + col * scale, originY + row * scale, scale, scale);
      }
    }
  }
}

export function drawBoard(
  canvas: HTMLCanvasElement,
  game: Game,
  assets: BoardAssets,
  hover: number,
): void {
  const rect = canvas.getBoundingClientRect();
  const size = Math.round(rect.width);
  if (size <= 0) return;

  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const pixels = Math.round(size * dpr);
  if (canvas.width !== pixels || canvas.height !== pixels) {
    canvas.width = pixels;
    canvas.height = pixels;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size, size);
  ctx.imageSmoothingEnabled = false;

  const cell = size / game.side;
  const over = game.status === 'won' || game.status === 'lost';

  for (let index = 0; index < game.cells.length; index++) {
    const state = game.cells[index];
    const x = (index % game.side) * cell;
    const y = Math.floor(index / game.side) * cell;
    const showBone = over && state.bone;
    const open = state.revealed || showBone;

    if (open) {
      const tile = assets.sand[tileVariant(index + 97, assets.sand.length)];
      drawTile(ctx, tile, x, y, cell, '#d9c7a3');
    } else {
      // Um único tile de terra deixa o campo legível; a variante clara
      // parecia areia e o giro revelava artefatos rosados do JPEG.
      drawTile(ctx, assets.dirt[0], x, y, cell, '#6b4a2f');
      ctx.fillStyle = 'rgba(27, 21, 16, 0.18)';
      ctx.fillRect(x, y, cell, cell);
    }
  }

  // Linhas de 2 px cobrem a franja rosa que sobra da borda dos tiles.
  ctx.strokeStyle = 'rgba(27, 21, 16, 0.75)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let line = 0; line <= game.side; line++) {
    const pos = Math.round(line * cell) + 0.5;
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, size);
    ctx.moveTo(0, pos);
    ctx.lineTo(size, pos);
  }
  ctx.stroke();

  ctx.strokeStyle = '#1b1510';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, size - 2, size - 2);

  for (let index = 0; index < game.cells.length; index++) {
    const state = game.cells[index];
    const x = (index % game.side) * cell;
    const y = Math.floor(index / game.side) * cell;

    if (over && state.bone) {
      if (index === game.hit) {
        ctx.fillStyle = 'rgba(194, 69, 45, 0.25)';
        ctx.fillRect(x, y, cell, cell);
        drawContained(ctx, assets.cracked, x, y, cell, 0.78);
      } else {
        drawContained(ctx, assets.bone, x, y, cell, 0.68);
      }
      continue;
    }

    if (!state.revealed) {
      if (state.mark === 1) drawContained(ctx, assets.flag, x, y, cell, 0.78);
      if (state.mark === 2) drawContained(ctx, assets.question, x, y, cell, 0.62);
      continue;
    }

    const count = adjacentBones(game, index);
    if (count > 0) drawDigit(ctx, count, x, y, cell);
  }

  if (
    hover >= 0 &&
    hover < game.cells.length &&
    !game.cells[hover].revealed &&
    game.status !== 'won' &&
    game.status !== 'lost'
  ) {
    const x = (hover % game.side) * cell;
    const y = Math.floor(hover / game.side) * cell;
    ctx.fillStyle = 'rgba(240, 230, 204, 0.08)';
    ctx.fillRect(x, y, cell, cell);
    ctx.strokeStyle = 'rgba(240, 230, 204, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, Math.max(0, cell - 2), Math.max(0, cell - 2));
  }
}
