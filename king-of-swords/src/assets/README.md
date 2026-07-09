# 可替换素材入口

- `characters/player.svg`
  当前玩家实体占位图。后续可直接替换为外部 PNG/SVG，只要保持透明背景即可。

- `weapons/knife.svg`
  当前刀的占位图。刀的根部应位于图片底部中线附近，因为游戏里刀是以根部贴着玩家中心旋转的。

如需替换成新素材，只要保持 `BootScene.ts` 中的资源 key 不变即可：

- `player`
- `knife`
