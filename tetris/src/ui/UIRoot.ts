import type { GameRecord, GameStats, GlobalGameState } from "../app/GameConfig";
import { GameEvents, type StatePayload, eventBus } from "../app/EventBus";
import { audioManager } from "../audio/AudioManager";
import { historyStore } from "../core/HistoryStore";
import { formatDuration } from "../core/Timer";
import { HistoryModal } from "./HistoryModal";
import { PausePanel } from "./PausePanel";
import { ResultPanel } from "./ResultPanel";
import { SettingsModal } from "./SettingsModal";

export class UIRoot {
  private readonly root: HTMLElement;
  private readonly menuLayer: HTMLDivElement;
  private readonly hudLayer: HTMLDivElement;
  private readonly controlsLayer: HTMLDivElement;
  private readonly scoreValue: HTMLSpanElement;
  private readonly timeValue: HTMLSpanElement;
  private readonly pauseButton: HTMLButtonElement;

  private readonly settingsModal: SettingsModal;
  private readonly historyModal: HistoryModal;
  private readonly pausePanel: PausePanel;
  private readonly resultPanel: ResultPanel;

  private latestRecords: GameRecord[] = [];
  private latestResult: GameStats = {
    score: 0,
    durationSeconds: 0,
    linesCleared: 0
  };

  constructor(root: HTMLElement) {
    this.root = root;

    this.menuLayer = document.createElement("div");
    this.menuLayer.className = "menu-layer";
    this.menuLayer.innerHTML = `
      <div class="menu-card">
        <h1>俄罗斯方块</h1>
        <p class="menu-subtitle">tetris · 手机竖屏版</p>
        <div class="menu-actions">
          <button type="button" id="menu-start">开始游戏</button>
          <button type="button" id="menu-settings">设置</button>
          <button type="button" id="menu-history">历史记录</button>
        </div>
      </div>
    `;

    this.hudLayer = document.createElement("div");
    this.hudLayer.className = "hud-layer hidden";
    this.hudLayer.innerHTML = `
      <div class="hud-item">得分：<span id="hud-score">0</span></div>
      <div class="hud-item">时长：<span id="hud-time">00:00</span></div>
      <button type="button" id="hud-pause">暂停</button>
    `;

    this.controlsLayer = document.createElement("div");
    this.controlsLayer.className = "controls-layer hidden";
    this.controlsLayer.innerHTML = `
      <button type="button" id="btn-left">左移</button>
      <button type="button" id="btn-right">右移</button>
      <button type="button" id="btn-soft-drop">软降</button>
      <button type="button" id="btn-rotate">旋转</button>
    `;

    this.root.appendChild(this.menuLayer);
    this.root.appendChild(this.hudLayer);
    this.root.appendChild(this.controlsLayer);

    this.settingsModal = new SettingsModal(this.root);
    this.historyModal = new HistoryModal(this.root);
    this.pausePanel = new PausePanel(this.root);
    this.resultPanel = new ResultPanel(this.root);

    this.scoreValue = this.hudLayer.querySelector<HTMLSpanElement>("#hud-score")!;
    this.timeValue = this.hudLayer.querySelector<HTMLSpanElement>("#hud-time")!;
    this.pauseButton = this.hudLayer.querySelector<HTMLButtonElement>("#hud-pause")!;

    this.bindMenuActions();
    this.bindHudActions();
    this.bindControls();
    this.bindBusEvents();
  }

  private bindMenuActions(): void {
    const startBtn = this.menuLayer.querySelector<HTMLButtonElement>("#menu-start");
    const settingsBtn = this.menuLayer.querySelector<HTMLButtonElement>("#menu-settings");
    const historyBtn = this.menuLayer.querySelector<HTMLButtonElement>("#menu-history");

    startBtn?.addEventListener("click", () => {
      audioManager.unlockFromGesture();
      eventBus.emit(GameEvents.StartGame);
    });

    settingsBtn?.addEventListener("click", () => {
      audioManager.unlockFromGesture();
      eventBus.emit(GameEvents.OpenSettings);
    });

    historyBtn?.addEventListener("click", () => {
      audioManager.unlockFromGesture();
      eventBus.emit(GameEvents.OpenHistory);
    });
  }

