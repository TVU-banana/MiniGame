import type { GameStats } from "../app/GameConfig";
import { GameEvents, eventBus } from "../app/EventBus";
import { formatDuration } from "../core/Timer";

export class ResultPanel {
  private readonly element: HTMLDivElement;
  private readonly scoreEl: HTMLSpanElement;
  private readonly durationEl: HTMLSpanElement;
  private readonly linesEl: HTMLSpanElement;

  constructor(parent: HTMLElement) {
    this.element = document.createElement("div");
    this.element.className = "modal hidden";
    this.element.innerHTML = `
      <div class="modal-card">
        <h2>本局结算</h2>
        <p>最终得分：<span id="result-score">0</span></p>
        <p>总时长：<span id="result-duration">00:00</span></p>
        <p>消除总行数：<span id="result-lines">0</span></p>
        <div class="modal-actions">
          <button type="button" id="result-restart">再来一局</button>
          <button type="button" id="result-menu">返回菜单</button>
        </div>
      </div>
    `;
    parent.appendChild(this.element);

    this.scoreEl = this.element.querySelector<HTMLSpanElement>("#result-score")!;
    this.durationEl = this.element.querySelector<HTMLSpanElement>("#result-duration")!;
    this.linesEl = this.element.querySelector<HTMLSpanElement>("#result-lines")!;

    const restartBtn = this.element.querySelector<HTMLButtonElement>("#result-restart");
    const menuBtn = this.element.querySelector<HTMLButtonElement>("#result-menu");

    restartBtn?.addEventListener("click", () => {
      eventBus.emit(GameEvents.StartGame);
    });
    menuBtn?.addEventListener("click", () => {
      eventBus.emit(GameEvents.ReturnToMenu);
    });
  }

  show(stats: GameStats): void {
    this.scoreEl.textContent = `${stats.score}`;
    this.durationEl.textContent = formatDuration(stats.durationSeconds);
    this.linesEl.textContent = `${stats.linesCleared}`;
    this.element.classList.remove("hidden");
  }

  hide(): void {
    this.element.classList.add("hidden");
  }
}
