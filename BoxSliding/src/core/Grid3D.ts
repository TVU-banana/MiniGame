import type { BlockData, LevelDimensions } from './BlockModel';

export class Grid3D {
  readonly dimensions: LevelDimensions;

  private readonly cells: Array<string | null>;

  constructor(dimensions: LevelDimensions) {
    this.dimensions = dimensions;
    this.cells = new Array(dimensions.sizeX * dimensions.sizeY * dimensions.sizeZ).fill(null);
  }

  static fromBlocks(dimensions: LevelDimensions, blocks: BlockData[]): Grid3D {
    const grid = new Grid3D(dimensions);
    for (const block of blocks) {
      if (!block.removed) {
        grid.fillBlock(block, block.id);
      }
    }
    return grid;
  }

  index(x: number, y: number, z: number): number {
    return x + this.dimensions.sizeX * (z + this.dimensions.sizeZ * y);
  }

  inBounds(x: number, y: number, z: number): boolean {
    return (
      x >= 0 &&
      y >= 0 &&
      z >= 0 &&
      x < this.dimensions.sizeX &&
      y < this.dimensions.sizeY &&
      z < this.dimensions.sizeZ
    );
  }

  get(x: number, y: number, z: number): string | null {
    if (!this.inBounds(x, y, z)) {
      return null;
    }
    return this.cells[this.index(x, y, z)];
  }

  set(x: number, y: number, z: number, value: string | null): void {
    if (!this.inBounds(x, y, z)) {
      return;
    }
    this.cells[this.index(x, y, z)] = value;
  }

  canPlace(x: number, y: number, z: number, sizeX: number, sizeY: number, sizeZ: number): boolean {
    for (let offsetX = 0; offsetX < sizeX; offsetX += 1) {
      for (let offsetY = 0; offsetY < sizeY; offsetY += 1) {
        for (let offsetZ = 0; offsetZ < sizeZ; offsetZ += 1) {
          const nextX = x + offsetX;
          const nextY = y + offsetY;
          const nextZ = z + offsetZ;
          if (!this.inBounds(nextX, nextY, nextZ) || this.get(nextX, nextY, nextZ) !== null) {
            return false;
          }
        }
      }
    }
    return true;
  }

  fillBlock(block: Pick<BlockData, 'id' | 'x' | 'y' | 'z' | 'sizeX' | 'sizeY' | 'sizeZ'>, value: string | null): void {
    for (let offsetX = 0; offsetX < block.sizeX; offsetX += 1) {
      for (let offsetY = 0; offsetY < block.sizeY; offsetY += 1) {
        for (let offsetZ = 0; offsetZ < block.sizeZ; offsetZ += 1) {
          this.set(block.x + offsetX, block.y + offsetY, block.z + offsetZ, value);
        }
      }
    }
  }

  firstEmptyCell(): { x: number; y: number; z: number } | null {
    for (let y = 0; y < this.dimensions.sizeY; y += 1) {
      for (let z = 0; z < this.dimensions.sizeZ; z += 1) {
        for (let x = 0; x < this.dimensions.sizeX; x += 1) {
          if (this.get(x, y, z) === null) {
            return { x, y, z };
          }
        }
      }
    }
    return null;
  }

  emptyCells(): Array<{ x: number; y: number; z: number }> {
    const output: Array<{ x: number; y: number; z: number }> = [];
    for (let y = 0; y < this.dimensions.sizeY; y += 1) {
      for (let z = 0; z < this.dimensions.sizeZ; z += 1) {
        for (let x = 0; x < this.dimensions.sizeX; x += 1) {
          if (this.get(x, y, z) === null) {
            output.push({ x, y, z });
          }
        }
      }
    }
    return output;
  }
}
