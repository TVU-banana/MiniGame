(function () {
  const ns = window.OccupyGrid;
  const utils = ns.utils;

  class CollisionSystem {
    resolveBoundary(players, movedPlayerIds, playerSystem, tick) {
      const deaths = [];
      for (let i = 0; i < movedPlayerIds.length; i += 1) {
        const player = movedPlayerIds[i];
        if (!player.alive) {
          continue;
        }
        if (!utils.inBounds(player.position.x, player.position.y) || utils.isBorder(player.position.x, player.position.y)) {
          playerSystem.markDead(player, tick, "撞墙");
          deaths.push(player);
        }
      }
      return deaths;
    }

    resolveSameCellCollision(moveTargets, playerSystem, tick) {
      const map = new Map();
      const deaths = [];

      for (let i = 0; i < moveTargets.length; i += 1) {
        const item = moveTargets[i];
        if (!item.player.alive) {
          continue;
        }
        const key = item.x + "," + item.y;
        if (!map.has(key)) {
          map.set(key, []);
        }
        map.get(key).push(item.player);
      }

      map.forEach((arr) => {
        if (arr.length < 2) {
          return;
        }
        for (let i = 0; i < arr.length; i += 1) {
          if (arr[i].alive) {
            playerSystem.markDead(arr[i], tick, "同格碰撞");
            deaths.push(arr[i]);
          }
        }
      });

      return deaths;
    }

    resolveTrailCuts(board, movedPlayers, playerById, playerSystem, tick) {
      const deaths = [];
      for (let i = 0; i < movedPlayers.length; i += 1) {
        const actor = movedPlayers[i];
        if (!actor.alive) {
          continue;
        }
        const trailOwner = board.getTrail(actor.position.x, actor.position.y);
        if (trailOwner !== 0 && trailOwner !== actor.id) {
          const victim = playerById.get(trailOwner);
          if (victim && victim.alive) {
            playerSystem.markDead(victim, tick, "尾迹被切断");
            deaths.push(victim);
          }
        }
      }
      return deaths;
    }

    cleanupDeadTrails(board, players) {
      for (let i = 0; i < players.length; i += 1) {
        if (!players[i].alive) {
          board.clearTrailByOwner(players[i].id);
          players[i].trailActive = false;
          players[i].currentTrailCells = 0;
        }
      }
    }
  }

  ns.CollisionSystem = CollisionSystem;
})();
