export const AudioKeys = {
  MenuBgm: "menu-bgm",
  GameBgm: "game-bgm",
  LockSfx: "lock-sfx",
  ClearSfx: "clear-sfx"
} as const;

export type BgmType = "menu" | "game";
