export const APP_TEMPLATE = `
  <div class="upgrade-shell" data-screen="menu" data-modal-open="false">
    <div class="menu-screen">
      <div class="menu-topbar">
        <div class="menu-shortcuts">
          <button class="icon-button icon-with-mark" data-action="open-achievements">
            <span class="button-mark trophy-mark" aria-hidden="true"></span>
            <span>成就</span>
          </button>
          <button class="icon-button icon-with-mark" data-action="open-settings">
            <span class="button-mark gear-mark" aria-hidden="true"></span>
            <span>设置</span>
          </button>
          <button class="coin-pill menu-coin-pill" data-action="open-coins">
            <span class="coin-mark" aria-hidden="true"></span>
            <span data-role="menu-coins">0</span>
          </button>
        </div>
        <div class="menu-safe-gap" aria-hidden="true"><span>抖音小游戏<br />安全区</span></div>
      </div>

      <section class="hero-panel">
        <h1 class="hero-title retro-title">滑块消消乐</h1>

        <div class="record-float-card">
          <p class="record-summary" data-role="record-summary">
            <span class="record-label">最短通关时长</span>
            <span class="record-time">-- m -- s</span>
          </p>
        </div>

        <div class="collision-stage" aria-hidden="true">
          <div class="collision-halo halo-left"></div>
          <div class="collision-halo halo-right"></div>
          <div class="octahedron-showcase">
            <div class="pyramid-cube" style="--x: 0; --y: 2; --z: 0;"></div>
            <div class="pyramid-cube" style="--x: -1; --y: 1; --z: 0;"></div>
            <div class="pyramid-cube" style="--x: 1; --y: 1; --z: 0;"></div>
            <div class="pyramid-cube" style="--x: 0; --y: 1; --z: -1;"></div>
            <div class="pyramid-cube" style="--x: 0; --y: 1; --z: 1;"></div>
            <div class="pyramid-cube" style="--x: -2; --y: 0; --z: 0;"></div>
            <div class="pyramid-cube" style="--x: -1; --y: 0; --z: -1;"></div>
            <div class="pyramid-cube core" style="--x: 0; --y: 0; --z: -2;"></div>
            <div class="pyramid-cube core" style="--x: 1; --y: 0; --z: -1;"></div>
            <div class="pyramid-cube" style="--x: 2; --y: 0; --z: 0;"></div>
            <div class="pyramid-cube" style="--x: -1; --y: 0; --z: 1;"></div>
            <div class="pyramid-cube core" style="--x: 0; --y: 0; --z: 0;"></div>
            <div class="pyramid-cube" style="--x: 1; --y: 0; --z: 1;"></div>
            <div class="pyramid-cube core" style="--x: 0; --y: 0; --z: 2;"></div>
            <div class="pyramid-cube" style="--x: -1; --y: -1; --z: 0;"></div>
            <div class="pyramid-cube" style="--x: 1; --y: -1; --z: 0;"></div>
            <div class="pyramid-cube" style="--x: 0; --y: -1; --z: -1;"></div>
            <div class="pyramid-cube" style="--x: 0; --y: -1; --z: 1;"></div>
            <div class="pyramid-cube" style="--x: 0; --y: -2; --z: 0;"></div>
          </div>
        </div>

        <div class="menu-actions">
          <div class="mode-stack">
            <button class="mode-card endless" data-action="start-endless">
              <span class="mode-option">
                <span class="mode-icon sword-icon" aria-hidden="true"></span>
                <span class="mode-title retro-mode-title">不限时模式</span>
              </span>
            </button>
            <button class="mode-card challenge" data-action="start-challenge">
              <span class="mode-option">
                <span class="mode-icon clock-icon" aria-hidden="true"></span>
                <span class="mode-title retro-mode-title">挑战模式</span>
              </span>
            </button>
          </div>
        </div>
      </section>
    </div>

    <div class="game-screen">
      <header class="game-topbar">
        <div class="top-left-stack">
          <button class="icon-button pause-button" data-action="pause-settings">暂停</button>
          <div class="coin-pill"><span class="coin-mark" aria-hidden="true"></span><span data-role="game-coins">0</span></div>
        </div>
        <div class="timer-dock">
          <p class="timer-hint" data-role="timer-hint">不限时模式</p>
          <div class="timer-value" data-role="timer">00:00</div>
        </div>
        <div class="safe-gap" aria-hidden="true"><span>抖音小游戏<br />安全区</span></div>
      </header>

      <div class="status-row">
        <span class="mode-badge" data-role="mode-badge">不限时模式 · LEVEL 1</span>
        <span class="remain-badge" data-role="remain">剩余 0 块</span>
      </div>

      <div class="scene-shell">
        <div class="scene-host"></div>
        <div class="toast-layer"><div class="toast-chip" data-role="toast" data-open="false"></div></div>
      </div>

      <div class="progress-shell">
        <div class="progress-head"><span>当前进度</span><span data-role="progress">0 / 0</span></div>
        <div class="progress-track"><div class="progress-fill" data-role="progress-fill"></div></div>
      </div>

      <div class="toolbelt">
        <button class="tool-button" data-action="toggle-reverse">
          <span class="tool-name">反向</span><span class="tool-meta" data-role="reverse-meta">5 次</span>
        </button>
        <button class="tool-button highlight" data-action="activate-clear">
          <span class="tool-name">消块</span><span class="tool-meta" data-role="clear-meta">1 次</span>
        </button>
        <button class="tool-button" data-action="apply-reset">
          <span class="tool-name">重置</span><span class="tool-meta" data-role="reset-meta">5 次</span>
        </button>
      </div>

      <p class="hint-copy" data-role="hint">点击带箭头的方块尝试滑出，遇到死路时可以使用反向、消块或重置。</p>
    </div>

    <div class="modal-root" data-open="false">
      <div class="modal-scrim" data-action="close-modal"></div>
      <div class="modal-card">
        <section class="modal-panel" data-panel="settings" hidden>
          <div class="modal-head">
            <div><p class="modal-kicker">PAUSE & AUDIO</p><h2>设置</h2></div>
            <button class="icon-button small" data-action="close-modal">关闭</button>
          </div>
          <div class="settings-notes">
            <p class="settings-note"><strong>暂停菜单</strong> 可以在这里调整音量、重新开始当前关卡，或直接返回主菜单。</p>
            <p class="settings-note"><strong>模式规则</strong> 不限时模式支持任意选关，挑战模式按顺序解锁，但已经通过的关卡仍可随时重玩。</p>
            <p class="settings-note"><strong>辅助能力</strong> 反向会改变单个滑块方向，消块会随机消除 3 个滑块，重置会刷新当前局方向。</p>
          </div>
          <label class="slider-field"><span>BGM 音量 <strong data-role="bgm-label">62</strong></span><input data-role="bgm-slider" type="range" min="0" max="100" value="62" /></label>
          <label class="slider-field"><span>音效音量 <strong data-role="sfx-label">80</strong></span><input data-role="sfx-slider" type="range" min="0" max="100" value="80" /></label>
          <div class="settings-actions">
            <button class="action-chip" data-action="settings-restart">重新开始</button>
            <button class="action-chip secondary" data-action="settings-exit">返回菜单</button>
          </div>
        </section>

        <section class="modal-panel" data-panel="achievements" hidden>
          <div class="modal-head">
            <div><p class="modal-kicker">ACHIEVEMENTS</p><h2>成就记录</h2></div>
            <button class="icon-button small" data-action="close-modal">关闭</button>
          </div>
          <div class="achievements-list" data-role="achievements-list"></div>
        </section>

        <section class="modal-panel" data-panel="coins" hidden>
          <div class="modal-head">
            <div><p class="modal-kicker">COIN RULES</p><h2>金币规则</h2></div>
            <button class="icon-button small" data-action="close-modal">关闭</button>
          </div>
          <div class="settings-notes">
            <p class="settings-note"><strong>额外反向</strong> 当反向次数用完后，可以花费 1000 金币购买 1 次额外反向。</p>
            <p class="settings-note"><strong>额外重置</strong> 当重置次数用完后，可以花费 1500 金币购买 1 次额外重置。</p>
            <p class="settings-note"><strong>额外消块</strong> 当消块次数用完后，可以花费 2000 金币购买 1 次额外消块。</p>
            <p class="settings-note"><strong>查看入口</strong> 菜单右上角金币按钮会弹出这组规则，方便随时确认消耗。</p>
          </div>
        </section>

        <section class="modal-panel" data-panel="level-select" hidden>
          <div class="modal-head">
            <div><p class="modal-kicker">LEVEL SELECT</p><h2 data-role="level-select-title">选择关卡</h2></div>
            <button class="icon-button small" data-action="close-modal">关闭</button>
          </div>
          <div class="level-select-list" data-role="level-select-list"></div>
        </section>

        <section class="modal-panel" data-panel="result" hidden>
          <div class="modal-head">
            <div><p class="modal-kicker">RESULT</p><h2 data-role="result-title">结果</h2></div>
            <button class="icon-button small" data-action="close-modal">关闭</button>
          </div>
          <p class="result-message" data-role="result-message"></p>
          <p class="result-meta" data-role="result-meta"></p>
          <p class="result-reward" data-role="result-reward"></p>
          <div class="star-row" data-role="result-stars"></div>
          <div class="result-actions">
            <button class="action-chip" data-action="result-next">下一关</button>
            <button class="action-chip" data-action="result-replay">重新挑战</button>
            <button class="action-chip secondary" data-action="result-home">返回菜单</button>
          </div>
        </section>
      </div>
    </div>
  </div>
`;
