import type { AxisDirection, BlockData, LevelDimensions } from './BlockModel';
import { Grid3D } from './Grid3D';

const DIRECTION_STEP: Record<AxisDirection, { x: number; y: number; z: number }> = {
  '+X': { x: 1, y: 0, z: 0 },
  '-X': { x: -1, y: 0, z: 0 },
  '+Y': { x: 0, y: 1, z: 0 },
  '-Y': { x: 0, y: -1, z: 0 },
  '+Z': { x: 0, y: 0, z: 1 },
  '-Z': { x: 0, y: 0, z: -1 },
};

export interface MoveCheckResult {
  removable: boolean;
  travelUnits: number;
  step: { x: number; y: number; z: number };
}

export class MoveValidator {
  isBlockRemovable(block: BlockData, blocks: BlockData[], dimensions: LevelDimensions): MoveCheckResult {
    const grid = Grid3D.fromBlocks(dimensions, blocks);
    const step = DIRECTION_STEP[block.direction];
    const travelUnits = this.computeTravelUnits(block, dimensions, step);

    for (let offsetX = 0; offsetX < block.sizeX; offsetX += 1) {
      for (let offsetY = 0; offsetY < block.sizeY; offsetY += 1) {
        for (let offsetZ = 0; offsetZ < block.sizeZ; offsetZ += 1) {
          let x = block.x + offsetX + step.x;
          let y = block.y + offsetY + step.y;
          let z = block.z + offsetZ + step.z;

          while (grid.inBounds(x, y, z)) {
            const occupant = grid.get(x, y, z);
            if (occupant !== null && occupant !== block.id) {
              return { removable: false, travelUnits: 0.2, step };
            }
            x += step.x;
            y += step.y;
            z += step.z;
          }
        }
      }
    }

    return { removable: true, travelUnits, step };
  }

  getRemovableBlocks(blocks: BlockData[], dimensions: LevelDimensions): BlockData[] {
    return blocks.filter((block) => !block.removed && this.isBlockRemovable(block, blocks, dimensions).removable);
  }

  countRemovableBlocks(blocks: BlockData[], dimensions: LevelDimensions): number {
    return this.getRemovableBlocks(blocks, dimensions).length;
  }

  isFailureState(
    blocks: BlockData[],
    dimensions: LevelDimensions,
    reverseRemaining: number,
    resetRemaining: number,
  ): boolean {
    return (
      this.countRemovableBlocks(blocks, dimensions) === 0 &&
      reverseRemaining === 0 &&
      resetRemaining === 0
    );
  }

  private computeTravelUnits(
    block: BlockData,
    dimensions: LevelDimensions,
    step: { x: number; y: number; z: number },
  ): number {
    if (step.x > 0) {
      return dimensions.sizeX - (block.x + block.sizeX) + 0.75;
    }
    if (step.x < 0) {
      return block.x + 0.75;
    }
    if (step.y > 0) {
      return dimensions.sizeY - (block.y + block.sizeY) + 0.75;
    }
    if (step.y < 0) {
      return block.y + 0.75;
    }
    if (step.z > 0) {
      return dimensions.sizeZ - (block.z + block.sizeZ) + 0.75;
    }
    return block.z + 0.75;
  }
}

export function directionToVector(direction: AxisDirection): { x: number; y: number; z: number } {
  return DIRECTION_STEP[direction];
}
