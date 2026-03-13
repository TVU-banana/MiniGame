import { BOARD_SIZE } from "../app/constants";

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function snapToCell(
  clientX: number,
  clientY: number,
  rect: DOMRect,
) {
  const cellSize = rect.width / BOARD_SIZE;
  const x = clamp(Math.floor((clientX - rect.left) / cellSize), 0, BOARD_SIZE - 1);
  const y = clamp(Math.floor((clientY - rect.top) / cellSize), 0, BOARD_SIZE - 1);

  return {
    x,
    y,
  };
}
