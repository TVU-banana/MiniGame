(function () {
  const ns = window.OccupyGrid;
  const cfg = ns.CONFIG;
  const utils = ns.utils;
  const ALL_DIRECTIONS = Object.values(cfg.DIRECTIONS);

  class RandomSafeAI {
    chooseDirection(player, board) {
      const trailLength = board.trailIndicesByOwner(player.id).length;
      const scores = [];

      for (let i = 0; i < ALL_DIRECTIONS.length; i += 1) {
        const dir = ALL_DIRECTIONS[i];
        const nx = player.position.x + dir.dx;
        const ny = player.position.y + dir.dy;
        scores.push({
          direction: dir,
          score: this.scoreMove(player, board, nx, ny, dir, trailLength)
        });
      }

      scores.sort((a, b) => b.score - a.score);
      const best = scores[0];
      const picks = scores.filter((it) => it.score >= best.score - 3);
      const selected = picks[Math.floor(Math.random() * picks.length)];
      return selected.direction.name;
    }

    scoreMove(player, board, nx, ny, dir, trailLength) {
      if (!utils.inBounds(nx, ny) || utils.isBorder(nx, ny)) {
        return -100000;
      }

      const territoryOwner = board.getTerritory(nx, ny);
      const trailOwner = board.getTrail(nx, ny);
      const edgeDistance = Math.min(nx, ny, cfg.BOARD_WIDTH - 1 - nx, cfg.BOARD_HEIGHT - 1 - ny);
      const isHome = territoryOwner === player.id;
      let score = Math.random() * 0.9;

      if (dir.name === player.direction.name) {
        score += 1.5;
      }

      score += Math.min(edgeDistance, 12) * 0.9;

      if (trailOwner !== 0 && trailOwner !== player.id) {
        score += 14;
      }

      if (!player.trailActive) {
        if (territoryOwner === 0) {
          score += 4;
        } else if (territoryOwner !== player.id) {
          score += 9;
        } else {
          score -= 1;
        }
      } else {
        if (isHome) {
          score += 30 + trailLength * 0.3;
        } else {
          score += 3;
        }

        if (trailLength >= 14 && !isHome) {
          score -= 4;
        }
      }

      return score;
    }
  }

  class AggressiveEncircleAI {
    constructor() {
      this.botMemory = new Map();
    }

    chooseDirection(player, board) {
      const trailIndices = board.trailIndicesByOwner(player.id);
      const trailLength = trailIndices.length;
      const memory = this.getMemory(player.id);
      const nowEdge = this.edgeDistance(player.position.x, player.position.y);
      const nearEnemyTrail = this.nearestDistance(
        board,
        player.position.x,
        player.position.y,
        7,
        (x, y) => {
          const owner = board.getTrail(x, y);
          return owner !== 0 && owner !== player.id;
        }
      );

      if (!player.trailActive || memory.loopTarget <= 0) {
        memory.loopTarget = this.computeLoopTarget(player);
      }

      const shouldReturnHome = player.trailActive && (
        (trailLength >= memory.loopTarget && nearEnemyTrail > 2) ||
        nowEdge <= 3
      );

      const trailBounds = this.computeTrailBounds(trailIndices, player.position);
      const scored = [];

      for (let i = 0; i < ALL_DIRECTIONS.length; i += 1) {
        const dir = ALL_DIRECTIONS[i];
        const nx = player.position.x + dir.dx;
        const ny = player.position.y + dir.dy;
        scored.push({
          direction: dir,
          score: this.scoreMove(player, board, nx, ny, dir, trailLength, shouldReturnHome, trailBounds)
        });
      }

      scored.sort((a, b) => b.score - a.score);
      const best = scored[0];
      const candidates = scored.filter((it) => it.score >= best.score - 1.6);
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      return pick.direction.name;
    }

    scoreMove(player, board, nx, ny, dir, trailLength, shouldReturnHome, trailBounds) {
      if (!utils.inBounds(nx, ny) || utils.isBorder(nx, ny)) {
        return -1000000;
      }

      const territoryOwner = board.getTerritory(nx, ny);
      const trailOwner = board.getTrail(nx, ny);
      const isHome = territoryOwner === player.id;
      const edge = this.edgeDistance(nx, ny);
      const ownTerrDist = this.nearestDistance(
        board,
        nx,
        ny,
        12,
        (x, y) => board.getTerritory(x, y) === player.id
      );
      const enemyTerrDist = this.nearestDistance(
        board,
        nx,
        ny,
        12,
        (x, y) => {
          const owner = board.getTerritory(x, y);
          return owner !== 0 && owner !== player.id;
        }
      );
      const enemyTrailDist = this.nearestDistance(
        board,
        nx,
        ny,
        12,
        (x, y) => {
          const owner = board.getTrail(x, y);
          return owner !== 0 && owner !== player.id;
        }
      );

      let score = Math.random() * 0.8;

      if (dir.name === player.direction.name) {
        score += 2.2;
      }

      score += Math.min(edge, 12) * 1.3;

      if (edge <= 3) {
        score -= 120;
      } else if (edge <= 5) {
        score -= 20;
      }

      if (trailOwner !== 0 && trailOwner !== player.id) {
        score += 920;
      }

      if (!player.trailActive) {
        if (territoryOwner === player.id) {
          score -= 6;
        } else if (territoryOwner === 0) {
          score += 10;
        } else {
          score += 44;
        }

        score += Math.max(0, 12 - enemyTerrDist) * 3.2;
        score += Math.max(0, 10 - enemyTrailDist) * 5.2;
      } else {
        const loopArea = this.estimateLoopArea(trailBounds, nx, ny);

        if (shouldReturnHome) {
          if (isHome) {
            score += 280 + Math.min(loopArea, 220) * 0.42;
          } else {
            score += 8;
          }
          score -= ownTerrDist * 6.2;
          score += Math.max(0, 8 - enemyTrailDist) * 4.2;
        } else {
          score += Math.min(loopArea, 360) * 0.18;
          score += Math.max(0, 12 - enemyTerrDist) * 3.8;
          score += Math.max(0, 10 - enemyTrailDist) * 6.4;

          if (territoryOwner !== 0 && territoryOwner !== player.id) {
            score += 34;
          }

          if (isHome && trailLength < 7) {
            score -= 80;
          }

          if (ownTerrDist < 3) {
            score -= 4;
          }
        }
      }

      return score;
    }

    computeLoopTarget(player) {
      return 18 + Math.min(30, Math.floor(Math.sqrt(Math.max(1, player.territoryCells)) * 1.35));
    }

    computeTrailBounds(trailIndices, position) {
      let minX = position.x;
      let maxX = position.x;
      let minY = position.y;
      let maxY = position.y;

      for (let i = 0; i < trailIndices.length; i += 1) {
        const cell = utils.toCell(trailIndices[i]);
        if (cell.x < minX) {
          minX = cell.x;
        }
        if (cell.x > maxX) {
          maxX = cell.x;
        }
        if (cell.y < minY) {
          minY = cell.y;
        }
        if (cell.y > maxY) {
          maxY = cell.y;
        }
      }

      return {
        minX: minX,
        maxX: maxX,
        minY: minY,
        maxY: maxY
      };
    }

    estimateLoopArea(bounds, nx, ny) {
      const minX = Math.min(bounds.minX, nx);
      const maxX = Math.max(bounds.maxX, nx);
      const minY = Math.min(bounds.minY, ny);
      const maxY = Math.max(bounds.maxY, ny);
      return (maxX - minX + 1) * (maxY - minY + 1);
    }

    nearestDistance(board, x, y, maxRadius, predicate) {
      for (let r = 0; r <= maxRadius; r += 1) {
        for (let dy = -r; dy <= r; dy += 1) {
          for (let dx = -r; dx <= r; dx += 1) {
            if (Math.abs(dx) + Math.abs(dy) !== r) {
              continue;
            }
            const px = x + dx;
            const py = y + dy;
            if (!utils.inBounds(px, py)) {
              continue;
            }
            if (predicate(px, py)) {
              return r;
            }
          }
        }
      }
      return maxRadius + 1;
    }

    edgeDistance(x, y) {
      return Math.min(x, y, cfg.BOARD_WIDTH - 1 - x, cfg.BOARD_HEIGHT - 1 - y);
    }

    getMemory(playerId) {
      if (!this.botMemory.has(playerId)) {
        this.botMemory.set(playerId, { loopTarget: 0 });
      }
      return this.botMemory.get(playerId);
    }
  }

  class AISystem {
    constructor() {
      this.registry = {
        RandomSafeAI: new RandomSafeAI(),
        AggressiveAI: new AggressiveEncircleAI(),
        DefensiveAI: new RandomSafeAI(),
        TerritoryGreedyAI: new AggressiveEncircleAI()
      };
    }

    chooseDirectionFor(player, board) {
      const controller = this.registry[player.aiController] || this.registry.RandomSafeAI;
      return controller.chooseDirection(player, board);
    }
  }

  ns.AISystem = AISystem;
})();
