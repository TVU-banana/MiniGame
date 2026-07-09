import type { AudioSettings } from '../audio/AudioManager';
import { AudioManager } from '../audio/AudioManager';
import { DirectionAssigner } from '../core/DirectionAssigner';
import { EXTRA_TOOL_COSTS, GameController } from '../core/GameController';
import { HistoryStore } from '../core/HistoryStore';
import { LevelGenerator } from '../core/LevelGenerator';
import type { GameMode, LevelId, RunRecord } from '../core/BlockModel';
import { LEVEL_IDS, LEVEL_SPECS } from '../core/LevelConfig';
import { MoveValidator } from '../core/MoveValidator';
import { GameScene } from '../scene/GameScene';
import type { InteractionState, LevelRuntime, ScreenState } from './GameState';
import { APP_TEMPLATE } from './template';
import { formatElapsed } from '../utils/time';

interface ResultState {
  success: boolean;
  message: string;
  nextLevel: LevelId | null;
  record: RunRecord;
}

type AppModal = 'none' | 'settings' | 'achievements' | 'coins' | 'level-select' | 'result';
type ToolMode = 'reverse' | null;

declare global {
  interface Window {
    render_game_to_text?: () => string;
    advanceTime?: (ms: number) => void;
  }
}

const must = <T extends Element>(value: T | null, message: string): T => {
  if (!value) {
    throw new Error(message);
  }
  return value;
};

const formatModeLabel = (mode: GameMode): string => (mode === 'challenge' ? '挑战模式' : '不限时模式');
const formatResultLabel = (record: RunRecord): string => (record.result === 'success' ? '通关' : '失败');

const formatDateTime = (value: string): string =>
  new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

const formatRecordDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}m${String(remainSeconds).padStart(2, '0')}s`;
};

const isLevelId = (value: string | undefined): value is `${LevelId}` =>
  value === '1' || value === '2' || value === '3' || value === '4' || value === '5' || value === '6';

const pickRandomBlockIds = (runtime: LevelRuntime, count: number): string[] => {
  const candidates = runtime.blocks.filter((block) => !block.removed).map((block) => block.id);
  for (let index = candidates.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [candidates[index], candidates[swapIndex]] = [candidates[swapIndex], candidates[index]];
  }
  return candidates.slice(0, Math.min(count, candidates.length));
};

const getBestChallengeCampaignTime = (history: RunRecord[]): number | null => {
  const challengeRuns = [...history]
    .filter((record) => record.mode === 'challenge')
    .sort((left, right) => new Date(left.finishedAt).getTime() - new Date(right.finishedAt).getTime());

  let expectedLevel: LevelId = 1;
  let currentTotal = 0;
  let bestTotal: number | null = null;

  for (const record of challengeRuns) {
    if (record.result !== 'success') {
      expectedLevel = 1;
      currentTotal = 0;
      continue;
    }

    if (record.level === 1) {
      expectedLevel = 2;
      currentTotal = record.elapsedSeconds;
      continue;
    }

    if (record.level !== expectedLevel) {
      expectedLevel = 1;
      currentTotal = 0;
      continue;
    }

    currentTotal += record.elapsedSeconds;

    if (record.level === 6) {
      bestTotal = bestTotal === null ? currentTotal : Math.min(bestTotal, currentTotal);
      expectedLevel = 1;
      currentTotal = 0;
      continue;
    }

    expectedLevel = (record.level + 1) as LevelId;
  }

  return bestTotal;
};

const getToolPurchaseLabel = (remaining: number, cost: number, coins: number): string =>
  remaining > 0 ? `${remaining} 次` : coins >= cost ? `${cost} 金币购买 1 次` : '金币不足';

export class App {
  private readonly audio = new AudioManager();
  private readonly moveValidator = new MoveValidator();
  private readonly controller = new GameController(
    new LevelGenerator(),
    new DirectionAssigner(this.moveValidator),
    this.moveValidator,
    new HistoryStore(),
  );

  private readonly sceneHost: HTMLDivElement;
  private readonly scene: GameScene;
  private readonly shell: HTMLDivElement;
  private readonly modalRoot: HTMLDivElement;
  private readonly settingsPanel: HTMLDivElement;
  private readonly achievementsPanel: HTMLDivElement;
  private readonly coinsPanel: HTMLDivElement;
  private readonly levelSelectPanel: HTMLDivElement;
  private readonly resultPanel: HTMLDivElement;
  private readonly menuCoinsValue: HTMLSpanElement;
  private readonly gameCoinsValue: HTMLSpanElement;
  private readonly timerValue: HTMLSpanElement;
  private readonly timerHint: HTMLParagraphElement;
  private readonly modeBadge: HTMLSpanElement;
  private readonly remainValue: HTMLSpanElement;
  private readonly progressValue: HTMLSpanElement;
  private readonly progressFill: HTMLDivElement;
  private readonly hintValue: HTMLParagraphElement;
  private readonly reverseButton: HTMLButtonElement;
  private readonly reverseMeta: HTMLSpanElement;
  private readonly clearButton: HTMLButtonElement;
  private readonly clearMeta: HTMLSpanElement;
  private readonly resetButton: HTMLButtonElement;
  private readonly resetMeta: HTMLSpanElement;
  private readonly bgmSlider: HTMLInputElement;
  private readonly sfxSlider: HTMLInputElement;
  private readonly bgmLabel: HTMLSpanElement;
  private readonly sfxLabel: HTMLSpanElement;
  private readonly achievementsList: HTMLDivElement;
  private readonly levelSelectTitle: HTMLHeadingElement;
  private readonly levelSelectList: HTMLDivElement;
  private readonly resultTitle: HTMLHeadingElement;
  private readonly resultMessage: HTMLParagraphElement;
  private readonly resultMeta: HTMLParagraphElement;
  private readonly resultReward: HTMLParagraphElement;
  private readonly resultStars: HTMLDivElement;
  private readonly nextLevelButton: HTMLButtonElement;
  private readonly settingsRestartButton: HTMLButtonElement;
  private readonly settingsExitButton: HTMLButtonElement;
  private readonly menuRecordSummary: HTMLParagraphElement;
  private readonly toast: HTMLDivElement;

  private screenState: ScreenState = 'MENU';
  private activeModal: AppModal = 'none';
  private runtime: LevelRuntime | null = null;
  private resultState: ResultState | null = null;
  private latestHistory: RunRecord[] = [];
  private coins = 0;
  private unlockedLevel: LevelId = 1;
  private animationLocked = false;
  private toolMode: ToolMode = null;
  private pendingMode: GameMode | null = null;
  private toastTimer: number | null = null;
  private lastTickAt = 0;

  private static readonly TICK_INTERVAL_MS = 100;

  constructor(private readonly root: HTMLDivElement) {
    this.root.innerHTML = APP_TEMPLATE;
    this.shell = must(this.root.querySelector('.upgrade-shell'), 'missing shell');
    this.sceneHost = must(this.root.querySelector('.scene-host'), 'missing scene host');
    this.modalRoot = must(this.root.querySelector('.modal-root'), 'missing modal root');
    this.settingsPanel = must(this.root.querySelector('[data-panel="settings"]'), 'missing settings panel');
    this.achievementsPanel = must(
      this.root.querySelector('[data-panel="achievements"]'),
      'missing achievements panel',
    );
    this.coinsPanel = must(this.root.querySelector('[data-panel="coins"]'), 'missing coins panel');
    this.levelSelectPanel = must(
      this.root.querySelector('[data-panel="level-select"]'),
      'missing level select panel',
    );
    this.resultPanel = must(this.root.querySelector('[data-panel="result"]'), 'missing result panel');
    this.menuCoinsValue = must(this.root.querySelector('[data-role="menu-coins"]'), 'missing menu coins');
    this.gameCoinsValue = must(this.root.querySelector('[data-role="game-coins"]'), 'missing game coins');
    this.timerValue = must(this.root.querySelector('[data-role="timer"]'), 'missing timer');
    this.timerHint = must(this.root.querySelector('[data-role="timer-hint"]'), 'missing timer hint');
    this.modeBadge = must(this.root.querySelector('[data-role="mode-badge"]'), 'missing mode badge');
    this.remainValue = must(this.root.querySelector('[data-role="remain"]'), 'missing remain badge');
    this.progressValue = must(this.root.querySelector('[data-role="progress"]'), 'missing progress value');
    this.progressFill = must(this.root.querySelector('[data-role="progress-fill"]'), 'missing progress fill');
    this.hintValue = must(this.root.querySelector('[data-role="hint"]'), 'missing hint');
    this.reverseButton = must(this.root.querySelector('[data-action="toggle-reverse"]'), 'missing reverse button');
    this.reverseMeta = must(this.root.querySelector('[data-role="reverse-meta"]'), 'missing reverse meta');
    this.clearButton = must(this.root.querySelector('[data-action="activate-clear"]'), 'missing clear button');
    this.clearMeta = must(this.root.querySelector('[data-role="clear-meta"]'), 'missing clear meta');
    this.resetButton = must(this.root.querySelector('[data-action="apply-reset"]'), 'missing reset button');
    this.resetMeta = must(this.root.querySelector('[data-role="reset-meta"]'), 'missing reset meta');
    this.bgmSlider = must(this.root.querySelector('[data-role="bgm-slider"]'), 'missing bgm slider');
    this.sfxSlider = must(this.root.querySelector('[data-role="sfx-slider"]'), 'missing sfx slider');
    this.bgmLabel = must(this.root.querySelector('[data-role="bgm-label"]'), 'missing bgm label');
    this.sfxLabel = must(this.root.querySelector('[data-role="sfx-label"]'), 'missing sfx label');
    this.achievementsList = must(
      this.root.querySelector('[data-role="achievements-list"]'),
      'missing achievements list',
    );
    this.levelSelectTitle = must(
      this.root.querySelector('[data-role="level-select-title"]'),
      'missing level select title',
    );
    this.levelSelectList = must(
      this.root.querySelector('[data-role="level-select-list"]'),
      'missing level select list',
    );
    this.resultTitle = must(this.root.querySelector('[data-role="result-title"]'), 'missing result title');
    this.resultMessage = must(
      this.root.querySelector('[data-role="result-message"]'),
      'missing result message',
    );
    this.resultMeta = must(this.root.querySelector('[data-role="result-meta"]'), 'missing result meta');
    this.resultReward = must(this.root.querySelector('[data-role="result-reward"]'), 'missing result reward');
    this.resultStars = must(this.root.querySelector('[data-role="result-stars"]'), 'missing result stars');
    this.nextLevelButton = must(
      this.root.querySelector('[data-action="result-next"]'),
      'missing next level button',
    );
    this.settingsRestartButton = must(
      this.root.querySelector('[data-action="settings-restart"]'),
      'missing restart button',
    );
    this.settingsExitButton = must(
      this.root.querySelector('[data-action="settings-exit"]'),
      'missing exit button',
    );
    this.menuRecordSummary = must(
      this.root.querySelector('[data-role="record-summary"]'),
      'missing record summary',
    );
    this.toast = must(this.root.querySelector('[data-role="toast"]'), 'missing toast');

    this.scene = new GameScene(this.sceneHost, {
      onBlockSelect: (blockId) => void this.handleBlockSelection(blockId),
      onPointerActivity: () => void this.audio.unlock(),
    });
  }

  mount(): void {
    this.bindDomEvents();
    this.bindControllerEvents();
    this.applyAudioSettings(this.audio.getSettings());
    this.refreshAchievements();
    this.updateCoins(this.controller.getCoins());
    this.setScreen('MENU');
    this.audio.startMenuBgm();
    this.root.addEventListener('pointerdown', () => void this.audio.unlock());
    this.installDebugHooks();
    this.loop();
  }

  private bindDomEvents(): void {
    this.root.addEventListener('click', (event) => {
      const actionElement =
        event.target instanceof HTMLElement ? event.target.closest<HTMLElement>('[data-action]') : null;
      const action = actionElement?.dataset.action;
      if (!action) {
        return;
      }

      this.audio.playButton();

      switch (action) {
        case 'open-settings':
        case 'pause-settings':
          this.openModal('settings');
          break;
        case 'open-achievements':
          this.openModal('achievements');
          break;
        case 'open-coins':
          this.openModal('coins');
          break;
        case 'start-endless':
          this.openLevelSelect('endless');
          break;
        case 'start-challenge':
          this.openLevelSelect('challenge');
          break;
        case 'select-level': {
          const levelValue = actionElement.dataset.level;
          if (isLevelId(levelValue)) {
            this.selectLevel(Number(levelValue) as LevelId);
          }
          break;
        }
        case 'close-modal':
          this.activeModal === 'result' ? this.returnToMenu() : this.closeModal();
          break;
        case 'toggle-reverse':
          this.toggleReverseMode();
          break;
        case 'activate-clear':
          void this.activateClearMode();
          break;
        case 'apply-reset':
          this.applyReset();
          break;
        case 'settings-restart':
        case 'result-replay':
          this.restartCurrentLevel();
          break;
        case 'settings-exit':
        case 'result-home':
          this.returnToMenu();
          break;
        case 'result-next':
          this.startNextLevel();
          break;
      }
    });

    this.bgmSlider.addEventListener('input', () => {
      this.applyAudioSettings(this.audio.setSettings({ bgmVolume: Number(this.bgmSlider.value) }));
    });

    this.sfxSlider.addEventListener('input', () => {
      this.applyAudioSettings(this.audio.setSettings({ sfxVolume: Number(this.sfxSlider.value) }));
    });
  }

  private bindControllerEvents(): void {
    this.controller.on('levelLoaded', ({ blocks, dimensions, runtime }) => {
      this.runtime = runtime;
      this.resultState = null;
      this.animationLocked = false;
      this.toolMode = null;
      this.scene.loadLevel(blocks, dimensions);
      this.updateRuntime(runtime);
      this.updateToolButtons();
      this.closeModal();
      this.setScreen('LEVEL_RUNNING');
    });

    this.controller.on('runtimeChanged', (runtime) => {
      this.runtime = runtime;
      this.updateRuntime(runtime);
      this.updateToolButtons();
    });

    this.controller.on('directionsChanged', ({ blocks }) => {
      this.scene.syncBlocks(blocks);
    });

    this.controller.on('reverseStateChanged', ({ active }) => {
      this.toolMode = active ? 'reverse' : null;
      this.updateToolButtons();
    });

    this.controller.on('coinsChanged', ({ total }) => {
      this.updateCoins(total);
      this.renderResult();
    });

    this.controller.on('notice', ({ message }) => {
      this.showToast(message);
    });

    this.controller.on('blockAnimationRequested', async ({ blockId, removable, direction, distance }) => {
      this.animationLocked = true;
      this.updateToolButtons();
      removable ? this.audio.playSlide() : this.audio.playBlocked();
      await this.scene.animateBlock(blockId, removable, direction, distance);
      this.controller.finalizeAnimation(blockId, removable);
      this.animationLocked = false;
      this.updateToolButtons();
    });

    this.controller.on('blockAnimationFinished', ({ kind }) => {
      if (this.runtime && kind !== 'blocked') {
        this.scene.syncBlocks(this.runtime.blocks);
      }
    });

    this.controller.on('levelSucceeded', (payload) => {
      this.audio.playSuccess();
      this.audio.startMenuBgm();
      this.resultState = {
        success: true,
        message: payload.message,
        nextLevel: payload.nextLevel,
        record: payload.record,
      };
      this.refreshAchievements();
      this.openModal('result');
    });

    this.controller.on('levelFailed', (payload) => {
      this.audio.playFail();
      this.audio.startMenuBgm();
      this.resultState = {
        success: false,
        message: payload.message,
        nextLevel: null,
        record: payload.record,
      };
      this.refreshAchievements();
      this.openModal('result');
    });
  }

  private openLevelSelect(mode: GameMode): void {
    this.pendingMode = mode;
    this.renderLevelSelect();
    this.openModal('level-select');
  }

  private selectLevel(levelId: LevelId): void {
    if (!this.pendingMode) {
      this.showToast('当前没有可进入的模式。');
      return;
    }

    if (this.pendingMode === 'challenge' && levelId > this.unlockedLevel) {
      this.showToast('挑战模式需要按顺序解锁，未解锁关卡暂时不能进入。');
      return;
    }

    this.startLevel(levelId, this.pendingMode);
  }

  private startLevel(levelId: LevelId, mode: GameMode): void {
    this.closeModal();
    this.toolMode = null;
    this.pendingMode = null;
    this.resultState = null;
    this.animationLocked = false;
    this.lastTickAt = 0;
    this.controller.startLevel(levelId, mode);
    this.audio.startGameBgm();
  }

  private restartCurrentLevel(): void {
    if (!this.runtime) {
      return;
    }

    this.toolMode = null;
    this.resultState = null;
    this.pendingMode = this.runtime.mode;
    this.lastTickAt = 0;
    this.controller.restartLevel();
    this.audio.startGameBgm();
    this.closeModal();
  }

  private startNextLevel(): void {
    if (this.resultState?.nextLevel) {
      this.startLevel(this.resultState.nextLevel, this.resultState.record.mode);
    }
  }

  private returnToMenu(): void {
    this.closeModal();
    this.toolMode = null;
    this.pendingMode = null;
    this.resultState = null;
    this.animationLocked = false;
    this.lastTickAt = 0;
    this.setScreen('MENU');
    this.audio.startMenuBgm();
  }

  private canUseToolActions(): boolean {
    return (
      !!this.runtime &&
      this.screenState === 'LEVEL_RUNNING' &&
      this.activeModal === 'none' &&
      !this.animationLocked &&
      !this.resultState
    );
  }

  private toggleReverseMode(): void {
    if (!this.canUseToolActions() || !this.runtime) {
      return;
    }

    if (this.toolMode === 'reverse') {
      this.controller.toggleReverseSelection(false);
      this.showToast('已退出反向模式。');
      return;
    }

    if (this.runtime.reverseRemaining <= 0 && !this.controller.purchaseExtra('reverse')) {
      return;
    }

    this.controller.toggleReverseSelection(true);
    this.showToast('请选择一个滑块来反转方向。');
  }

  private async activateClearMode(): Promise<void> {
    if (!this.canUseToolActions() || !this.runtime) {
      return;
    }

    if (this.toolMode === 'reverse') {
      this.controller.toggleReverseSelection(false);
    }

    if (this.runtime.clearChargesRemaining <= 0) {
      if (!this.controller.purchaseExtra('clear')) {
        return;
      }
      this.runtime = this.controller.getRuntime();
      if (!this.runtime) {
        return;
      }
    }

    if (!this.controller.armClearMode()) {
      this.showToast('消块次数已经用完。');
      return;
    }

    const targetBlockIds = pickRandomBlockIds(this.runtime, 3);
    if (targetBlockIds.length === 0) {
      this.showToast('当前没有可以消除的滑块。');
      return;
    }

    this.animationLocked = true;
    this.updateToolButtons();

    for (const blockId of targetBlockIds) {
      await this.scene.animateCheatRemove(blockId);
      this.controller.finalizeCheatRemoval(blockId);
      this.audio.playSuccess();
    }

    this.animationLocked = false;
    this.updateToolButtons();
    this.showToast(`随机消除了 ${targetBlockIds.length} 个滑块。`);
  }

  private applyReset(): void {
    if (!this.canUseToolActions() || !this.runtime) {
      return;
    }

    if (this.runtime.resetRemaining <= 0 && !this.controller.purchaseExtra('reset')) {
      return;
    }

    this.toolMode = null;
    this.controller.toggleReverseSelection(false);
    this.controller.applyReset();
    this.showToast('方向已重新洗牌。');
  }

  private async handleBlockSelection(blockId: string): Promise<void> {
    if (
      !this.runtime ||
      this.screenState !== 'LEVEL_RUNNING' ||
      this.activeModal !== 'none' ||
      this.animationLocked ||
      this.resultState
    ) {
      return;
    }

    if (this.toolMode === 'reverse') {
      this.controller.applyReverse(blockId);
      this.showToast('已反转该滑块的方向。');
      return;
    }

    this.controller.requestBlockAction(blockId);
  }

  private updateRuntime(runtime: LevelRuntime): void {
    const remaining = runtime.totalBlocks - runtime.removedCount;
    const progress = runtime.totalBlocks === 0 ? 0 : runtime.removedCount / runtime.totalBlocks;

    this.timerValue.textContent =
      runtime.mode === 'challenge' && runtime.timeLimitMs !== null
        ? formatElapsed(Math.max(0, runtime.timeLimitMs - runtime.elapsedMs))
        : formatElapsed(runtime.elapsedMs);
    this.timerHint.textContent =
      runtime.mode === 'challenge' ? '挑战模式 · 倒计时' : '不限时模式 · 累计用时';
    this.modeBadge.textContent = `${formatModeLabel(runtime.mode)} · LEVEL ${runtime.levelId}`;
    this.remainValue.textContent = `剩余 ${remaining} 块`;
    this.progressValue.textContent = `${runtime.removedCount} / ${runtime.totalBlocks}`;
    this.progressFill.style.width = `${Math.round(progress * 100)}%`;
    this.reverseMeta.textContent = getToolPurchaseLabel(
      runtime.reverseRemaining,
      EXTRA_TOOL_COSTS.reverse,
      this.coins,
    );
    this.clearMeta.textContent = getToolPurchaseLabel(runtime.clearChargesRemaining, EXTRA_TOOL_COSTS.clear, this.coins);
    this.resetMeta.textContent = getToolPurchaseLabel(runtime.resetRemaining, EXTRA_TOOL_COSTS.reset, this.coins);
    this.hintValue.textContent =
      this.toolMode === 'reverse'
        ? '反向模式已激活，点击一个滑块来改变移动方向。'
        : runtime.mode === 'challenge'
          ? '挑战模式按顺序解锁，但已通过关卡仍可随时访问，并记录最快通关时间。'
          : '不限时模式可自由选关，适合观察结构和练习拆解顺序。';
  }

  private updateToolButtons(): void {
    if (!this.runtime) {
      return;
    }

    const toolLocked = !this.canUseToolActions();
    this.reverseButton.dataset.active = String(this.toolMode === 'reverse');
    this.clearButton.dataset.active = 'false';
    this.resetButton.dataset.active = 'false';
    this.reverseButton.disabled = toolLocked;
    this.clearButton.disabled =
      toolLocked || (this.runtime.clearChargesRemaining <= 0 && this.coins < EXTRA_TOOL_COSTS.clear);
    this.resetButton.disabled = toolLocked;
  }

  private openModal(modal: Exclude<AppModal, 'none'>): void {
    this.activeModal = modal;
    this.modalRoot.dataset.open = 'true';
    this.shell.dataset.modalOpen = 'true';
    this.settingsPanel.hidden = modal !== 'settings';
    this.achievementsPanel.hidden = modal !== 'achievements';
    this.coinsPanel.hidden = modal !== 'coins';
    this.levelSelectPanel.hidden = modal !== 'level-select';
    this.resultPanel.hidden = modal !== 'result';
    this.settingsRestartButton.hidden = this.screenState !== 'LEVEL_RUNNING';
    this.settingsExitButton.hidden = this.screenState !== 'LEVEL_RUNNING';

    if (modal === 'achievements') {
      this.renderAchievements();
    }
    if (modal === 'level-select') {
      this.renderLevelSelect();
    }
    if (modal === 'result') {
      this.renderResult();
    }
  }

  private closeModal(): void {
    this.activeModal = 'none';
    this.modalRoot.dataset.open = 'false';
    this.shell.dataset.modalOpen = 'false';
    this.settingsPanel.hidden = true;
    this.achievementsPanel.hidden = true;
    this.coinsPanel.hidden = true;
    this.levelSelectPanel.hidden = true;
    this.resultPanel.hidden = true;
    this.pendingMode = this.screenState === 'LEVEL_RUNNING' && this.runtime ? this.runtime.mode : null;
  }

  private setScreen(screenState: ScreenState): void {
    this.screenState = screenState;
    this.shell.dataset.screen = screenState === 'LEVEL_RUNNING' ? 'game' : 'menu';
  }

  private applyAudioSettings(settings: AudioSettings): void {
    this.bgmSlider.value = String(settings.bgmVolume);
    this.sfxSlider.value = String(settings.sfxVolume);
    this.bgmLabel.textContent = String(settings.bgmVolume);
    this.sfxLabel.textContent = String(settings.sfxVolume);
  }

  private refreshAchievements(): void {
    this.latestHistory = this.controller.getHistory();
    this.unlockedLevel = this.controller.getUnlockedLevel();
    this.renderAchievements();
    this.renderLevelSelect();
    this.renderMenuRecords();
  }

  private renderMenuRecords(): void {
    const bestCampaignTime = getBestChallengeCampaignTime(this.latestHistory);
    this.menuRecordSummary.innerHTML = `<span class="record-label">最短通关时长</span><span class="record-time">${
      bestCampaignTime !== null ? formatRecordDuration(bestCampaignTime) : '-- m -- s'
    }</span>`;
  }

  private renderAchievements(): void {
    if (this.latestHistory.length === 0) {
      this.achievementsList.innerHTML = '<div class="achievement-empty">暂时还没有对局记录。</div>';
      return;
    }

    this.achievementsList.innerHTML = this.latestHistory
      .map((record) => {
        const starText =
          record.mode === 'endless'
            ? `${record.stars} 星`
            : record.result === 'success'
              ? '挑战通关'
              : '挑战失败';

        return `<article class="achievement-item"><div class="achievement-row"><strong>Level ${
          record.level
        }</strong><span>${formatModeLabel(record.mode)}</span></div><div class="achievement-row subtle"><span>${formatDateTime(
          record.startedAt,
        )}</span><span>${formatResultLabel(
          record,
        )}</span></div><div class="achievement-row"><span>用时 ${formatElapsed(
          record.elapsedSeconds * 1000,
        )}</span><span>${starText}</span></div><div class="achievement-row subtle"><span>金币 +${
          record.earnedCoins
        }</span></div></article>`;
      })
      .join('');
  }

  private renderLevelSelect(): void {
    const mode = this.pendingMode ?? 'endless';
    this.levelSelectTitle.textContent = `${formatModeLabel(mode)} · 选择关卡`;

    this.levelSelectList.innerHTML = LEVEL_IDS.map((levelId) => {
      const spec = LEVEL_SPECS[levelId];
      const locked = mode === 'challenge' ? levelId > this.unlockedLevel : false;
      const stateLabel =
        mode === 'challenge'
          ? levelId === this.unlockedLevel
            ? '当前进度'
            : levelId < this.unlockedLevel
              ? '已通关'
              : '未解锁'
          : '可直接进入';
      const timeLabel =
        mode === 'challenge'
          ? `${Math.round(spec.challengeTimeMs / 1000)} 秒倒计时`
          : '自由观察，无倒计时';

      return `<button class="level-card" data-action="select-level" data-level="${levelId}" ${
        locked ? 'disabled' : ''
      }><span class="level-card-top"><strong>LEVEL ${levelId}</strong><span class="level-card-state">${stateLabel}</span></span><span class="level-card-meta">${spec.targetBlocks} 块 · ${spec.shape}</span><span class="level-card-meta">${timeLabel}</span></button>`;
    }).join('');
  }

  private renderResult(): void {
    if (!this.resultState) {
      return;
    }

    const { record, message, nextLevel, success } = this.resultState;
    this.resultTitle.textContent = success ? '通关成功' : '挑战失败';
    this.resultMessage.textContent = message;
    this.resultMeta.textContent = `Level ${record.level} · ${formatModeLabel(record.mode)} · 用时 ${formatElapsed(
      record.elapsedSeconds * 1000,
    )}`;
    this.resultReward.textContent = `金币 +${record.earnedCoins}`;
    this.resultStars.innerHTML =
      record.mode === 'endless'
        ? [0, 1, 2]
            .map((index) => `<span class="star-badge" data-active="${String(index < record.stars)}">★</span>`)
            .join('')
        : '<span class="challenge-tag">挑战模式会记录全局最快通关时间</span>';
    this.nextLevelButton.disabled = !success || nextLevel === null;
  }

  private updateCoins(total: number): void {
    this.coins = total;
    this.menuCoinsValue.textContent = String(total);
    this.gameCoinsValue.textContent = String(total);
    if (this.runtime) {
      this.updateRuntime(this.runtime);
    }
  }

  private showToast(message: string): void {
    this.toast.textContent = message;
    this.toast.dataset.open = 'true';
    if (this.toastTimer !== null) {
      window.clearTimeout(this.toastTimer);
    }
    this.toastTimer = window.setTimeout(() => {
      this.toast.dataset.open = 'false';
      this.toastTimer = null;
    }, 1800);
  }

  private resolveInteractionState(): InteractionState {
    if (this.animationLocked) {
      return 'BLOCK_ANIMATING';
    }
    if (this.toolMode === 'reverse') {
      return 'REVERSE_SELECTING';
    }
    return 'NORMAL_CLICK';
  }

  private installDebugHooks(): void {
    window.render_game_to_text = () =>
      JSON.stringify({
        screen: this.screenState,
        modal: this.activeModal,
        interaction: this.resolveInteractionState(),
        coins: this.coins,
        unlockedLevel: this.unlockedLevel,
        toolMode: this.toolMode,
        level:
          this.runtime && {
            id: this.runtime.levelId,
            mode: this.runtime.mode,
            elapsedMs: this.runtime.elapsedMs,
            timeLimitMs: this.runtime.timeLimitMs,
            removedCount: this.runtime.removedCount,
            totalBlocks: this.runtime.totalBlocks,
            reverseRemaining: this.runtime.reverseRemaining,
            resetRemaining: this.runtime.resetRemaining,
            clearChargesRemaining: this.runtime.clearChargesRemaining,
            removableCount: this.runtime.removableCount,
            coordinateSystem: 'grid: x left-right, y bottom-top, z back-front',
            activeBlocks: this.runtime.blocks
              .filter((block) => !block.removed)
              .map((block) => ({
                id: block.id,
                x: block.x,
                y: block.y,
                z: block.z,
                sizeX: block.sizeX,
                sizeY: block.sizeY,
                sizeZ: block.sizeZ,
                direction: block.direction,
              })),
          },
      });

    window.advanceTime = (ms: number) => {
      if (this.runtime && this.screenState === 'LEVEL_RUNNING' && !this.resultState) {
        this.controller.setElapsedBase(this.runtime.elapsedMs + ms);
        this.lastTickAt = performance.now();
        this.controller.tick(this.lastTickAt);
      }
      this.scene.advanceTime(ms);
    };
  }

  private loop = (): void => {
    if (this.screenState === 'LEVEL_RUNNING' && !this.resultState) {
      const now = performance.now();
      if (this.lastTickAt === 0 || now - this.lastTickAt >= App.TICK_INTERVAL_MS) {
        this.lastTickAt = now;
        this.controller.tick(now);
      }
    }
    this.scene.render();
    window.requestAnimationFrame(this.loop);
  };
}
