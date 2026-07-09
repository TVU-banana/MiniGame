import type { GameMode, LevelId, RunRecord } from './BlockModel';

const HISTORY_KEY = 'slider-clear-3d:history';
const PROGRESS_KEY = 'slider-clear-3d:progress';

interface StoredProgress {
  unlockedLevel?: LevelId;
  coins?: number;
}

function normalizeMode(value: unknown): GameMode {
  return value === 'challenge' ? 'challenge' : 'endless';
}

export class HistoryStore {
  loadRuns(): RunRecord[] {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw) as Partial<RunRecord>[];
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.map((record) => ({
        id: String(record.id ?? crypto.randomUUID()),
        level:
          record.level === 2 ||
          record.level === 3 ||
          record.level === 4 ||
          record.level === 5 ||
          record.level === 6
            ? record.level
            : 1,
        mode: normalizeMode(record.mode),
        startedAt: String(record.startedAt ?? new Date().toISOString()),
        finishedAt: String(record.finishedAt ?? new Date().toISOString()),
        result: record.result === 'fail' ? 'fail' : 'success',
        elapsedSeconds: Math.max(0, Number(record.elapsedSeconds ?? 0)),
        stars:
          record.stars === 1 || record.stars === 2 || record.stars === 3 ? record.stars : 0,
        earnedCoins: Math.max(0, Number(record.earnedCoins ?? 0)),
      }));
    } catch {
      return [];
    }
  }

  saveRun(record: RunRecord): RunRecord[] {
    const current = this.loadRuns();
    const next = [record, ...current].slice(0, 60);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    return next;
  }

  loadUnlockedLevel(): LevelId {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      if (!raw) {
        return 1;
      }
      const parsed = JSON.parse(raw) as StoredProgress;
      if (
        parsed.unlockedLevel === 1 ||
        parsed.unlockedLevel === 2 ||
        parsed.unlockedLevel === 3 ||
        parsed.unlockedLevel === 4 ||
        parsed.unlockedLevel === 5 ||
        parsed.unlockedLevel === 6
      ) {
        return parsed.unlockedLevel;
      }
      return 1;
    } catch {
      return 1;
    }
  }

  saveUnlockedLevel(levelId: LevelId): void {
    const current = this.loadProgress();
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ ...current, unlockedLevel: levelId }));
  }

  loadCoins(): number {
    return this.loadProgress().coins ?? 0;
  }

  saveCoins(coins: number): void {
    const current = this.loadProgress();
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ ...current, coins: Math.max(0, coins) }));
  }

  private loadProgress(): StoredProgress {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      if (!raw) {
        return { unlockedLevel: 1, coins: 0 };
      }
      const parsed = JSON.parse(raw) as StoredProgress;
      return {
        unlockedLevel:
          parsed.unlockedLevel === 2 ||
          parsed.unlockedLevel === 3 ||
          parsed.unlockedLevel === 4 ||
          parsed.unlockedLevel === 5 ||
          parsed.unlockedLevel === 6
            ? parsed.unlockedLevel
            : 1,
        coins: Math.max(0, Number(parsed.coins ?? 0)),
      };
    } catch {
      return { unlockedLevel: 1, coins: 0 };
    }
  }
}
