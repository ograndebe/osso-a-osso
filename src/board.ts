export type Mark = 0 | 1 | 2;
export type GameStatus = 'idle' | 'playing' | 'won' | 'lost';

export interface Cell {
  bone: boolean;
  revealed: boolean;
  mark: Mark;
}

export interface Game {
  side: number;
  bones: number;
  cells: Cell[];
  status: GameStatus;
  started: boolean;
  revealedSafe: number;
  flags: number;
  startedAt: number | null;
  endedAt: number | null;
  hit: number | null;
}

export type Rng = () => number;

export function createGame(side: number, bones: number): Game {
  if (side < 2 || bones < 1 || bones >= side * side) {
    throw new Error(`Configuração inválida: ${side}x${side} com ${bones} ossos`);
  }

  return {
    side,
    bones,
    cells: Array.from({ length: side * side }, () => ({
      bone: false,
      revealed: false,
      mark: 0 as Mark,
    })),
    status: 'idle',
    started: false,
    revealedSafe: 0,
    flags: 0,
    startedAt: null,
    endedAt: null,
    hit: null,
  };
}

export function neighbors(index: number, side: number): number[] {
  const row = Math.floor(index / side);
  const col = index % side;
  const out: number[] = [];

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < side && c >= 0 && c < side) out.push(r * side + c);
    }
  }

  return out;
}

export function adjacentBones(game: Game, index: number): number {
  let count = 0;
  for (const neighbor of neighbors(index, game.side)) {
    if (game.cells[neighbor].bone) count++;
  }
  return count;
}

function placeBones(game: Game, first: number, rng: Rng): void {
  const safe = new Set<number>([first, ...neighbors(first, game.side)]);
  const pool: number[] = [];

  for (let i = 0; i < game.cells.length; i++) {
    if (!safe.has(i)) pool.push(i);
  }

  if (pool.length < game.bones) {
    throw new Error('Não há células suficientes para os ossos');
  }

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  for (let i = 0; i < game.bones; i++) {
    game.cells[pool[i]].bone = true;
  }
}

function revealFrom(game: Game, start: number): void {
  const stack = [start];

  while (stack.length > 0) {
    const index = stack.pop()!;
    const cell = game.cells[index];
    if (cell.revealed || cell.mark === 1 || cell.bone) continue;

    cell.revealed = true;
    if (cell.mark === 2) cell.mark = 0;
    game.revealedSafe++;

    if (adjacentBones(game, index) === 0) {
      for (const neighbor of neighbors(index, game.side)) {
        const next = game.cells[neighbor];
        if (!next.revealed && next.mark !== 1) stack.push(neighbor);
      }
    }
  }
}

export function reveal(
  game: Game,
  index: number,
  rng: Rng = Math.random,
  now = Date.now(),
): void {
  if (game.status === 'won' || game.status === 'lost') return;

  const cell = game.cells[index];
  if (!cell || cell.mark === 1 || cell.revealed) return;

  if (!game.started) {
    placeBones(game, index, rng);
    game.started = true;
    game.status = 'playing';
    game.startedAt = now;
  }

  if (cell.bone) {
    game.hit = index;
    game.status = 'lost';
    game.endedAt = now;
    return;
  }

  revealFrom(game, index);

  if (game.revealedSafe === game.cells.length - game.bones) {
    game.status = 'won';
    game.endedAt = now;
    for (const c of game.cells) {
      if (c.bone) c.mark = 1;
    }
    game.flags = game.bones;
  }
}

export function toggleMark(game: Game, index: number): void {
  if (game.status === 'won' || game.status === 'lost') return;

  const cell = game.cells[index];
  if (!cell || cell.revealed) return;

  if (cell.mark === 0) {
    cell.mark = 1;
    game.flags++;
  } else if (cell.mark === 1) {
    cell.mark = 2;
    game.flags--;
  } else {
    cell.mark = 0;
  }
}

export function chord(
  game: Game,
  index: number,
  rng: Rng = Math.random,
  now = Date.now(),
): void {
  if (game.status !== 'playing') return;

  const cell = game.cells[index];
  if (!cell?.revealed) return;

  const number = adjacentBones(game, index);
  if (number === 0) return;

  const around = neighbors(index, game.side);
  const flagged = around.filter((i) => game.cells[i].mark === 1).length;
  if (flagged !== number) return;

  for (const neighbor of around) {
    const next = game.cells[neighbor];
    if (!next.revealed && next.mark !== 1) {
      reveal(game, neighbor, rng, now);
      if (game.status !== 'playing') break;
    }
  }
}

export function remainingBones(game: Game): number {
  return game.bones - game.flags;
}

export function elapsedMs(game: Game, now = Date.now()): number {
  if (game.startedAt === null) return 0;
  return Math.max(0, (game.endedAt ?? now) - game.startedAt);
}
