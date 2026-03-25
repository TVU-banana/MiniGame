import { appEvents } from '../app/events';
import type { GameResult, GameSnapshot, RunRecord, SettingsState } from '../app/types';
import { formatDateTime, formatSeconds } from '../utils/time';
import { VirtualJoystick } from '../systems/VirtualJoystick';

export class AppUI {
  private readonly root: HTMLDivElement;
  private readonly menuScreen: HTMLDivElement;
  private readonly hud: HTMLDivElement;
  private readonly settingsOverlay: HTMLDivElement;
  private readonly historyOverlay: HTMLDivElement;
  private readonly resultOverlay: HTMLDivElement;
  private readonly toast: HTMLDivElement;
  private readonly joystick: VirtualJoystick;
  private readonly values: Record<string, HTMLElement>;
  private readonly recordsContainer: HTMLDivElement;

  constructor(parent: HTMLElement, settings: SettingsState, records: RunRecord[]) {
    this.root = document.createElement('div');
    this.root.className = 'ui-layer';
    this.root.innerHTML = this.template();
    parent.appendChild(this.root);

    this.menuScreen = this.query<HTMLDivElement>('[data-screen="menu"]');
    this.hud = this.query<HTMLDivElement>('.hud');
    this.settingsOverlay = this.query<HTMLDivElement>('[data-overlay="settings"]');
    this.historyOverlay = this.query<HTMLDivElement>('[data-overlay="history"]');
    this.resultOverlay = this.query<HTMLDivElement>('[data-overlay="result"]');
    this.toast = this.query<HTMLDivElement>('.toast');
    this.recordsContainer = this.query<HTMLDivElement>('.records');
    this.values = {
      hp: this.query('[data-value="hp"]'),
      time: this.query('[data-value="time"]'),
      kills: this.query('[data-value="kills"]'),
      knives: this.query('[data-value="knives"]')
    };

    this.bindButtons();
    const joystickRoot = this.query<HTMLElement>('.joystick');
    const joystickKnob = this.query<HTMLElement>('.joystick__knob');
    this.joystick = new VirtualJoystick(joystickRoot, joystickKnob);
    this.applySettings(settings);
    this.renderRecords(records);
  }

  getJoystickVector(): { x: number; y: number } {
    return this.joystick.getVector();
  }

  resetJoystick(): void {
    this.joystick.reset();
  }

  showMenu(): void {
    this.menuScreen.hidden = false;
    this.hud.hidden = true;
    this.settingsOverlay.hidden = true;
    this.historyOverlay.hidden = true;
    this.resultOverlay.hidden = true;
    this.query('.joystick').hidden = true;
  }

  showGameHud(): void {
    this.menuScreen.hidden = true;
    this.hud.hidden = false;
    this.query('.joystick').hidden = false;
    this.settingsOverlay.hidden = true;
    this.historyOverlay.hidden = true;
    this.resultOverlay.hidden = true;
  }

  showSettings(): void {
    this.settingsOverlay.hidden = false;
  }

  hideSettings(): void {
    this.settingsOverlay.hidden = true;
  }

  showHistory(): void {
    this.historyOverlay.hidden = false;
  }

  hideHistory(): void {
    this.historyOverlay.hidden = true;
  }

  showResult(result: GameResult): void {
    this.menuScreen.hidden = true;
    this.hud.hidden = true;
    this.query('.joystick').hidden = true;
    this.resultOverlay.hidden = false;
    this.query('[data-result="title"]').textContent = result.success ? '生存成功' : '战斗失败';
    this.query('[data-result="summary"]').textContent = result.success
      ? '你撑过了 180 秒，刀阵守住了最后一圈。'
      : '怪物撕开了刀阵缺口，下次走位再狠一点。';
    this.query('[data-result="time"]').textContent = `${result.survivalSeconds} 秒`;
    this.query('[data-result="kills"]').textContent = `${result.kills}`;
    this.query('[data-result="knives"]').textContent = `${result.maxKnifeCount}`;
    const badge = this.query('[data-result="badge"]');
    badge.textContent = result.bestRecord ? '刷新历史最佳' : result.success ? '成功通关' : '继续挑战';
    badge.className = `result-badge ${result.success ? 'result-badge--success' : 'result-badge--fail'}`;
  }

