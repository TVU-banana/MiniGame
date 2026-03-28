import Phaser from "phaser";
import {
  BOARD_CELL_SIZE,
  BOARD_HEIGHT,
  BOARD_OFFSET_X,
  BOARD_OFFSET_Y,
  BOARD_WIDTH,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  HOLD_MOVE_INITIAL_DELAY_MS,
  HOLD_MOVE_REPEAT_MS,
  INITIAL_FALL_SPEED,
  LOCK_DELAY_MS,
  MAX_BASE_FALL_SPEED,
  SCENE_BACKGROUND_COLOR,
  SOFT_DROP_MULTIPLIER,
  SPEED_INCREASE_INTERVAL_SECONDS,
  SPEED_INCREASE_STEP,
  TETROMINO_COLORS,
  type ActivePiece,
  type GameStats,
  type GlobalGameState,
  type PlaySubState
} from "../app/GameConfig";
import { GameEvents, emitHistoryUpdated, emitHud, emitResult, emitState, eventBus } from "../app/EventBus";
import { SceneKeys } from "../app/SceneKeys";
import { audioManager } from "../audio/AudioManager";
import { BagRandomizer } from "../core/BagRandomizer";
import { Board } from "../core/Board";
import { isPieceGrounded, isPiecePositionValid } from "../core/Collision";
import { historyStore } from "../core/HistoryStore";
import { getLineClearScore, getLockScore } from "../core/Scoring";
import { GameStateMachine } from "../core/StateMachine";
import { createSpawnPiece, getTetrominoCells, movePiece, rotatePieceClockwise } from "../core/Tetromino";
import { GameTimer } from "../core/Timer";

const colorToInt = (hex: string): number => Number.parseInt(hex.replace("#", ""), 16);

export class GameScene extends Phaser.Scene {
  private readonly board = new Board();
  private readonly randomizer = new BagRandomizer();
  private readonly timer = new GameTimer();
  private readonly stateMachine = new GameStateMachine();

  private graphics!: Phaser.GameObjects.Graphics;
  private activePiece: ActivePiece | null = null;

  private score = 0;
  private linesCleared = 0;

  private softDropActive = false;
  private fallAccumulatorMs = 0;
  private lockDelayElapsedMs: number | null = null;

  private leftHeld = false;
  private rightHeld = false;
  private leftHoldElapsedMs = 0;
  private rightHoldElapsedMs = 0;

  private renderDirty = true;

  private leftKey?: Phaser.Input.Keyboard.Key;
  private rightKey?: Phaser.Input.Keyboard.Key;
  private downKey?: Phaser.Input.Keyboard.Key;
  private rotateKey?: Phaser.Input.Keyboard.Key;

  constructor() {
    super(SceneKeys.Game);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(SCENE_BACKGROUND_COLOR);
    this.graphics = this.add.graphics();
    this.setupKeyboard();
    this.registerBusEvents();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.unregisterBusEvents, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.unregisterBusEvents, this);

