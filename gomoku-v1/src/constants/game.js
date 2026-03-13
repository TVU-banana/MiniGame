export const BOARD_SIZE = 20;
export const WIN_LENGTH = 5;

export const EMPTY = 0;
export const BLACK = 1;
export const WHITE = 2;

export const GAME_STATES = {
  MENU: "MENU",
  PLAYING: "PLAYING",
  GAME_OVER: "GAME_OVER",
};

export const GAME_MODES = {
  PVP: "PVP",
  PVE: "PVE",
};

export const MODE_LABELS = {
  [GAME_MODES.PVP]: "玩家对玩家",
  [GAME_MODES.PVE]: "玩家对机器",
};

export const PLAYER_LABELS = {
  [BLACK]: "黑子",
  [WHITE]: "白子",
};

export const SCENE_LABELS = {
  menu: "菜单曲",
  game: "对局曲",
};

export const HUMAN_PLAYER = BLACK;
export const AI_PLAYER = WHITE;

export const THINK_DELAY_MIN = 250;
export const THINK_DELAY_MAX = 500;

export const OPENING_POINTS = [
  { x: 9, y: 9 },
  { x: 10, y: 9 },
  { x: 9, y: 10 },
  { x: 10, y: 10 },
];

export const DIRECTIONS = [
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: 1, dy: 1 },
  { dx: 1, dy: -1 },
];
