import type { AxisDirection, BlockData, LevelDimensions } from './BlockModel';
import { randomItem, shuffle } from '../utils/random';
import { MoveValidator } from './MoveValidator';

const ALL_DIRECTIONS: AxisDirection[] = ['+X', '-X', '+Y', '-Y', '+Z', '-Z'];

export class DirectionAssigner {
  constructor(private readonly moveValidator: MoveValidator) {}

  assignDirections(blocks: BlockData[], dimensions: LevelDimensions): BlockData[] {
    let bestBlocks = blocks.map((block) => ({ ...block, direction: randomItem(ALL_DIRECTIONS) }));
    let bestScore = this.moveValidator.countRemovableBlocks(bestBlocks, dimensions);
    const attemptLimit = this.getAttemptLimit(blocks.length);

    for (let attempt = 0; attempt < attemptLimit; attempt += 1) {
      const next = blocks.map((block) => ({ ...block, direction: randomItem(ALL_DIRECTIONS) }));
      const removableCount = this.moveValidator.countRemovableBlocks(next, dimensions);
      if (removableCount >= 3) {
        return next;
      }
      if (removableCount > bestScore) {
        bestScore = removableCount;
        bestBlocks = next;
      }
    }

    return this.forcePlayable(bestBlocks, dimensions);
  }

  reverseDirection(direction: AxisDirection): AxisDirection {
    switch (direction) {
      case '+X':
        return '-X';
      case '-X':
        return '+X';
      case '+Y':
        return '-Y';
      case '-Y':
        return '+Y';
      case '+Z':
        return '-Z';
      case '-Z':
        return '+Z';
    }
  }

  private forcePlayable(blocks: BlockData[], dimensions: LevelDimensions): BlockData[] {
    const next = blocks.map((block) => ({ ...block }));
    const candidateIds = shuffle(
      next
        .map((block) => ({ block, outward: this.getOutwardDirections(block, dimensions) }))
        .filter((entry) => entry.outward.length > 0),
    );

    let adjusted = 0;
    for (const entry of candidateIds) {
      if (adjusted >= 3) {
        break;
      }
      entry.block.direction = entry.outward[0];
      adjusted += 1;
    }

    return next;
  }

  private getAttemptLimit(blockCount: number): number {
    if (blockCount >= 120) {
      return 16;
    }
    if (blockCount >= 80) {
      return 24;
    }
    if (blockCount >= 54) {
      return 32;
    }
    return 48;
  }

  private getOutwardDirections(block: BlockData, dimensions: LevelDimensions): AxisDirection[] {
    const output: AxisDirection[] = [];
    if (block.x === 0) {
      output.push('-X');
    }
    if (block.x + block.sizeX === dimensions.sizeX) {
      output.push('+X');
    }
    if (block.y === 0) {
      output.push('-Y');
    }
    if (block.y + block.sizeY === dimensions.sizeY) {
      output.push('+Y');
    }
    if (block.z === 0) {
      output.push('-Z');
    }
    if (block.z + block.sizeZ === dimensions.sizeZ) {
      output.push('+Z');
    }
    return output;
  }
}