  private bindHudActions(): void {
    this.pauseButton.addEventListener("click", () => {
      eventBus.emit(GameEvents.PauseGame);
    });
  }

  private bindControls(): void {
    const left = this.controlsLayer.querySelector<HTMLButtonElement>("#btn-left");
    const right = this.controlsLayer.querySelector<HTMLButtonElement>("#btn-right");
    const softDrop = this.controlsLayer.querySelector<HTMLButtonElement>("#btn-soft-drop");
    const rotate = this.controlsLayer.querySelector<HTMLButtonElement>("#btn-rotate");

    if (left) {
      this.bindHoldButton(left, GameEvents.MoveLeftStart, GameEvents.MoveLeftEnd);
    }
    if (right) {
      this.bindHoldButton(right, GameEvents.MoveRightStart, GameEvents.MoveRightEnd);
    }
    if (softDrop) {
      this.bindHoldButton(softDrop, GameEvents.SoftDropStart, GameEvents.SoftDropEnd);
    }
    if (rotate) {
      rotate.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        eventBus.emit(GameEvents.Rotate);
      });
      rotate.addEventListener("click", (event) => {
        event.preventDefault();
      });
    }
  }

  private bindHoldButton(button: HTMLButtonElement, startEvent: string, endEvent: string): void {
    const emitEnd = () => eventBus.emit(endEvent);

    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      eventBus.emit(startEvent);
    });
    button.addEventListener("pointerup", emitEnd);
    button.addEventListener("pointercancel", emitEnd);
    button.addEventListener("pointerleave", emitEnd);
    button.addEventListener("contextmenu", (event) => event.preventDefault());
  }

  private bindBusEvents(): void {
    eventBus.on(GameEvents.StateChanged, (payload: StatePayload) => {
      this.renderByState(payload.globalState);
    });

    eventBus.on(GameEvents.HudUpdated, (payload: { score: number; durationSeconds: number }) => {
      this.scoreValue.textContent = `${payload.score}`;
      this.timeValue.textContent = formatDuration(payload.durationSeconds);
    });

    eventBus.on(GameEvents.ResultReady, (stats: GameStats) => {
      this.latestResult = stats;
    });

    eventBus.on(GameEvents.HistoryUpdated, (records: GameRecord[]) => {
      this.latestRecords = records;
    });
  }

  private renderByState(state: GlobalGameState): void {
    this.settingsModal.hide();
    this.historyModal.hide();
    this.pausePanel.hide();
    this.resultPanel.hide();

    if (state === "MENU") {
      this.menuLayer.classList.remove("hidden");
      this.hudLayer.classList.add("hidden");
      this.controlsLayer.classList.add("hidden");
      return;
    }

    if (state === "PLAYING") {
      this.menuLayer.classList.add("hidden");
      this.hudLayer.classList.remove("hidden");
      this.controlsLayer.classList.remove("hidden");
      return;
    }

    if (state === "PAUSED") {
      this.menuLayer.classList.add("hidden");
      this.hudLayer.classList.remove("hidden");
      this.controlsLayer.classList.add("hidden");
      this.pausePanel.show();
      return;
    }

    if (state === "RESULT") {
      this.menuLayer.classList.add("hidden");
      this.hudLayer.classList.add("hidden");
      this.controlsLayer.classList.add("hidden");
      this.resultPanel.show(this.latestResult);
      return;
    }

    if (state === "SETTINGS") {
      this.menuLayer.classList.add("hidden");
      this.hudLayer.classList.add("hidden");
      this.controlsLayer.classList.add("hidden");
      this.settingsModal.show();
      return;
    }

    if (state === "HISTORY") {
      this.menuLayer.classList.add("hidden");
      this.hudLayer.classList.add("hidden");
      this.controlsLayer.classList.add("hidden");
      const records = this.latestRecords.length > 0 ? this.latestRecords : historyStore.getRecords();
      this.historyModal.show(records);
      return;
    }

    this.menuLayer.classList.remove("hidden");
    this.hudLayer.classList.add("hidden");
    this.controlsLayer.classList.add("hidden");
  }
}
