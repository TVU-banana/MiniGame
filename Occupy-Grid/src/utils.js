(function () {
  const ns = window.OccupyGrid;
  const cfg = ns.CONFIG;

  function toIndex(x, y) {
    return y * cfg.BOARD_WIDTH + x;
  }

  function toCell(index) {
    return {
      x: index % cfg.BOARD_WIDTH,
      y: Math.floor(index / cfg.BOARD_WIDTH)
    };
  }

  function inBounds(x, y) {
    return x >= 0 && x < cfg.BOARD_WIDTH && y >= 0 && y < cfg.BOARD_HEIGHT;
  }

  function isBorder(x, y) {
    return x <= 0 || y <= 0 || x >= cfg.BOARD_WIDTH - 1 || y >= cfg.BOARD_HEIGHT - 1;
  }

  function formatTimeMs(ms) {
    return String(Math.max(0, Math.ceil(ms / 1000)));
  }

  function nowDateLabel() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return yyyy + "/" + mm + "/" + dd;
  }

  function isOpposite(a, b) {
    return a && b && a.dx === -b.dx && a.dy === -b.dy;
  }

  function directionFromName(name) {
    const values = Object.values(cfg.DIRECTIONS);
    for (let i = 0; i < values.length; i += 1) {
      if (values[i].name === name) {
        return values[i];
      }
    }
    return cfg.DIRECTIONS.RIGHT;
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function shuffleInPlace(arr) {
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  ns.utils = {
    toIndex: toIndex,
    toCell: toCell,
    inBounds: inBounds,
    isBorder: isBorder,
    formatTimeMs: formatTimeMs,
    nowDateLabel: nowDateLabel,
    isOpposite: isOpposite,
    directionFromName: directionFromName,
    clamp: clamp,
    shuffleInPlace: shuffleInPlace
  };
})();
