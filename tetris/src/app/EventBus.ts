import Phaser from "phaser";
import type { GameStats, GlobalGameState, HudPayload, PlaySubState } from "./GameConfig";
import type { GameRecord } from "./GameConfig";

export interface StatePayload {
  globalState: GlobalGameState;
  subState: PlaySubState;
}

export const GameEvents = {
  StartGame: "ui:start-game",
  PauseGame: "ui:pause-game",
  ResumeGame: "ui:resume-game",
  ReturnToMenu: "ui:return-to-menu",
  OpenSettings: "ui:open-settings",
  CloseSettings: "ui:close-settings",
  OpenHistory: "ui:open-history",
  CloseHistory: "ui:close-history",
  MoveLeftStart: "ui:move-left-start",
  MoveLeftEnd: "ui:move-left-end",
  MoveRightStart: "ui:move-right-start",
  MoveRightEnd: "ui:move-right-end",
  SoftDropStart: "ui:soft-drop-start",
  SoftDropEnd: "ui:soft-drop-end",
  Rotate: "ui:rotate",
  StateChanged: "game:state-changed",
  HudUpdated: "game:hud-updated",
  ResultReady: "game:result-ready",
  HistoryUpdated: "game:history-updated"
} as const;

export type EventName = (typeof GameEvents)[keyof typeof GameEvents];

export const eventBus = new Phaser.Events.EventEmitter();

export const emitState = (payload: StatePayload): void => {
  eventBus.emit(GameEvents.StateChanged, payload);
};

export const emitHud = (payload: HudPayload): void => {
  eventBus.emit(GameEvents.HudUpdated, payload);
};

export const emitResult = (payload: GameStats): void => {
  eventBus.emit(GameEvents.ResultReady, payload);
};

export const emitHistoryUpdated = (records: GameRecord[]): void => {
  eventBus.emit(GameEvents.HistoryUpdated, records);
};
