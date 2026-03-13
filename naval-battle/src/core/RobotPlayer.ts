import type { CellData, DifficultyKey, ShipData } from "../app/gameState";
import { BOARD_SIZE } from "../app/constants";
import { cloneShips, createFleet } from "./ShipModel";
import { canPlaceShip } from "./RuleChecker";
import { createBoard, cloneBoard, setCellState } from "./BoardModel";
import { weightedPick } from "../utils/random";

function randomInt(max: number) {
  return Math.floor(Math.random() * max);
}

function getAttackableCells(board: CellData[][]) {
  const cells: { x: number; y: number; weight: number }[] = [];

  for (let y = 0; y < BOARD_SIZE; y += 1) {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      const cell = board[y][x];
      const attacked = cell.state === "miss" || cell.state === "hit" || cell.state === "sunk";
      if (!attacked) {
        cells.push({
          x,
          y,
          weight: cell.shipId ? 2 : 1,
        });
      }
    }
  }

  return cells;
}

export function createRandomFleet() {
  const board = createBoard();
  const ships = createFleet();

  ships.forEach((ship) => {
    let placed = false;
    while (!placed) {
      const horizontal = Math.random() > 0.5;
      const x = randomInt(BOARD_SIZE);
      const y = randomInt(BOARD_SIZE);

      if (!canPlaceShip(board, ship, x, y, horizontal)) {
        continue;
      }

      ship.x = x;
      ship.y = y;
      ship.horizontal = horizontal;
      ship.placed = true;

      for (let index = 0; index < ship.length; index += 1) {
        const cellX = x + (horizontal ? index : 0);
        const cellY = y + (horizontal ? 0 : index);
        setCellState(board, cellX, cellY, "ship", ship.id);
      }

      placed = true;
    }
  });

  return {
    board: cloneBoard(board),
    ships: cloneShips(ships),
  };
}

export function chooseRobotAttack(board: CellData[][], difficulty: DifficultyKey) {
  const candidates = getAttackableCells(board);

  if (candidates.length === 0) {
    return null;
  }

  if (difficulty === "easy") {
    const index = randomInt(candidates.length);
    return candidates[index];
  }

  return weightedPick(candidates, (candidate) => candidate.weight);
}
