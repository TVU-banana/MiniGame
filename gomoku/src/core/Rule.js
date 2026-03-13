const DIRECTIONS = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1]
];

export class Rule {
  static checkWin(board, x, y, player) {
    for (const [dx, dy] of DIRECTIONS) {
      const line = [{ x, y }];
      line.push(...Rule.collect(board, x, y, dx, dy, player));
      line.unshift(...Rule.collect(board, x, y, -dx, -dy, player));

      if (line.length >= 5) {
        return {
          winner: player,
          winningLine: line.slice(0, 5)
        };
      }
    }
    return null;
  }

  static collect(board, x, y, dx, dy, player) {
    const stones = [];
    let cx = x + dx;
    let cy = y + dy;
    while (board.getCell(cx, cy) === player) {
      stones.push({ x: cx, y: cy });
      cx += dx;
      cy += dy;
    }
    return stones;
  }

  static checkDraw(board) {
    return board.isFull();
  }
}
