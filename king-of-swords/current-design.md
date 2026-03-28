# Current Design

本文件用于帮助后续的 Codex CLI 快速、准确接手当前项目。内容以“当前代码真实实现”为准，不以最初 PRD 为准。

## 1. 项目概况

- 项目名：`king-of-swords`
- 技术栈：`Phaser 3 + TypeScript + Vite`
- 类型：竖屏 H5 单机生存动作小游戏
- 当前状态：可运行、可构建，核心循环已实现，但仍属于快速迭代中的原型版本

## 2. 启动与构建

开发：

```bash
npm install
npm run dev
```

构建：

```bash
npm run build
```

## 3. 当前玩法规则

### 3.1 胜负

- 单局时长：`90` 秒
- 玩家在时间结束前存活则成功
- 玩家 HP 归零则失败

### 3.2 玩家

- 玩家最大生命值：`20`
- 玩家移动速度：`280`
- 玩家受伤后无敌时间：`800ms`
- 玩家实体使用 [src/entities/Player.ts](D:\MiniGame\king-of-swords\src\entities\Player.ts)

### 3.3 刀系统

- 初始刀数：`1`
- 最大刀数：`6`
- 当前实现中，刀像“电风扇叶片”一样旋转：
  刀的根部固定在玩家中心
  每把刀按均匀角度分布
  刀围绕玩家中心做整体旋转
- 第一把刀是永久刀：
  不损耗耐久
  不会报废
- 其他刀的默认耐久：`30`
- 每把刀对同一个敌人的命中间隔：`200ms`
- 刀命中敌人后，普通刀耐久 `-1`
- 普通刀耐久归零后会被移除
- 即使普通刀都报废，也至少保留 1 把永久刀

关键文件：

- [src/entities/Knife.ts](D:\MiniGame\king-of-swords\src\entities\Knife.ts)
- [src/systems/KnifeSystem.ts](D:\MiniGame\king-of-swords\src\systems\KnifeSystem.ts)
- [src/scenes/GameScene.ts](D:\MiniGame\king-of-swords\src\scenes\GameScene.ts)

### 3.4 获得新刀规则

- 当前不是旧 PRD 的固定阈值解锁
- 当前规则是：每击败 `3` 个敌人，补 `1` 把新刀
- 通过 [src/systems/ProgressionSystem.ts](D:\MiniGame\king-of-swords\src\systems\ProgressionSystem.ts) 的 `consumeKnifeRewards()` 实现
- 当前 `playerState.unlockedKnifeSlots` 在战斗中初始化为 `MAX_KNIVES`，实际控制刀增长的是“每 3 杀 +1”

### 3.5 怪物

当前有三种怪：

- `small`
- `medium`
- `large`

当前数值在 [src/data/balance.ts](D:\MiniGame\king-of-swords\src\data\balance.ts)：

- small: HP 2, damage 1, speed `150 * 0.75`
- medium: HP 4, damage 1, speed `115 * 0.75`
- large: HP 7, damage 2, speed `82 * 0.75`

怪物行为：

- 主要朝玩家移动
- 有轻微偏航概率
- 被刀命中后会被击退
- 击退阶段结束后，不会立刻满速回追，而是有一个恢复减速段

实现文件：

- [src/entities/Enemy.ts](D:\MiniGame\king-of-swords\src\entities\Enemy.ts)

### 3.6 刷怪

当前刷怪频率已经比初版慢很多，使用分段间隔：

- 0~20 秒：`2500ms`
- 20~60 秒：`1960ms`
- 60~120 秒：`1520ms`
- 120 秒后：`1120ms`

虽然当前单局只有 90 秒，但 `getSpawnInterval()` 仍保留了 120 秒后的分支，没有功能问题，只是冗余。

实现文件：

- [src/data/balance.ts](D:\MiniGame\king-of-swords\src\data\balance.ts)
- [src/systems/EnemySpawnSystem.ts](D:\MiniGame\king-of-swords\src\systems\EnemySpawnSystem.ts)

## 4. 当前输入方式

当前版本已经移除 DOM 摇杆。

### 4.1 现在的控制方式

- 必须先按住玩家身体附近
- 按住后，手指可在任意位置滑动
- 玩家会按拖拽方向移动
- 松手后停止

实现位置：

- [src/scenes/GameScene.ts](D:\MiniGame\king-of-swords\src\scenes\GameScene.ts)

相关方法：

- `bindDirectDragControls()`
- `updateMoveVector()`
- `updatePlayer()`

### 4.2 已废弃但仍残留的命名

- [src/ui/AppUI.ts](D:\MiniGame\king-of-swords\src\ui\AppUI.ts) 里还保留了 `getJoystickVector()` / `resetJoystick()` 这类方法名
- 它们现在只是兼容性空壳，不再参与实际移动控制

后续若重构，可考虑清理这些旧命名，减少误导。

## 5. 命中与碰撞实现

### 5.1 刀命中

刀不再依赖 Phaser 的 Arcade 矩形碰撞体做命中判定。

当前改为几何判定：

- 从“玩家中心”到“刀尖”构成一条线段
- 对每个敌人计算“敌人中心到这条线段的最短距离”
- 若该距离小于 `enemy.radius + KNIFE_WIDTH * 0.7`，则视为命中

实现位置：

- [src/scenes/GameScene.ts](D:\MiniGame\king-of-swords\src\scenes\GameScene.ts)
- [src/utils/math.ts](D:\MiniGame\king-of-swords\src\utils\math.ts)

### 5.2 玩家受伤

