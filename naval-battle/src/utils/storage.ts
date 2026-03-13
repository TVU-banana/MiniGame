import { DEFAULT_VOLUME, STORAGE_KEYS } from "../app/constants";
import type { StatsData } from "../app/gameState";

export const defaultStats: StatsData = {
  totalGames: 0,
  totalWins: 0,
  totalLosses: 0,
  totalPlaySeconds: 0,
  easyGames: 0,
  hardGames: 0,
  easyWins: 0,
  easyLosses: 0,
  hardWins: 0,
  hardLosses: 0,
  volume: DEFAULT_VOLUME,
};

export function readStats(): StatsData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.stats);
    if (!raw) {
      return defaultStats;
    }
    return {
      ...defaultStats,
      ...JSON.parse(raw),
    };
  } catch {
    return defaultStats;
  }
}

export function writeStats(stats: StatsData) {
  window.localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(stats));
}

export function clearStats() {
  writeStats(defaultStats);
}
