import Phaser from 'phaser';
import { SceneKeys } from '../app/SceneKeys';
import playerTextureUrl from '../assets/characters/player.svg';
import knifeTextureUrl from '../assets/weapons/knife.svg';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Boot);
  }

  preload(): void {
    this.load.image('player', playerTextureUrl);
    this.load.image('knife', knifeTextureUrl);
  }

  create(): void {
    this.createTextures();
    this.scene.start(SceneKeys.Menu);
  }

  private createTextures(): void {
    const g = this.add.graphics({ x: 0, y: 0 });

    if (!this.textures.exists('player')) {
      g.clear();
      g.fillStyle(0x83f2ba, 1);
      g.fillCircle(32, 32, 32);
      g.generateTexture('player', 64, 64);
    }

    if (!this.textures.exists('knife')) {
      g.clear();
      g.fillStyle(0xf4f7ff, 1);
      g.fillRoundedRect(18, 0, 20, 108, 10);
      g.fillStyle(0xffd166, 1);
      g.fillTriangle(28, 0, 40, 20, 16, 20);
      g.generateTexture('knife', 56, 108);
    }

    const makeEnemyTexture = (key: string, fill: number, stroke: number) => {
      g.clear();
      g.lineStyle(4, stroke, 1);
      g.fillStyle(fill, 1);
      g.fillCircle(40, 40, 28);
      g.strokeCircle(40, 40, 28);
      g.generateTexture(key, 80, 80);
    };

    makeEnemyTexture('enemy-small', 0xff7a7a, 0xffd2d2);
    makeEnemyTexture('enemy-medium', 0xffae57, 0xffe4c0);
    makeEnemyTexture('enemy-large', 0xffdf6b, 0xfff5c1);

    g.destroy();
  }
}
