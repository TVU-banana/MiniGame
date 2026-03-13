import { AI_PLAYER, BLACK, EMPTY, GAME_MODES, GAME_STATES, PLAYER_LABELS, THINK_DELAY_MAX, THINK_DELAY_MIN, WHITE } from "../constants/game.js";
import { DEFAULT_DIFFICULTY } from "../constants/difficulty.js";
import Board from "./Board.js";
import { evaluateMove } from "./Rule.js";

function createMachineDelay(moveCount) {
  const span = THINK_DELAY_MAX - THINK_DELAY_MIN;
  return THINK_DELAY_MIN + ((moveCount * 67) % (span + 1));
}

export default class GameManager {
  createInitialState(options = {}) {
    return {
      phase: GAME_STATES.MENU,
      mode: GAME_MODES.PVE,
      difficulty: options.difficulty ?? DEFAULT_DIFFICULTY,
      board: Board.create(),
      currentPlayer: BLACK,
      winner: EMPTY,
      winningLine: [],
      isDraw: false,
      isThinking: false,
      machineDelay: THINK_DELAY_MIN,
      lastMove: null,
    };
  }

  setDifficulty(state, difficulty) {
    return {
      ...state,
      difficulty,
    };
  }

  startGame(state, mode, difficulty = state.difficulty) {
    return {
      ...state,
      phase: GAME_STATES.PLAYING,
      mode,
      difficulty,
      board: Board.create(),
      currentPlayer: BLACK,
      winner: EMPTY,
      winningLine: [],
      isDraw: false,
      isThinking: false,
      machineDelay: THINK_DELAY_MIN,
      lastMove: null,
    };
  }

  restartGame(state) {
    return this.startGame(state, state.mode, state.difficulty);
  }

  returnToMenu(state) {
    return {
      ...this.createInitialState({ difficulty: state.difficulty }),
    };
  }

  applyPlayerMove(state, x, y) {
    if (state.phase !== GAME_STATES.PLAYING || state.isThinking) {
      return state;
    }

    return this.#commitMove(state, x, y, state.currentPlayer);
  }

  applyMachineMove(state, move) {
    if (
      state.phase !== GAME_STATES.PLAYING ||
      state.mode !== GAME_MODES.PVE ||
      state.currentPlayer !== AI_PLAYER
    ) {
      return state;
    }

    return this.#commitMove(
      {
        ...state,
        isThinking: false,
      },
      move.x,
      move.y,
      WHITE,
    );
  }

  #commitMove(state, x, y, player) {
    const nextBoard = state.board.placeStone(x, y, player);

    if (!nextBoard) {
      return state;
    }

    const result = evaluateMove(nextBoard, x, y, player);

    if (result.winner !== EMPTY || result.draw) {
      return {
        ...state,
        phase: GAME_STATES.GAME_OVER,
        board: nextBoard,
        currentPlayer: player,
        winner: result.winner,
        winningLine: result.line,
        isDraw: result.draw,
        isThinking: false,
        lastMove: nextBoard.getLastMove(),
      };
    }

    const nextPlayer = player === BLACK ? WHITE : BLACK;

    return {
      ...state,
      board: nextBoard,
      currentPlayer: nextPlayer,
      winningLine: [],
      winner: EMPTY,
      isDraw: false,
      isThinking: state.mode === GAME_MODES.PVE && nextPlayer === AI_PLAYER,
      machineDelay:
        state.mode === GAME_MODES.PVE && nextPlayer === AI_PLAYER
          ? createMachineDelay(nextBoard.moveHistory.length)
          : state.machineDelay,
      lastMove: nextBoard.getLastMove(),
    };
  }

  getResultText(state) {
    if (state.isDraw) {
      return "平局";
    }

    return state.winner ? `${PLAYER_LABELS[state.winner]}获胜` : "";
  }
}
