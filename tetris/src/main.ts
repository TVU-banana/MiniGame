import { GameApp } from "./app/GameApp";
import "./styles/main.css";
import { UIRoot } from "./ui/UIRoot";

const uiContainer = document.getElementById("ui-root");

if (!uiContainer) {
  throw new Error("UI 容器不存在：#ui-root");
}

new UIRoot(uiContainer);
new GameApp("game-container");
