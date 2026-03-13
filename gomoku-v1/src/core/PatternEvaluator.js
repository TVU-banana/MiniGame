import { DIRECTIONS, EMPTY } from "../constants/game.js";
import { getEmptyCellsOnLine, wouldWin } from "./Rule.js";

const CATEGORY_SCORES = {
  FIVE: 2000000,
  LIVE_FOUR: 320000,
  RUSH_FOUR: 90000,
  LIVE_THREE: 22000,
  SLEEP_THREE: 7000,
  LIVE_TWO: 2000,
  SLEEP_TWO: 600,
  ONE: 120,
};

const CATEGORY_ORDER = [
  "FIVE",
  "LIVE_FOUR",
  "RUSH_FOUR",
  "LIVE_THREE",
  "SLEEP_THREE",
  "LIVE_TWO",
  "SLEEP_TWO",
  "ONE",
];

const PATTERN_TABLE = [
  {
    category: "FIVE",
    patterns: [/11111/],
  },
  {
    category: "LIVE_FOUR",
    patterns: [/011110/],
  },
  {
    category: "RUSH_FOUR",
    patterns: [/211110/, /011112/, /011101/, /010111/, /101110/, /11011/, /11101/, /10111/],
  },
  {
    category: "LIVE_THREE",
    patterns: [/01110/, /010110/, /011010/, /0100110/],
  },
  {
    category: "SLEEP_THREE",
    patterns: [/001112/, /211100/, /010112/, /211010/, /011012/, /210110/, /10110/, /01101/, /11010/, /01011/],
  },
  {
    category: "LIVE_TWO",
    patterns: [/00110/, /01100/, /01010/, /010010/],
  },
  {
    category: "SLEEP_TWO",
    patterns: [/001012/, /210100/, /0100102/, /2010010/, /00101/, /10100/, /00110/, /01100/],
  },
];

function buildLine(board, x, y, player, dx, dy, span = 5) {
  let line = "";

  for (let step = -span; step <= span; step += 1) {
    const nx = x + dx * step;
    const ny = y + dy * step;

    if (nx === x && ny === y) {
      line += "1";
      continue;
    }

    if (!board.isInside(nx, ny)) {
      line += "2";
      continue;
    }

    const cell = board.getCell(nx, ny);

    if (cell === EMPTY) {
      line += "0";
    } else if (cell === player) {
      line += "1";
    } else {
      line += "2";
    }
  }

  return line;
}

function classifyLine(line) {
  for (const entry of PATTERN_TABLE) {
    if (entry.patterns.some((pattern) => pattern.test(line))) {
      return entry.category;
    }
  }

  return "ONE";
}

function createEmptyCounts() {
  return CATEGORY_ORDER.reduce((accumulator, key) => {
    accumulator[key] = 0;
    return accumulator;
  }, {});
}

function getWinningExtensions(board, x, y, player) {
  const winningMoves = new Set();

  DIRECTIONS.forEach(({ dx, dy }) => {
    const empties = getEmptyCellsOnLine(board, x, y, dx, dy, 4);

    empties.forEach(({ x: emptyX, y: emptyY }) => {
      if (wouldWin(board, emptyX, emptyY, player)) {
        winningMoves.add(`${emptyX}:${emptyY}`);
      }
    });
  });

  return winningMoves.size;
}

function getCenterBias(x, y) {
  const center = 9.5;
  return Math.max(0, 12 - Math.hypot(x - center, y - center));
}

export default class PatternEvaluator {
  static evaluatePoint(board, x, y, player) {
    if (!board.isInside(x, y) || !board.isEmpty(x, y)) {
      return null;
    }

    const simulatedBoard = board.placeStone(x, y, player);
    const directionCategories = [];
    const counts = createEmptyCounts();
    let score = 0;

    // 棋型识别拆成单方向窗口匹配，便于把“成五 / 活四 / 活三”等优先级稳定编码出来。
    DIRECTIONS.forEach(({ dx, dy }) => {
      const category = classifyLine(buildLine(simulatedBoard, x, y, player, dx, dy));
      directionCategories.push(category);
      counts[category] += 1;
      score += CATEGORY_SCORES[category];
    });

    const immediateWin = directionCategories.includes("FIVE");
    const winningExtensions = getWinningExtensions(simulatedBoard, x, y, player);
    const doubleLiveThree = counts.LIVE_THREE >= 2;
    const dualThreat = winningExtensions >= 2 || counts.LIVE_FOUR >= 1 || doubleLiveThree;

    if (winningExtensions >= 2) {
      score += 260000;
    } else if (winningExtensions === 1) {
      score += 72000;
    }

    if (doubleLiveThree) {
      score += 42000;
    }

    if (counts.LIVE_TWO >= 2) {
      score += 7000;
    }

    score += getCenterBias(x, y) * 120;

    return {
      x,
      y,
      score,
      immediateWin,
      dualThreat,
      winningExtensions,
      categories: directionCategories,
      counts,
      primaryCategory: CATEGORY_ORDER.find((key) => counts[key] > 0) ?? "ONE",
    };
  }
}
