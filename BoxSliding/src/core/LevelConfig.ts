import type { LevelDimensions, LevelId } from './BlockModel';

export const LEVEL_CONFIG: Record<LevelId, LevelDimensions> = {
  1: { sizeX: 2, sizeY: 4, sizeZ: 4 },
  2: { sizeX: 4, sizeY: 4, sizeZ: 4 },
  3: { sizeX: 4, sizeY: 8, sizeZ: 4 },
};

export const LEVEL_IDS: LevelId[] = [1, 2, 3];

export function getNextLevel(levelId: LevelId): LevelId | null {
  const index = LEVEL_IDS.indexOf(levelId);
  if (index === -1 || index === LEVEL_IDS.length - 1) {
    return null;
  }
  return LEVEL_IDS[index + 1];
}
