export const SceneKeys = {
  Boot: 'BOOT',
  Menu: 'MENU',
  Game: 'GAME'
} as const;

export type SceneKey = (typeof SceneKeys)[keyof typeof SceneKeys];
