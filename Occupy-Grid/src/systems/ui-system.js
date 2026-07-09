(function () {
  const ns = window.OccupyGrid;
  const cfg = ns.CONFIG;
  const utils = ns.utils;

  class UISystem {
    constructor(callbacks) {
      this.callbacks = callbacks || {};
      this.el = {
        menuScreen: document.getElementById("menu-screen"),
        startButton: document.getElementById("start-button"),
        menuSettingsButton: document.getElementById("menu-settings-button"),
        menuHistoryButton: document.getElementById("menu-history-button"),
        hud: document.getElementById("hud"),
        hudTimer: document.getElementById("hud-timer"),
        hudSettingsButton: document.getElementById("hud-settings-button"),
        hudHistoryButton: document.getElementById("hud-history-button"),
        scoreboard: document.getElementById("hud-scoreboard"),
        settingsModal: document.getElementById("settings-modal"),
        closeSettingsButton: document.getElementById("close-settings-button"),
        clearRecordsButton: document.getElementById("clear-records-button"),
        bgmVolume: document.getElementById("bgm-volume"),
        sfxVolume: document.getElementById("sfx-volume"),
        gridVisibility: document.getElementById("grid-visibility"),
        historyModal: document.getElementById("history-modal"),
        historyList: document.getElementById("history-list"),
        closeHistoryButton: document.getElementById("close-history-button"),
        resultModal: document.getElementById("result-modal"),
        resultTitle: document.getElementById("result-title"),
        resultSubtitle: document.getElementById("result-subtitle"),
        resultRanking: document.getElementById("result-ranking"),
        playAgainButton: document.getElementById("play-again-button"),
        backMenuButton: document.getElementById("back-menu-button")
      };
      this.bindEvents();
    }

    bindEvents() {
      this.el.startButton.addEventListener("click", () => this.call("onStart"));
      this.el.menuSettingsButton.addEventListener("click", () => this.openSettings());
      this.el.menuHistoryButton.addEventListener("click", () => this.openHistory());
      this.el.hudSettingsButton.addEventListener("click", () => this.openSettings());
      this.el.hudHistoryButton.addEventListener("click", () => this.openHistory());
      this.el.closeSettingsButton.addEventListener("click", () => this.closeSettings());
      this.el.closeHistoryButton.addEventListener("click", () => this.closeHistory());
      this.el.clearRecordsButton.addEventListener("click", () => this.call("onClearRecords"));
      this.el.playAgainButton.addEventListener("click", () => this.call("onPlayAgain"));
      this.el.backMenuButton.addEventListener("click", () => this.call("onBackMenu"));

      this.el.bgmVolume.addEventListener("input", () => this.emitSettings());
      this.el.sfxVolume.addEventListener("input", () => this.emitSettings());
      this.el.gridVisibility.addEventListener("change", () => this.emitSettings());

      this.el.settingsModal.addEventListener("click", (event) => {
        if (event.target === this.el.settingsModal) {
          this.closeSettings();
        }
      });
      this.el.historyModal.addEventListener("click", (event) => {
        if (event.target === this.el.historyModal) {
          this.closeHistory();
        }
      });
      this.el.resultModal.addEventListener("click", (event) => {
        if (event.target === this.el.resultModal) {
          return;
        }
      });
    }

    call(name, payload) {
      const fn = this.callbacks[name];
      if (typeof fn === "function") {
        fn(payload);
      }
    }

    emitSettings() {
      this.call("onSettingsChange", this.readSettingsFromUI());
    }

    readSettingsFromUI() {
      return {
        bgmVolume: Number(this.el.bgmVolume.value),
        sfxVolume: Number(this.el.sfxVolume.value),
        showGrid: this.el.gridVisibility.checked
      };
    }

    applySettings(settings) {
      this.el.bgmVolume.value = String(settings.bgmVolume);
      this.el.sfxVolume.value = String(settings.sfxVolume);
      this.el.gridVisibility.checked = Boolean(settings.showGrid);
    }

    setMenuVisible(flag) {
      this.el.menuScreen.classList.toggle("hidden", !flag);
    }

    setHudVisible(flag) {
      this.el.hud.classList.toggle("hidden", !flag);
      this.el.scoreboard.classList.toggle("hidden", !flag);
    }

    setTimerMs(ms) {
      this.el.hudTimer.textContent = utils.formatTimeMs(ms);
    }

    renderScoreboard(players) {
      const ordered = players.slice().sort((a, b) => b.territoryCells - a.territoryCells);
      this.el.scoreboard.innerHTML = ordered.map((p) => {
        const status = p.alive ? "" : " (淘汰)";
        const activeClass = p.id === cfg.PLAYER_IDS.HUMAN ? " active" : "";
        return "<div class=\"score-row" + activeClass + "\">" +
          "<span class=\"dot\" style=\"background:" + p.color + "\"></span>" +
          "<span>" + p.name + status + "</span>" +
          "<strong>" + p.territoryCells + "</strong>" +
          "</div>";
      }).join("");
    }

    renderHistory(historyItems) {
      if (historyItems.length === 0) {
        this.el.historyList.innerHTML = "<li class=\"history-item\">暂无记录</li>";
        return;
      }
      this.el.historyList.innerHTML = historyItems.map((item) => {
        const resultLabel = item.victory ? "胜利" : "失败";
        return "<li class=\"history-item\">" +
          "<strong>" + item.date + "</strong> | 用时 " + item.durationSeconds + "s | 排名 #" + item.rank + " | " + resultLabel +
          "</li>";
      }).join("");
    }

    openSettings() {
      this.el.settingsModal.classList.remove("hidden");
      this.el.settingsModal.setAttribute("aria-hidden", "false");
    }

    closeSettings() {
      this.el.settingsModal.classList.add("hidden");
      this.el.settingsModal.setAttribute("aria-hidden", "true");
    }

    openHistory() {
      this.call("onOpenHistory");
      this.el.historyModal.classList.remove("hidden");
      this.el.historyModal.setAttribute("aria-hidden", "false");
    }

    closeHistory() {
      this.el.historyModal.classList.add("hidden");
      this.el.historyModal.setAttribute("aria-hidden", "true");
    }

    showResult(summary, title, subtitle) {
      this.el.resultTitle.textContent = title;
      this.el.resultSubtitle.textContent = subtitle;
      this.el.resultRanking.innerHTML = summary.ranking.map((row) => {
        const status = row.alive ? "存活" : "淘汰";
        const reason = row.deathReason ? " - " + row.deathReason : "";
        return "<li class=\"ranking-item\">" +
          "#" + row.rank + " <strong style=\"color:" + row.color + "\">" + row.name + "</strong> | 领地 " + row.territoryCells + " | " + status + reason +
          "</li>";
      }).join("");
      this.el.resultModal.classList.remove("hidden");
      this.el.resultModal.setAttribute("aria-hidden", "false");
    }

    hideResult() {
      this.el.resultModal.classList.add("hidden");
      this.el.resultModal.setAttribute("aria-hidden", "true");
    }
  }

  ns.UISystem = UISystem;
})();
