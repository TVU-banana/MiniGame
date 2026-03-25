import Phaser from 'phaser';
import {
  KNIFE_LENGTH,
  KNIFE_MAX_DURABILITY,
  KNIFE_RADIUS,
  KNIFE_WIDTH
} from '../data/balance';
import { Knife } from '../entities/Knife';

export class KnifeSystem {
  private serial = 0;

  reset(): void {
    this.serial = 0;
  }

  syncCount(scene: Phaser.Scene, group: Phaser.Physics.Arcade.Group, count: number): Knife[] {
    while (group.getLength() < count) {
      const isPermanent = group.getLength() === 0;
      const knife = new Knife(scene, `knife-${this.serial++}`);
      knife.radius = KNIFE_RADIUS;
      knife.isPermanent = isPermanent;
      knife.durability = isPermanent ? Number.POSITIVE_INFINITY : KNIFE_MAX_DURABILITY;
      group.add(knife);
    }

    while (group.getLength() > count) {
      const knives = group.getChildren() as Knife[];
      const knife = knives[knives.length - 1];
      if (!knife) {
        break;
      }
      group.remove(knife, true, true);
    }

    return group.getChildren() as Knife[];
  }

  layout(
    knives: Knife[],
    playerPosition: Phaser.Math.Vector2,
    baseRotation: number
  ): void {
    const count = knives.length;
    knives.forEach((knife, index) => {
      const angle = baseRotation + (Math.PI * 2 * index) / Math.max(count, 1);
      knife.angleOffset = angle;
      knife.x = playerPosition.x;
      knife.y = playerPosition.y;
      knife.rotation = angle + Math.PI / 2;
      knife.setDisplaySize(KNIFE_WIDTH * 1.2, KNIFE_LENGTH);
    });
  }
}
