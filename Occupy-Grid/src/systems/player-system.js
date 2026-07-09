(function () {
  const ns = window.OccupyGrid;
  const cfg = ns.CONFIG;
  const utils = ns.utils;

  class PlayerSystem {
    createPlayers(startTick, startTimeMs) {
      return [
        this.createPlayer(cfg.PLAYER_IDS.HUMAN, "human", startTick, startTimeMs),
        this.createPlayer(cfg.PLAYER_IDS.BOT_A, "bot", startTick, startTimeMs),
        this.createPlayer(cfg.PLAYER_IDS.BOT_B, "bot", startTick, startTimeMs),
        this.createPlayer(cfg.PLAYER_IDS.BOT_C, "bot", startTick, startTimeMs),
        this.createPlayer(cfg.PLAYER_IDS.BOT_D, "bot", startTick, startTimeMs)
      ];
    }

    createPlayer(id, type, startTick, startTimeMs) {
      const spawn = cfg.SPAWNS[id];
      return {
        id: id,
        name: cfg.PLAYER_NAMES[id],
        type: type,
        color: cfg.PLAYER_COLORS[id],
        alive: true,
        position: { x: spawn.x, y: spawn.y },
        direction: cfg.DIRECTIONS.RIGHT,
        pendingDirection: cfg.DIRECTIONS.RIGHT,
        speedState: "normal",
        moveIntervalMs: cfg.BASE_MOVE_INTERVAL_MS,
        nextMoveAt: startTimeMs + cfg.BASE_MOVE_INTERVAL_MS,
        territoryCells: cfg.INITIAL_TERRITORY_SIZE * cfg.INITIAL_TERRITORY_SIZE,
        currentTrailCells: 0,
        trailActive: false,
        spawnArea: {
          x: spawn.x,
          y: spawn.y
        },
        rank: 0,
        deathTick: null,
        deathReason: "",
        lastInputName: "right",
        aiController: type === "bot" ? "AggressiveAI" : "LocalHumanController",
        spawnTick: startTick
      };
    }

    queueDirection(player, directionName, nowMs) {
      if (!player.alive) {
        return;
      }
      const nextDirection = utils.directionFromName(directionName);
      const sameDirection = player.direction.name === nextDirection.name;
      const opposite = utils.isOpposite(player.direction, nextDirection);

      if (!sameDirection && opposite) {
        player.pendingDirection = nextDirection;
        this.setSpeedState(player, "normal", nowMs);
        player.lastInputName = directionName;
        return;
      }

      if (sameDirection) {
        this.setSpeedState(player, "boosted", nowMs);
      } else {
        player.pendingDirection = nextDirection;
        this.setSpeedState(player, "normal", nowMs);
      }

      player.lastInputName = directionName;
    }

    applyPendingDirection(player) {
      if (!player.alive) {
        return;
      }
      player.direction = player.pendingDirection;
    }

    setSpeedState(player, mode, nowMs) {
      const nextInterval = mode === "boosted"
        ? cfg.BOOST_MOVE_INTERVAL_MS
        : cfg.BASE_MOVE_INTERVAL_MS;
      player.speedState = mode;
      player.moveIntervalMs = nextInterval;
      player.nextMoveAt = Math.min(player.nextMoveAt, nowMs + nextInterval);
    }

    markDead(player, tick, reason) {
      if (!player.alive) {
        return;
      }
      player.alive = false;
      player.deathTick = tick;
      player.deathReason = reason;
      player.speedState = "normal";
    }

    countLiving(players) {
      let living = 0;
      for (let i = 0; i < players.length; i += 1) {
        if (players[i].alive) {
          living += 1;
        }
      }
      return living;
    }
  }

  ns.PlayerSystem = PlayerSystem;
})();
