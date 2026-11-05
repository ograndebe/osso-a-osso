import './style.css';
import {
  chord,
  createGame,
  elapsedMs,
  remainingBones,
  reveal,
  toggleMark,
  type Game,
} from './board.ts';
import { DINOS, GROUPS, type Dino } from './data.ts';
import { defaultSave, loadSave, persist, type Save } from './storage.ts';
import { drawBoard, loadBoardAssets, type BoardAssets } from './render.ts';

const content = document.querySelector<HTMLDivElement>('#expedition-content')!;
const screenExpedition = document.querySelector<HTMLElement>('#screen-expedition')!;
const screenDig = document.querySelector<HTMLElement>('#screen-dig')!;
const board = document.querySelector<HTMLCanvasElement>('#board')!;
const boardFrame = document.querySelector<HTMLDivElement>('#board-frame')!;
const digTitle = document.querySelector<HTMLElement>('#dig-title')!;
const digEra = document.querySelector<HTMLElement>('#dig-era')!;
const bonesLeft = document.querySelector<HTMLElement>('#bones-left')!;
const timerEl = document.querySelector<HTMLElement>('#timer')!;
const modal = document.querySelector<HTMLDialogElement>('#modal')!;

let save: Save = loadSave();
let assets: BoardAssets | null = null;
let game: Game | null = null;
let currentIndex = -1;
let hover = -1;
let modalMode: 'help' | 'win' | 'lose' | null = null;

let lastTapIndex = -1;
let lastTapAt = 0;
let longPressTimer = 0;
let longPressFired = false;
let suppressUp = false;
let downIndex = -1;
let downX = 0;
let downY = 0;
let downButton = 0;

function formatTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

function completedCount(): number {
  return DINOS.filter((dino) => save.completed[dino.id]).length;
}

function nextIncomplete(): number {
  for (let i = 0; i < DINOS.length; i++) {
    if (!save.completed[DINOS[i].id] && i <= save.unlocked) return i;
  }
  return -1;
}

function cardHtml(dino: Dino, index: number): string {
  const completed = save.completed[dino.id];
  const locked = index > save.unlocked;
  const status = completed ? 'completed' : locked ? 'locked' : 'available';
  const name = locked ? '???' : dino.name;
  const meta = locked
    ? `${dino.era} · sítio bloqueado`
    : `${dino.era} · ${dino.side}×${dino.side} · ${dino.bones} ossos`;
  const badge = completed
    ? `<span class="badge badge-done"><img src="./ui/check.png" alt="" />No museu</span>`
    : locked
      ? `<span class="badge badge-lock"><img src="./ui/lock.png" alt="" />Bloqueado</span>`
      : `<span class="badge badge-play"><img src="./ui/pickaxe.png" alt="" />Escavar</span>`;
  const fact = completed ? `<span class="card-fact">${dino.fact}</span>` : '';
  const best = completed
    ? `<span class="card-best">Recorde ${formatTime(completed.bestTime)}</span>`
    : '';
  const action = locked ? 'disabled' : `data-action="play" data-index="${index}"`;
  const label = locked ? 'Sítio bloqueado' : `Escavar ${dino.name}`;

  return `
    <button class="dino-card ${status}" ${action} aria-label="${label}" type="button">
      <span class="card-art">
        <img class="card-skeleton${completed ? '' : ' silhouette'}" src="./skeletons/${dino.id}.png" alt="" />
        ${badge}
      </span>
      <span class="card-body">
        <span class="card-era">${dino.era}</span>
        <span class="card-name">${name}</span>
        <span class="card-meta">${meta}</span>
        ${fact}
        ${best}
      </span>
    </button>
  `;
}

