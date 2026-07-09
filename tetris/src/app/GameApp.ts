import Phaser from "phaser";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "./GameConfig";
import { BootScene } from "../scenes/BootScene";
import { GameScene } from "../scenes/GameScene";

export class GameApp {
  private readonly game: Phaser.Game;

  constructor(parentId = "game-container") {
    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: parentId,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      scene: [BootScene, GameScene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      backgroundColor: "#0b1221",
      audio: {
        disableWebAudio: false
      },
      fps: {
        target: 60,
        forceSetTimeOut: true
      },
      title: "俄罗斯方块 - tetris"
    });
  }

  destroy(): void {
    this.game.destroy(true);
  }
}
