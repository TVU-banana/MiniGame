export type TetrominoType = "I" | "O" | "T" | "L" | "J" | "S" | "Z";

export type GlobalGameState =
  | "BOOT"
  | "MENU"
  | "PLAYING"
  | "PAUSED"
  | "RESULT"
  | "SETTINGS"
  | "HISTORY";

export type PlaySubState =
  | "SPAWNING"
  | "ACTIVE_FALLING"
  | "LOCK_DELAY"
  | "LINE_CLEARING"
  | "GAME_OVER";

export interface Cell {
  x: number;
  y: number;
}

export interface ActivePiece {
  type: TetrominoType;
  rotation: number;
  x: number;
  y: number;
}

export interface GameRecord {
  score: number;
  durationSeconds: number;
  dateKey: string; // YY-MM-DD-HH
}

export interface GameStats {
  score: number;
  durationSeconds: number;
  linesCleared: number;
}

export interface HudPayload {
  score: number;
  durationSeconds: number;
  linesCleared: number;
}

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

export const INITIAL_FALL_SPEED = 1;
export const SPEED_INCREASE_INTERVAL_SECONDS = 20;
export const SPEED_INCREASE_STEP = 0.1;
export const MAX_BASE_FALL_SPEED = 2;
export const SOFT_DROP_MULTIPLIER = 3;

export const LOCK_DELAY_MS = 300;
export const LOCK_SCORE_PER_CELL = 1;
export const LINE_CLEAR_SCORE_PER_LINE = 10;
export const HISTORY_MAX_RECORDS = 10;

export const CANVAS_WIDTH = 360;
export const CANVAS_HEIGHT = 640;

export const BOARD_CELL_SIZE = 24;
export const BOARD_PIXEL_WIDTH = BOARD_WIDTH * BOARD_CELL_SIZE;
export const BOARD_PIXEL_HEIGHT = BOARD_HEIGHT * BOARD_CELL_SIZE;
export const BOARD_OFFSET_X = Math.floor((CANVAS_WIDTH - BOARD_PIXEL_WIDTH) / 2);
export const BOARD_OFFSET_Y = 96;

export const HOLD_MOVE_INITIAL_DELAY_MS = 120;
export const HOLD_MOVE_REPEAT_MS = 70;

export const SPAWN_X = 3;
export const SPAWN_Y = -2;

export const TETROMINO_COLORS: Record<TetrominoType, string> = {
  I: "#22d3ee",
  O: "#facc15",
  T: "#a855f7",
  L: "#f97316",
  J: "#3b82f6",
  S: "#22c55e",
  Z: "#ef4444"
};

export const SCENE_BACKGROUND_COLOR = 0x0b1221;
