import { useMemo, useState } from "react";
import type { DifficultyKey } from "../app/gameState";
import { clearStats, defaultStats, readStats, writeStats } from "../utils/storage";

export default function useLocalStats() {
  const [stats, setStats] = useState(readStats);

  const actions = useMemo(
    () => ({
      setVolume(volume: number) {
        const next = {
          ...stats,
          volume,
        };
        setStats(next);
        writeStats(next);
      },
      clearAll() {
        setStats(defaultStats);
        clearStats();
      },
      recordResult(won: boolean, difficulty: DifficultyKey, playSeconds: number) {
        const next = {
          ...stats,
          totalGames: stats.totalGames + 1,
          totalWins: stats.totalWins + (won ? 1 : 0),
          totalLosses: stats.totalLosses + (won ? 0 : 1),
          totalPlaySeconds: stats.totalPlaySeconds + playSeconds,
          easyGames: stats.easyGames + (difficulty === "easy" ? 1 : 0),
          hardGames: stats.hardGames + (difficulty === "hard" ? 1 : 0),
          easyWins: stats.easyWins + (difficulty === "easy" && won ? 1 : 0),
          easyLosses: stats.easyLosses + (difficulty === "easy" && !won ? 1 : 0),
          hardWins: stats.hardWins + (difficulty === "hard" && won ? 1 : 0),
          hardLosses: stats.hardLosses + (difficulty === "hard" && !won ? 1 : 0),
        };
        setStats(next);
        writeStats(next);
      },
    }),
    [stats],
  );

  return {
    stats,
    ...actions,
  };
}
