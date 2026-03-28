import type { LevelRuntime } from '../app/GameState';
import { toIsoNow } from '../utils/time';
import type { BlockData, GameMode, LevelDimensions, LevelId, RunRecord } from './BlockModel';
import { DirectionAssigner } from './DirectionAssigner';
import { CHALLENGE_TIME_LIMITS, getNextLevel, LEVEL_CONFIG } from './LevelConfig';
import { LevelGenerator } from './LevelGenerator';
import { MoveValidator, directionToVector, type MoveCheckResult } from './MoveValidator';
import { HistoryStore } from './HistoryStore';

const EXTRA_TOOL_COST = 100;

export interface BlockActionRequest {
  block: BlockData;
  result: MoveCheckResult;
}

export interface GameControllerEvents {
  levelLoaded: {
    levelId: LevelId;
    dimensions: LevelDimensions;
    blocks: BlockData[];
    runtime: LevelRuntime;
  };
  runtimeChanged: LevelRuntime;
  directionsChanged: {
    blocks: BlockData[];
  };
  reverseStateChanged: {
    active: boolean;
    remaining: number;
  };
  coinsChanged: {
    total: number;
    delta: number;
  };
  notice: {
    message: string;
    tone: 'info' | 'warning' | 'success';
  };
  blockAnimationRequested: {
    blockId: string;
    kind: 'slide' | 'blocked';
    removable: boolean;
    direction: { x: number; y: number; z: number };
    distance: number;
  };
  blockAnimationFinished: {
    blockId: string;
    kind: 'slide' | 'blocked' | 'shatter';
  };
  levelSucceeded: {
    runtime: LevelRuntime;
    record: RunRecord;
    nextLevel: LevelId | null;
    message: string;
  };
  levelFailed: {
    runtime: LevelRuntime;
    record: RunRecord;
    message: string;
  };
}

type Listener<T> = (payload: T) => void;

export class GameController {
  private runtime: LevelRuntime | null = null;

  private dimensions: LevelDimensions | null = null;

  private tickStartedAt = 0;

  private levelResolved = false;

  private coins: number;

  private readonly listeners = new Map<keyof GameControllerEvents, Set<Listener<any>>>();

  constructor(
    private readonly levelGenerator: LevelGenerator,
    private readonly directionAssigner: DirectionAssigner,
    private readonly moveValidator: MoveValidator,
    private readonly historyStore: HistoryStore,
  ) {
    this.coins = this.historyStore.loadCoins();
  }

  on<TKey extends keyof GameControllerEvents>(
    eventName: TKey,
    listener: Listener<GameControllerEvents[TKey]>,
  ): () => void {
    const group = this.listeners.get(eventName) ?? new Set<Listener<GameControllerEvents[TKey]>>();
    group.add(listener);
    this.listeners.set(eventName, group as Set<Listener<any>>);

    return () => {
      group.delete(listener);
      if (group.size === 0) {
        this.listeners.delete(eventName);
      }
    };
  }

  startLevel(levelId: LevelId, mode: GameMode): LevelRuntime {
    const dimensions = LEVEL_CONFIG[levelId];
    const generated = this.levelGenerator.generate(levelId, dimensions);
    const blocks = this.directionAssigner.assignDirections(generated, dimensions);
    const removableCount = this.moveValidator.countRemovableBlocks(blocks, dimensions);

    this.dimensions = dimensions;
    this.levelResolved = false;
    this.runtime = {
      levelId,
      mode,
      blocks,
      totalBlocks: blocks.length,
      removedCount: 0,
      startedAt: toIsoNow(),
      elapsedMs: 0,
      reverseRemaining: 5,
      resetRemaining: 5,
      clearChargesRemaining: 1,
      removableCount,
      coinsEarned: 0,
      timeLimitMs: mode === 'challenge' ? CHALLENGE_TIME_LIMITS[levelId] : null,
    };
    this.tickStartedAt = performance.now();

    const snapshot = this.cloneRuntime();
    this.emit('levelLoaded', { levelId, dimensions, blocks: snapshot.blocks, runtime: snapshot });
    this.emit('runtimeChanged', snapshot);
    this.emit('reverseStateChanged', { active: false, remaining: snapshot.reverseRemaining });
    return snapshot;
  }

