export class VirtualJoystick {
  private pointerId: number | null = null;
  private vector = { x: 0, y: 0 };
  private readonly baseRadius = 44;
  private readonly inputScale = 1.35;

  constructor(
    private root: HTMLElement,
    private knob: HTMLElement
  ) {
    this.attach();
  }

  getVector(): { x: number; y: number } {
    return this.vector;
  }

  reset(): void {
    this.pointerId = null;
    this.vector = { x: 0, y: 0 };
    this.knob.style.transform = 'translate(-50%, -50%) translate(0px, 0px)';
  }

  private attach(): void {
    this.root.addEventListener('pointerdown', (event) => {
      this.pointerId = event.pointerId;
      this.root.setPointerCapture(event.pointerId);
      this.updateFromPointer(event);
    });
    this.root.addEventListener('pointermove', (event) => {
      if (event.pointerId !== this.pointerId) return;
      this.updateFromPointer(event);
    });
    const end = (event: PointerEvent) => {
      if (event.pointerId !== this.pointerId) return;
      this.reset();
    };
    this.root.addEventListener('pointerup', end);
    this.root.addEventListener('pointercancel', end);
  }

  private updateFromPointer(event: PointerEvent): void {
    const rect = this.root.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;
    const distance = Math.hypot(dx, dy);
    const clamped = Math.min(this.baseRadius, distance);
    const angle = Math.atan2(dy, dx);
    const strength = clamped / this.baseRadius;
    const responsiveStrength = Math.pow(strength, 0.72);
    const knobX = Math.cos(angle) * clamped;
    const knobY = Math.sin(angle) * clamped;
    const normalized =
      distance === 0
        ? { x: 0, y: 0 }
        : {
            x: Math.max(-1, Math.min(1, Math.cos(angle) * responsiveStrength * this.inputScale)),
            y: Math.max(-1, Math.min(1, Math.sin(angle) * responsiveStrength * this.inputScale))
          };
    this.vector = normalized;
    this.knob.style.transform = `translate(-50%, -50%) translate(${knobX}px, ${knobY}px)`;
  }
}
