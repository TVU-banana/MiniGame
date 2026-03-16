# 滑块消消乐

基于 `TypeScript + Vite + Three.js` 的竖屏 H5 3D 空间滑块解谜小游戏。

## 功能

- 3 个随机生成关卡：`2x4x4`、`4x4x4`、`4x8x4`
- Three.js 立体滑块场景，支持拖动旋转和双指缩放
- 点击方块判定滑出或阻挡弹回
- 每局 `5` 次反向、`5` 次重置
- 菜单 / 游戏双 BGM，基础滑出、弹回、成功、失败音效
- 设置浮窗，支持本地持久化保存音量
- 历史记录浮窗，保存最近 `10` 条结果
- 通关后按 PRD 规则结算 `1~3` 星

## 运行

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

## 目录

- `src/app`：应用入口与 UI 状态
- `src/audio`：Web Audio BGM / 音效
- `src/core`：关卡生成、判定、控制器、存档
- `src/scene`：Three.js 场景与方块渲染
- `src/styles`：整体视觉与布局样式

## 说明

- 音频使用 Web Audio API 实时合成，不依赖外部音频资源。
- 历史记录、音量设置、解锁进度均存储在 `localStorage`。
