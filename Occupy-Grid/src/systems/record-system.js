(function () {
  const ns = window.OccupyGrid;
  const cfg = ns.CONFIG;
  const utils = ns.utils;

  class RecordSystem {
    loadSettings() {
      const defaults = {
        bgmVolume: 0.35,
        sfxVolume: 0.7,
        showGrid: true
      };
      try {
        const raw = localStorage.getItem(cfg.SETTINGS_KEY);
        if (!raw) {
          return defaults;
        }
        const parsed = JSON.parse(raw);
        return {
          bgmVolume: utils.clamp(Number(parsed.bgmVolume), 0, 1),
          sfxVolume: utils.clamp(Number(parsed.sfxVolume), 0, 1),
          showGrid: Boolean(parsed.showGrid)
        };
      } catch (error) {
        return defaults;
      }
    }

    saveSettings(settings) {
      try {
        localStorage.setItem(cfg.SETTINGS_KEY, JSON.stringify(settings));
      } catch (error) {
        return;
      }
    }

    loadHistory() {
      try {
        const raw = localStorage.getItem(cfg.HISTORY_KEY);
        const list = raw ? JSON.parse(raw) : [];
        return Array.isArray(list) ? list : [];
      } catch (error) {
        return [];
      }
    }

    appendHistory(entry) {
      const list = this.loadHistory();
      list.unshift(entry);
      const next = list.slice(0, cfg.MAX_HISTORY);
      try {
        localStorage.setItem(cfg.HISTORY_KEY, JSON.stringify(next));
      } catch (error) {
        return next;
      }
      return next;
    }

    clearHistory() {
      try {
        localStorage.removeItem(cfg.HISTORY_KEY);
      } catch (error) {
        return;
      }
    }

    createHistoryEntry(gameSummary) {
      return {
        date: utils.nowDateLabel(),
        durationSeconds: Math.ceil(gameSummary.durationMs / 1000),
        rank: gameSummary.humanRank,
        victory: gameSummary.humanRank === 1
      };
    }
  }

  ns.RecordSystem = RecordSystem;
})();
