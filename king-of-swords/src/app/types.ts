export interface PlayerState {
  hp: number;
  maxHp: number;
  moveSpeed: number;
  invincibleUntil: number;
  currentKnifeCount: number;
  unlockedKnifeSlots: number;
  kills: number;
  alive: boolean;
}

export interface KnifeState {
  id: string;
  angle: number;
  radius: number;
  durability: number;
  maxDurability: number;
  active: boolean;
}

export type EnemyType = 'small' | 'medium' | 'large';

export interface EnemyState {
  id: string;
  type: EnemyType;
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  active: boolean;
}

export interface RunRecord {
  id: string;
  startedAt: string;
  finishedAt: string;
  success: boolean;
  survivalSeconds: number;
  kills: number;
  maxKnifeCount: number;
}

export interface SettingsState {
  bgmVolume: number;
  sfxVolume: number;
}

export interface GameSnapshot {
  hp: number;
  maxHp: number;
  timeLeft: number;
  kills: number;
  currentKnives: number;
  unlockedKnives: number;
  maxKnivesHeld: number;
}

export interface GameResult extends RunRecord {
  bestRecord: boolean;
}
