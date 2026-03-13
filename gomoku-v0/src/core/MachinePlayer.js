import { Rule } from "./Rule";

const DIFFICULTY = {
  BEGINNER: "BEGINNER",
  ADVANCED: "ADVANCED",
  EXPERT: "EXPERT"
};

const DIRECTIONS = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1]
];

export class MachinePlayer {
  constructor(machineStone = 2, humanStone = 1, difficulty = DIFFICULTY.BEGINNER) {
    this.machineStone = machineStone;
    this.humanStone = humanStone;
    this.difficulty = difficulty;
  }

  setDifficulty(difficulty) {
    this.difficulty = difficulty;
  }

  getMove(board) {
    if (this.difficulty === DIFFICULTY.BEGINNER) {
      return this.getBeginnerMove(board);
    }

    if (this.difficulty === DIFFICULTY.ADVANCED) {
      return this.getAdvancedMove(board);
    }

    return this.getExpertMove(board);
  }

  getBeginnerMove(board) {
    const immediateWin = this.findCriticalMove(board, this.machineStone);
    if (immediateWin) {
      return immediateWin;
    }

    const candidates = this.getCandidateMoves(board, 18);
    return this.pickBest(candidates, (move) => this.selfProgressScore(board, move, this.machineStone));
  }

  getAdvancedMove(board) {
    const immediateBlock = this.findCriticalMove(board, this.humanStone);
    if (immediateBlock) {
      return immediateBlock;
    }

    const candidates = this.getCandidateMoves(board, 18);
    return this.pickBest(candidates, (move) => this.blockOnlyScore(board, move));
  }

  getExpertMove(board) {
    const immediateWin = this.findCriticalMove(board, this.machineStone);
    if (immediateWin) {
      return immediateWin;
    }

    const immediateBlock = this.findCriticalMove(board, this.humanStone);
    if (immediateBlock) {
      return immediateBlock;
    }

    const candidates = this.getCandidateMoves(board, 14);
    return this.pickBest(candidates, (move) => {
      const attack = this.selfProgressScore(board, move, this.machineStone) * 1.15;
      const defense = this.blockOnlyScore(board, move);
      return attack + defense;
    });
  }

  findCriticalMove(board, targetStone) {
    for (const move of this.getCandidateMoves(board, 32, true)) {
      const virtualBoard = this.createVirtualBoard(board, move, targetStone);
      if (Rule.checkWin(virtualBoard, move.x, move.y, targetStone)) {
        return move;
      }
    }
    return null;
  }

  getCandidateMoves(board, limit = 12, includeAllWhenSparse = false) {
    const available = board.getAvailableMoves();
    if (available.length === 0) {
      return [];
    }

    if (board.moveHistory.length === 0) {
      const center = Math.floor(board.size / 2);
      return [{ x: center, y: center }];
    }

    const candidates = available
      .filter((move) => includeAllWhenSparse || this.hasNeighbor(board, move.x, move.y, 2))
      .map((move) => ({ ...move, center: this.centerScore(board, move.x, move.y) }))
      .sort((a, b) => b.center - a.center);

    return (candidates.length ? candidates : available.map((move) => ({ ...move, center: 0 }))).slice(0, limit);
  }

  selfProgressScore(board, move, player) {
    const line = this.linePotential(board, move.x, move.y, player);
    const ownNeighbors = this.neighborScore(board, move.x, move.y, player);
    return line * 12 + ownNeighbors * 2 + this.centerScore(board, move.x, move.y);
  }

  blockOnlyScore(board, move) {
    const line = this.linePotential(board, move.x, move.y, this.humanStone);
    const humanNeighbors = this.neighborScore(board, move.x, move.y, this.humanStone);
    return line * 16 + humanNeighbors * 3 + this.centerScore(board, move.x, move.y);
  }

  linePotential(board, x, y, player) {
    let best = 0;
    for (const [dx, dy] of DIRECTIONS) {
      let count = 1;
      count += this.countDirection(board, x, y, dx, dy, player);
      count += this.countDirection(board, x, y, -dx, -dy, player);
      best = Math.max(best, count);
    }
    return best;
  }

  countDirection(board, x, y, dx, dy, player) {
    let count = 0;
    let cx = x + dx;
    let cy = y + dy;
    while (board.getCell(cx, cy) === player) {
      count += 1;
      cx += dx;
      cy += dy;
    }
    return count;
  }

  neighborScore(board, x, y, player) {
    let score = 0;
    for (let dy = -2; dy <= 2; dy += 1) {
      for (let dx = -2; dx <= 2; dx += 1) {
        if (dx === 0 && dy === 0) {
          continue;
        }
        const stone = board.getCell(x + dx, y + dy);
        if (stone === player) {
          score += 6 - Math.abs(dx) - Math.abs(dy);
        }
      }
    }
    return score;
  }

  centerScore(board, x, y) {
    const center = Math.floor(board.size / 2);
    return 4 - (Math.abs(x - center) + Math.abs(y - center)) * 0.2;
  }

  hasNeighbor(board, x, y, distance = 1) {
    for (let dy = -distance; dy <= distance; dy += 1) {
      for (let dx = -distance; dx <= distance; dx += 1) {
        if (dx === 0 && dy === 0) {
          continue;
        }
        if (board.getCell(x + dx, y + dy)) {
          return true;
        }
      }
    }
    return false;
  }

  createVirtualBoard(board, move, player) {
    const draft = board.cloneCells();
    draft[move.y][move.x] = player;
    return {
      size: board.size,
      moveHistory: [...board.moveHistory, { ...move, player }],
      cloneCells: () => draft.map((row) => [...row]),
      getCell: (x, y) => (x >= 0 && x < board.size && y >= 0 && y < board.size ? draft[y][x] : null),
      getAvailableMoves: () => {
        const moves = [];
        for (let y = 0; y < board.size; y += 1) {
          for (let x = 0; x < board.size; x += 1) {
            if (draft[y][x] === 0) {
              moves.push({ x, y });
            }
          }
        }
        return moves;
      },
      isFull: () => draft.every((row) => row.every((cell) => cell !== 0))
    };
  }

  pickBest(moves, scorer) {
    if (!moves.length) {
      return null;
    }

    let bestMove = moves[0];
    let bestScore = -Infinity;
    for (const move of moves) {
      const score = scorer(move);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    return bestMove;
  }
}

export { DIFFICULTY };
