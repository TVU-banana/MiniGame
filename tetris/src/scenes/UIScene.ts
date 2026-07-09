import Phaser from "phaser";
import { SceneKeys } from "../app/SceneKeys";

export class UIScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.UI);
  }
}
