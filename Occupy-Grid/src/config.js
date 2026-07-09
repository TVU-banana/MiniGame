window.OccupyGrid = window.OccupyGrid || {};

(function () {
  const CONFIG = Object.freeze({
    BOARD_WIDTH: 100,
    BOARD_HEIGHT: 100,
    INITIAL_TERRITORY_SIZE: 3,
    MATCH_DURATION_MS: 60000,
    BASE_MOVE_INTERVAL_MS: 150,
    BOOST_MOVE_INTERVAL_MS: 100,
    PLAYER_IDS: Object.freeze({
      HUMAN: 1,
      BOT_A: 2,
      BOT_B: 3,
      BOT_C: 4,
      BOT_D: 5
    }),
    PLAYER_COLORS: Object.freeze({
      1: "#2f2a3a",
      2: "#3d8bff",
      3: "#ff5fb0",
      4: "#59d7a1",
      5: "#ffb347"
    }),
    PLAYER_NAMES: Object.freeze({
      1: "玩家",
      2: "Bot-A",
      3: "Bot-B",
      4: "Bot-C",
      5: "Bot-D"
    }),
    SPAWNS: Object.freeze({
      1: Object.freeze({ x: 50, y: 50 }),
      2: Object.freeze({ x: 20, y: 20 }),
      3: Object.freeze({ x: 80, y: 20 }),
      4: Object.freeze({ x: 80, y: 80 }),
      5: Object.freeze({ x: 20, y: 80 })
    }),
    DIRECTIONS: Object.freeze({
      UP: Object.freeze({ name: "up", dx: 0, dy: -1 }),
      DOWN: Object.freeze({ name: "down", dx: 0, dy: 1 }),
      LEFT: Object.freeze({ name: "left", dx: -1, dy: 0 }),
      RIGHT: Object.freeze({ name: "right", dx: 1, dy: 0 })
    }),
    HISTORY_KEY: "OCCUPY_GRID_HISTORY_V2",
    SETTINGS_KEY: "OCCUPY_GRID_SETTINGS_V2",
    MAX_HISTORY: 20,
    TICK_MS: 50
  });

  window.OccupyGrid.CONFIG = CONFIG;
})();
