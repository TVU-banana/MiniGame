import type { BlockData, LevelDimensions } from './BlockModel';
import { shuffle } from '../utils/random';
import { Grid3D } from './Grid3D';

interface ShapeVariant {
  sizeX: number;
  sizeY: number;
  sizeZ: number;
}

const SHAPE_VARIANTS: ShapeVariant[] = uniqueVariants([
  { sizeX: 1, sizeY: 1, sizeZ: 1 },
  { sizeX: 1, sizeY: 2, sizeZ: 1 },
  { sizeX: 1, sizeY: 2, sizeZ: 2 },
]);

function uniqueVariants(base: ShapeVariant[]): ShapeVariant[] {
  const seen = new Set<string>();
  const output: ShapeVariant[] = [];
  for (const shape of base) {
    const permutations: ShapeVariant[] = [
      { sizeX: shape.sizeX, sizeY: shape.sizeY, sizeZ: shape.sizeZ },
      { sizeX: shape.sizeX, sizeY: shape.sizeZ, sizeZ: shape.sizeY },
      { sizeX: shape.sizeY, sizeY: shape.sizeX, sizeZ: shape.sizeZ },
      { sizeX: shape.sizeY, sizeY: shape.sizeZ, sizeZ: shape.sizeX },
      { sizeX: shape.sizeZ, sizeY: shape.sizeX, sizeZ: shape.sizeY },
      { sizeX: shape.sizeZ, sizeY: shape.sizeY, sizeZ: shape.sizeX },
    ];

    for (const variant of permutations) {
      const key = `${variant.sizeX}-${variant.sizeY}-${variant.sizeZ}`;
      if (!seen.has(key)) {
        seen.add(key);
        output.push(variant);
      }
    }
  }
  return output;
}

export class LevelGenerator {
  generate(dimensions: LevelDimensions): BlockData[] {
    const grid = new Grid3D(dimensions);
    const blocks: BlockData[] = [];
    let idCounter = 0;
    let attempts = 0;

    const fill = (): boolean => {
      attempts += 1;
      if (attempts > 100) {
        return false;
      }

      const nextCell = grid.firstEmptyCell();
      if (!nextCell) {
        return true;
      }

      const candidates = shuffle(SHAPE_VARIANTS);
      for (const candidate of candidates) {
        if (
          !grid.canPlace(
            nextCell.x,
            nextCell.y,
            nextCell.z,
            candidate.sizeX,
            candidate.sizeY,
            candidate.sizeZ,
          )
        ) {
          continue;
        }

        const block: BlockData = {
          id: `block-${idCounter += 1}`,
          x: nextCell.x,
          y: nextCell.y,
          z: nextCell.z,
          sizeX: candidate.sizeX,
          sizeY: candidate.sizeY,
          sizeZ: candidate.sizeZ,
          direction: '+X',
          removed: false,
        };

        grid.fillBlock(block, block.id);
        blocks.push(block);

        if (fill()) {
          return true;
        }

        blocks.pop();
        grid.fillBlock(block, null);
      }

      return false;
    };

    if (!fill()) {
      return this.fillWithSingles(dimensions);
    }

    const holes = grid.emptyCells();
    if (holes.length > 0) {
      for (const hole of holes) {
        blocks.push({
          id: `block-${idCounter += 1}`,
          x: hole.x,
          y: hole.y,
          z: hole.z,
          sizeX: 1,
          sizeY: 1,
          sizeZ: 1,
          direction: '+X',
          removed: false,
        });
      }
    }

    return blocks;
  }

  private fillWithSingles(dimensions: LevelDimensions): BlockData[] {
    const blocks: BlockData[] = [];
    let idCounter = 0;
    for (let y = 0; y < dimensions.sizeY; y += 1) {
      for (let z = 0; z < dimensions.sizeZ; z += 1) {
        for (let x = 0; x < dimensions.sizeX; x += 1) {
          blocks.push({
            id: `block-${idCounter += 1}`,
            x,
            y,
            z,
            sizeX: 1,
            sizeY: 1,
            sizeZ: 1,
            direction: '+X',
            removed: false,
          });
        }
      }
    }
    return blocks;
  }
}
