import type { CellData, ShipData } from "../app/gameState";
import { getCell, isInsideBoard } from "./BoardModel";

export function getShipCells(ship: ShipData) {
  return Array.from({ length: ship.length }, (_, index) => ({
    x: ship.x + (ship.horizontal ? index : 0),
    y: ship.y + (ship.horizontal ? 0 : index),
  }));
}

export function canPlaceShip(
  board: CellData[][],
  ship: ShipData,
  x: number,
  y: number,
  horizontal: boolean,
  ignoreShipId?: string,
) {
  for (let index = 0; index < ship.length; index += 1) {
    const cellX = x + (horizontal ? index : 0);
    const cellY = y + (horizontal ? 0 : index);

    if (!isInsideBoard(cellX, cellY)) {
      return false;
    }

    const cell = getCell(board, cellX, cellY);
    if (!cell) {
      return false;
    }

    if (cell.shipId && cell.shipId !== ignoreShipId) {
      return false;
    }
  }

  return true;
}

export function areAllShipsPlaced(ships: ShipData[]) {
  return ships.every((ship) => ship.placed);
}

export function areAllShipsSunk(ships: ShipData[]) {
  return ships.every((ship) => ship.sunk);
}
