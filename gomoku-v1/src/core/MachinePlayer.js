import { AI_PLAYER, HUMAN_PLAYER, OPENING_POINTS } from "../constants/game.js";
import { DEFAULT_DIFFICULTY, DIFFICULTIES } from "../constants/difficulty.js";
import CandidateGenerator from "./CandidateGenerator.js";
import PatternEvaluator from "./PatternEvaluator.js";

function getCenterDistance(x, y) {
  return Math.hypot(x - 9.5, y - 9.5);
}

function compareStable(left, right) {
  const centerDelta = getCenterDistance(left.x, left.y) - getCenterDistance(right.x, right.y);
  if (centerDelta !== 0) {
    return centerDelta;
  }
  if (left.y !== right.y) {
    return left.y - right.y;
  }
  return left.x - right.x;
}

function getOpeningMove(board) {
  return OPENING_POINTS.filter(({ x, y }) => board.isEmpty(x, y)).sort(compareStable)[0] ?? {
    x: 9,
    y: 9,
  };
}

function buildEvaluation(board, candidate, aiPlayer, humanPlayer) {
  const attack = PatternEvaluator.evaluatePoint(board, candidate.x, candidate.y, aiPlayer);
  const defense = PatternEvaluator.evaluatePoint(board, candidate.x, candidate.y, humanPlayer);

  return {
    x: candidate.x,
    y: candidate.y,
    attack,
    defense,
    centerDistance: getCenterDistance(candidate.x, candidate.y),
  };
}

function getExpertPriority(entry) {
  if (entry.attack.immediateWin) {
    return 100;
  }
  if (entry.defense.immediateWin) {
    return 95;
  }
  if (entry.attack.winningExtensions >= 2 || entry.attack.counts.LIVE_FOUR >= 1) {
    return 88;
  }
  if (entry.defense.winningExtensions >= 2 || entry.defense.counts.LIVE_FOUR >= 1) {
    return 84;
  }
  if (entry.attack.counts.RUSH_FOUR >= 1 && entry.attack.counts.LIVE_THREE >= 1) {
    return 80;
  }
  if (entry.attack.dualThreat && entry.defense.score > 16000) {
    return 76;
  }
  if (entry.attack.counts.LIVE_THREE >= 1 || entry.attack.counts.LIVE_TWO >= 2) {
    return 70;
  }
  return 60;
}

function getLookaheadBonus(board, entry, aiPlayer) {
  const simulatedBoard = board.placeStone(entry.x, entry.y, aiPlayer);
  if (!simulatedBoard) {
    return 0;
  }

  const nextCandidates = CandidateGenerator.generate(simulatedBoard, {
    radius: 2,
    maxCandidates: 18,
  });

  let bestFollowUp = 0;

  nextCandidates.forEach(({ x, y }) => {
    const preview = PatternEvaluator.evaluatePoint(simulatedBoard, x, y, aiPlayer);
    if (preview) {
      bestFollowUp = Math.max(bestFollowUp, preview.score);
    }
  });

  return bestFollowUp * 0.08;
}

function chooseHighest(entries, selector) {
  return [...entries].sort((left, right) => {
    const diff = selector(right) - selector(left);
    if (diff !== 0) {
      return diff;
    }
    return compareStable(left, right);
  })[0];
}

export default class MachinePlayer {
  chooseMove(board, difficultyKey = DEFAULT_DIFFICULTY, aiPlayer = AI_PLAYER, humanPlayer = HUMAN_PLAYER) {
    const difficulty = DIFFICULTIES[difficultyKey] ?? DIFFICULTIES[DEFAULT_DIFFICULTY];
    const candidates = CandidateGenerator.generate(board, {
      radius: difficulty.candidateRadius,
      maxCandidates: difficulty.maxCandidates,
    });

    if (board.moveHistory.length === 0) {
      return getOpeningMove(board);
    }

    const entries = candidates
      .map((candidate) => buildEvaluation(board, candidate, aiPlayer, humanPlayer))
      .filter((entry) => entry.attack && entry.defense);

    const winningMove = entries.find((entry) => entry.attack.immediateWin);
    if (winningMove) {
      return { x: winningMove.x, y: winningMove.y };
    }

    if (difficulty.key !== "beginner") {
      const forcedBlock = entries.find((entry) => entry.defense.immediateWin);
      if (forcedBlock) {
        return { x: forcedBlock.x, y: forcedBlock.y };
      }
    }

    if (difficulty.key === "beginner") {
      const selected = chooseHighest(
        entries,
        (entry) =>
          entry.attack.score * difficulty.attackWeight +
          entry.defense.score * difficulty.defenseWeight +
          (12 - entry.centerDistance) * difficulty.centerWeight,
      );

      return { x: selected.x, y: selected.y };
    }

    if (difficulty.key === "normal") {
      const selected = chooseHighest(
        entries,
        (entry) => {
          let score =
            entry.attack.score * difficulty.attackWeight +
            entry.defense.score * difficulty.defenseWeight +
            Math.min(entry.attack.score, entry.defense.score) * difficulty.dualWeight +
            (12 - entry.centerDistance) * difficulty.centerWeight;

          if (entry.defense.counts.LIVE_FOUR >= 1 || entry.defense.winningExtensions >= 1) {
            score += 180000;
          }

          if (entry.defense.counts.LIVE_THREE >= 1) {
            score += 28000;
          }

          return score;
        },
      );

      return { x: selected.x, y: selected.y };
    }

    // 专家模式先过优先级，再叠加多维分数，避免把紧急防守交给普通总分碰运气。
    const selected = chooseHighest(entries, (entry) => {
      const priority = getExpertPriority(entry);
      const lookaheadBonus = difficulty.lookahead ? getLookaheadBonus(board, entry, aiPlayer) : 0;

      return (
        priority * 100000 +
        entry.attack.score * difficulty.attackWeight +
        entry.defense.score * difficulty.defenseWeight +
        Math.min(entry.attack.score, entry.defense.score) * difficulty.dualWeight +
        lookaheadBonus +
        (12 - entry.centerDistance) * difficulty.centerWeight
      );
    });

    return { x: selected.x, y: selected.y };
  }
}
