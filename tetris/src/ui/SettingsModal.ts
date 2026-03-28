import { GameEvents, eventBus } from "../app/EventBus";
import { audioManager } from "../audio/AudioManager";

export class SettingsModal {
  private readonly element: HTMLDivElement;
  private readonly audioCheckbox: HTMLInputElement;

  constructor(parent: HTMLElement) {
    this.element = document.createElement("div");
    this.element.className = "modal hidden";
    this.element.innerHTML = `
      <div class="modal-card">
        <h2>设置</h2>
        <label class="setting-item">
          <span>音频开关</span>
          <input type="checkbox" id="audio-toggle" />
        </label>
        <button type="button" id="settings-close">关闭</button>
      </div>
    `;
    parent.appendChild(this.element);

    this.audioCheckbox = this.element.querySelector<HTMLInputElement>("#audio-toggle")!;
    this.audioCheckbox.checked = audioManager.isEnabled();

    const closeBtn = this.element.querySelector<HTMLButtonElement>("#settings-close");
    closeBtn?.addEventListener("click", () => {
      eventBus.emit(GameEvents.CloseSettings);
    });

    this.audioCheckbox.addEventListener("change", () => {
      audioManager.setEnabled(this.audioCheckbox.checked);
      if (this.audioCheckbox.checked) {
        audioManager.unlockFromGesture();
      }
    });
  }

  show(): void {
    this.audioCheckbox.checked = audioManager.isEnabled();
    this.element.classList.remove("hidden");
  }

  hide(): void {
    this.element.classList.add("hidden");
  }
}
