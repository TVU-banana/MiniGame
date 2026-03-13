import { DIFFICULTIES, SCREENS } from "./constants";

export type ScreenName = (typeof SCREENS)[keyof typeof SCREENS];
export type DifficultyKey = keyof typeof DIFFICULTIES;

export type CellState = "empty" | "ship" | "miss" | "hit" | "sunk";

export interface CellData {
  x: number;
  y: number;
  state: CellState;
  shipId?: string;
}

export interface ShipData {
  id: string;
  name: string;
  length: number;
  x: number;
  y: number;
  horizontal: boolean;
  placed: boolean;
  sunk: boolean;
  hitCount: number;
  accent: string;
}

export interface DifficultyInfoState {
  open: boolean;
  difficulty: DifficultyKey;
}

export interface SettingsState {
  open: boolean;
}

export interface ResultState {
  open: boolean;
  won: boolean;
}

export interface StatsData {
  totalGames: number;
  totalWins: number;
  totalLosses: number;
  totalPlaySeconds: number;
  easyGames: number;
  hardGames: number;
  easyWins: number;
  easyLosses: number;
  hardWins: number;
  hardLosses: number;
  volume: number;
}

export interface DragState {
  shipId: string;
  pointerId: number;
  offsetX: number;
  offsetY: number;
  startedAtX: number;
  startedAtY: number;
  active: boolean;
}

export interface PreviewPlacement {
  shipId: string;
  x: number;
  y: number;
  horizontal: boolean;
  valid: boolean;
}

export interface AttackFeedback {
  owner: "player" | "robot";
  x: number;
  y: number;
  type: "miss" | "hit" | "sunk";
}

export interface AppGameState {
  screen: ScreenName;
  difficulty: DifficultyKey;
  playerBoard: CellData[][];
  robotBoard: CellData[][];
  playerShips: ShipData[];
  robotShips: ShipData[];
  currentTurn: "player" | "robot";
  statusText: string;
  dragState: DragState | null;
  previewPlacement: PreviewPlacement | null;
  settings: SettingsState;
  result: ResultState;
  difficultyInfo: DifficultyInfoState;
  feedback: AttackFeedback | null;
}
