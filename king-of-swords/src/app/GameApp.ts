import Phaser from 'phaser';
import { appEvents } from './events';
import { createGameConfig } from './GameConfig';
import { SceneKeys } from './SceneKeys';
import type { GameResult, RunRecord, SettingsState } from './types';
import { loadSettings, saveSettings } from '../data/storage';
import { AudioManager } from '../audio/AudioManager';
import { AppUI } from '../ui/AppUI';
import { RecordSystem } from '../systems/RecordSystem';

export class GameApp {
  private readonly shell: HTMLDivElement;
  private readonly host: HTMLDivElement;
  private readonly ui: AppUI;
  private readonly game: Phaser.Game;
  private readonly records = new RecordSystem();
  private readonly audio: AudioManager;
  private settings: SettingsState;
  private currentRecords: RunRecord[];
  private playing = false;
  private pausedBySettings = false;

  constructor(root: HTMLElement) {
    this.shell = document.createElement('div');
    this.shell.className = 'shell';
    this.host = document.createElement('div');
    this.host.className = 'game-host';
    this.shell.appendChild(this.host);
    root.appendChild(this.shell);

    this.settings = loadSettings();
    this.currentRecords = this.records.getRecords();
    this.audio = new AudioManager(this.settings);
    this.ui = new AppUI(this.shell, this.settings, this.currentRecords);
    this.game = new Phaser.Game(createGameConfig(this.host));

    this.bindEvents();
    this.ui.showMenu();
  }

  private bindEvents(): void {
    appEvents.on('ui:start-game', () => {
      void this.startGame();
    });
    appEvents.on('ui:restart-game', () => {
      void this.startGame();
    });
    appEvents.on('ui:return-menu', () => {
      this.returnToMenu();
    });
    appEvents.on('ui:open-settings', () => {
      this.ui.showSettings();
      if (this.playing) {
        this.game.scene.pause(SceneKeys.Game);
        this.pausedBySettings = true;
      }
    });
    appEvents.on('ui:close-settings', () => {
      this.ui.hideSettings();
      if (this.pausedBySettings) {
        this.game.scene.resume(SceneKeys.Game);
        this.pausedBySettings = false;
      }
    });
    appEvents.on('ui:open-history', () => {
      this.ui.renderRecords(this.currentRecords);
      this.ui.showHistory();
    });
    appEvents.on('ui:close-history', () => {
      this.ui.hideHistory();
    });
    appEvents.on('ui:settings-changed', (settings) => {
      this.settings = settings;
      saveSettings(settings);
      this.audio.updateSettings(settings);
      this.ui.applySettings(settings);
    });
    appEvents.on('audio:button', () => {
      void this.audio.unlock().then(() => this.audio.playButton());
    });
    appEvents.on('audio:sfx', ({ key }) => {
      this.audio.playSfx(key);
    });
    appEvents.on('game:hud', (snapshot) => {
      this.ui.updateHud(snapshot);
    });
    appEvents.on('game:notification', ({ text }) => {
      this.ui.showToast(text);
    });
    appEvents.on('game:finished', (result) => {
      this.onGameFinished(result);
    });
  }

  private async startGame(): Promise<void> {
    await this.audio.unlock();
    this.playing = true;
    this.pausedBySettings = false;
    this.ui.hideSettings();
    this.ui.hideHistory();
    this.ui.hideResult();
    this.ui.resetJoystick();
    this.ui.showGameHud();
    this.audio.playBgm('game');

    this.game.scene.stop(SceneKeys.Menu);
    if (this.game.scene.isActive(SceneKeys.Game)) {
      this.game.scene.stop(SceneKeys.Game);
    }
    this.game.scene.start(SceneKeys.Game);
  }

  private returnToMenu(): void {
    this.playing = false;
    this.pausedBySettings = false;
    this.ui.resetJoystick();
    this.ui.hideSettings();
    this.ui.hideHistory();
    this.ui.hideResult();
    this.ui.showMenu();
    if (this.game.scene.isActive(SceneKeys.Game) || this.game.scene.isPaused(SceneKeys.Game)) {
      this.game.scene.stop(SceneKeys.Game);
    }
    if (!this.game.scene.isActive(SceneKeys.Menu)) {
      this.game.scene.start(SceneKeys.Menu);
    }
    this.audio.playBgm('menu');
  }

  private onGameFinished(result: GameResult): void {
    this.playing = false;
    this.audio.stopBgm();
    const saved = this.records.save(result);
    this.currentRecords = this.records.getRecords();
    this.ui.renderRecords(this.currentRecords);
    this.ui.showResult(saved);
    this.audio.playResult(saved.success);
  }
}
