const KEY = 'osso-a-osso:v1';

export interface CompletedDino {
  bestTime: number;
}

export interface Save {
  version: 1;
  unlocked: number;
  completed: Record<string, CompletedDino>;
  seenHelp: boolean;
}

export function defaultSave(): Save {
  return {
    version: 1,
    unlocked: 0,
    completed: {},
    seenHelp: false,
  };
}

function normalize(raw: unknown): Save {
  const save = defaultSave();
  if (!raw || typeof raw !== 'object') return save;

  const data = raw as Record<string, unknown>;

  if (typeof data.unlocked === 'number' && Number.isFinite(data.unlocked)) {
    save.unlocked = Math.max(0, Math.floor(data.unlocked));
  }

  if (data.completed && typeof data.completed === 'object') {
    for (const [id, value] of Object.entries(data.completed as Record<string, unknown>)) {
      if (!value || typeof value !== 'object') continue;
      const best = (value as Record<string, unknown>).bestTime;
      if (typeof best === 'number' && Number.isFinite(best) && best >= 0) {
        save.completed[id] = { bestTime: Math.floor(best) };
      }
    }
  }

  save.seenHelp = data.seenHelp === true;
  return save;
}

export function loadSave(): Save {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    return normalize(JSON.parse(raw));
  } catch {
    return defaultSave();
  }
}

export function persist(save: Save): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    // jogo continua em memória se o localStorage estiver bloqueado
  }
}
