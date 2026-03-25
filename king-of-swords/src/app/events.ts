import type { GameResult, GameSnapshot, RunRecord, SettingsState } from './types';

export interface AppEvents {
  'ui:start-game': undefined;
  'ui:open-settings': undefined;
  'ui:close-settings': undefined;
  'ui:open-history': undefined;
  'ui:close-history': undefined;
  'ui:return-menu': undefined;
  'ui:restart-game': undefined;
  'ui:settings-changed': SettingsState;
  'audio:button': undefined;
  'audio:menu-bgm': undefined;
  'audio:game-bgm': undefined;
  'audio:result': { success: boolean };
  'audio:sfx': { key: SoundEffectKey };
  'game:hud': GameSnapshot;
  'game:notification': { text: string };
  'game:finished': GameResult;
}

export type SoundEffectKey =
  | 'hit'
  | 'enemyDeath'
  | 'knifeBreak'
  | 'playerHurt'
  | 'knifeUnlock';

export class EventBus<TEvents extends object> {
  private target = new EventTarget();

  on<TKey extends keyof TEvents>(
    type: TKey,
    handler: (detail: TEvents[TKey]) => void
  ): () => void {
    const listener = (event: Event) => {
      handler((event as CustomEvent<TEvents[TKey]>).detail);
    };
    this.target.addEventListener(type as string, listener);
    return () => this.target.removeEventListener(type as string, listener);
  }

  emit<TKey extends keyof TEvents>(type: TKey, detail: TEvents[TKey]): void {
    this.target.dispatchEvent(new CustomEvent(type as string, { detail }));
  }
}

export const appEvents = new EventBus<AppEvents>();

export type { RunRecord };
