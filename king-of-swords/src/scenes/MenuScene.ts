import Phaser from 'phaser';
import { SceneKeys } from '../app/SceneKeys';
import { GAME_HEIGHT, GAME_WIDTH } from '../data/balance';

export class MenuScene extends Phaser.Scene {
  private bladeGroup?: Phaser.GameObjects.Group;

  constructor() {
    super(SceneKeys.Menu);
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0b1219');
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0c1621, 1);
    this.add.circle(GAME_WIDTH / 2, 240, 220, 0xffd166, 0.08);
    this.add.circle(GAME_WIDTH * 0.18, 360, 160, 0x7ef29a, 0.06);
    this.bladeGroup = this.add.group();
    for (let index = 0; index < 12; index += 1) {
      const blade = this.add.image(
        Phaser.Math.Between(80, GAME_WIDTH - 80),
        Phaser.Math.Between(120, GAME_HEIGHT - 120),
        'knife'
      );
      blade.setAlpha(0.12);
      blade.setScale(0.7 + Math.random() * 0.4);
      blade.rotation = Math.random() * Math.PI * 2;
      this.bladeGroup.add(blade);
    }
  }

  update(_: number, delta: number): void {
    const step = delta * 0.0004;
    this.bladeGroup?.children.each((child, index) => {
      const blade = child as Phaser.GameObjects.Image;
      blade.rotation += step * (index % 2 === 0 ? 1 : -1);
      blade.y += Math.sin(this.time.now * 0.001 + index) * 0.14;
      return false;
    });
  }
}
