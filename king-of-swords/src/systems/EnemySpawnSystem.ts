import Phaser from 'phaser';
import type { EnemyType } from '../app/types';
import { ENEMY_STATS, WORLD_HEIGHT, WORLD_WIDTH, getSpawnInterval, getSpawnWeights } from '../data/balance';
import { weightedPick } from '../utils/math';
import { Enemy } from '../entities/Enemy';

export class EnemySpawnSystem {
  private nextSpawnAt = 0;
  private serial = 0;

  reset(): void {
    this.nextSpawnAt = 0;
    this.serial = 0;
  }

  update(
    scene: Phaser.Scene,
    group: Phaser.Physics.Arcade.Group,
    elapsedSeconds: number,
    playerPosition: Phaser.Math.Vector2
  ): void {
    const now = scene.time.now;
    if (now < this.nextSpawnAt) return;
    this.nextSpawnAt = now + getSpawnInterval(elapsedSeconds);
    const type = weightedPick<EnemyType>(
      getSpawnWeights(elapsedSeconds).map((item) => ({ value: item.type, weight: item.weight }))
    );
    const enemy = this.createEnemy(scene, type, playerPosition);
    group.add(enemy);
  }

  private createEnemy(
    scene: Phaser.Scene,
    type: EnemyType,
    playerPosition: Phaser.Math.Vector2
  ): Enemy {
    const stats = ENEMY_STATS[type];
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const distance = Phaser.Math.Between(560, 760);
    const x = Phaser.Math.Clamp(playerPosition.x + Math.cos(angle) * distance, 40, WORLD_WIDTH - 40);
    const y = Phaser.Math.Clamp(playerPosition.y + Math.sin(angle) * distance, 40, WORLD_HEIGHT - 40);
    return new Enemy(
      scene,
      `enemy-${this.serial++}`,
      type,
      x,
      y,
      stats.hp,
      stats.speed,
      stats.damage,
      stats.radius
    );
  }
}
