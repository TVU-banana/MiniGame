(function () {
  const ns = window.OccupyGrid;
  const cfg = ns.CONFIG;
  const utils = ns.utils;

  class TerritorySystem {
    isInOwnTerritory(board, player, x, y) {
      return board.getTerritory(x, y) === player.id;
    }

    markTrailStep(board, player, x, y) {
      if (!utils.inBounds(x, y)) {
        return;
      }
      board.setTrail(x, y, player.id);
      player.trailActive = true;
    }

    clearPlayerTrail(board, player) {
      board.clearTrailByOwner(player.id);
      player.trailActive = false;
      player.currentTrailCells = 0;
    }

    resolveClosure(board, player, players) {
      const blocked = new Uint8Array(board.cellCount);
      const external = new Uint8Array(board.cellCount);
      const queue = new Uint32Array(board.cellCount);
      let head = 0;
      let tail = 0;

      for (let i = 0; i < board.cellCount; i += 1) {
        if (board.territory[i] === player.id || board.trail[i] === player.id) {
          blocked[i] = 1;
        }
      }

      const enqueue = (index) => {
        if (index < 0 || index >= board.cellCount) {
          return;
        }
        if (blocked[index] || external[index]) {
          return;
        }
        external[index] = 1;
        queue[tail] = index;
        tail += 1;
      };

      for (let x = 0; x < cfg.BOARD_WIDTH; x += 1) {
        enqueue(utils.toIndex(x, 0));
        enqueue(utils.toIndex(x, cfg.BOARD_HEIGHT - 1));
      }
      for (let y = 0; y < cfg.BOARD_HEIGHT; y += 1) {
        enqueue(utils.toIndex(0, y));
        enqueue(utils.toIndex(cfg.BOARD_WIDTH - 1, y));
      }

      while (head < tail) {
        const idx = queue[head];
        head += 1;
        const cell = utils.toCell(idx);
        if (cell.x > 0) {
          enqueue(idx - 1);
        }
        if (cell.x < cfg.BOARD_WIDTH - 1) {
          enqueue(idx + 1);
        }
        if (cell.y > 0) {
          enqueue(idx - cfg.BOARD_WIDTH);
        }
        if (cell.y < cfg.BOARD_HEIGHT - 1) {
          enqueue(idx + cfg.BOARD_WIDTH);
        }
      }

      const captured = [];
      for (let i = 0; i < board.cellCount; i += 1) {
        if (!blocked[i] && !external[i]) {
          captured.push(i);
        }
      }

      const ownTrailIndices = board.trailIndicesByOwner(player.id);
      const changedSet = new Set(captured);
      for (let i = 0; i < ownTrailIndices.length; i += 1) {
        changedSet.add(ownTrailIndices[i]);
      }
      const changedIndices = Array.from(changedSet);

      board.convertIndicesToOwner(changedIndices, player.id);
      player.trailActive = false;
      player.currentTrailCells = 0;

      const eliminated = [];
      for (let i = 0; i < players.length; i += 1) {
        const target = players[i];
        if (!target.alive || target.id === player.id) {
          continue;
        }
        const idx = utils.toIndex(target.position.x, target.position.y);
        if (changedSet.has(idx) && board.getTerritory(target.position.x, target.position.y) === player.id) {
          eliminated.push(target.id);
        }
      }

      return {
        capturedIndices: changedIndices,
        eliminatedPlayerIds: eliminated,
        capturedCount: changedIndices.length
      };
    }
  }

  ns.TerritorySystem = TerritorySystem;
})();
