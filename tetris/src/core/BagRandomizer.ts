import type { TetrominoType } from "../app/GameConfig";

const ALL_TYPES: TetrominoType[] = ["I", "O", "T", "L", "J", "S", "Z"];

export class BagRandomizer {
  private bag: TetrominoType[] = [];

  reset(): void {
    this.bag = [];
  }

  next(): TetrominoType {
    if (this.bag.length === 0) {
      this.refillBag();
    }
    const piece = this.bag.shift();
    if (!piece) {
      throw new Error("7-bag 出块失败：bag 为空。");
    }
    return piece;
  }

  private refillBag(): void {
    this.bag = [...ALL_TYPES];
    for (let i = this.bag.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = this.bag[i];
      this.bag[i] = this.bag[j];
      this.bag[j] = temp;
    }
  }
}
