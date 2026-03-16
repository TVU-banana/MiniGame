import type { AudioSettings } from '../audio/AudioManager';
import type { BlockData, LevelId, RunRecord } from '../core/BlockModel';

export type ScreenState =
  | 'BOOT'
  | 'MENU'
  | 'LEVEL_RUNNING'
  | 'RESULT_SUCCESS'
  | 'RESULT_FAIL'
  | 'SETTINGS_MODAL'
  | 'HISTORY_MODAL';

export type InteractionState =
  | 'NORMAL_CLICK'
  | 'REVERSE_SELECTING'
  | 'BLOCK_ANIMATING'
  | 'CAMERA_DRAGGING';

export interface LevelRuntime {
  levelId: LevelId;
  blocks: BlockData[];
  totalBlocks: number;
  removedCount: number;
  startedAt: string;
  elapsedMs: number;
  reverseRemaining: number;
  resetRemaining: number;
  removableCount: number;
}

export interface PersistentProgress {
  unlockedLevel: LevelId;
}

export interface GameSnapshot {
  screenState: ScreenState;
  interactionState: InteractionState;
  runtime: LevelRuntime | null;
  audioSettings: AudioSettings;
  history: RunRecord[];
  progress: PersistentProgress;
}
