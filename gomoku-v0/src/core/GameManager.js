import { Board } from "./Board";
import { MachinePlayer } from "./MachinePlayer";
import { Rule } from "./Rule";

export class GameManager {
  constructor({ size = 15 } = {}) {
    this.board = new Board(size);
    this.machinePlayer = new MachinePlayer();
    this.state = {
      phase: "MENU",
      mode: null,
      difficulty: null,
      currentPlayer: 1,
      machineThinking: false,
      result: null
    };
  }

  start(config) {
    const mode = typeof config === "string" ? config : config.mode;
    const difficulty = typeof config === "string" ? null : config.difficulty ?? null;

    this.board.reset();
    this.machinePlayer.setDifficulty(difficulty ?? "BEGINNER");
    this.state = {
      phase: "PLAYING",
      mode,
      difficulty,
      currentPlayer: 1,
      machineThinking: false,
      result: null
    };
  }

  restart() {
    if (!this.state.mode) {
      return;
    }
    this.start({ mode: this.state.mode, difficulty: this.state.difficulty });
  }

  returnToMenu() {
    this.board.reset();
    this.state = {
      phase: "MENU",
      mode: null,
      difficulty: null,
      currentPlayer: 1,
      machineThinking: false,
      result: null
    };
  }

  canPlace(x, y) {
    const isHumanTurn = this.state.mode !== "PVE" || this.state.currentPlayer === 1;
    return this.state.phase === "PLAYING" && isHumanTurn && !this.state.machineThinking && this.board.isEmpty(x, y);
  }

  applyMove(x, y) {
    const player = this.state.currentPlayer;
    const placed = this.board.placeStone(x, y, player);
    if (!placed) {
      return { ok: false };
    }

    const win = Rule.checkWin(this.board, x, y, player);
    if (win) {
      this.state.phase = "GAME_OVER";
      this.state.result = {
        winner: player,
        text: player === 1 ? "黑子获胜" : "白子获胜",
        winningLine: win.winningLine
      };
      return { ok: true, result: this.state.result };
    }

    if (Rule.checkDraw(this.board)) {
      this.state.phase = "GAME_OVER";
      this.state.result = {
        winner: 0,
        text: "平局",
        winningLine: null
      };
      return { ok: true, result: this.state.result };
    }

    this.state.currentPlayer = player === 1 ? 2 : 1;
    return { ok: true, result: null };
  }

  getMachineMove() {
    return this.machinePlayer.getMove(this.board);
  }

  setMachineThinking(value) {
    this.state.machineThinking = value;
  }

  getSnapshot() {
    return {
      phase: this.state.phase,
      mode: this.state.mode,
      difficulty: this.state.difficulty,
      currentPlayer: this.state.currentPlayer,
      machineThinking: this.state.machineThinking,
      result: this.state.result,
      board: this.board.cloneCells(),
      boardSize: this.board.size,
      moveHistory: [...this.board.moveHistory]
    };
  }
}
