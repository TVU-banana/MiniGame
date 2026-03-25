import Phaser from 'phaser';
import { KNIFE_DAMAGE_INTERVAL_MS, KNIFE_MAX_DURABILITY } from '../data/balance';

export class Knife extends Phaser.Physics.Arcade.Image {
  readonly id: string;
  angleOffset = 0;
  radius = 0;
  durability = KNIFE_MAX_DURABILITY;
  isPermanent = false;
  activeKnife = true;
  private hitCooldowns = new Map<string, number>();

  constructor(scene: Phaser.Scene, id: string) {
    super(scene, 0, 0, 'knife');
    this.id = id;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    this.setImmovable(true);
    this.setDepth(8);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setEnable(false);
  }

  canHit(targetId: string, now: number): boolean {
    const lastHit = this.hitCooldowns.get(targetId) ?? -Infinity;
    return now - lastHit >= KNIFE_DAMAGE_INTERVAL_MS;
  }

  markHit(targetId: string, now: number): void {
    this.hitCooldowns.set(targetId, now);
    if (!this.isPermanent) {
      this.durability -= 1;
    }
  }
}
