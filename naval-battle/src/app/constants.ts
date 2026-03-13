export const APP_TITLE = "土豆海战棋";
export const BOARD_SIZE = 10;
export const DEFAULT_VOLUME = 70;

export const SCREENS = {
  MAIN_MENU: "MAIN_MENU",
  DIFFICULTY_SELECT: "DIFFICULTY_SELECT",
  DEPLOY: "DEPLOY",
  BATTLE: "BATTLE",
  RESULT: "RESULT",
} as const;

export const DIFFICULTIES = {
  easy: {
    key: "easy",
    label: "简单",
    shortLabel: "简单机器人",
    description: "随机攻击尚未攻击过的格子，节奏平缓，适合第一次上手。",
  },
  hard: {
    key: "hard",
    label: "困难",
    shortLabel: "困难机器人",
    description: "按权重随机攻击，玩家舰船格权重为 2，其余格子为 1，更容易命中。",
  },
} as const;

export const SHIP_TEMPLATES = [
  {
    id: "large",
    name: "主力舰",
    length: 4,
    accent: "#fee29d",
  },
  {
    id: "medium",
    name: "巡航舰",
    length: 3,
    accent: "#f7cedb",
  },
  {
    id: "small",
    name: "侦察艇",
    length: 2,
    accent: "#d8effc",
  },
] as const;

export const STORAGE_KEYS = {
  stats: "potato-sea-battle-stats",
} as const;

export const STATUS_TEXT = {
  playerTurn: "轮到你攻击敌方海域",
  robotTurn: "机器人正在反击",
  playerKeep: "命中目标，可继续攻击",
  deployHint: "拖动舰船到棋盘，轻触舰船可旋转方向",
  invalidDeploy: "请先将三艘舰船全部合法放置",
  attacked: "该格已攻击",
  playerWin: "敌方舰队全灭，你赢了",
  robotWin: "你的舰队被全部击沉",
} as const;
