import type { ActivePiece, Cell, TetrominoType } from "../app/GameConfig";
import { SPAWN_X, SPAWN_Y } from "../app/GameConfig";

const shape = (cells: ReadonlyArray<[number, number]>): Cell[] =>
  cells.map(([x, y]) => ({ x, y }));

const I_STATES = [
  shape([
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 1]
  ]),
  shape([
    [2, 0],
    [2, 1],
    [2, 2],
    [2, 3]
  ]),
  shape([
    [0, 2],
    [1, 2],
    [2, 2],
    [3, 2]
  ]),
  shape([
    [1, 0],
    [1, 1],
    [1, 2],
    [1, 3]
  ])
];

const O_STATES = [
  shape([
    [1, 0],
    [2, 0],
    [1, 1],
    [2, 1]
  ])
];

const T_STATES = [
  shape([
    [1, 0],
    [0, 1],
    [1, 1],
    [2, 1]
  ]),
  shape([
    [1, 0],
    [1, 1],
    [2, 1],
    [1, 2]
  ]),
  shape([
    [0, 1],
    [1, 1],
    [2, 1],
    [1, 2]
  ]),
  shape([
    [1, 0],
    [0, 1],
    [1, 1],
    [1, 2]
  ])
];

const L_STATES = [
  shape([
    [2, 0],
    [0, 1],
    [1, 1],
    [2, 1]
  ]),
  shape([
    [1, 0],
    [1, 1],
    [1, 2],
    [2, 2]
  ]),
  shape([
    [0, 1],
    [1, 1],
    [2, 1],
    [0, 2]
  ]),
  shape([
    [0, 0],
    [1, 0],
    [1, 1],
    [1, 2]
  ])
];

const J_STATES = [
  shape([
    [0, 0],
    [0, 1],
    [1, 1],
    [2, 1]
  ]),
  shape([
    [1, 0],
    [2, 0],
    [1, 1],
    [1, 2]
  ]),
  shape([
    [0, 1],
    [1, 1],
    [2, 1],
    [2, 2]
  ]),
  shape([
    [1, 0],
    [1, 1],
    [0, 2],
    [1, 2]
  ])
];

const S_STATES = [
  shape([
    [1, 0],
    [2, 0],
    [0, 1],
    [1, 1]
  ]),
  shape([
    [1, 0],
    [1, 1],
    [2, 1],
    [2, 2]
  ]),
  shape([
    [1, 1],
    [2, 1],
    [0, 2],
    [1, 2]
  ]),
  shape([
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 2]
  ])
];

const Z_STATES = [
  shape([
    [0, 0],
    [1, 0],
    [1, 1],
    [2, 1]
  ]),
  shape([
    [2, 0],
    [1, 1],
    [2, 1],
    [1, 2]
  ]),
  shape([
    [0, 1],
    [1, 1],
    [1, 2],
    [2, 2]
  ]),
  shape([
    [1, 0],
    [0, 1],
    [1, 1],
    [0, 2]
  ])
];

const TETROMINO_SHAPES: Record<TetrominoType, Cell[][]> = {
  I: I_STATES,
  O: O_STATES,
  T: T_STATES,
  L: L_STATES,
  J: J_STATES,
  S: S_STATES,
  Z: Z_STATES
};

export const getTetrominoCells = (piece: ActivePiece): Cell[] => {
  const states = TETROMINO_SHAPES[piece.type];
  const state = states[piece.rotation % states.length];
  return state.map((offset) => ({
    x: piece.x + offset.x,
    y: piece.y + offset.y
  }));
};

export const rotatePieceClockwise = (piece: ActivePiece): ActivePiece => {
  const stateCount = TETROMINO_SHAPES[piece.type].length;
  return {
    ...piece,
    rotation: (piece.rotation + 1) % stateCount
  };
};

export const movePiece = (piece: ActivePiece, dx: number, dy: number): ActivePiece => ({
  ...piece,
  x: piece.x + dx,
  y: piece.y + dy
});

export const createSpawnPiece = (type: TetrominoType): ActivePiece => ({
  type,
  rotation: 0,
  x: SPAWN_X,
  y: SPAWN_Y
});
