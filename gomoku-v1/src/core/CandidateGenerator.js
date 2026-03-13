import { BOARD_SIZE, OPENING_POINTS } from "../constants/game.js";

function getClusterCenter(occupied) {
  if (occupied.length === 0) {
    return {
      x: (BOARD_SIZE - 1) / 2,
      y: (BOARD_SIZE - 1) / 2,
    };
  }

  const total = occupied.reduce(
    (accumulator, cell) => ({
      x: accumulator.x + cell.x,
      y: accumulator.y + cell.y,
    }),
    { x: 0, y: 0 },
  );

  return {
    x: total.x / occupied.length,
    y: total.y / occupied.length,
  };
}

function rankCandidate(cell, clusterCenter) {
  const boardCenter = (BOARD_SIZE - 1) / 2;
  const toCluster = Math.hypot(cell.x - clusterCenter.x, cell.y - clusterCenter.y);
  const toCenter = Math.hypot(cell.x - boardCenter, cell.y - boardCenter);

  return toCluster * 0.72 + toCenter * 0.28;
}

export default class CandidateGenerator {
  static generate(board, options = {}) {
    const { radius = 2, maxCandidates = 72 } = options;
    const occupied = board.getOccupiedCells();

    if (occupied.length === 0) {
      return OPENING_POINTS.filter(({ x, y }) => board.isEmpty(x, y));
    }

    const clusterCenter = getClusterCenter(occupied);
    const candidates = new Map();

    // 只在已有棋群周围 1~2 格内扩展候选区，避免 20×20 全盘扫描带来无效计算。
    occupied.forEach(({ x, y }) => {
      for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
        for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
          const targetX = x + offsetX;
          const targetY = y + offsetY;
          const key = `${targetX}:${targetY}`;

          if (!board.isInside(targetX, targetY) || !board.isEmpty(targetX, targetY)) {
            continue;
          }

          const score =
            Math.abs(offsetX) +
            Math.abs(offsetY) +
            rankCandidate({ x: targetX, y: targetY }, clusterCenter);

          const previous = candidates.get(key);
          if (!previous || score < previous.score) {
            candidates.set(key, { x: targetX, y: targetY, score });
          }
        }
      }
    });

    return [...candidates.values()]
      .sort((left, right) => {
        if (left.score !== right.score) {
          return left.score - right.score;
        }
        if (left.y !== right.y) {
          return left.y - right.y;
        }
        return left.x - right.x;
      })
      .slice(0, maxCandidates)
      .map(({ x, y }) => ({ x, y }));
  }
}
