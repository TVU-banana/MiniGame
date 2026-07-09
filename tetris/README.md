# 俄罗斯方块 - tetris（H5）

基于 `TypeScript + Vite + Phaser 3` 的手机竖屏 H5 俄罗斯方块项目。  
实现了 PRD 要求的完整核心玩法、状态机、HTML/CSS 覆层 UI 和本地历史记录。

## 技术栈

- TypeScript
- Vite
- Phaser 3
- 原生 HTML + CSS（HUD 与菜单/弹层/虚拟按键）
- localStorage（历史记录）

## 本地运行

```bash
npm install
npm run dev
```

构建：

```bash
npm run build
```

## 已实现玩法与规则

- 棋盘固定 `10 × 20`
- 标准 7 种 tetromino（I/O/T/L/J/S/Z）
- `7-bag` 出块机制
- 操作：
  - 键盘：`←` 左移，`→` 右移，`↓` 软降，`空格` 顺时针旋转
  - 手机：左移 / 右移 / 软降 / 旋转虚拟按键
- 软降为按住持续 `3x` 基础下落速度（非瞬移）
- 基础速度：`1 格/秒` 起，每 `20 秒 +0.1`，上限 `2`
- 锁定延迟：`300ms`（可移动、可旋转；若重新悬空则取消倒计时）
- 清行规则：满行即清，支持一次多行
- 失败判定：
  - 出生碰撞失败
  - 锁定时存在任意 `y < 0` 的格子则失败
- 计分：
  - 锁定得分：`1 格 = 1 分`
  - 清行得分：`1 行 = 10 分`
- 计时：
  - `MM:SS` 格式
  - 暂停时停止，恢复后继续

## 游戏流程

- 主菜单：开始、设置、历史记录
- 游戏中：棋盘、HUD（得分/时长）、暂停、虚拟按键
- 暂停层：继续游戏、返回菜单
- 结算层：最终得分、总时长、消除总行数、再来一局、返回菜单

## 历史记录

- 使用 `localStorage`
- 仅保留最近 `10` 场
- 字段：
  - `score`
  - `durationSeconds`
  - `dateKey`（`YY-MM-DD-HH`）

## 音频说明

- 实现了菜单 BGM、游戏 BGM、锁定音效、清行音效（WebAudio 占位）
- 目录结构保留：

```text
assets/audio/bgm/
assets/audio/sfx/
```

## 项目结构

```text
src/
  app/
  audio/
  core/
  data/
  scenes/
  styles/
  ui/
  assets/audio/{bgm,sfx}
```
