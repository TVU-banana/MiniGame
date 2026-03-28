import Phaser from 'phaser';
import { appEvents } from '../app/events';
import { SceneKeys } from '../app/SceneKeys';
import type { GameSnapshot, PlayerState } from '../app/types';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Knife } from '../entities/Knife';
import {
  GAME_HEIGHT,
  GAME_WIDTH,
  INITIAL_KNIVES,
  KNIFE_LENGTH,
  KNIFE_WIDTH,
  MAX_KNIVES,
  PLAYER_INVINCIBLE_MS,
  PLAYER_MAX_HP,
  PLAYER_SPEED,
  ROUND_DURATION,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  getRotationSpeed
} from '../data/balance';
import { EnemySpawnSystem } from '../systems/EnemySpawnSystem';
import { KnifeSystem } from '../systems/KnifeSystem';
import { ProgressionSystem } from '../systems/ProgressionSystem';
import { distancePointToSegment } from '../utils/math';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private enemies!: Phaser.Physics.Arcade.Group;
  private knives!: Phaser.Physics.Arcade.Group;
  private playerState!: PlayerState;
  private readonly knifeSystem = new KnifeSystem();
  private readonly spawnSystem = new EnemySpawnSystem();
  private readonly progression = new ProgressionSystem();
  private baseRotation = 0;
  private startIso = '';
  private runStartedAt = 0;
  private maxKnivesHeld = INITIAL_KNIVES;
  private finished = false;
  private moveVector = new Phaser.Math.Vector2();
  private dragPointerId: number | null = null;

  constructor() {
    super(SceneKeys.Game);
  }

  create(): void {
    this.finished = false;
    this.startIso = new Date().toISOString();
    this.runStartedAt = this.time.now;
    this.maxKnivesHeld = INITIAL_KNIVES;
    this.baseRotation = 0;
    this.knifeSystem.reset();
    this.spawnSystem.reset();
    this.progression.reset();
    this.playerState = {
      hp: PLAYER_MAX_HP,
      maxHp: PLAYER_MAX_HP,
      moveSpeed: PLAYER_SPEED,
      invincibleUntil: 0,
      currentKnifeCount: INITIAL_KNIVES,
      unlockedKnifeSlots: MAX_KNIVES,
      kills: 0,
      alive: true
    };

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBackgroundColor('#0a1119');
    this.drawArena();

    this.player = new Player(this, WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
    this.cameras.main.startFollow(this.player, true, 1, 1);
    this.cameras.main.setZoom(1);

    this.enemies = this.physics.add.group({ runChildUpdate: false });
    this.knives = this.physics.add.group({ runChildUpdate: false });
    this.knifeSystem.syncCount(this, this.knives, INITIAL_KNIVES);

    this.physics.add.overlap(
      this.player,
      this.enemies,
      (_, enemyObj) => this.handlePlayerHit(enemyObj as Enemy),
      undefined,
      this
    );

    this.bindDirectDragControls();
    this.emitHud();
  }

  update(_: number, delta: number): void {
    if (this.finished) return;

    const elapsedSeconds = (this.time.now - this.runStartedAt) / 1000;
    const timeLeft = ROUND_DURATION - elapsedSeconds;

    if (timeLeft <= 0) {
      this.finishRun(true);
      return;
    }

    this.updatePlayer(delta);
    this.baseRotation += getRotationSpeed(elapsedSeconds) * (delta / 1000);
    const knives = this.knifeSystem.syncCount(this, this.knives, this.playerState.currentKnifeCount);
    this.knifeSystem.layout(
      knives,
      new Phaser.Math.Vector2(this.player.x, this.player.y),
      this.baseRotation
    );

    this.spawnSystem.update(
      this,
      this.enemies,
      elapsedSeconds,
      new Phaser.Math.Vector2(this.player.x, this.player.y)
    );

    (this.enemies.getChildren() as Enemy[]).forEach((enemy) => {
      enemy.updateSteering(this.time.now, delta, this.player.x, this.player.y);
    });

    this.processKnifeHits(knives);

    if (this.time.now < this.playerState.invincibleUntil) {
      this.player.setAlpha(Math.floor(this.time.now / 80) % 2 === 0 ? 0.45 : 1);
    } else {
      this.player.setAlpha(1);
    }

    this.emitHud();
  }

  private updatePlayer(_: number): void {
    const movement = this.moveVector.clone();
    if (movement.lengthSq() > 1) movement.normalize();
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(
      movement.x * this.playerState.moveSpeed,
      movement.y * this.playerState.moveSpeed
    );
  }

  private bindDirectDragControls(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.finished || this.dragPointerId !== null) return;
      const distance = Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, this.player.x, this.player.y);
      if (distance <= 56) {
        this.dragPointerId = pointer.id;
        this.updateMoveVector(pointer);
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id !== this.dragPointerId) return;
      this.updateMoveVector(pointer);
    });

    const release = (pointer: Phaser.Input.Pointer) => {
      if (pointer.id !== this.dragPointerId) return;
      this.dragPointerId = null;
      this.moveVector.set(0, 0);
    };

    this.input.on('pointerup', release);
    this.input.on('gameout', () => {
      this.dragPointerId = null;
      this.moveVector.set(0, 0);
    });
  }

  private updateMoveVector(pointer: Phaser.Input.Pointer): void {
    this.moveVector.set(pointer.worldX - this.player.x, pointer.worldY - this.player.y);
    if (this.moveVector.lengthSq() > 1) {
      this.moveVector.normalize();
    }
  }

  private handleKnifeHit(knife: Knife, enemy: Enemy): void {
    if (!knife.activeKnife || this.finished) return;
    const now = this.time.now;
    if (!knife.canHit(enemy.id, now)) return;

    knife.markHit(enemy.id, now);
    enemy.hp -= 1;
    appEvents.emit('audio:sfx', { key: 'hit' });

    const knockback = new Phaser.Math.Vector2(enemy.x - this.player.x, enemy.y - this.player.y)
      .normalize()
      .scale(280);
    enemy.applyKnockback(knockback, now, 180);
    this.tweens.add({
      targets: enemy,
      alpha: 0.45,
      yoyo: true,
      duration: 60
    });

    if (!knife.isPermanent && knife.durability <= 0) {
      this.knives.remove(knife, true, true);
      this.playerState.currentKnifeCount = Math.max(1, this.playerState.currentKnifeCount - 1);
      appEvents.emit('audio:sfx', { key: 'knifeBreak' });
    }

    if (enemy.hp <= 0) {
      this.killEnemy(enemy);
    }
  }

  private processKnifeHits(knives: Knife[]): void {
    const enemies = this.enemies.getChildren() as Enemy[];
    for (const knife of knives) {
      if (!knife.activeKnife) continue;
      const endX = this.player.x + Math.cos(knife.angleOffset) * KNIFE_LENGTH;
      const endY = this.player.y + Math.sin(knife.angleOffset) * KNIFE_LENGTH;

      for (const enemy of enemies) {
        if (!enemy.active) continue;
        const distance = distancePointToSegment(
          enemy.x,
          enemy.y,
          this.player.x,
          this.player.y,
          endX,
          endY
        );

        if (distance <= enemy.radius + KNIFE_WIDTH * 0.7) {
          this.handleKnifeHit(knife, enemy);
        }
      }
    }
  }

  private killEnemy(enemy: Enemy): void {
    this.enemies.remove(enemy, true, true);
    this.playerState.kills += 1;
    appEvents.emit('audio:sfx', { key: 'enemyDeath' });

    const rewards = this.progression.consumeKnifeRewards(this.playerState.kills);
    if (rewards > 0) {
      this.playerState.currentKnifeCount = Math.min(
        MAX_KNIVES,
        this.playerState.currentKnifeCount + rewards
      );
      this.maxKnivesHeld = Math.max(this.maxKnivesHeld, this.playerState.currentKnifeCount);
      appEvents.emit('audio:sfx', { key: 'knifeUnlock' });
      appEvents.emit('game:notification', { text: '刀数 +1' });
      this.knifeSystem.syncCount(this, this.knives, this.playerState.currentKnifeCount);
    }
  }

  private handlePlayerHit(enemy: Enemy): void {
    if (this.finished || this.time.now < this.playerState.invincibleUntil) return;
    this.playerState.hp = Math.max(0, this.playerState.hp - enemy.damage);
    this.playerState.invincibleUntil = this.time.now + PLAYER_INVINCIBLE_MS;
    appEvents.emit('audio:sfx', { key: 'playerHurt' });

    const push = new Phaser.Math.Vector2(this.player.x - enemy.x, this.player.y - enemy.y)
      .normalize()
      .scale(180);
    (this.player.body as Phaser.Physics.Arcade.Body).velocity.add(push);
    if (this.playerState.hp <= 0) {
      this.finishRun(false);
    }
  }

  private finishRun(success: boolean): void {
    if (this.finished) return;
    this.finished = true;
    this.playerState.alive = false;
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    (this.enemies.getChildren() as Enemy[]).forEach((enemy) =>
      (enemy.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0)
    );

    const elapsedSeconds = Math.min(
      ROUND_DURATION,
      Math.max(0, Math.round((this.time.now - this.runStartedAt) / 1000))
    );

    appEvents.emit('game:finished', {
      id: crypto.randomUUID(),
      startedAt: this.startIso,
      finishedAt: new Date().toISOString(),
      success,
      survivalSeconds: elapsedSeconds,
      kills: this.playerState.kills,
      maxKnifeCount: this.maxKnivesHeld,
      bestRecord: false
    });
  }

  private emitHud(): void {
    const snapshot: GameSnapshot = {
      hp: this.playerState.hp,
      maxHp: this.playerState.maxHp,
      timeLeft: Math.max(0, ROUND_DURATION - (this.time.now - this.runStartedAt) / 1000),
      kills: this.playerState.kills,
      currentKnives: this.playerState.currentKnifeCount,
      unlockedKnives: this.playerState.unlockedKnifeSlots,
      maxKnivesHeld: this.maxKnivesHeld
    };
    appEvents.emit('game:hud', snapshot);
  }

  private drawArena(): void {
    const grid = this.add.graphics();
    grid.fillStyle(0x0b1219, 1);
    grid.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    grid.lineStyle(1, 0x153042, 0.4);
    for (let x = 0; x < WORLD_WIDTH; x += 90) {
      grid.lineBetween(x, 0, x, WORLD_HEIGHT);
    }
    for (let y = 0; y < WORLD_HEIGHT; y += 90) {
      grid.lineBetween(0, y, WORLD_WIDTH, y);
    }
    grid.fillStyle(0xffd166, 0.06);
    grid.fillCircle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 220);
    grid.fillStyle(0x7ef29a, 0.05);
    grid.fillCircle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 120);
    grid.setDepth(0);

    const frame = this.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH - 8, WORLD_HEIGHT - 8);
    frame.setStrokeStyle(4, 0x24445e, 0.55);
    frame.setDepth(1);

    const vignette = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0);
    vignette.setScrollFactor(0);
    vignette.setDepth(30);
  }
}
