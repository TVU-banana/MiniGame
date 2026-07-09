import type { EnemyType } from '../app/types';

export const GAME_WIDTH = 720;
export const GAME_HEIGHT = 1280;
export const WORLD_WIDTH = 900;
export const WORLD_HEIGHT = 1600;
export const ROUND_DURATION = 90;
export const PLAYER_MAX_HP = 20;
export const PLAYER_SPEED = 280;
export const PLAYER_RADIUS = 26;
export const PLAYER_INVINCIBLE_MS = 800;
export const KNIFE_RANGE_MULTIPLIER = 3;
export const KNIFE_RADIUS = PLAYER_RADIUS * 2.7 * KNIFE_RANGE_MULTIPLIER;
export const KNIFE_LENGTH = 112 * KNIFE_RANGE_MULTIPLIER * 0.5;
export const KNIFE_WIDTH = 16;
export const KNIFE_MAX_DURABILITY = 30;
export const KNIFE_DAMAGE_INTERVAL_MS = 200;
export const KNIFE_SPEED_MULTIPLIER = 1.25 * 1.25;
export const KNIFE_ROTATION_SPEED = 1.45 * KNIFE_SPEED_MULTIPLIER;
export const KNIFE_MAX_ROTATION_SPEED = 2.2 * KNIFE_SPEED_MULTIPLIER;
export const MAX_KNIVES = 6;
export const INITIAL_KNIVES = 1;
export const KNIFE_REWARD_INTERVAL = 3;

export const ENEMY_STATS: Record<
  EnemyType,
  { hp: number; speed: number; damage: number; radius: number; color: number }
> = {
  small: { hp: 2, speed: 150 * 0.75, damage: 1, radius: 18, color: 0xff7a7a },
  medium: { hp: 4, speed: 115 * 0.75, damage: 1, radius: 28, color: 0xffae57 },
  large: { hp: 7, speed: 82 * 0.75, damage: 2, radius: 40, color: 0xffdf6b }
};

export function getRotationSpeed(elapsedSeconds: number): number {
  if (elapsedSeconds < 30) return KNIFE_ROTATION_SPEED;
  if (elapsedSeconds < 60) return KNIFE_ROTATION_SPEED * 1.1;
  if (elapsedSeconds < 90) return KNIFE_ROTATION_SPEED * 1.2;
  if (elapsedSeconds < 120) return KNIFE_ROTATION_SPEED * 1.3;
  return Math.min(KNIFE_MAX_ROTATION_SPEED, KNIFE_ROTATION_SPEED * 1.36);
}

export function getSpawnInterval(elapsedSeconds: number): number {
  if (elapsedSeconds < 20) return 2500;
  if (elapsedSeconds < 60) return 1960;
  if (elapsedSeconds < 120) return 1520;
  return 1120;
}

export function getSpawnWeights(
  elapsedSeconds: number
): Array<{ type: EnemyType; weight: number }> {
  if (elapsedSeconds < 20) {
    return [{ type: 'small', weight: 1 }];
  }
  if (elapsedSeconds < 60) {
    return [
      { type: 'small', weight: 0.75 },
      { type: 'medium', weight: 0.25 }
    ];
  }
  if (elapsedSeconds < 120) {
    return [
      { type: 'small', weight: 0.45 },
      { type: 'medium', weight: 0.35 },
      { type: 'large', weight: 0.2 }
    ];
  }
  return [
    { type: 'small', weight: 0.35 },
    { type: 'medium', weight: 0.4 },
    { type: 'large', weight: 0.25 }
  ];
}
