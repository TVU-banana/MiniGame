(function () {
  const ns = window.OccupyGrid;
  const cfg = ns.CONFIG;
  const utils = ns.utils;

  class Game {
    constructor() {
      this.boardSystem = new ns.BoardSystem(document.getElementById("game-canvas"));
      this.playerSystem = new ns.PlayerSystem();
      this.territorySystem = new ns.TerritorySystem();
      this.collisionSystem = new ns.CollisionSystem();
      this.aiSystem = new ns.AISystem();
      this.audioSystem = new ns.AudioSystem();
      this.recordSystem = new ns.RecordSystem();
      this.resultSystem = new ns.ResultSystem();
      this.inputSystem = new ns.InputSystem(
        (directionName) => this.handleHumanDirection(directionName),
        () => this.audioSystem.unlock()
      );
      this.uiSystem = new ns.UISystem({
        onStart: () => this.startMatch(),
        onPlayAgain: () => this.startMatch(),
        onBackMenu: () => this.backToMenu(),
        onOpenHistory: () => this.refreshHistory(),
        onClearRecords: () => this.clearHistory(),
        onSettingsChange: (settings) => this.applySettings(settings)
      });
      this.loop = new ns.GameLoop(
        (deltaMs, nowMs) => this.tick(deltaMs, nowMs),
        (nowMs) => this.render(nowMs)
      );

      this.settings = this.recordSystem.loadSettings();
      this.audioSystem.applySettings(this.settings);
      this.uiSystem.applySettings(this.settings);

      this.phase = "menu";
      this.tickCount = 0;
      this.remainingMs = cfg.MATCH_DURATION_MS;
      this.matchStartedAtMs = 0;
      this.matchEndedAtMs = 0;
      this.players = [];
      this.playerById = new Map();
      this.history = this.recordSystem.loadHistory();
      this.effects = [];

      this.refreshHistory();
      this.uiSystem.setMenuVisible(true);
      this.uiSystem.setHudVisible(false);
      this.uiSystem.hideResult();
      this.audioSystem.startMenuBgm();
      this.loop.start();
    }

    refreshHistory() {
      this.history = this.recordSystem.loadHistory();
      this.uiSystem.renderHistory(this.history);
    }

    clearHistory() {
      this.audioSystem.playButton();
      this.recordSystem.clearHistory();
      this.refreshHistory();
    }

    applySettings(nextSettings) {
      this.settings = {
        bgmVolume: utils.clamp(nextSettings.bgmVolume, 0, 1),
        sfxVolume: utils.clamp(nextSettings.sfxVolume, 0, 1),
        showGrid: Boolean(nextSettings.showGrid)
      };
      this.recordSystem.saveSettings(this.settings);
      this.audioSystem.applySettings(this.settings);
    }

    startMatch() {
      this.audioSystem.unlock();
      this.audioSystem.playButton();
      this.audioSystem.startGameBgm();

      this.phase = "playing";
      this.tickCount = 0;
      this.remainingMs = cfg.MATCH_DURATION_MS;
      this.matchStartedAtMs = performance.now();
      this.matchEndedAtMs = this.matchStartedAtMs;
      this.effects.length = 0;

      this.boardSystem.clearAll();
      this.players = this.playerSystem.createPlayers(this.tickCount, this.matchStartedAtMs);
      this.playerById.clear();

      for (let i = 0; i < this.players.length; i += 1) {
        const player = this.players[i];
        this.playerById.set(player.id, player);
        this.boardSystem.claimSpawn(player.position.x, player.position.y, player.id);
      }

      this.updatePlayerStats();
      this.uiSystem.hideResult();
      this.uiSystem.closeSettings();
      this.uiSystem.closeHistory();
      this.uiSystem.setMenuVisible(false);
      this.uiSystem.setHudVisible(true);
      this.uiSystem.setTimerMs(this.remainingMs);
      this.uiSystem.renderScoreboard(this.players);
      this.inputSystem.setEnabled(true);
    }

    backToMenu() {
      this.audioSystem.playButton();
      this.phase = "menu";
      this.inputSystem.setEnabled(false);
      this.uiSystem.hideResult();
      this.uiSystem.closeSettings();
      this.uiSystem.closeHistory();
      this.uiSystem.setHudVisible(false);
      this.uiSystem.setMenuVisible(true);
      this.audioSystem.startMenuBgm();
    }

    handleHumanDirection(directionName) {
      if (this.phase !== "playing") {
        return;
      }
      const human = this.playerById.get(cfg.PLAYER_IDS.HUMAN);
      if (!human || !human.alive) {
        return;
      }
      this.playerSystem.queueDirection(human, directionName, performance.now());
    }

    tick(deltaMs, nowMs) {
      this.updateEffects(deltaMs);
      if (this.phase !== "playing") {
        return;
      }

      this.tickCount += 1;
      this.remainingMs = Math.max(0, this.remainingMs - deltaMs);

      const moveTargets = [];
      const movedPlayers = [];

      for (let i = 0; i < this.players.length; i += 1) {
        const player = this.players[i];
        if (!player.alive || player.type !== "bot") {
          continue;
        }
        if (nowMs >= player.nextMoveAt) {
          const chosen = this.aiSystem.chooseDirectionFor(player, this.boardSystem);
          this.playerSystem.queueDirection(player, chosen, nowMs);
        }
      }

      for (let i = 0; i < this.players.length; i += 1) {
        const player = this.players[i];
        if (!player.alive || nowMs < player.nextMoveAt) {
          continue;
        }

        this.playerSystem.applyPendingDirection(player);
        const nextX = player.position.x + player.direction.dx;
        const nextY = player.position.y + player.direction.dy;
        moveTargets.push({ player: player, x: nextX, y: nextY });
      }

      for (let i = 0; i < moveTargets.length; i += 1) {
        const item = moveTargets[i];
        item.player.position.x = item.x;
        item.player.position.y = item.y;
        item.player.nextMoveAt = nowMs + item.player.moveIntervalMs;
        movedPlayers.push(item.player);
      }

      this.markDeaths(this.collisionSystem.resolveBoundary(movedPlayers, movedPlayers, this.playerSystem, this.tickCount));
      this.markDeaths(this.collisionSystem.resolveSameCellCollision(moveTargets, this.playerSystem, this.tickCount));
      this.markDeaths(this.collisionSystem.resolveTrailCuts(this.boardSystem, movedPlayers, this.playerById, this.playerSystem, this.tickCount));

      const closures = [];
      for (let i = 0; i < movedPlayers.length; i += 1) {
        const player = movedPlayers[i];
        if (!player.alive) {
          continue;
        }

        const inHome = this.territorySystem.isInOwnTerritory(
          this.boardSystem,
          player,
          player.position.x,
          player.position.y
        );

        if (inHome && player.trailActive) {
          closures.push(player);
          continue;
        }

        if (!inHome) {
          this.territorySystem.markTrailStep(
            this.boardSystem,
            player,
            player.position.x,
            player.position.y
          );
        }
      }

      for (let i = 0; i < closures.length; i += 1) {
        const player = closures[i];
        if (!player.alive) {
          continue;
        }
        const capture = this.territorySystem.resolveClosure(this.boardSystem, player, this.players);
        if (capture.capturedCount > 0) {
          this.audioSystem.playCapture();
        }
        for (let j = 0; j < capture.eliminatedPlayerIds.length; j += 1) {
          const victim = this.playerById.get(capture.eliminatedPlayerIds[j]);
          if (victim && victim.alive) {
            this.playerSystem.markDead(victim, this.tickCount, "被包围吞并");
            this.spawnExplosion(victim.position.x, victim.position.y, victim.color);
            this.audioSystem.playExplosion();
          }
        }
      }

      this.collisionSystem.cleanupDeadTrails(this.boardSystem, this.players);
      this.updatePlayerStats();
      this.uiSystem.setTimerMs(this.remainingMs);
      this.uiSystem.renderScoreboard(this.players);

      if (this.shouldFinish("human_dead")) {
        this.finishMatch("human_dead");
        return;
      }
      if (this.shouldFinish("all_eliminated")) {
        this.finishMatch("all_eliminated");
        return;
      }
      if (this.remainingMs <= 0) {
        this.finishMatch("timeout");
      }
    }

    shouldFinish(reason) {
      const human = this.playerById.get(cfg.PLAYER_IDS.HUMAN);
      if (reason === "human_dead") {
        return human && !human.alive;
      }
      if (reason === "all_eliminated") {
        return this.playerSystem.countLiving(this.players) <= 1;
      }
      return false;
    }

    markDeaths(deathPlayers) {
      for (let i = 0; i < deathPlayers.length; i += 1) {
        const player = deathPlayers[i];
        if (!player) {
          continue;
        }
        this.spawnExplosion(player.position.x, player.position.y, player.color);
        this.audioSystem.playExplosion();
      }
    }

    spawnExplosion(x, y, color) {
      for (let i = 0; i < 22; i += 1) {
        const angle = (Math.PI * 2 * i) / 22;
        this.effects.push({
          x: x + 0.5,
          y: y + 0.5,
          vx: Math.cos(angle) * (1.8 + Math.random() * 3.5),
          vy: Math.sin(angle) * (1.8 + Math.random() * 3.5),
          life: 320 + Math.random() * 380,
          maxLife: 320 + Math.random() * 380,
          color: color
        });
      }
    }

    updateEffects(deltaMs) {
      const next = [];
      for (let i = 0; i < this.effects.length; i += 1) {
        const p = this.effects[i];
        p.life -= deltaMs;
        if (p.life <= 0) {
          continue;
        }
        p.x += p.vx * (deltaMs / 1000);
        p.y += p.vy * (deltaMs / 1000);
        p.vy += 5.8 * (deltaMs / 1000);
        next.push(p);
      }
      this.effects = next;
    }

    updatePlayerStats() {
      for (let i = 0; i < this.players.length; i += 1) {
        const p = this.players[i];
        p.territoryCells = this.boardSystem.countTerritory(p.id);
        p.currentTrailCells = this.boardSystem.trailIndicesByOwner(p.id).length;
      }
    }

    finishMatch(reason) {
      if (this.phase !== "playing") {
        return;
      }

      this.phase = "result";
      this.matchEndedAtMs = performance.now();
      this.inputSystem.setEnabled(false);

      const elapsedMs = Math.max(0, this.matchEndedAtMs - this.matchStartedAtMs);
      const summary = this.resultSystem.buildSummary(this.players, reason, elapsedMs);
      const title = this.resultSystem.getTitle(summary);
      const subtitle = this.resultSystem.getSubtitle(summary);

      const historyEntry = this.recordSystem.createHistoryEntry(summary);
      this.history = this.recordSystem.appendHistory(historyEntry);
      this.uiSystem.renderHistory(this.history);
      this.uiSystem.showResult(summary, title, subtitle);
      this.uiSystem.setHudVisible(false);
      this.audioSystem.startMenuBgm();
    }

    render() {
      this.boardSystem.render({
        players: this.players,
        settings: this.settings
      });
      this.renderEffects();
    }

    renderEffects() {
      if (this.effects.length === 0) {
        return;
      }
      const ctx = this.boardSystem.ctx;
      const vp = this.boardSystem.viewport;
      for (let i = 0; i < this.effects.length; i += 1) {
        const p = this.effects[i];
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = this.toRgba(p.color, alpha);
        const s = Math.max(2, vp.cellSize * 0.5);
        const px = vp.x + p.x * vp.cellSize - s / 2;
        const py = vp.y + p.y * vp.cellSize - s / 2;
        ctx.fillRect(px, py, s, s);
      }
    }

    toRgba(hex, alpha) {
      const v = parseInt(hex.replace("#", ""), 16);
      const r = (v >> 16) & 255;
      const g = (v >> 8) & 255;
      const b = v & 255;
      return "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
    }
  }

  ns.Game = Game;
})();