  restartLevel(): LevelRuntime | null {
    if (!this.runtime) {
      return null;
    }
    return this.startLevel(this.runtime.levelId, this.runtime.mode);
  }

  tick(now: number): void {
    if (!this.runtime || this.levelResolved) {
      return;
    }

    this.runtime.elapsedMs = Math.max(0, now - this.tickStartedAt);

    if (this.runtime.timeLimitMs !== null && this.runtime.elapsedMs >= this.runtime.timeLimitMs) {
      this.runtime.elapsedMs = this.runtime.timeLimitMs;
      this.emit('runtimeChanged', this.cloneRuntime());
      this.handleFailure('倒计时结束，本次挑战失败。');
      return;
    }

    this.emit('runtimeChanged', this.cloneRuntime());
  }

  setElapsedBase(elapsedMs: number): void {
    if (!this.runtime) {
      return;
    }

    this.runtime.elapsedMs = elapsedMs;
    this.tickStartedAt = performance.now() - elapsedMs;
  }

  getRuntime(): LevelRuntime | null {
    return this.runtime ? this.cloneRuntime() : null;
  }

  getDimensions(): LevelDimensions | null {
    return this.dimensions;
  }

  getHistory(): RunRecord[] {
    return this.historyStore.loadRuns();
  }

  getUnlockedLevel(): LevelId {
    return this.historyStore.loadUnlockedLevel();
  }

  getCoins(): number {
    return this.coins;
  }

  toggleReverseSelection(active: boolean): void {
    const runtime = this.getRuntimeOrThrow();
    this.emit('reverseStateChanged', { active, remaining: runtime.reverseRemaining });
  }

  requestBlockAction(blockId: string): BlockActionRequest | null {
    if (this.levelResolved) {
      return null;
    }

    const runtime = this.getRuntimeOrThrow();
    const block = runtime.blocks.find((entry) => entry.id === blockId && !entry.removed);
    if (!block || !this.dimensions) {
      return null;
    }

    const result = this.moveValidator.isBlockRemovable(block, runtime.blocks, this.dimensions);
    this.emit('blockAnimationRequested', {
      blockId: block.id,
      kind: result.removable ? 'slide' : 'blocked',
      removable: result.removable,
      direction: directionToVector(block.direction),
      distance: result.travelUnits,
    });
    return { block, result };
  }

  applyReverse(blockId: string): LevelRuntime | null {
    if (this.levelResolved) {
      return null;
    }

    const runtime = this.getRuntimeOrThrow();
    if (runtime.reverseRemaining <= 0 || !this.dimensions) {
      return null;
    }

    const block = runtime.blocks.find((entry) => entry.id === blockId && !entry.removed);
    if (!block) {
      return null;
    }

    block.direction = this.directionAssigner.reverseDirection(block.direction);
    runtime.reverseRemaining -= 1;
    runtime.removableCount = this.moveValidator.countRemovableBlocks(runtime.blocks, this.dimensions);

    const snapshot = this.cloneRuntime();
    this.emit('directionsChanged', { blocks: snapshot.blocks });
    this.emit('runtimeChanged', snapshot);
    this.emit('reverseStateChanged', { active: false, remaining: snapshot.reverseRemaining });
    this.resolveStalemateIfNeeded();
    return snapshot;
  }

  applyReset(): LevelRuntime | null {
    const result = this.applyResetInternal(true);
    this.resolveStalemateIfNeeded();
    return result;
  }

