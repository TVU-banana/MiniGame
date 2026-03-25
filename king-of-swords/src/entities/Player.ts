import Phaser from 'phaser';
import { PLAYER_RADIUS } from '../data/balance';

export class Player extends Phaser.Physics.Arcade.Image {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDisplaySize(74, 74);
    this.setCircle(PLAYER_RADIUS);
    this.setOffset(11, 11);
    this.setCollideWorldBounds(true);
    (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.setDepth(10);
  }
}
