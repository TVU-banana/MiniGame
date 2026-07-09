import type { AudioSettings } from '../audio/AudioManager';
import type { BlockData, GameMode, LevelId, RunRecord } from '../core/BlockModel';

export type ScreenState = 'MENU' | 'LEVEL_RUNNING';

export type InteractionState =
  | 'NORMAL_CLICK'
  | 'REVERSE_SELECTING'
  | 'CLEAR_SELECTING'
  | 'BLOCK_ANIMATING'
  | 'CAMERA_DRAGGING';

export interface LevelRuntime {
  levelId: LevelId;
  mode: GameMode;
  blocks: BlockData[];
  totalBlocks: number;
  removedCount: number;
  startedAt: string;
  elapsedMs: number;
  reverseRemaining: number;
  resetRemaining: number;
  clearChargesRemaining: number;
  removableCount: number;
  coinsEarned: number;
  timeLimitMs: number | null;
}

export interface PersistentProgress {
  unlockedLevel: LevelId;
  coins: number;
}

export interface GameSnapshot {
  screenState: ScreenState;
  interactionState: InteractionState;
  runtime: LevelRuntime | null;
  audioSettings: AudioSettings;
  history: RunRecord[];
  progress: PersistentProgress;
}