function heroHtml(): string {
  const next = nextIncomplete();

  if (next < 0) {
    return `
      <section class="hero hero-done">
        <div class="hero-copy">
          <p class="eyebrow">Museu completo</p>
          <h2>Todos os fósseis</h2>
          <p class="hero-blurb">Você escavou os ${DINOS.length} sítios. O museu está aberto.</p>
        </div>
        <div class="hero-art-wrap">
          <img class="hero-art bone-art" src="./overlays/bone.png" alt="" />
        </div>
      </section>
    `;
  }

  const dino = DINOS[next];
  return `
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Próxima escavação</p>
        <h2>${dino.name}</h2>
        <p class="hero-meta">${dino.era} · ${dino.side}×${dino.side} · ${dino.bones} ossos</p>
        <p class="hero-blurb">Limpe a terra sem quebrar o fóssil. A primeira escavação é sempre segura.</p>
        <button class="btn btn-primary" data-action="play" data-index="${next}" type="button">
          <img class="btn-icon" src="./ui/pickaxe.png" alt="" />Escavar
        </button>
      </div>
      <div class="hero-art-wrap">
        <img class="hero-art silhouette" src="./skeletons/${dino.id}.png" alt="" />
      </div>
    </section>
  `;
}

function renderExpedition(): void {
  const done = completedCount();
  const sections = GROUPS.map((group) => {
    const items = DINOS.map((dino, index) => ({ dino, index })).filter(
      ({ dino }) => dino.group === group.name,
    );
    if (items.length === 0) return '';

    return `
      <section class="era era-${group.slug}">
        <div class="era-head">
          <h2>${group.name}</h2>
          <span>${group.blurb}</span>
        </div>
        <div class="cards">
          ${items.map(({ dino, index }) => cardHtml(dino, index)).join('')}
        </div>
      </section>
    `;
  }).join('');

  content.innerHTML = `
    <header class="topbar">
      <div class="brand">
        <img class="brand-icon" src="./overlays/bone.png" alt="" />
        <h1>Osso a Osso</h1>
      </div>
      <div class="top-actions">
        <span class="progress-chip">
          <img src="./ui/museum.png" alt="" />Museu <b>${done}/${DINOS.length}</b>
        </span>
        <button class="icon-btn" data-action="help" aria-label="Como jogar" type="button">
          <img src="./ui/hint.png" alt="" />
        </button>
      </div>
    </header>

    ${heroHtml()}
    ${sections}

    <footer class="foot">
      <p>A primeira escavação é sempre segura. Toque em <b>Como jogar</b> para rever os controles.</p>
    </footer>
  `;
}

function draw(): void {
  if (!game || !assets) return;
  drawBoard(board, game, assets, hover);
}

function renderHud(): void {
  if (!game || currentIndex < 0) return;
  const dino = DINOS[currentIndex];
  digTitle.textContent = dino.name;
  digEra.textContent = `${dino.era} · ${dino.side}×${dino.side}`;

  const remaining = remainingBones(game);
  bonesLeft.textContent = String(remaining);
  bonesLeft.classList.toggle('negative', remaining < 0);
  timerEl.textContent = formatTime(elapsedMs(game, Date.now()) / 1000);
}

function updateTimer(): void {
  if (!game || currentIndex < 0 || game.status !== 'playing') return;
  timerEl.textContent = formatTime(elapsedMs(game, Date.now()) / 1000);
}

