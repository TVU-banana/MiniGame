export const formatDuration = (durationSeconds: number): string => {
  const minutes = Math.floor(durationSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(durationSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
};

export class GameTimer {
  private elapsedMs = 0;
  private running = false;
  private lastReportedSecond = -1;

  start(): void {
    this.elapsedMs = 0;
    this.running = true;
    this.lastReportedSecond = -1;
  }

  pause(): void {
    this.running = false;
  }

  resume(): void {
    this.running = true;
  }

  stop(): void {
    this.running = false;
  }

  update(deltaMs: number): boolean {
    if (!this.running) {
      return false;
    }
    this.elapsedMs += deltaMs;
    const currentSecond = this.getElapsedSeconds();
    if (currentSecond !== this.lastReportedSecond) {
      this.lastReportedSecond = currentSecond;
      return true;
    }
    return false;
  }

  getElapsedSeconds(): number {
    return Math.floor(this.elapsedMs / 1000);
  }
}
