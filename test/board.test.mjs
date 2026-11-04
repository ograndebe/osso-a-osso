import test from 'node:test';
import assert from 'node:assert/strict';
import {
  adjacentBones,
  chord,
  createGame,
  neighbors,
  remainingBones,
  reveal,
  toggleMark,
} from '../src/board.ts';

function seeded(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test('primeiro clique é seguro e abre o 3x3', () => {
  const game = createGame(6, 4);
  const first = 14;
  reveal(game, first, seeded(1), 1000);

  assert.equal(game.status, 'playing');
  assert.equal(game.started, true);
  assert.equal(game.cells[first].revealed, true);
  assert.equal(adjacentBones(game, first), 0);

  const safe = new Set([first, ...neighbors(first, 6)]);
  for (const index of safe) {
    assert.equal(game.cells[index].bone, false, `osso no primeiro clique: ${index}`);
    assert.equal(game.cells[index].revealed, true, `célula segura fechada: ${index}`);
  }

  assert.equal(game.cells.filter((cell) => cell.bone).length, 4);
});

test('revelar toda a terra segura vence e zera os ossos restantes', () => {
  const game = createGame(6, 4);
  reveal(game, 0, seeded(2), 0);

  for (let i = 0; i < game.cells.length; i++) {
    if (!game.cells[i].bone && !game.cells[i].revealed) {
      reveal(game, i, seeded(2), 0);
    }
    if (game.status !== 'playing') break;
  }

  assert.equal(game.status, 'won');
  assert.equal(game.revealedSafe, game.cells.length - game.bones);
  assert.equal(remainingBones(game), 0);
});

test('bandeira e interrogação alternam e bandeira bloqueia o clique', () => {
  const game = createGame(6, 4);

  toggleMark(game, 0);
  assert.equal(game.cells[0].mark, 1);
  assert.equal(game.flags, 1);

  toggleMark(game, 0);
  assert.equal(game.cells[0].mark, 2);
  assert.equal(game.flags, 0);

  toggleMark(game, 0);
  assert.equal(game.cells[0].mark, 0);

  toggleMark(game, 0);
  reveal(game, 0, seeded(3), 0);
  assert.equal(game.cells[0].revealed, false);
  assert.equal(game.started, false);
});

test('chord abre as células ao redor quando as bandeiras batem', () => {
  const game = createGame(6, 4);
  reveal(game, 14, seeded(4), 0);

  let numberIndex = -1;
  for (let i = 0; i < game.cells.length; i++) {
    if (game.cells[i].revealed && adjacentBones(game, i) > 0) {
      numberIndex = i;
      break;
    }
  }
  assert.notEqual(numberIndex, -1);

  const around = neighbors(numberIndex, game.side);
  for (const index of around) {
    if (game.cells[index].bone) toggleMark(game, index);
  }

  chord(game, numberIndex, seeded(4), 0);
  assert.notEqual(game.status, 'lost');

  for (const index of around) {
    if (!game.cells[index].bone) {
      assert.equal(game.cells[index].revealed, true, `vizinha segura fechada: ${index}`);
    }
  }
});

test('chord com bandeira errada perde no osso', () => {
  const game = createGame(3, 1);
  game.started = true;
  game.status = 'playing';
  game.startedAt = 0;

  game.cells[4].revealed = true;
  game.revealedSafe = 1;

  game.cells[0].bone = true;
  game.cells[1].mark = 1;
  game.flags = 1;

  assert.equal(adjacentBones(game, 4), 1);
  chord(game, 4, seeded(5), 50);

  assert.equal(game.status, 'lost');
  assert.equal(game.hit, 0);
  assert.equal(game.endedAt, 50);
});