    this.setGlobalState("MENU");
    this.setSubState("SPAWNING");
    this.emitHud();
    audioManager.startMenuBgm();
    emitHistoryUpdated(historyStore.getRecords());
    this.redraw();
  }

  update(_time: number, delta: number): void {
    if (this.stateMachine.getGlobalState() === "PLAYING") {
      const secondChanged = this.timer.update(delta);
      if (secondChanged) {
        this.emitHud();
      }
      this.updateHorizontalHold(delta);
      this.updateFalling(delta);
      this.updateLockDelay(delta);
    }

    if (this.renderDirty || this.stateMachine.getGlobalState() === "PLAYING") {
      this.redraw();
      this.renderDirty = false;
    }
  }

  private registerBusEvents(): void {
    eventBus.on(GameEvents.StartGame, this.handleStartGame, this);
    eventBus.on(GameEvents.PauseGame, this.handlePauseGame, this);
    eventBus.on(GameEvents.ResumeGame, this.handleResumeGame, this);
    eventBus.on(GameEvents.ReturnToMenu, this.handleReturnToMenu, this);
    eventBus.on(GameEvents.OpenSettings, this.handleOpenSettings, this);
    eventBus.on(GameEvents.CloseSettings, this.handleCloseSettings, this);
    eventBus.on(GameEvents.OpenHistory, this.handleOpenHistory, this);
    eventBus.on(GameEvents.CloseHistory, this.handleCloseHistory, this);
    eventBus.on(GameEvents.MoveLeftStart, this.handleMoveLeftStart, this);
    eventBus.on(GameEvents.MoveLeftEnd, this.handleMoveLeftEnd, this);
    eventBus.on(GameEvents.MoveRightStart, this.handleMoveRightStart, this);
    eventBus.on(GameEvents.MoveRightEnd, this.handleMoveRightEnd, this);
    eventBus.on(GameEvents.SoftDropStart, this.handleSoftDropStart, this);
    eventBus.on(GameEvents.SoftDropEnd, this.handleSoftDropEnd, this);
    eventBus.on(GameEvents.Rotate, this.handleRotate, this);
  }

  private unregisterBusEvents(): void {
    eventBus.off(GameEvents.StartGame, this.handleStartGame, this);
    eventBus.off(GameEvents.PauseGame, this.handlePauseGame, this);
    eventBus.off(GameEvents.ResumeGame, this.handleResumeGame, this);
    eventBus.off(GameEvents.ReturnToMenu, this.handleReturnToMenu, this);
    eventBus.off(GameEvents.OpenSettings, this.handleOpenSettings, this);
    eventBus.off(GameEvents.CloseSettings, this.handleCloseSettings, this);
    eventBus.off(GameEvents.OpenHistory, this.handleOpenHistory, this);
    eventBus.off(GameEvents.CloseHistory, this.handleCloseHistory, this);
    eventBus.off(GameEvents.MoveLeftStart, this.handleMoveLeftStart, this);
    eventBus.off(GameEvents.MoveLeftEnd, this.handleMoveLeftEnd, this);
    eventBus.off(GameEvents.MoveRightStart, this.handleMoveRightStart, this);
    eventBus.off(GameEvents.MoveRightEnd, this.handleMoveRightEnd, this);
    eventBus.off(GameEvents.SoftDropStart, this.handleSoftDropStart, this);
    eventBus.off(GameEvents.SoftDropEnd, this.handleSoftDropEnd, this);
    eventBus.off(GameEvents.Rotate, this.handleRotate, this);
  }

  private setupKeyboard(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) {
      return;
    }

    keyboard.addCapture([
      Phaser.Input.Keyboard.KeyCodes.LEFT,
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
      Phaser.Input.Keyboard.KeyCodes.DOWN,
      Phaser.Input.Keyboard.KeyCodes.SPACE
    ]);

    this.leftKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.rightKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.downKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.rotateKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.leftKey.on("down", this.handleMoveLeftStart, this);
    this.leftKey.on("up", this.handleMoveLeftEnd, this);

    this.rightKey.on("down", this.handleMoveRightStart, this);
    this.rightKey.on("up", this.handleMoveRightEnd, this);

    this.downKey.on("down", this.handleSoftDropStart, this);
    this.downKey.on("up", this.handleSoftDropEnd, this);

    this.rotateKey.on("down", this.handleRotate, this);
  }

  private handleStartGame(): void {
    const current = this.stateMachine.getGlobalState();
    if (current !== "MENU" && current !== "RESULT") {
      return;
    }
    this.startNewGame();
  }

  private handlePauseGame(): void {
    if (this.stateMachine.getGlobalState() !== "PLAYING") {
      return;
    }
    this.timer.pause();
    this.setGlobalState("PAUSED");
    this.resetHeldControls();
  }

  private handleResumeGame(): void {
    if (this.stateMachine.getGlobalState() !== "PAUSED") {
      return;
    }
    this.timer.resume();
    this.setGlobalState("PLAYING");
  }

  private handleReturnToMenu(): void {
    const current = this.stateMachine.getGlobalState();
    if (current !== "PAUSED" && current !== "RESULT" && current !== "PLAYING") {
      return;
    }
    this.resetToMenu();
  }

  private handleOpenSettings(): void {
    if (this.stateMachine.getGlobalState() === "MENU") {
      this.setGlobalState("SETTINGS");
    }
  }

  private handleCloseSettings(): void {
    if (this.stateMachine.getGlobalState() === "SETTINGS") {
      this.setGlobalState("MENU");
    }
  }

  private handleOpenHistory(): void {
    if (this.stateMachine.getGlobalState() === "MENU") {
      this.setGlobalState("HISTORY");
      emitHistoryUpdated(historyStore.getRecords());
    }
  }

  private handleCloseHistory(): void {
    if (this.stateMachine.getGlobalState() === "HISTORY") {
      this.setGlobalState("MENU");
    }
  }

  private handleMoveLeftStart(): void {
    if (this.stateMachine.getGlobalState() !== "PLAYING") {
      return;
    }
    this.leftHeld = true;
    this.rightHeld = false;
    this.leftHoldElapsedMs = -HOLD_MOVE_INITIAL_DELAY_MS;
    this.tryMove(-1);
  }

  private handleMoveLeftEnd(): void {
    this.leftHeld = false;
    this.leftHoldElapsedMs = 0;
  }

  private handleMoveRightStart(): void {
    if (this.stateMachine.getGlobalState() !== "PLAYING") {
      return;
    }
    this.rightHeld = true;
    this.leftHeld = false;
    this.rightHoldElapsedMs = -HOLD_MOVE_INITIAL_DELAY_MS;
    this.tryMove(1);
  }

  private handleMoveRightEnd(): void {
    this.rightHeld = false;
    this.rightHoldElapsedMs = 0;
  }

  private handleSoftDropStart(): void {
    if (this.stateMachine.getGlobalState() !== "PLAYING") {
      return;
    }
    this.softDropActive = true;
  }

  private handleSoftDropEnd(): void {
    this.softDropActive = false;
  }

  private handleRotate(): void {
    if (this.stateMachine.getGlobalState() !== "PLAYING" || !this.activePiece) {
      return;
    }
    const rotated = rotatePieceClockwise(this.activePiece);
    if (!isPiecePositionValid(this.board, rotated)) {
      return;
    }
    this.activePiece = rotated;
    this.afterMovementOrRotate();
    this.renderDirty = true;
  }

  private startNewGame(): void {
    this.board.reset();
    this.randomizer.reset();
    this.timer.start();
    this.score = 0;
    this.linesCleared = 0;
    this.fallAccumulatorMs = 0;
    this.lockDelayElapsedMs = null;
    this.softDropActive = false;
    this.activePiece = null;
    this.resetHeldControls();

    this.setGlobalState("PLAYING");
    this.spawnNextPiece();
    this.emitHud();
    audioManager.startGameBgm();
    this.renderDirty = true;
  }

  private resetToMenu(): void {
    this.board.reset();
    this.randomizer.reset();
    this.timer.stop();
    this.score = 0;
    this.linesCleared = 0;
    this.fallAccumulatorMs = 0;
    this.lockDelayElapsedMs = null;
    this.softDropActive = false;
    this.activePiece = null;
    this.resetHeldControls();

    this.setGlobalState("MENU");
    this.setSubState("SPAWNING");
    this.emitHud();
    audioManager.startMenuBgm();
    this.renderDirty = true;
  }

  private emitHud(): void {
    emitHud({
      score: this.score,
      durationSeconds: this.timer.getElapsedSeconds(),
      linesCleared: this.linesCleared
    });
  }

  private setGlobalState(next: GlobalGameState): void {
    this.stateMachine.setGlobalState(next);
    emitState({
      globalState: this.stateMachine.getGlobalState(),
      subState: this.stateMachine.getSubState()
    });
    this.renderDirty = true;
  }

  private setSubState(next: PlaySubState): void {
    this.stateMachine.setSubState(next);
    emitState({
      globalState: this.stateMachine.getGlobalState(),
      subState: this.stateMachine.getSubState()
    });
  }

  private spawnNextPiece(): void {
    this.setSubState("SPAWNING");
    const nextType = this.randomizer.next();
    const piece = createSpawnPiece(nextType);

    if (!isPiecePositionValid(this.board, piece)) {
      this.triggerGameOver();
      return;
    }

    this.activePiece = piece;
    this.lockDelayElapsedMs = null;
    this.fallAccumulatorMs = 0;
    this.setSubState("ACTIVE_FALLING");
    this.renderDirty = true;
  }

  private updateFalling(delta: number): void {
    if (!this.activePiece) {
      return;
    }

    const baseSpeed = this.getCurrentBaseSpeed();
    const realtimeSpeed = this.softDropActive ? baseSpeed * SOFT_DROP_MULTIPLIER : baseSpeed;
    this.fallAccumulatorMs += delta * realtimeSpeed;

    while (this.fallAccumulatorMs >= 1000) {
      const moved = this.tryStepDown();
      if (!moved) {
        this.fallAccumulatorMs = 1000;
        break;
      }
      this.fallAccumulatorMs -= 1000;
    }
  }

  private tryStepDown(): boolean {
    if (!this.activePiece) {
      return false;
    }
    const moved = movePiece(this.activePiece, 0, 1);
    if (isPiecePositionValid(this.board, moved)) {
      this.activePiece = moved;
      this.lockDelayElapsedMs = null;
      this.setSubState("ACTIVE_FALLING");
      this.renderDirty = true;
      return true;
    }

    if (this.lockDelayElapsedMs === null) {
      this.lockDelayElapsedMs = 0;
      this.setSubState("LOCK_DELAY");
    }
    return false;
  }

  private updateLockDelay(delta: number): void {
    if (!this.activePiece || this.lockDelayElapsedMs === null) {
      return;
    }
    if (!isPieceGrounded(this.board, this.activePiece)) {
      this.lockDelayElapsedMs = null;
      this.setSubState("ACTIVE_FALLING");
      return;
    }
    this.lockDelayElapsedMs += delta;
    if (this.lockDelayElapsedMs >= LOCK_DELAY_MS) {
      this.finalizeLock();
    }
  }

  private finalizeLock(): void {
    if (!this.activePiece) {
      return;
    }
    const cells = getTetrominoCells(this.activePiece);
    const hasTopOverflow = cells.some((cell) => cell.y < 0);
    if (hasTopOverflow) {
      this.triggerGameOver();
      return;
    }

    const locked = this.board.lockPiece(cells, this.activePiece.type);
    this.score += getLockScore(locked.lockedCells);
    audioManager.playLockSfx();

    this.setSubState("LINE_CLEARING");
    const cleared = this.board.clearFullLines();
    if (cleared > 0) {
      this.linesCleared += cleared;
      this.score += getLineClearScore(cleared);
      audioManager.playLineClearSfx();
    }

    this.emitHud();
    this.activePiece = null;
    this.lockDelayElapsedMs = null;
    this.fallAccumulatorMs = 0;
    this.renderDirty = true;

    this.spawnNextPiece();
  }

  private triggerGameOver(): void {
    if (this.stateMachine.getGlobalState() === "RESULT") {
      return;
    }
    this.timer.stop();
    this.resetHeldControls();
    this.softDropActive = false;
    this.lockDelayElapsedMs = null;
    this.setSubState("GAME_OVER");
    this.setGlobalState("RESULT");

    const stats: GameStats = {
      score: this.score,
      durationSeconds: this.timer.getElapsedSeconds(),
      linesCleared: this.linesCleared
    };

    const records = historyStore.addRecord(stats.score, stats.durationSeconds);
    emitResult(stats);
    emitHistoryUpdated(records);
    this.emitHud();
    audioManager.startMenuBgm();
    this.renderDirty = true;
  }

  private updateHorizontalHold(delta: number): void {
    if (!this.activePiece) {
      return;
    }

    if (this.leftHeld && !this.rightHeld) {
      this.leftHoldElapsedMs += delta;
      while (this.leftHoldElapsedMs >= 0) {
        this.tryMove(-1);
        this.leftHoldElapsedMs -= HOLD_MOVE_REPEAT_MS;
      }
    }

    if (this.rightHeld && !this.leftHeld) {
      this.rightHoldElapsedMs += delta;
      while (this.rightHoldElapsedMs >= 0) {
        this.tryMove(1);
        this.rightHoldElapsedMs -= HOLD_MOVE_REPEAT_MS;
      }
    }
  }

  private tryMove(dx: number): void {
    if (!this.activePiece) {
      return;
    }
    const moved = movePiece(this.activePiece, dx, 0);
    if (!isPiecePositionValid(this.board, moved)) {
      return;
    }
    this.activePiece = moved;
    this.afterMovementOrRotate();
    this.renderDirty = true;
  }

  private afterMovementOrRotate(): void {
    if (!this.activePiece) {
      return;
    }
    if (isPieceGrounded(this.board, this.activePiece)) {
      if (this.lockDelayElapsedMs === null) {
        this.lockDelayElapsedMs = 0;
      }
      this.setSubState("LOCK_DELAY");
    } else {
      this.lockDelayElapsedMs = null;
      this.setSubState("ACTIVE_FALLING");
    }
  }

  private resetHeldControls(): void {
    this.leftHeld = false;
    this.rightHeld = false;
    this.leftHoldElapsedMs = 0;
    this.rightHoldElapsedMs = 0;
  }

  private getCurrentBaseSpeed(): number {
    const elapsedSeconds = this.timer.getElapsedSeconds();
    const increments = Math.floor(elapsedSeconds / SPEED_INCREASE_INTERVAL_SECONDS);
    const speed = INITIAL_FALL_SPEED + increments * SPEED_INCREASE_STEP;
    return Math.min(speed, MAX_BASE_FALL_SPEED);
  }

  private redraw(): void {
    const g = this.graphics;
    g.clear();

    g.fillGradientStyle(0x0f172a, 0x0f172a, 0x111827, 0x111827, 1);
    g.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    g.fillStyle(0x1f2937, 0.95);
    g.fillRoundedRect(
      BOARD_OFFSET_X - 10,
      BOARD_OFFSET_Y - 10,
      BOARD_WIDTH * BOARD_CELL_SIZE + 20,
      BOARD_HEIGHT * BOARD_CELL_SIZE + 20,
      14
    );

    for (let y = 0; y < BOARD_HEIGHT; y += 1) {
      for (let x = 0; x < BOARD_WIDTH; x += 1) {
        const px = BOARD_OFFSET_X + x * BOARD_CELL_SIZE;
        const py = BOARD_OFFSET_Y + y * BOARD_CELL_SIZE;

        g.fillStyle(0x0f172a, 1);
        g.fillRect(px + 1, py + 1, BOARD_CELL_SIZE - 2, BOARD_CELL_SIZE - 2);

        const cell = this.board.getCell(x, y);
        if (cell) {
          g.fillStyle(colorToInt(TETROMINO_COLORS[cell]), 1);
          g.fillRoundedRect(px + 2, py + 2, BOARD_CELL_SIZE - 4, BOARD_CELL_SIZE - 4, 5);
        }
      }
    }

    const globalState = this.stateMachine.getGlobalState();
    if (this.activePiece && (globalState === "PLAYING" || globalState === "PAUSED")) {
      for (const cell of getTetrominoCells(this.activePiece)) {
        if (cell.y < 0) {
          continue;
        }
        const px = BOARD_OFFSET_X + cell.x * BOARD_CELL_SIZE;
        const py = BOARD_OFFSET_Y + cell.y * BOARD_CELL_SIZE;
        g.fillStyle(colorToInt(TETROMINO_COLORS[this.activePiece.type]), 1);
        g.fillRoundedRect(px + 2, py + 2, BOARD_CELL_SIZE - 4, BOARD_CELL_SIZE - 4, 5);
      }
    }

    g.lineStyle(2, 0x334155, 1);
    g.strokeRoundedRect(
      BOARD_OFFSET_X - 1,
      BOARD_OFFSET_Y - 1,
      BOARD_WIDTH * BOARD_CELL_SIZE + 2,
      BOARD_HEIGHT * BOARD_CELL_SIZE + 2,
      6
    );
  }
}