  hideResult(): void {
    this.resultOverlay.hidden = true;
  }

  updateHud(snapshot: GameSnapshot): void {
    this.values.hp.textContent = `${snapshot.hp}/${snapshot.maxHp}`;
    this.values.time.textContent = formatSeconds(snapshot.timeLeft);
    this.values.kills.textContent = `${snapshot.kills}`;
    this.values.knives.textContent = `${snapshot.currentKnives}/${snapshot.unlockedKnives}`;
  }

  applySettings(settings: SettingsState): void {
    const bgm = this.query<HTMLInputElement>('input[name="bgmVolume"]');
    const sfx = this.query<HTMLInputElement>('input[name="sfxVolume"]');
    bgm.value = String(settings.bgmVolume);
    sfx.value = String(settings.sfxVolume);
  }

  renderRecords(records: RunRecord[]): void {
    if (records.length === 0) {
      this.recordsContainer.innerHTML = '<div class="record record--empty">还没有战绩，先开一局。</div>';
      return;
    }
    this.recordsContainer.innerHTML = records
      .map(
        (record) => `
          <div class="record">
            <strong>
              <span>${record.success ? '成功' : '失败'}</span>
              <span>${formatSeconds(record.survivalSeconds)}</span>
            </strong>
            <span>${formatDateTime(record.finishedAt)}</span>
            <span>击杀 ${record.kills} ｜ 最高刀数 ${record.maxKnifeCount}</span>
          </div>
        `
      )
      .join('');
  }

  showToast(text: string): void {
    this.toast.textContent = text;
    this.toast.hidden = false;
    window.clearTimeout(Number(this.toast.dataset.timerId ?? '0'));
    const timerId = window.setTimeout(() => {
      this.toast.hidden = true;
    }, 1400);
    this.toast.dataset.timerId = String(timerId);
  }

  private bindButtons(): void {
    this.queryAll<HTMLButtonElement>('[data-action]').forEach((button) => {
      button.addEventListener('click', async () => {
        appEvents.emit('audio:button', undefined);
        const action = button.dataset.action;
        switch (action) {
          case 'start':
            appEvents.emit('ui:start-game', undefined);
            break;
          case 'open-settings':
            appEvents.emit('ui:open-settings', undefined);
            break;
          case 'close-settings':
            appEvents.emit('ui:close-settings', undefined);
            break;
          case 'open-history':
            appEvents.emit('ui:open-history', undefined);
            break;
          case 'close-history':
            appEvents.emit('ui:close-history', undefined);
            break;
          case 'return-menu':
            appEvents.emit('ui:return-menu', undefined);
            break;
          case 'restart':
            appEvents.emit('ui:restart-game', undefined);
            break;
        }
      });
    });

    this.queryAll<HTMLInputElement>('input[type="range"]').forEach((input) => {
      input.addEventListener('input', () => {
        appEvents.emit('ui:settings-changed', {
          bgmVolume: Number(this.query<HTMLInputElement>('input[name="bgmVolume"]').value),
          sfxVolume: Number(this.query<HTMLInputElement>('input[name="sfxVolume"]').value)
        });
      });
    });
  }

