import type { LevelDimensions, LevelId } from './BlockModel';

export type LevelShape = 'cube' | 'sphere' | 'heart' | 'diamond';
export type LevelPlayStyle = 'balanced' | 'vertical' | 'layered' | 'radial';

export interface LevelSpec {
  dimensions: LevelDimensions;
  challengeTimeMs: number;
  shape: LevelShape;
  playStyle: LevelPlayStyle;
  targetBlocks: number;
  occupiedCells: number;
}

export const LEVEL_SPECS: Record<LevelId, LevelSpec> = {
  1: {
    dimensions: { sizeX: 3, sizeY: 4, sizeZ: 4 },
    challengeTimeMs: 60_000,
    shape: 'cube',
    playStyle: 'balanced',
    targetBlocks: 16,
    occupiedCells: 20,
  },
  2: {
    dimensions: { sizeX: 4, sizeY: 4, sizeZ: 4 },
    challengeTimeMs: 90_000,
    shape: 'sphere',
    playStyle: 'radial',
    targetBlocks: 24,
    occupiedCells: 32,
  },
  3: {
    dimensions: { sizeX: 5, sizeY: 5, sizeZ: 4 },
    challengeTimeMs: 135_000,
    shape: 'heart',
    playStyle: 'vertical',
    targetBlocks: 36,
    occupiedCells: 48,
  },
  4: {
    dimensions: { sizeX: 6, sizeY: 6, sizeZ: 4 },
    challengeTimeMs: 210_000,
    shape: 'diamond',
    playStyle: 'layered',
    targetBlocks: 54,
    occupiedCells: 72,
  },
  5: {
    dimensions: { sizeX: 6, sizeY: 7, sizeZ: 5 },
    challengeTimeMs: 315_000,
    shape: 'sphere',
    playStyle: 'radial',
    targetBlocks: 81,
    occupiedCells: 108,
  },
  6: {
    dimensions: { sizeX: 7, sizeY: 8, sizeZ: 6 },
    challengeTimeMs: 480_000,
    shape: 'heart',
    playStyle: 'vertical',
    targetBlocks: 122,
    occupiedCells: 162,
  },
};

export const LEVEL_CONFIG: Record<LevelId, LevelDimensions> = {
  1: LEVEL_SPECS[1].dimensions,
  2: LEVEL_SPECS[2].dimensions,
  3: LEVEL_SPECS[3].dimensions,
  4: LEVEL_SPECS[4].dimensions,
  5: LEVEL_SPECS[5].dimensions,
  6: LEVEL_SPECS[6].dimensions,
};

export const CHALLENGE_TIME_LIMITS: Record<LevelId, number> = {
  1: LEVEL_SPECS[1].challengeTimeMs,
  2: LEVEL_SPECS[2].challengeTimeMs,
  3: LEVEL_SPECS[3].challengeTimeMs,
  4: LEVEL_SPECS[4].challengeTimeMs,
  5: LEVEL_SPECS[5].challengeTimeMs,
  6: LEVEL_SPECS[6].challengeTimeMs,
};

export const LEVEL_IDS: LevelId[] = [1, 2, 3, 4, 5, 6];

export function getNextLevel(levelId: LevelId): LevelId | null {
  const index = LEVEL_IDS.indexOf(levelId);
  if (index === -1 || index === LEVEL_IDS.length - 1) {
    return null;
  }
  return LEVEL_IDS[index + 1];
}
