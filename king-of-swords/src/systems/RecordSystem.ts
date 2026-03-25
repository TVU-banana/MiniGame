import type { GameResult, RunRecord } from '../app/types';
import { loadRecords, saveRecord } from '../data/storage';

export class RecordSystem {
  getRecords(): RunRecord[] {
    return loadRecords();
  }

  save(result: Omit<GameResult, 'bestRecord'>): GameResult {
    const saved = saveRecord(result);
    return {
      ...result,
      bestRecord: saved.bestRecord
    };
  }
}