  private template(): string {
    return `
      <div class="screen" data-screen="menu">
        <div class="brand">
          <div class="brand__tag">SURVIVE 180 SECONDS</div>
          <h1>旋转<br />刀刀刀</h1>
          <p>用摇杆走位，让刀阵自己开路。刀会变多，也会报废，最后能不能守住缺口，只看你能不能活满 180 秒。</p>
        </div>
        <div class="menu-actions">
          <button class="button button--primary" data-action="start"><strong>开始游戏</strong><span>进入 180 秒生存战</span></button>
          <button class="button" data-action="open-settings"><strong>设置</strong><span>调节 BGM 和音效音量</span></button>
          <button class="button" data-action="open-history"><strong>历史记录</strong><span>查看最近 10 局战绩</span></button>
        </div>
        <div class="footer-note">竖屏 H5 单机生存动作游戏</div>
      </div>

      <div class="hud" hidden>
        <div class="hud-top">
          <div class="stat-card"><span class="stat-card__label">生命</span><strong class="stat-card__value" data-value="hp">5/5</strong></div>
          <div class="stat-card"><span class="stat-card__label">剩余时间</span><strong class="stat-card__value" data-value="time">03:00</strong></div>
          <div class="stat-card"><span class="stat-card__label">击杀</span><strong class="stat-card__value" data-value="kills">0</strong></div>
          <div class="stat-card"><span class="stat-card__label">刀阵</span><strong class="stat-card__value" data-value="knives">1/1</strong></div>
        </div>
        <div class="hud-tools">
          <button class="chip" data-action="open-settings">设置</button>
          <button class="chip" data-action="return-menu">菜单</button>
        </div>
      </div>

      <div class="joystick" hidden>
        <div class="joystick__base"></div>
        <div class="joystick__knob"></div>
      </div>

      <div class="toast" hidden>刀数 +1</div>

      <div class="overlay" data-overlay="settings" hidden>
        <div class="modal">
          <h2>设置</h2>
          <p>音量变化会立即生效，并保存在本地。</p>
          <div class="slider">
            <label>BGM 音量</label>
            <input type="range" name="bgmVolume" min="0" max="1" step="0.01" />
          </div>
          <div class="slider">
            <label>音效音量</label>
            <input type="range" name="sfxVolume" min="0" max="1" step="0.01" />
          </div>
          <div class="result-actions" style="margin-top:18px">
            <button class="button button--primary" data-action="close-settings"><strong>关闭</strong><span>返回当前界面</span></button>
          </div>
        </div>
      </div>

      <div class="overlay" data-overlay="history" hidden>
        <div class="modal">
          <h2>历史记录</h2>
          <p>按结束时间倒序展示最近 10 局。</p>
          <div class="records"></div>
          <div class="result-actions" style="margin-top:18px">
            <button class="button button--primary" data-action="close-history"><strong>关闭</strong><span>回到主菜单</span></button>
          </div>
        </div>
      </div>

      <div class="overlay" data-overlay="result" hidden>
        <div class="result-panel">
          <h2 data-result="title">生存成功</h2>
          <p data-result="summary"></p>
          <div data-result="badge" class="result-badge result-badge--success"></div>
          <div class="result-grid">
            <div class="stat-card"><span class="stat-card__label">生存时长</span><strong class="stat-card__value" data-result="time">180 秒</strong></div>
            <div class="stat-card"><span class="stat-card__label">击杀数</span><strong class="stat-card__value" data-result="kills">0</strong></div>
            <div class="stat-card"><span class="stat-card__label">最高刀数</span><strong class="stat-card__value" data-result="knives">1</strong></div>
          </div>
          <div class="result-actions">
            <button class="button button--primary" data-action="restart"><strong>再来一局</strong><span>立刻重新进入战斗</span></button>
            <button class="button" data-action="return-menu"><strong>返回菜单</strong><span>查看历史或调整设置</span></button>
          </div>
        </div>
      </div>
    `;
  }

  private query<T extends HTMLElement>(selector: string): T {
    const element = this.root.querySelector<T>(selector);
    if (!element) {
      throw new Error(`Missing UI element: ${selector}`);
    }
    return element;
  }

  private queryAll<T extends HTMLElement>(selector: string): T[] {
    return Array.from(this.root.querySelectorAll<T>(selector));
  }
}
