import type { LevelRuntime } from '../app/GameState';
import { formatElapsed, toIsoNow } from '../utils/time';
import type { BlockData, LevelDimensions, LevelId, RunRecord } from './BlockModel';
import { DirectionAssigner } from './DirectionAssigner';
import { getNextLevel, LEVEL_CONFIG } from './LevelConfig';
import { LevelGenerator } from './LevelGenerator';
import { MoveValidator, directionToVector, type MoveCheckResult } from './MoveValidator';
import { HistoryStore } from './HistoryStore';

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
  blockAnimationRequested: {
    blockId: string;
    removable: boolean;
    direction: { x: number; y: number; z: number };
    distance: number;
  };
  blockAnimationFinished: {
    blockId: string;
    removable: boolean;
  };
  levelSucceeded: {
    runtime: LevelRuntime;
    record: RunRecord;
    nextLevel: LevelId | null;
    message: string;
    starsText: string;
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

  private readonly listeners = new Map<keyof GameControllerEvents, Set<Listener<any>>>();

  constructor(
    private readonly levelGenerator: LevelGenerator,
    private readonly directionAssigner: DirectionAssigner,
    private readonly moveValidator: MoveValidator,
    private readonly historyStore: HistoryStore,
  ) {}

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

  startLevel(levelId: LevelId): LevelRuntime {
    const dimensions = LEVEL_CONFIG[levelId];
    const generated = this.levelGenerator.generate(dimensions);
    const blocks = this.directionAssigner.assignDirections(generated, dimensions);
    const removableCount = this.moveValidator.countRemovableBlocks(blocks, dimensions);
    this.dimensions = dimensions;
    this.runtime = {
      levelId,
      blocks,
      totalBlocks: blocks.length,
      removedCount: 0,
      startedAt: toIsoNow(),
      elapsedMs: 0,
      reverseRemaining: 5,
      resetRemaining: 5,
      removableCount,
    };
    this.tickStartedAt = performance.now();

    const snapshot = this.getRuntimeOrThrow();
    this.emit('levelLoaded', { levelId, dimensions, blocks: snapshot.blocks, runtime: snapshot });
    this.emit('runtimeChanged', snapshot);
    this.emit('reverseStateChanged', { active: false, remaining: snapshot.reverseRemaining });
    return snapshot;
  }

  restartLevel(): LevelRuntime | null {
    if (!this.runtime) {
      return null;
    }
    return this.startLevel(this.runtime.levelId);
  }

  tick(now: number): void {
    if (!this.runtime) {
      return;
    }

    this.runtime.elapsedMs = now - this.tickStartedAt;
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

  toggleReverseSelection(active: boolean): void {
    const runtime = this.getRuntimeOrThrow();
    this.emit('reverseStateChanged', { active, remaining: runtime.reverseRemaining });
  }

  requestBlockAction(blockId: string): BlockActionRequest | null {
    const runtime = this.getRuntimeOrThrow();
    const block = runtime.blocks.find((entry) => entry.id === blockId && !entry.removed);
    if (!block || !this.dimensions) {
      return null;
    }

    const result = this.moveValidator.isBlockRemovable(block, runtime.blocks, this.dimensions);
    this.emit('blockAnimationRequested', {
      blockId: block.id,
      removable: result.removable,
      direction: directionToVector(block.direction),
      distance: result.travelUnits,
    });
    return { block, result };
  }

  applyReverse(blockId: string): LevelRuntime | null {
    const runtime = this.getRuntimeOrThrow();
    if (runtime.reverseRemaining <= 0) {
      return null;
    }

    const block = runtime.blocks.find((entry) => entry.id === blockId && !entry.removed);
    if (!block || !this.dimensions) {
      return null;
    }

    block.direction = this.directionAssigner.reverseDirection(block.direction);
    runtime.reverseRemaining -= 1;
    runtime.removableCount = this.moveValidator.countRemovableBlocks(runtime.blocks, this.dimensions);
    const snapshot = this.cloneRuntime();
    this.emit('directionsChanged', { blocks: snapshot.blocks });
    this.emit('runtimeChanged', snapshot);
    this.emit('reverseStateChanged', { active: false, remaining: snapshot.reverseRemaining });
    this.checkFailure();
    return snapshot;
  }

  applyReset(): LevelRuntime | null {
    const runtime = this.getRuntimeOrThrow();
    if (runtime.resetRemaining <= 0 || !this.dimensions) {
      return null;
    }

    const activeBlocks = runtime.blocks.map((block) => ({ ...block }));
    const updated = this.directionAssigner.assignDirections(activeBlocks, this.dimensions);
    const byId = new Map(updated.map((block) => [block.id, block.direction]));
    for (const block of runtime.blocks) {
      const nextDirection = byId.get(block.id);
      if (nextDirection) {
        block.direction = nextDirection;
      }
    }
    runtime.resetRemaining -= 1;
    runtime.removableCount = this.moveValidator.countRemovableBlocks(runtime.blocks, this.dimensions);
    const snapshot = this.cloneRuntime();
    this.emit('directionsChanged', { blocks: snapshot.blocks });
    this.emit('runtimeChanged', snapshot);
    this.checkFailure();
    return snapshot;
  }

  finalizeAnimation(blockId: string, removable: boolean): void {
    const runtime = this.getRuntimeOrThrow();
    if (!this.dimensions) {
      return;
    }

    const block = runtime.blocks.find((entry) => entry.id === blockId);
    if (!block) {
      return;
    }

    if (removable) {
      block.removed = true;
      runtime.removedCount += 1;
    }

    runtime.removableCount = this.moveValidator.countRemovableBlocks(runtime.blocks, this.dimensions);
    const snapshot = this.cloneRuntime();
    this.emit('blockAnimationFinished', { blockId, removable });
    this.emit('runtimeChanged', snapshot);

    if (runtime.removedCount === runtime.totalBlocks) {
      this.handleSuccess();
      return;
    }

    this.checkFailure();
  }

  getProgressText(): string {
    const runtime = this.getRuntimeOrThrow();
    return `${runtime.removedCount} / ${runtime.totalBlocks}`;
  }

  getElapsedLabel(): string {
    return formatElapsed(this.getRuntimeOrThrow().elapsedMs);
  }

  private handleSuccess(): void {
    const runtime = this.getRuntimeOrThrow();
    const nextLevel = getNextLevel(runtime.levelId);
    if (nextLevel !== null) {
      const unlocked = this.historyStore.loadUnlockedLevel();
      if (nextLevel > unlocked) {
        this.historyStore.saveUnlockedLevel(nextLevel);
      }
    }

    const record = this.createRecord('success');
    this.historyStore.saveRun(record);
    this.emit('levelSucceeded', {
      runtime: this.cloneRuntime(),
      record,
      nextLevel,
      message: '恭喜你挑战成功，你这空间能力真是没谁了！',
      starsText: `${record.stars} 星`,
    });
  }

  private checkFailure(): void {
    const runtime = this.getRuntimeOrThrow();
    if (!this.dimensions) {
      return;
    }

    if (
      !this.moveValidator.isFailureState(
        runtime.blocks,
        this.dimensions,
        runtime.reverseRemaining,
        runtime.resetRemaining,
      )
    ) {
      return;
    }

    const record = this.createRecord('fail');
    this.historyStore.saveRun(record);
    this.emit('levelFailed', {
      runtime: this.cloneRuntime(),
      record,
      message: '很遗憾，你失败了…… 本局已无可操作空间且反向、重置次数都已耗尽。',
    });
  }

  private createRecord(result: 'success' | 'fail'): RunRecord {
    const runtime = this.getRuntimeOrThrow();
    const elapsedSeconds = Math.floor(runtime.elapsedMs / 1000);
    return {
      id: crypto.randomUUID(),
      level: runtime.levelId,
      startedAt: runtime.startedAt,
      finishedAt: toIsoNow(),
      result,
      elapsedSeconds,
      stars: result === 'success' ? this.resolveStars(elapsedSeconds) : 0,
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
      throw new Error('当前没有进行中的关卡');
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
