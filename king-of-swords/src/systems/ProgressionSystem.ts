import { KNIFE_REWARD_INTERVAL, MAX_KNIVES } from '../data/balance';

export class ProgressionSystem {
  private nextRewardAt = KNIFE_REWARD_INTERVAL;

  reset(): void {
    this.nextRewardAt = KNIFE_REWARD_INTERVAL;
  }

  consumeKnifeRewards(kills: number): number {
    let rewards = 0;
    while (kills >= this.nextRewardAt) {
      this.nextRewardAt += KNIFE_REWARD_INTERVAL;
      rewards += 1;
    }
    return Math.min(MAX_KNIVES, rewards);
  }
}
