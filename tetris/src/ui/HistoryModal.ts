import type { GameRecord } from "../app/GameConfig";
import { GameEvents, eventBus } from "../app/EventBus";
import { formatDuration } from "../core/Timer";

export class HistoryModal {
  private readonly element: HTMLDivElement;
  private readonly list: HTMLUListElement;

  constructor(parent: HTMLElement) {
    this.element = document.createElement("div");
    this.element.className = "modal hidden";
    this.element.innerHTML = `
      <div class="modal-card">
        <h2>历史记录（最近 10 场）</h2>
        <ul class="history-list"></ul>
        <button type="button" id="history-close">关闭</button>
      </div>
    `;
    parent.appendChild(this.element);

    this.list = this.element.querySelector<HTMLUListElement>(".history-list")!;
    const closeBtn = this.element.querySelector<HTMLButtonElement>("#history-close");
    closeBtn?.addEventListener("click", () => {
      eventBus.emit(GameEvents.CloseHistory);
    });
  }

  show(records: GameRecord[]): void {
    this.renderRecords(records);
    this.element.classList.remove("hidden");
  }

  hide(): void {
    this.element.classList.add("hidden");
  }

  private renderRecords(records: GameRecord[]): void {
    this.list.innerHTML = "";
    if (records.length === 0) {
      const empty = document.createElement("li");
      empty.className = "history-empty";
      empty.textContent = "暂无记录";
      this.list.appendChild(empty);
      return;
    }
    for (const record of records) {
      const item = document.createElement("li");
      item.className = "history-item";
      item.innerHTML = `
        <span>得分：${record.score}</span>
        <span>时长：${formatDuration(record.durationSeconds)}</span>
        <span>时间：${record.dateKey}</span>
      `;
      this.list.appendChild(item);
    }
  }
}
