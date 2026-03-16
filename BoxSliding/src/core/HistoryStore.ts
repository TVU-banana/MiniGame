import type { LevelId, RunRecord } from './BlockModel';

const HISTORY_KEY = 'slider-clear-3d:history';
const PROGRESS_KEY = 'slider-clear-3d:progress';

export class HistoryStore {
  loadRuns(): RunRecord[] {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw) as RunRecord[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  saveRun(record: RunRecord): RunRecord[] {
    const current = this.loadRuns();
    const next = [record, ...current].slice(0, 10);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    return next;
  }

  loadUnlockedLevel(): LevelId {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      if (!raw) {
        return 1;
      }
      const parsed = JSON.parse(raw) as { unlockedLevel?: LevelId };
      if (parsed.unlockedLevel === 1 || parsed.unlockedLevel === 2 || parsed.unlockedLevel === 3) {
        return parsed.unlockedLevel;
      }
      return 1;
    } catch {
      return 1;
    }
  }

  saveUnlockedLevel(levelId: LevelId): void {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ unlockedLevel: levelId }));
  }
}
