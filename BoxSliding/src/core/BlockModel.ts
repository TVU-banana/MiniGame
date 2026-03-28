export type AxisDirection = '+X' | '-X' | '+Y' | '-Y' | '+Z' | '-Z';

export type LevelId = 1 | 2 | 3 | 4 | 5 | 6;

export type GameMode = 'endless' | 'challenge';

export interface BlockData {
  id: string;
  sizeX: number;
  sizeY: number;
  sizeZ: number;
  x: number;
  y: number;
  z: number;
  direction: AxisDirection;
  removed: boolean;
}

export interface LevelDimensions {
  sizeX: number;
  sizeY: number;
  sizeZ: number;
}

export interface RunRecord {
  id: string;
  level: LevelId;
  mode: GameMode;
  startedAt: string;
  finishedAt: string;
  result: 'success' | 'fail';
  elapsedSeconds: number;
  stars: 0 | 1 | 2 | 3;
  earnedCoins: number;
}
