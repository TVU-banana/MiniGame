import { HISTORY_MAX_RECORDS } from "../app/GameConfig";
import type { GameRecord } from "../app/GameConfig";
import { safeGetItem, safeSetItem } from "../data/storage";

const STORAGE_KEY = "tetris-h5-history";

const isValidRecord = (value: unknown): value is GameRecord => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.score === "number" &&
    typeof obj.durationSeconds === "number" &&
    typeof obj.dateKey === "string"
  );
};

const createDateKey = (date: Date): string => {
  const yy = (date.getFullYear() % 100).toString().padStart(2, "0");
  const mm = (date.getMonth() + 1).toString().padStart(2, "0");
  const dd = date.getDate().toString().padStart(2, "0");
  const hh = date.getHours().toString().padStart(2, "0");
  return `${yy}-${mm}-${dd}-${hh}`;
};

export class HistoryStore {
  getRecords(): GameRecord[] {
    const raw = safeGetItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.filter(isValidRecord);
    } catch {
      return [];
    }
  }

  addRecord(score: number, durationSeconds: number): GameRecord[] {
    const record: GameRecord = {
      score,
      durationSeconds,
      dateKey: createDateKey(new Date())
    };
    const records = [record, ...this.getRecords()];
    const trimmed = records.slice(0, HISTORY_MAX_RECORDS);
    safeSetItem(STORAGE_KEY, JSON.stringify(trimmed));
    return trimmed;
  }
}

export const historyStore = new HistoryStore();
