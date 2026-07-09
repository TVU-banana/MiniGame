import { GameEvents, eventBus } from "../app/EventBus";

export class PausePanel {
  private readonly element: HTMLDivElement;

  constructor(parent: HTMLElement) {
    this.element = document.createElement("div");
    this.element.className = "modal hidden";
    this.element.innerHTML = `
      <div class="modal-card">
        <h2>已暂停</h2>
        <div class="modal-actions">
          <button type="button" id="pause-resume">继续游戏</button>
          <button type="button" id="pause-menu">返回菜单</button>
        </div>
      </div>
    `;
    parent.appendChild(this.element);

    const resumeBtn = this.element.querySelector<HTMLButtonElement>("#pause-resume");
    const menuBtn = this.element.querySelector<HTMLButtonElement>("#pause-menu");

    resumeBtn?.addEventListener("click", () => {
      eventBus.emit(GameEvents.ResumeGame);
    });
    menuBtn?.addEventListener("click", () => {
      eventBus.emit(GameEvents.ReturnToMenu);
    });
  }

  show(): void {
    this.element.classList.remove("hidden");
  }

  hide(): void {
    this.element.classList.add("hidden");
  }
}