  armClearMode(): boolean {
    const runtime = this.getRuntimeOrThrow();
    if (runtime.clearChargesRemaining <= 0) {
      return false;
    }

    runtime.clearChargesRemaining -= 1;
    this.emit('runtimeChanged', this.cloneRuntime());
    return true;
  }

  finalizeAnimation(blockId: string, removable: boolean): void {
    if (this.levelResolved) {
      return;
    }

    const runtime = this.getRuntimeOrThrow();
    if (!this.dimensions) {
      return;
    }

    const block = runtime.blocks.find((entry) => entry.id === blockId);
    if (!block) {
      return;
    }

    if (removable && !block.removed) {
      block.removed = true;
      runtime.removedCount += 1;
      runtime.coinsEarned += 10;
      this.addCoins(10);
    }

    runtime.removableCount = this.moveValidator.countRemovableBlocks(runtime.blocks, this.dimensions);

    const snapshot = this.cloneRuntime();
    this.emit('runtimeChanged', snapshot);
    this.emit('blockAnimationFinished', {
      blockId,
      kind: removable ? 'slide' : 'blocked',
    });

    if (runtime.removedCount === runtime.totalBlocks) {
      this.handleSuccess();
      return;
    }

    this.resolveStalemateIfNeeded();
  }

  finalizeCheatRemoval(blockId: string): void {
    if (this.levelResolved) {
      return;
    }

    const runtime = this.getRuntimeOrThrow();
    if (!this.dimensions) {
      return;
    }

    const block = runtime.blocks.find((entry) => entry.id === blockId && !entry.removed);
    if (!block) {
      return;
    }

    block.removed = true;
    runtime.removedCount += 1;
    runtime.removableCount = this.moveValidator.countRemovableBlocks(runtime.blocks, this.dimensions);

    const snapshot = this.cloneRuntime();
    this.emit('runtimeChanged', snapshot);
    this.emit('blockAnimationFinished', { blockId, kind: 'shatter' });

    if (runtime.removedCount === runtime.totalBlocks) {
      this.handleSuccess();
      return;
    }

    this.resolveStalemateIfNeeded();
  }

  purchaseExtra(kind: 'reverse' | 'reset'): boolean {
    if (this.coins < EXTRA_TOOL_COST) {
      this.emit('notice', {
        message: '金币不足，无法购买额外次数。',
        tone: 'warning',
      });
      return false;
    }

    const runtime = this.getRuntimeOrThrow();
    this.addCoins(-EXTRA_TOOL_COST);

    if (kind === 'reverse') {
      runtime.reverseRemaining += 1;
    } else {
      runtime.resetRemaining += 1;
    }

    this.emit('runtimeChanged', this.cloneRuntime());
    this.emit('notice', {
      message: `消耗 ${EXTRA_TOOL_COST} 金币，补充了 1 次${kind === 'reverse' ? '反向' : '重置'}。`,
      tone: 'info',
    });
    return true;
  }

  private applyResetInternal(consumeCharge: boolean): LevelRuntime | null {
    const runtime = this.getRuntimeOrThrow();
    if (!this.dimensions) {
      return null;
    }

    if (consumeCharge && runtime.resetRemaining <= 0) {
      return null;
    }

    const clonedBlocks = runtime.blocks.map((block) => ({ ...block }));
    const reassigned = this.directionAssigner.assignDirections(clonedBlocks, this.dimensions);
    const nextDirections = new Map(reassigned.map((block) => [block.id, block.direction]));

    for (const block of runtime.blocks) {
      const nextDirection = nextDirections.get(block.id);
      if (nextDirection) {
        block.direction = nextDirection;
      }
    }

    if (consumeCharge) {
      runtime.resetRemaining -= 1;
    }

    runtime.removableCount = this.moveValidator.countRemovableBlocks(runtime.blocks, this.dimensions);

    const snapshot = this.cloneRuntime();
    this.emit('directionsChanged', { blocks: snapshot.blocks });
    this.emit('runtimeChanged', snapshot);
    this.emit('reverseStateChanged', { active: false, remaining: snapshot.reverseRemaining });
    return snapshot;
  }

