import Phaser from 'phaser';
import type { EnemyType } from '../app/types';

export class Enemy extends Phaser.Physics.Arcade.Image {
  readonly id: string;
  readonly type: EnemyType;
  hp: number;
  readonly maxHp: number;
  readonly damage: number;
  readonly moveSpeed: number;
  readonly radius: number;
  private steeringTimer = 0;
  private steeringAngle = 0;
  private knockbackUntil = 0;
  private recoveryUntil = 0;
  private knockbackVelocity = new Phaser.Math.Vector2();

  constructor(
    scene: Phaser.Scene,
    id: string,
    type: EnemyType,
    x: number,
    y: number,
    hp: number,
    speed: number,
    damage: number,
    radius: number
  ) {
    super(scene, x, y, `enemy-${type}`);
    this.id = id;
    this.type = type;
    this.hp = hp;
    this.maxHp = hp;
    this.moveSpeed = speed;
    this.damage = damage;
    this.radius = radius;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCircle(radius);
    this.setOffset(8, 8);
    this.setDepth(6);
    (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
  }

  applyKnockback(vector: Phaser.Math.Vector2, now: number, durationMs = 180): void {
    this.knockbackUntil = now + durationMs;
    this.recoveryUntil = this.knockbackUntil + 420;
    this.knockbackVelocity.copy(vector);
    (this.body as Phaser.Physics.Arcade.Body).setVelocity(vector.x, vector.y);
  }

  updateSteering(now: number, deltaMs: number, playerX: number, playerY: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (now < this.knockbackUntil) {
      body.setVelocity(this.knockbackVelocity.x, this.knockbackVelocity.y);
      this.knockbackVelocity.scale(Math.pow(0.88, deltaMs / 16.6667));
      return;
    }

    this.steeringTimer -= deltaMs;
    if (this.steeringTimer <= 0) {
      const angleToPlayer = Phaser.Math.Angle.Between(this.x, this.y, playerX, playerY);
      const offset = Math.random() < 0.3 ? Phaser.Math.FloatBetween(-0.45, 0.45) : 0;
      this.steeringAngle = angleToPlayer + offset;
      this.steeringTimer = Phaser.Math.Between(180, 460);
    }
    let speedFactor = 1;
    if (now < this.recoveryUntil) {
      const recoveryProgress =
        (now - this.knockbackUntil) / Math.max(1, this.recoveryUntil - this.knockbackUntil);
      speedFactor = Phaser.Math.Linear(0.35, 1, Phaser.Math.Clamp(recoveryProgress, 0, 1));
    }

    this.scene.physics.velocityFromRotation(this.steeringAngle, this.moveSpeed * speedFactor, body.velocity);
  }
}
