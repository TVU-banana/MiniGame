import type { GlobalGameState, PlaySubState } from "../app/GameConfig";

export class GameStateMachine {
  private globalState: GlobalGameState = "BOOT";
  private subState: PlaySubState = "SPAWNING";

  getGlobalState(): GlobalGameState {
    return this.globalState;
  }

  getSubState(): PlaySubState {
    return this.subState;
  }

  setGlobalState(next: GlobalGameState): void {
    this.globalState = next;
  }

  setSubState(next: PlaySubState): void {
    this.subState = next;
  }
}