- 玩家与怪物仍使用 `physics.add.overlap` 做接触伤害
- 玩家受伤后会被推开
- 同时进入无敌时间

## 6. 美术与素材入口

### 6.1 当前素材加载方式

当前启动场景会直接加载本地图片素材：

- `player` -> [src/assets/characters/player.svg](D:\MiniGame\king-of-swords\src\assets\characters\player.svg)
- `knife` -> [src/assets/weapons/knife.svg](D:\MiniGame\king-of-swords\src\assets\weapons\knife.svg)

加载位置：

- [src/scenes/BootScene.ts](D:\MiniGame\king-of-swords\src\scenes\BootScene.ts)

### 6.2 启动兜底

如果 `player` 或 `knife` 素材未正确加载，`BootScene` 会用程序绘制的简易纹理兜底，避免整场黑屏。

### 6.3 后续替换外部素材的推荐方式

最简单的方式：

1. 直接替换以下两个文件
   - [src/assets/characters/player.svg](D:\MiniGame\king-of-swords\src\assets\characters\player.svg)
   - [src/assets/weapons/knife.svg](D:\MiniGame\king-of-swords\src\assets\weapons\knife.svg)
2. 保持 `BootScene` 中的资源 key 不变：
   - `player`
   - `knife`
3. 如果外部素材尺寸差异较大，再同步调整：
   - [src/entities/Player.ts](D:\MiniGame\king-of-swords\src\entities\Player.ts)
   - [src/systems/KnifeSystem.ts](D:\MiniGame\king-of-swords\src\systems\KnifeSystem.ts)
   - [src/data/balance.ts](D:\MiniGame\king-of-swords\src\data\balance.ts)

## 7. UI 与界面结构

HTML 覆层 UI 由 [src/ui/AppUI.ts](D:\MiniGame\king-of-swords\src\ui\AppUI.ts) 生成。

包含：

- 主菜单
- HUD
- 设置弹窗
- 历史记录弹窗
- 结算弹窗
- 顶层 toast 提示

控制入口：

- [src/app/GameApp.ts](D:\MiniGame\king-of-swords\src\app\GameApp.ts)

### 当前注意点

部分中文文案在源码中疑似已经出现编码污染/乱码。

主要可疑文件：

- [src/ui/AppUI.ts](D:\MiniGame\king-of-swords\src\ui\AppUI.ts)
- 可能还包括个别战斗提示字符串

如果后续要继续大改 UI，建议优先先统一修正这些中文字符串，否则终端查看和后续编辑会很痛苦。

## 8. 音频与存档

### 8.1 音频

当前音频全部由 Web Audio 合成，没有外部音频资源。

实现文件：

- [src/audio/AudioManager.ts](D:\MiniGame\king-of-swords\src\audio\AudioManager.ts)

### 8.2 本地存档

本地存储使用 `localStorage`。

实现文件：

- [src/data/storage.ts](D:\MiniGame\king-of-swords\src\data\storage.ts)

保存内容：

- 设置项：BGM / SFX 音量
- 最近 10 条战绩

## 9. 关键文件速查

- 游戏主入口：
  [src/app/GameApp.ts](D:\MiniGame\king-of-swords\src\app\GameApp.ts)
- Phaser 配置：
  [src/app/GameConfig.ts](D:\MiniGame\king-of-swords\src\app\GameConfig.ts)
- 启动场景：
  [src/scenes/BootScene.ts](D:\MiniGame\king-of-swords\src\scenes\BootScene.ts)
- 菜单场景：
  [src/scenes/MenuScene.ts](D:\MiniGame\king-of-swords\src\scenes\MenuScene.ts)
- 战斗主场景：
  [src/scenes/GameScene.ts](D:\MiniGame\king-of-swords\src\scenes\GameScene.ts)
- 数值配置：
  [src/data/balance.ts](D:\MiniGame\king-of-swords\src\data\balance.ts)
- 玩家：
  [src/entities/Player.ts](D:\MiniGame\king-of-swords\src\entities\Player.ts)
- 刀：
  [src/entities/Knife.ts](D:\MiniGame\king-of-swords\src\entities\Knife.ts)
- 怪物：
  [src/entities/Enemy.ts](D:\MiniGame\king-of-swords\src\entities\Enemy.ts)
- 刀系统：
  [src/systems/KnifeSystem.ts](D:\MiniGame\king-of-swords\src\systems\KnifeSystem.ts)
- 成长系统：
  [src/systems/ProgressionSystem.ts](D:\MiniGame\king-of-swords\src\systems\ProgressionSystem.ts)
- UI：
  [src/ui/AppUI.ts](D:\MiniGame\king-of-swords\src\ui\AppUI.ts)

## 10. 后续修改建议顺序

如果后续 Codex CLI 要继续迭代，建议优先顺序如下：

1. 先修复中文文案乱码问题
2. 再决定是否继续保留“按住玩家拖拽”的输入方式
3. 再做玩家跑动动画与更正式的人物素材接入
4. 再做刀的视觉特效和怪物反馈特效
5. 最后再回头调平衡数值

原因：

- 现在最大的“维护阻力”不是功能缺失，而是文案乱码和多次迭代后留下的命名/结构不完全一致
- 把这些整理干净后，后续迭代效率会高很多

## 11. 当前版本的一句话总结

当前版本是一个 90 秒竖屏生存原型：
玩家按住自身直接拖动移动，身上挂着均匀旋转的扇叶式刀阵，至少保留 1 把永久刀；每 3 杀补 1 把新刀，怪物被命中后会被击退并减速恢复，目标是在 90 秒内活下来。