function openGame(index: number): void {
  if (index < 0 || index >= DINOS.length || index > save.unlocked) return;

  closeModal();
  const dino = DINOS[index];
  currentIndex = index;
  game = createGame(dino.side, dino.bones);
  hover = -1;
  lastTapIndex = -1;
  suppressUp = false;
  longPressFired = false;
  clearLongPress();
  boardFrame.classList.remove('shake');
  screenExpedition.classList.add('hidden');
  screenDig.classList.remove('hidden');
  renderHud();
  requestAnimationFrame(() => {
    draw();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function showExpedition(): void {
  closeModal();
  currentIndex = -1;
  game = null;
  hover = -1;
  longPressFired = false;
  clearLongPress();
  screenDig.classList.add('hidden');
  screenExpedition.classList.remove('hidden');
  renderExpedition();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function restartGame(): void {
  if (currentIndex < 0) return;
  const dino = DINOS[currentIndex];
  game = createGame(dino.side, dino.bones);
  hover = -1;
  lastTapIndex = -1;
  suppressUp = false;
  longPressFired = false;
  clearLongPress();
  boardFrame.classList.remove('shake');
  renderHud();
  draw();
}

function afterAction(): void {
  if (!game) return;
  renderHud();
  draw();

  if (game.status === 'won') handleWin();
  if (game.status === 'lost') handleLose();
}

function digCell(index: number): void {
  if (!game || game.status === 'won' || game.status === 'lost') return;

  const cell = game.cells[index];
  if (!cell) return;

  // Cava mesmo se a célula estiver marcada: bandeira vira interrogação e a
  // revelação limpa a marca. Assim o toque longo nunca fica "preso" na flag.
  if (cell.mark === 1) toggleMark(game, index);
  reveal(game, index, Math.random, Date.now());
  afterAction();
}

function handleWin(): void {
  if (!game || currentIndex < 0) return;
  const dino = DINOS[currentIndex];
  const seconds = Math.max(0, Math.floor(elapsedMs(game, Date.now()) / 1000));
  const previous = save.completed[dino.id]?.bestTime;
  const isRecord = previous === undefined || seconds < previous;

  save.completed[dino.id] = { bestTime: isRecord ? seconds : previous };
  save.unlocked = Math.min(DINOS.length - 1, Math.max(save.unlocked, currentIndex + 1));
  persist(save);
  renderHud();

  window.setTimeout(() => {
    if (!modal.open && game?.status === 'won' && currentIndex >= 0) {
      openWinModal(dino, seconds, isRecord);
    }
  }, 380);
}

function handleLose(): void {
  if (!game || currentIndex < 0) return;
  const dino = DINOS[currentIndex];
  boardFrame.classList.add('shake');
  window.setTimeout(() => boardFrame.classList.remove('shake'), 460);

  window.setTimeout(() => {
    if (!modal.open && game?.status === 'lost' && currentIndex >= 0) {
      openLoseModal(dino);
    }
  }, 500);
}

function openWinModal(dino: Dino, seconds: number, isRecord: boolean): void {
  const best = save.completed[dino.id]?.bestTime ?? seconds;
  const next = nextIncomplete();
  const record = isRecord ? '<span class="record-badge">Novo recorde</span>' : '';

  modalMode = 'win';
  modal.innerHTML = `
    <div class="modal-card modal-win">
      <p class="eyebrow"><img class="inline-icon" src="./ui/sparkle.png" alt="" />Fóssil completo</p>
      <img class="win-skeleton" src="./skeletons/${dino.id}.png" alt="Esqueleto de ${dino.name}" />
      <h2>${dino.name}</h2>
      <p class="modal-meta">${dino.era} · ${dino.diet} · ${dino.side}×${dino.side}</p>
      ${record}
      <p class="fact">${dino.fact}</p>
      <div class="win-stats">
        <span>Tempo <b>${formatTime(seconds)}</b></span>
        <span>Recorde <b>${formatTime(best)}</b></span>
      </div>
      <div class="modal-actions">
        ${next >= 0 ? `<button class="btn btn-primary" data-action="next" type="button"><img class="btn-icon" src="./ui/arrow_right.png" alt="" />Próximo sítio</button>` : ''}
        <button class="btn ${next >= 0 ? 'btn-ghost' : 'btn-primary'}" data-action="museum" type="button">
          <img class="btn-icon" src="./ui/museum.png" alt="" />${next >= 0 ? 'Museu' : 'Ver museu'}
        </button>
      </div>
    </div>
  `;
  modal.showModal();
  modal.querySelector<HTMLButtonElement>('.modal-actions .btn')?.focus();
}

function openLoseModal(dino: Dino): void {
  modalMode = 'lose';
  modal.innerHTML = `
    <div class="modal-card modal-lose">
      <p class="eyebrow">Escavação interrompida</p>
      <img class="lose-bone" src="./overlays/bone_cracked.png" alt="" />
      <h2>O fóssil foi danificado</h2>
      <p class="fact">Você acertou um osso. O sítio de ${dino.name} continua aqui — tente de novo.</p>
      <div class="modal-actions">
        <button class="btn btn-primary" data-action="retry" type="button">
          <img class="btn-icon" src="./ui/restart.png" alt="" />Escavar de novo
        </button>
        <button class="btn btn-ghost" data-action="museum" type="button">
          <img class="btn-icon" src="./ui/map.png" alt="" />Mapa
        </button>
      </div>
    </div>
  `;
  modal.showModal();
  modal.querySelector<HTMLButtonElement>('.modal-actions .btn')?.focus();
}

function openHelp(): void {
  modalMode = 'help';
  modal.innerHTML = `
    <div class="modal-card modal-help">
      <div class="modal-head">
        <h2>Como escavar</h2>
        <button class="icon-btn" data-action="close-modal" aria-label="Fechar" type="button">
          <img src="./ui/close.png" alt="" />
        </button>
      </div>
      <p class="modal-lead">Revele toda a terra sem acertar um osso. O número mostra quantos ossos existem nas 8 células ao redor.</p>
      <div class="help-cols">
        <div class="help-box">
          <h3>Desktop</h3>
          <p><b>Clique</b> marca bandeira / interrogação.<br /><b>Segure o clique</b> ou use o <b>clique direito</b> para cavar.<br /><b>Duplo clique</b> num número com as bandeiras certas abre as células ao redor.</p>
        </div>
        <div class="help-box">
          <h3>Mobile</h3>
          <p><b>Toque</b> marca bandeira / interrogação.<br /><b>Segure</b> para cavar.<br /><b>Duplo toque</b> num número com as bandeiras certas abre as células ao redor.</p>
        </div>
      </div>
      <p class="help-tip">A primeira escavação é sempre segura: o 3×3 ao redor nunca tem osso. A bandeira alterna entre bandeira, interrogação e vazio.</p>
      <div class="modal-actions">
        <button class="btn btn-primary" data-action="close-modal" type="button">Entendi</button>
      </div>
      <button class="link-danger" data-action="reset" type="button">Apagar progresso</button>
    </div>
  `;
  modal.showModal();
  modal.querySelector<HTMLButtonElement>('[data-action="close-modal"]')?.focus();
}

function closeModal(): void {
  if (modal.open) modal.close();
  modalMode = null;
}

function resetProgress(): void {
  if (!window.confirm('Apagar todo o progresso do museu?')) return;
  save = defaultSave();
  save.seenHelp = true;
  persist(save);
  closeModal();
  showExpedition();
}

function indexFromEvent(event: PointerEvent): number {
  if (!game) return -1;
  const rect = board.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return -1;

  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;
  if (x < 0 || x >= 1 || y < 0 || y >= 1) return -1;

  const col = Math.floor(x * game.side);
  const row = Math.floor(y * game.side);
  return row * game.side + col;
}

function clearLongPress(): void {
  if (longPressTimer) {
    window.clearTimeout(longPressTimer);
    longPressTimer = 0;
  }
}

function bindCanvas(): void {
  board.addEventListener('contextmenu', (event) => event.preventDefault());

  board.addEventListener('pointerdown', (event) => {
    if (!game || game.status === 'won' || game.status === 'lost') return;

    const index = indexFromEvent(event);
    if (index < 0) return;

    downIndex = index;
    downX = event.clientX;
    downY = event.clientY;
    downButton = event.button;
    longPressFired = false;
    suppressUp = false;

    if (event.pointerType === 'mouse') {
      if (event.button === 2 || (event.button === 0 && event.ctrlKey)) {
        event.preventDefault();
        suppressUp = true;
        digCell(index);
        return;
      }

      if (event.button === 1) {
        event.preventDefault();
        suppressUp = true;
        chord(game, index, Math.random, Date.now());
        afterAction();
        return;
      }

      if (event.button !== 0) return;
    } else {
      event.preventDefault();
    }

    board.setPointerCapture(event.pointerId);
    clearLongPress();
    longPressTimer = window.setTimeout(() => {
      if (!game || game.status === 'won' || game.status === 'lost') return;
      longPressFired = true;
      digCell(downIndex);
      navigator.vibrate?.(8);
    }, 420);
  });

  board.addEventListener('pointermove', (event) => {
    if (!game) return;

    if (
      longPressTimer &&
      (Math.abs(event.clientX - downX) > 10 || Math.abs(event.clientY - downY) > 10)
    ) {
      clearLongPress();
    }

    if (event.pointerType !== 'mouse' || game.status === 'won' || game.status === 'lost') {
      return;
    }

    const index = indexFromEvent(event);
    if (index !== hover) {
      hover = index;
      draw();
    }
  });

  board.addEventListener('pointerup', (event) => {
    if (!game || game.status === 'won' || game.status === 'lost') {
      clearLongPress();
      longPressFired = false;
      return;
    }

    clearLongPress();

    if (suppressUp) {
      suppressUp = false;
      return;
    }

    if (longPressFired) {
      longPressFired = false;
      return;
    }

    if (downButton !== 0) return;

    const index = indexFromEvent(event);
    if (index < 0 || index !== downIndex) return;

    const moved =
      Math.abs(event.clientX - downX) > 10 || Math.abs(event.clientY - downY) > 10;
    if (moved) return;

    const now = performance.now();
    const isDouble = index === lastTapIndex && now - lastTapAt < 320;
    lastTapIndex = index;
    lastTapAt = now;

    if (isDouble && game.cells[index].revealed) {
      chord(game, index, Math.random, Date.now());
    } else {
      toggleMark(game, index);
    }

    afterAction();
  });

  board.addEventListener('pointercancel', () => {
    clearLongPress();
    longPressFired = false;
  });

  board.addEventListener('pointerleave', () => {
    clearLongPress();
    if (hover !== -1) {
      hover = -1;
      draw();
    }
  });
}

function bindEvents(): void {
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const control = target.closest<HTMLElement>('[data-action]');
    if (!control) return;

    switch (control.dataset.action) {
      case 'play': {
        const index = Number(control.dataset.index);
        if (Number.isInteger(index)) openGame(index);
        break;
      }
      case 'back':
        showExpedition();
        break;
      case 'restart':
        restartGame();
        break;
      case 'help':
        openHelp();
        break;
      case 'close-modal':
        closeModal();
        break;
      case 'museum':
        closeModal();
        showExpedition();
        break;
      case 'retry':
        closeModal();
        restartGame();
        break;
      case 'next': {
        closeModal();
        const next = nextIncomplete();
        if (next >= 0) openGame(next);
        else showExpedition();
        break;
      }
      case 'reset':
        resetProgress();
        break;
    }
  });

  modal.addEventListener('cancel', (event) => {
    if (modalMode !== 'help') event.preventDefault();
  });

  modal.addEventListener('click', (event) => {
    if (event.target === modal && modalMode === 'help') closeModal();
  });

  modal.addEventListener('close', () => {
    modalMode = null;
  });

  document.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() !== 'r' || event.repeat) return;
    if (screenDig.classList.contains('hidden') || modal.open) return;
    restartGame();
  });

  const redraw = () => {
    if (!screenDig.classList.contains('hidden')) draw();
  };

  window.addEventListener('resize', redraw);
  new ResizeObserver(redraw).observe(boardFrame);
}

async function init(): Promise<void> {
  save = loadSave();
  save.unlocked = Math.min(DINOS.length - 1, Math.max(0, save.unlocked));

  renderExpedition();
  bindEvents();
  bindCanvas();
  window.setInterval(updateTimer, 250);

  assets = await loadBoardAssets();
  if (game) draw();

  if (!save.seenHelp) {
    save.seenHelp = true;
    persist(save);
    openHelp();
  }
}

init().catch((error: unknown) => {
  console.error(error);
});
