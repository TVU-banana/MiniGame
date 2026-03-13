import { SHIP_TEMPLATES } from "../app/constants";
import type { ShipData } from "../app/gameState";

export function createFleet(): ShipData[] {
  return SHIP_TEMPLATES.map((template) => ({
    id: template.id,
    name: template.name,
    length: template.length,
    x: -1,
    y: -1,
    horizontal: false,
    placed: false,
    sunk: false,
    hitCount: 0,
    accent: template.accent,
  }));
}

export function cloneShips(ships: ShipData[]): ShipData[] {
  return ships.map((ship) => ({ ...ship }));
}

export function findShip(ships: ShipData[], shipId: string) {
  return ships.find((ship) => ship.id === shipId);
}
