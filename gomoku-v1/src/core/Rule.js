import { BOARD_SIZE, DIRECTIONS, EMPTY, WIN_LENGTH } from "../constants/game.js";

function collectDirection(board, x, y, player, dx, dy) {
  const cells = [];
  let nx = x + dx;
  let ny = y + dy;

  while (board.isInside(nx, ny) && board.getCell(nx, ny) === player) {
    cells.push({ x: nx, y: ny });
    nx += dx;
    ny += dy;
  }

  return cells;
}

function countDirection(board, x, y, player, dx, dy) {
  let count = 0;
  let nx = x + dx;
  let ny = y + dy;

  while (board.isInside(nx, ny) && board.getCell(nx, ny) === player) {
    count += 1;
    nx += dx;
    ny += dy;
  }

  return count;
}

export function wouldWin(board, x, y, player) {
  if (!board.isInside(x, y) || !board.isEmpty(x, y)) {
    return false;
  }

  return DIRECTIONS.some(({ dx, dy }) => {
    const total =
      1 +
      countDirection(board, x, y, player, dx, dy) +
      countDirection(board, x, y, player, -dx, -dy);

    return total >= WIN_LENGTH;
  });
}

export function checkVictory(board, x, y, player) {
  for (const { dx, dy } of DIRECTIONS) {
    const backward = collectDirection(board, x, y, player, -dx, -dy).reverse();
    const forward = collectDirection(board, x, y, player, dx, dy);
    const line = [...backward, { x, y }, ...forward];

    if (line.length >= WIN_LENGTH) {
      return {
        winner: player,
        line: line.slice(0, WIN_LENGTH),
      };
    }
  }

  return {
    winner: EMPTY,
    line: [],
  };
}

export function checkDraw(board) {
  return board.isFull();
}

export function evaluateMove(board, x, y, player) {
  const victory = checkVictory(board, x, y, player);

  if (victory.winner !== EMPTY) {
    return {
      winner: player,
      draw: false,
      line: victory.line,
    };
  }

  return {
    winner: EMPTY,
    draw: checkDraw(board),
    line: [],
  };
}

export function getEmptyCellsOnLine(board, x, y, dx, dy, span = WIN_LENGTH) {
  const cells = [];

  for (let step = -span; step <= span; step += 1) {
    const nx = x + dx * step;
    const ny = y + dy * step;

    if (board.isInside(nx, ny) && board.getCell(nx, ny) === EMPTY) {
      cells.push({ x: nx, y: ny });
    }
  }

  return cells;
}

export function getBoardCoverage(board) {
  return board.moveHistory.length / (BOARD_SIZE * BOARD_SIZE);
}