  private resolveStalemateIfNeeded(): void {
    const runtime = this.runtime;
    if (!runtime || this.levelResolved || runtime.removedCount === runtime.totalBlocks || !this.dimensions) {
      return;
    }

    runtime.removableCount = this.moveValidator.countRemovableBlocks(runtime.blocks, this.dimensions);
    if (runtime.removableCount > 0) {
      return;
    }

    for (let attempt = 0; attempt < 32; attempt += 1) {
      this.applyResetInternal(false);
      runtime.removableCount = this.moveValidator.countRemovableBlocks(runtime.blocks, this.dimensions);
      if (runtime.removableCount > 0) {
        this.emit('notice', {
          message: '无块可消，自动重置',
          tone: 'info',
        });
        return;
      }
    }

    this.handleFailure('当前局面无法继续推进。');
  }

  private handleSuccess(): void {
    const runtime = this.getRuntimeOrThrow();
    const nextLevel = getNextLevel(runtime.levelId);

    runtime.coinsEarned += 100;
    this.addCoins(100);

    if (nextLevel !== null) {
      const unlockedLevel = this.historyStore.loadUnlockedLevel();
      if (nextLevel > unlockedLevel) {
        this.historyStore.saveUnlockedLevel(nextLevel);
      }
    }

    const record = this.createRecord('success');
    this.historyStore.saveRun(record);
    this.levelResolved = true;
    this.emit('levelSucceeded', {
      runtime: this.cloneRuntime(),
      record,
      nextLevel,
      message:
        runtime.mode === 'challenge'
          ? '挑战成功，当前关卡已在倒计时结束前完成。'
          : '通关成功，整座滑块塔已经被你拆空了。',
    });
  }

  private handleFailure(message: string): void {
    if (this.levelResolved) {
      return;
    }

    const record = this.createRecord('fail');
    this.historyStore.saveRun(record);
    this.levelResolved = true;
    this.emit('levelFailed', {
      runtime: this.cloneRuntime(),
      record,
      message,
    });
  }

  private createRecord(result: 'success' | 'fail'): RunRecord {
    const runtime = this.getRuntimeOrThrow();
    const elapsedSeconds = Math.floor(runtime.elapsedMs / 1000);
    return {
      id: crypto.randomUUID(),
      level: runtime.levelId,
      mode: runtime.mode,
      startedAt: runtime.startedAt,
      finishedAt: toIsoNow(),
      result,
      elapsedSeconds,
      stars:
        result === 'success' && runtime.mode === 'endless'
          ? this.resolveStars(elapsedSeconds)
          : 0,
      earnedCoins: runtime.coinsEarned,
    };
  }

  private resolveStars(elapsedSeconds: number): 1 | 2 | 3 {
    if (elapsedSeconds <= 180) {
      return 3;
    }
    if (elapsedSeconds <= 300) {
      return 2;
    }
    return 1;
  }

  private addCoins(delta: number): void {
    this.coins = Math.max(0, this.coins + delta);
    this.historyStore.saveCoins(this.coins);
    this.emit('coinsChanged', { total: this.coins, delta });
  }

  private emit<TKey extends keyof GameControllerEvents>(
    eventName: TKey,
    payload: GameControllerEvents[TKey],
  ): void {
    const group = this.listeners.get(eventName);
    if (!group) {
      return;
    }

    for (const listener of group) {
      listener(payload);
    }
  }

  private getRuntimeOrThrow(): LevelRuntime {
    if (!this.runtime) {
      throw new Error('当前没有进行中的关卡。');
    }
    return this.runtime;
  }

  private cloneRuntime(): LevelRuntime {
    const runtime = this.getRuntimeOrThrow();
    return {
      ...runtime,
      blocks: runtime.blocks.map((block) => ({ ...block })),
    };
  }
}
