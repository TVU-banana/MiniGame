(function () {
  const ns = window.OccupyGrid;

  class InputSystem {
    constructor(onDirection, onAnyInput) {
      this.onDirection = onDirection;
      this.onAnyInput = onAnyInput;
      this.enabled = false;
      this.keyHandler = this.handleKeydown.bind(this);
      this.directionMap = {
        ArrowUp: "up",
        KeyW: "up",
        ArrowDown: "down",
        KeyS: "down",
        ArrowLeft: "left",
        KeyA: "left",
        ArrowRight: "right",
        KeyD: "right"
      };
    }

    setEnabled(flag) {
      const next = Boolean(flag);
      if (this.enabled === next) {
        return;
      }
      this.enabled = next;
      if (this.enabled) {
        window.addEventListener("keydown", this.keyHandler, { passive: false });
      } else {
        window.removeEventListener("keydown", this.keyHandler);
      }
    }

    handleKeydown(event) {
      if (!this.enabled) {
        return;
      }
      const direction = this.directionMap[event.code];
      if (!direction) {
        return;
      }
      event.preventDefault();
      if (this.onAnyInput) {
        this.onAnyInput();
      }
      this.onDirection(direction);
    }

    setVirtualDirection(directionName) {
      if (!this.enabled) {
        return;
      }
      if (this.onAnyInput) {
        this.onAnyInput();
      }
      this.onDirection(directionName);
    }
  }

  ns.InputSystem = InputSystem;
})();
