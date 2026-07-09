(function () {
  const ns = window.OccupyGrid;
  const cfg = ns.CONFIG;
  const utils = ns.utils || {};

  class BoardSystem {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.width = cfg.BOARD_WIDTH;
      this.height = cfg.BOARD_HEIGHT;
      this.cellCount = this.width * this.height;
      this.territory = new Uint8Array(this.cellCount);
      this.trail = new Uint8Array(this.cellCount);
      this.pixelRatio = Math.max(1, window.devicePixelRatio || 1);
      this.viewport = {
        x: 0,
        y: 0,
        sizePx: 0,
        cellSize: 6
      };
      this.resize();
      window.addEventListener("resize", () => this.resize());
    }

    clearAll() {
      this.territory.fill(0);
      this.trail.fill(0);
    }

    resize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.pixelRatio = Math.max(1, window.devicePixelRatio || 1);
      this.canvas.width = Math.floor(w * this.pixelRatio);
      this.canvas.height = Math.floor(h * this.pixelRatio);
      this.canvas.style.width = w + "px";
      this.canvas.style.height = h + "px";
      this.ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);

      const boardSize = Math.floor(Math.min(w - 20, h - 20));
      const cellSize = Math.max(3, Math.floor(boardSize / this.width));
      const sizePx = cellSize * this.width;
      this.viewport.cellSize = cellSize;
      this.viewport.sizePx = sizePx;
      this.viewport.x = Math.floor((w - sizePx) / 2);
      this.viewport.y = Math.floor((h - sizePx) / 2);
    }

    toIndex(x, y) {
      return y * this.width + x;
    }

    getTerritory(x, y) {
      if (!utils.inBounds(x, y)) {
        return 0;
      }
      return this.territory[this.toIndex(x, y)];
    }

    setTerritory(x, y, ownerId) {
      if (!utils.inBounds(x, y)) {
        return;
      }
      this.territory[this.toIndex(x, y)] = ownerId;
    }

    getTrail(x, y) {
      if (!utils.inBounds(x, y)) {
        return 0;
      }
      return this.trail[this.toIndex(x, y)];
    }

    setTrail(x, y, ownerId) {
      if (!utils.inBounds(x, y)) {
        return;
      }
      this.trail[this.toIndex(x, y)] = ownerId;
    }

    clearTrailByOwner(ownerId) {
      for (let i = 0; i < this.trail.length; i += 1) {
        if (this.trail[i] === ownerId) {
          this.trail[i] = 0;
        }
      }
    }

    trailIndicesByOwner(ownerId) {
      const arr = [];
      for (let i = 0; i < this.trail.length; i += 1) {
        if (this.trail[i] === ownerId) {
          arr.push(i);
        }
      }
      return arr;
    }

    claimSpawn(centerX, centerY, ownerId) {
      const half = Math.floor(cfg.INITIAL_TERRITORY_SIZE / 2);
      for (let y = centerY - half; y <= centerY + half; y += 1) {
        for (let x = centerX - half; x <= centerX + half; x += 1) {
          if (utils.inBounds(x, y)) {
            const idx = this.toIndex(x, y);
            this.territory[idx] = ownerId;
            this.trail[idx] = 0;
          }
        }
      }
    }

    countTerritory(ownerId) {
      let total = 0;
      for (let i = 0; i < this.territory.length; i += 1) {
        if (this.territory[i] === ownerId) {
          total += 1;
        }
      }
      return total;
    }

    convertIndicesToOwner(indices, ownerId) {
      for (let i = 0; i < indices.length; i += 1) {
        const idx = indices[i];
        this.territory[idx] = ownerId;
        this.trail[idx] = 0;
      }
    }

    render(state) {
      const ctx = this.ctx;
      const vp = this.viewport;
      const width = window.innerWidth;
      const height = window.innerHeight;

      const bg = ctx.createLinearGradient(0, 0, width, height);
      bg.addColorStop(0, "#060812");
      bg.addColorStop(1, "#111729");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "rgba(90, 232, 255, 0.04)";
      ctx.beginPath();
      ctx.arc(width * 0.17, height * 0.24, 120, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 96, 178, 0.04)";
      ctx.beginPath();
      ctx.arc(width * 0.8, height * 0.7, 180, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#f6fbff";
      ctx.fillRect(vp.x, vp.y, vp.sizePx, vp.sizePx);
      ctx.strokeStyle = "rgba(74, 94, 122, 0.5)";
      ctx.lineWidth = 2;
      ctx.strokeRect(vp.x - 1, vp.y - 1, vp.sizePx + 2, vp.sizePx + 2);

      this.renderTerritory(ctx, vp);
      this.renderTrail(ctx, vp);
      if (state.settings.showGrid) {
        this.renderGrid(ctx, vp);
      }
      this.renderBodies(ctx, vp, state.players);
    }

    renderGrid(ctx, vp) {
      ctx.strokeStyle = "rgba(52, 74, 97, 0.2)";
      ctx.lineWidth = 1;
      const step = 5;
      for (let n = 0; n <= this.width; n += step) {
        const pos = vp.x + n * vp.cellSize + 0.5;
        ctx.beginPath();
        ctx.moveTo(pos, vp.y);
        ctx.lineTo(pos, vp.y + vp.sizePx);
        ctx.stroke();
      }
      for (let n = 0; n <= this.height; n += step) {
        const pos = vp.y + n * vp.cellSize + 0.5;
        ctx.beginPath();
        ctx.moveTo(vp.x, pos);
        ctx.lineTo(vp.x + vp.sizePx, pos);
        ctx.stroke();
      }
    }

    renderTerritory(ctx, vp) {
      for (let i = 0; i < this.territory.length; i += 1) {
        const owner = this.territory[i];
        if (owner === 0) {
          continue;
        }
        const cell = utils.toCell(i);
        ctx.fillStyle = this.toTerritoryColor(owner);
        ctx.fillRect(
          vp.x + cell.x * vp.cellSize,
          vp.y + cell.y * vp.cellSize,
          vp.cellSize,
          vp.cellSize
        );
      }
    }

    renderTrail(ctx, vp) {
      for (let i = 0; i < this.trail.length; i += 1) {
        const owner = this.trail[i];
        if (owner === 0) {
          continue;
        }
        const cell = utils.toCell(i);
        ctx.fillStyle = this.toTrailColor(owner);
        const x = vp.x + cell.x * vp.cellSize;
        const y = vp.y + cell.y * vp.cellSize;
        ctx.fillRect(x + 0.5, y + 0.5, Math.max(2, vp.cellSize - 1), Math.max(2, vp.cellSize - 1));
      }
    }

    renderBodies(ctx, vp, players) {
      for (let i = 0; i < players.length; i += 1) {
        const player = players[i];
        if (!player.alive) {
          continue;
        }
        const x = vp.x + player.position.x * vp.cellSize;
        const y = vp.y + player.position.y * vp.cellSize;
        const color = cfg.PLAYER_COLORS[player.id];
        ctx.save();
        ctx.shadowBlur = Math.max(6, vp.cellSize * 1.4);
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.fillRect(x + 1, y + 1, Math.max(2, vp.cellSize - 2), Math.max(2, vp.cellSize - 2));
        ctx.restore();
        ctx.strokeStyle = "rgba(255,255,255,0.42)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, Math.max(2, vp.cellSize - 1), Math.max(2, vp.cellSize - 1));
      }
    }

    toTerritoryColor(ownerId) {
      const color = cfg.PLAYER_COLORS[ownerId];
      if (ownerId === cfg.PLAYER_IDS.HUMAN) {
        return "rgba(47, 42, 58, 0.74)";
      }
      return this.hexToRgba(color, 0.36);
    }

    toTrailColor(ownerId) {
      const color = cfg.PLAYER_COLORS[ownerId];
      if (ownerId === cfg.PLAYER_IDS.HUMAN) {
        return "rgba(79, 66, 110, 0.95)";
      }
      return this.hexToRgba(color, 0.92);
    }

    hexToRgba(hex, alpha) {
      if (!hex) {
        return "rgba(255,255,255," + alpha + ")";
      }
      const raw = hex.replace("#", "");
      const expanded = raw.length === 3
        ? raw.split("").map((s) => s + s).join("")
        : raw;
      const v = parseInt(expanded, 16);
      const r = (v >> 16) & 255;
      const g = (v >> 8) & 255;
      const b = v & 255;
      return "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
    }
  }

  ns.BoardSystem = BoardSystem;
})();
