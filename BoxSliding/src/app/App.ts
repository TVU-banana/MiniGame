import type { AudioSettings } from '../audio/AudioManager';
import { AudioManager } from '../audio/AudioManager';
import type { LevelRuntime, ScreenState } from './GameState';
import { DirectionAssigner } from '../core/DirectionAssigner';
import { GameController } from '../core/GameController';
import { HistoryStore } from '../core/HistoryStore';
import { LevelGenerator } from '../core/LevelGenerator';
import type { LevelId, RunRecord } from '../core/BlockModel';
import { MoveValidator } from '../core/MoveValidator';
import { GameScene } from '../scene/GameScene';
import { formatElapsed } from '../utils/time';

interface ResultState {
  success: boolean;
  message: string;
  nextLevel: LevelId | null;
  record: RunRecord;
  starsText: string;
}

type AppModal = 'none' | 'settings' | 'history' | 'result';

function must<T extends Element>(value: T | null, message: string): T {
  if (!value) {
    throw new Error(message);
  }
  return value;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatResultLabel(record: RunRecord): string {
  return record.result === 'success' ? '通关' : '失败';
}

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

  private readonly titleValue: HTMLSpanElement;

  private readonly timeValue: HTMLSpanElement;

  private readonly remainValue: HTMLSpanElement;

  private readonly progressValue: HTMLSpanElement;

  private readonly progressFill: HTMLDivElement;

  private readonly levelBadge: HTMLSpanElement;

  private readonly reverseButton: HTMLButtonElement;

  private readonly reverseMeta: HTMLSpanElement;

  private readonly resetButton: HTMLButtonElement;

  private readonly resetMeta: HTMLSpanElement;

  private readonly modalRoot: HTMLDivElement;

  private readonly settingsPanel: HTMLDivElement;

  private readonly historyPanel: HTMLDivElement;

  private readonly resultPanel: HTMLDivElement;

  private readonly bgmSlider: HTMLInputElement;

  private readonly sfxSlider: HTMLInputElement;

  private readonly bgmLabel: HTMLSpanElement;

  private readonly sfxLabel: HTMLSpanElement;

  private readonly historyList: HTMLDivElement;

  private readonly resultTitle: HTMLHeadingElement;

  private readonly resultMessage: HTMLParagraphElement;

  private readonly resultStars: HTMLDivElement;

  private readonly resultMeta: HTMLParagraphElement;

  private readonly nextLevelButton: HTMLButtonElement;

  private readonly footerCaption: HTMLParagraphElement;

  private screenState: ScreenState = 'MENU';

  private activeModal: AppModal = 'none';

  private runtime: LevelRuntime | null = null;

  private resultState: ResultState | null = null;

  private reverseSelecting = false;

  private latestHistory: RunRecord[] = [];

  private animationLocked = false;

  constructor(private readonly root: HTMLDivElement) {
    this.root.innerHTML = `
      <div class="app-shell">
        <div class="texture-layer"></div>
        <div class="menu-screen" data-screen="menu">
          <button class="corner-button" data-action="open-settings" data-variant="top-left">设置</button>
          <button class="corner-button" data-action="open-history" data-variant="bottom-left">历史记录</button>
          <div class="menu-hero">
            <p class="eyebrow">3D SPACE PUZZLE</p>
            <h1 class="menu-title">滑块消消乐</h1>
            <p class="menu-copy">旋转高塔，识别可滑出的方块，在有限的反向与重置次数中找出最短通关路径。</p>
            <div class="menu-preview">
              <div class="preview-stack preview-a"></div>
              <div class="preview-stack preview-b"></div>
              <div class="preview-stack preview-c"></div>
            </div>
            <button class="primary-launch" data-action="start-game">开始游戏</button>
          </div>
        </div>
        <div class="game-screen" data-screen="game">
          <div class="hud-strip">
            <div class="pill-card">
              <span class="pill-icon">⏱</span>
              <span class="pill-value" data-role="time">00:00</span>
            </div>
            <div class="pill-card">
              <span class="pill-icon">☞</span>
              <span class="pill-value" data-role="remain">0</span>
            </div>
          </div>
          <div class="game-topline">
            <span class="level-badge" data-role="level">LEVEL 1</span>
            <span class="game-title" data-role="title">滑块消消乐</span>
            <div class="pause-actions">
              <button class="mini-action" data-action="pause-settings">设置</button>
              <button class="mini-action" data-action="go-home">菜单</button>
            </div>
          </div>
          <div class="scene-shell">
            <div class="scene-host"></div>
          </div>
          <div class="progress-shell">
            <span class="progress-copy" data-role="progress">0 / 0</span>
            <div class="progress-track">
              <div class="progress-fill" data-role="progress-fill"></div>
            </div>
          </div>
          <div class="toolbar">
            <button class="tool-button" data-action="toggle-reverse">
              <span class="tool-label">反向</span>
              <span class="tool-meta" data-role="reverse-meta">5 次</span>
            </button>
            <button class="tool-button" data-action="apply-reset">
              <span class="tool-label">重置</span>
              <span class="tool-meta" data-role="reset-meta">5 次</span>
            </button>
          </div>
          <p class="footer-caption">拖动旋转，双指缩放，轻点方块尝试移除。</p>
        </div>
        <div class="modal-root" data-open="false">
          <div class="modal-scrim" data-action="close-modal"></div>
          <div class="modal-card">
            <div class="modal-panel" data-panel="settings">
              <div class="modal-head">
                <div>
                  <p class="modal-kicker">AUDIO</p>
                  <h2>设置</h2>
                </div>
                <button class="close-button" data-action="close-modal">关闭</button>
              </div>
              <label class="slider-field">
                <span>BGM 音量 <strong data-role="bgm-label">62</strong></span>
                <input data-role="bgm-slider" type="range" min="0" max="100" value="62" />
              </label>
              <label class="slider-field">
                <span>音效音量 <strong data-role="sfx-label">80</strong></span>
                <input data-role="sfx-slider" type="range" min="0" max="100" value="80" />
              </label>
            </div>
            <div class="modal-panel" data-panel="history">
              <div class="modal-head">
                <div>
                  <p class="modal-kicker">HISTORY</p>
                  <h2>最近 10 条记录</h2>
                </div>
                <button class="close-button" data-action="close-modal">关闭</button>
              </div>
              <div class="history-list" data-role="history-list"></div>
            </div>
            <div class="modal-panel" data-panel="result">
              <div class="modal-head">
                <div>
                  <p class="modal-kicker">RESULT</p>
                  <h2 data-role="result-title">结算</h2>
                </div>
                <button class="close-button" data-action="close-modal">关闭</button>
              </div>
              <p class="result-message" data-role="result-message"></p>
              <div class="star-row" data-role="result-stars"></div>
              <p class="result-meta" data-role="result-meta"></p>
              <div class="result-actions">
                <button class="mini-action strong" data-action="result-next">下一关</button>
                <button class="mini-action" data-action="result-replay">重新开始</button>
                <button class="mini-action" data-action="result-home">返回菜单</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.sceneHost = must(this.root.querySelector('.scene-host'), '缺少场景挂载节点。');
    this.titleValue = must(this.root.querySelector('[data-role="title"]'), '缺少标题节点。');
    this.timeValue = must(this.root.querySelector('[data-role="time"]'), '缺少时间节点。');
    this.remainValue = must(this.root.querySelector('[data-role="remain"]'), '缺少剩余节点。');
    this.progressValue = must(this.root.querySelector('[data-role="progress"]'), '缺少进度节点。');
    this.progressFill = must(this.root.querySelector('[data-role="progress-fill"]'), '缺少进度条节点。');
    this.levelBadge = must(this.root.querySelector('[data-role="level"]'), '缺少关卡节点。');
    this.reverseButton = must(this.root.querySelector('[data-action="toggle-reverse"]'), '缺少反向按钮。');
    this.reverseMeta = must(this.root.querySelector('[data-role="reverse-meta"]'), '缺少反向计数节点。');
    this.resetButton = must(this.root.querySelector('[data-action="apply-reset"]'), '缺少重置按钮。');
    this.resetMeta = must(this.root.querySelector('[data-role="reset-meta"]'), '缺少重置计数节点。');
    this.modalRoot = must(this.root.querySelector('.modal-root'), '缺少浮窗节点。');
    this.settingsPanel = must(this.root.querySelector('[data-panel="settings"]'), '缺少设置面板。');
    this.historyPanel = must(this.root.querySelector('[data-panel="history"]'), '缺少历史面板。');
    this.resultPanel = must(this.root.querySelector('[data-panel="result"]'), '缺少结果面板。');
    this.bgmSlider = must(this.root.querySelector('[data-role="bgm-slider"]'), '缺少 BGM 滑条。');
    this.sfxSlider = must(this.root.querySelector('[data-role="sfx-slider"]'), '缺少音效滑条。');
    this.bgmLabel = must(this.root.querySelector('[data-role="bgm-label"]'), '缺少 BGM 文本。');
    this.sfxLabel = must(this.root.querySelector('[data-role="sfx-label"]'), '缺少音效文本。');
    this.historyList = must(this.root.querySelector('[data-role="history-list"]'), '缺少历史列表。');
    this.resultTitle = must(this.root.querySelector('[data-role="result-title"]'), '缺少结果标题。');
    this.resultMessage = must(this.root.querySelector('[data-role="result-message"]'), '缺少结果文案。');
    this.resultStars = must(this.root.querySelector('[data-role="result-stars"]'), '缺少星级节点。');
    this.resultMeta = must(this.root.querySelector('[data-role="result-meta"]'), '缺少结果信息节点。');
    this.nextLevelButton = must(this.root.querySelector('[data-action="result-next"]'), '缺少下一关按钮。');
    this.footerCaption = must(this.root.querySelector('.footer-caption'), '缺少底部提示文案。');

    this.scene = new GameScene(this.sceneHost, {
      onBlockSelect: (blockId) => {
        void this.handleBlockSelection(blockId);
      },
      onPointerActivity: () => {
        void this.audio.unlock();
      },
    });
  }

  mount(): void {
    this.bindDomEvents();
    this.bindControllerEvents();
    this.applyAudioSettings(this.audio.getSettings());
    this.refreshHistory();
    this.setScreen('MENU');
    this.audio.startMenuBgm();
    this.root.addEventListener('pointerdown', () => {
      void this.audio.unlock();
    });
    this.loop();
  }

  private bindDomEvents(): void {
    this.root.addEventListener('click', (event) => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      const action = target?.closest<HTMLElement>('[data-action]')?.dataset.action;
      if (!action) {
        return;
      }

      this.audio.playButton();

      switch (action) {
        case 'start-game':
          this.startLevel(1);
          break;
        case 'open-settings':
        case 'pause-settings':
          this.openModal('settings');
          break;
        case 'open-history':
          this.openModal('history');
          break;
        case 'close-modal':
          this.closeModal();
          break;
        case 'toggle-reverse':
          this.toggleReverseMode();
          break;
        case 'apply-reset':
          this.applyReset();
          break;
        case 'go-home':
        case 'result-home':
          this.returnToMenu();
          break;
        case 'result-next':
          this.startNextLevel();
          break;
        case 'result-replay':
          this.restartCurrentLevel();
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
    this.controller.on('levelLoaded', (payload) => {
      this.runtime = payload.runtime;
      this.resultState = null;
      this.reverseSelecting = false;
      this.animationLocked = false;
      this.scene.loadLevel(payload.blocks, payload.dimensions);
      this.updateRuntime(payload.runtime);
      this.levelBadge.textContent = `LEVEL ${payload.levelId}`;
      this.footerCaption.textContent = '拖动旋转，双指缩放，轻点方块尝试移除。';
    });

    this.controller.on('runtimeChanged', (runtime) => {
      this.runtime = runtime;
      this.updateRuntime(runtime);
    });

    this.controller.on('directionsChanged', ({ blocks }) => {
      this.scene.syncBlocks(blocks);
      this.footerCaption.textContent = '箭头方向已刷新，继续寻找可滑出的方块。';
    });

    this.controller.on('reverseStateChanged', ({ active }) => {
      this.reverseSelecting = active;
      this.reverseButton.dataset.active = String(active);
      this.footerCaption.textContent = active
        ? '反向模式已开启，下一次点击方块会翻转它的滑出方向。'
        : '拖动旋转，双指缩放，轻点方块尝试移除。';
    });

    this.controller.on('blockAnimationRequested', async ({ blockId, removable, direction, distance }) => {
      this.animationLocked = true;
      if (removable) {
        this.audio.playSlide();
      } else {
        this.audio.playBlocked();
      }
      await this.scene.animateBlock(blockId, removable, direction, distance);
      this.controller.finalizeAnimation(blockId, removable);
      this.animationLocked = false;
    });

    this.controller.on('blockAnimationFinished', () => {
      if (this.runtime) {
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
        starsText: payload.starsText,
      };
      this.refreshHistory();
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
        starsText: '0 星',
      };
      this.refreshHistory();
      this.openModal('result');
    });
  }

  private startLevel(levelId: LevelId): void {
    this.closeModal();
    this.setScreen('LEVEL_RUNNING');
    this.controller.startLevel(levelId);
    this.audio.startGameBgm();
  }

  private restartCurrentLevel(): void {
    if (this.runtime) {
      this.startLevel(this.runtime.levelId);
    }
  }

  private startNextLevel(): void {
    if (this.resultState?.nextLevel) {
      this.startLevel(this.resultState.nextLevel);
    }
  }

  private returnToMenu(): void {
    this.closeModal();
    this.setScreen('MENU');
    this.audio.startMenuBgm();
  }

  private toggleReverseMode(): void {
    if (!this.runtime || this.animationLocked) {
      return;
    }

    if (this.runtime.reverseRemaining <= 0) {
      this.footerCaption.textContent = '反向次数已耗尽。';
      return;
    }

    this.controller.toggleReverseSelection(!this.reverseSelecting);
  }

  private applyReset(): void {
    if (!this.runtime || this.animationLocked) {
      return;
    }

    if (this.runtime.resetRemaining <= 0) {
      this.footerCaption.textContent = '重置次数已耗尽。';
      return;
    }

    this.controller.applyReset();
  }

  private async handleBlockSelection(blockId: string): Promise<void> {
    if (!this.runtime || this.screenState !== 'LEVEL_RUNNING' || this.activeModal !== 'none') {
      return;
    }

    if (this.animationLocked) {
      return;
    }

    if (this.reverseSelecting) {
      this.controller.applyReverse(blockId);
      return;
    }

    this.controller.requestBlockAction(blockId);
  }

  private updateRuntime(runtime: LevelRuntime): void {
    const remaining = runtime.totalBlocks - runtime.removedCount;
    const progress = runtime.totalBlocks === 0 ? 0 : runtime.removedCount / runtime.totalBlocks;

    this.timeValue.textContent = formatElapsed(runtime.elapsedMs);
    this.remainValue.textContent = String(remaining);
    this.progressValue.textContent = `${runtime.removedCount} / ${runtime.totalBlocks}`;
    this.progressFill.style.width = `${Math.round(progress * 100)}%`;
    this.reverseMeta.textContent = `${runtime.reverseRemaining} 次`;
    this.resetMeta.textContent = `${runtime.resetRemaining} 次`;
    this.reverseButton.disabled = runtime.reverseRemaining <= 0 || this.animationLocked;
    this.resetButton.disabled = runtime.resetRemaining <= 0 || this.animationLocked;
    this.titleValue.textContent = `剩余 ${remaining} 块`;
  }

  private openModal(modal: Exclude<AppModal, 'none'>): void {
    this.activeModal = modal;
    this.modalRoot.dataset.open = 'true';
    this.settingsPanel.hidden = modal !== 'settings';
    this.historyPanel.hidden = modal !== 'history';
    this.resultPanel.hidden = modal !== 'result';

    if (modal === 'history') {
      this.renderHistory();
    }

    if (modal === 'result') {
      this.renderResult();
    }
  }

  private closeModal(): void {
    this.activeModal = 'none';
    this.modalRoot.dataset.open = 'false';
  }

  private setScreen(screenState: ScreenState): void {
    this.screenState = screenState;
    this.root.dataset.screen = screenState === 'LEVEL_RUNNING' ? 'game' : 'menu';
  }

  private applyAudioSettings(settings: AudioSettings): void {
    this.bgmSlider.value = String(settings.bgmVolume);
    this.sfxSlider.value = String(settings.sfxVolume);
    this.bgmLabel.textContent = String(settings.bgmVolume);
    this.sfxLabel.textContent = String(settings.sfxVolume);
  }

  private refreshHistory(): void {
    this.latestHistory = this.controller.getHistory();
    this.renderHistory();
  }

  private renderHistory(): void {
    if (this.latestHistory.length === 0) {
      this.historyList.innerHTML = '<div class="history-empty">还没有历史记录，先去完成一局吧。</div>';
      return;
    }

    this.historyList.innerHTML = this.latestHistory
      .map((record) => {
        return `
          <article class="history-item">
            <div class="history-row">
              <strong>Level ${record.level}</strong>
              <span>${formatResultLabel(record)}</span>
            </div>
            <div class="history-row subtle">
              <span>开始 ${formatDateTime(record.startedAt)}</span>
              <span>结束 ${formatDateTime(record.finishedAt)}</span>
            </div>
            <div class="history-row">
              <span>用时 ${formatElapsed(record.elapsedSeconds * 1000)}</span>
              <span>${record.stars} 星</span>
            </div>
          </article>
        `;
      })
      .join('');
  }

  private renderResult(): void {
    const result = this.resultState;
    if (!result) {
      return;
    }

    this.resultTitle.textContent = result.success ? '通关成功' : '本局失败';
    this.resultMessage.textContent = result.message;
    this.resultMeta.textContent = `Level ${result.record.level} · 用时 ${formatElapsed(
      result.record.elapsedSeconds * 1000,
    )} · ${result.starsText}`;
    this.resultStars.innerHTML = [0, 1, 2]
      .map((index) => {
        const active = index < result.record.stars;
        return `<span class="star-badge" data-active="${String(active)}">★</span>`;
      })
      .join('');
    this.nextLevelButton.disabled = !result.success || result.nextLevel === null;
  }

  private loop = (): void => {
    if (this.screenState === 'LEVEL_RUNNING') {
      this.controller.tick(performance.now());
    }
    this.scene.render();
    window.requestAnimationFrame(this.loop);
  };
}
