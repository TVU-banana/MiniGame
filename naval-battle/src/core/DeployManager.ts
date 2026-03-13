import type { CellData, ShipData } from "../app/gameState";
import { cloneBoard, setCellState } from "./BoardModel";
import { cloneShips, findShip } from "./ShipModel";
import { canPlaceShip, getShipCells } from "./RuleChecker";

function clearShip(board: CellData[][], shipId: string) {
  board.forEach((row) => {
    row.forEach((cell) => {
      if (cell.shipId === shipId && cell.state === "ship") {
        cell.state = "empty";
        cell.shipId = undefined;
      }
    });
  });
}

function paintShip(board: CellData[][], ship: ShipData) {
  getShipCells(ship).forEach(({ x, y }) => {
    setCellState(board, x, y, "ship", ship.id);
  });
}

export function placeShip(
  board: CellData[][],
  ships: ShipData[],
  shipId: string,
  x: number,
  y: number,
  horizontal: boolean,
) {
  const nextBoard = cloneBoard(board);
  const nextShips = cloneShips(ships);
  const ship = findShip(nextShips, shipId);

  if (!ship) {
    return null;
  }

  clearShip(nextBoard, shipId);

  if (!canPlaceShip(nextBoard, ship, x, y, horizontal, shipId)) {
    return null;
  }

  ship.x = x;
  ship.y = y;
  ship.horizontal = horizontal;
  ship.placed = true;
  paintShip(nextBoard, ship);

  return {
    board: nextBoard,
    ships: nextShips,
  };
}

export function rotateShip(
  board: CellData[][],
  ships: ShipData[],
  shipId: string,
) {
  const ship = findShip(ships, shipId);
  if (!ship) {
    return null;
  }

  if (!ship.placed) {
    const nextShips = cloneShips(ships);
    const target = findShip(nextShips, shipId)!;
    target.horizontal = !target.horizontal;
    return {
      board,
      ships: nextShips,
    };
  }

  return placeShip(board, ships, shipId, ship.x, ship.y, !ship.horizontal);
}
