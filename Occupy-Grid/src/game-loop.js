(function () {
  const ns = window.OccupyGrid;
  const cfg = ns.CONFIG;

  class GameLoop {
    constructor(onTick, onRender) {
      this.onTick = onTick;
      this.onRender = onRender;
      this.running = false;
      this.rafId = 0;
      this.lastTime = 0;
      this.accumulator = 0;
    }

    start() {
      if (this.running) {
        return;
      }
      this.running = true;
      this.lastTime = performance.now();
      this.accumulator = 0;
      this.loop();
    }

    stop() {
      this.running = false;
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = 0;
      }
    }

    loop() {
      if (!this.running) {
        return;
      }
      const now = performance.now();
      let delta = now - this.lastTime;
      this.lastTime = now;
      if (delta > 100) {
        delta = 100;
      }
      this.accumulator += delta;

      while (this.accumulator >= cfg.TICK_MS) {
        this.accumulator -= cfg.TICK_MS;
        this.onTick(cfg.TICK_MS, now);
      }

      this.onRender(now);
      this.rafId = requestAnimationFrame(() => this.loop());
    }
  }

  ns.GameLoop = GameLoop;
})();
