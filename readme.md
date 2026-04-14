readme_content = '''# Stick Hero - 撑杆英雄

[![Cocos Creator](https://img.shields.io/badge/Cocos%20Creator-3.x-green)](https://www.cocos.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.x-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> 一款基于 Cocos Creator 3.x 开发的休闲益智小游戏，考验你的时机把握能力！

## 📖 游戏简介

《撑杆英雄》是一款简单易上手但极具挑战性的休闲游戏。玩家需要按住屏幕控制杆子变长，搭建桥梁让角色跨越平台间隙。杆子太长或太短都会导致角色坠落，精准的判断是获得高分的关键！

## ✨ 功能特性

- 🎮 **核心玩法**：按住屏幕增长杆子，松开自动倒下，角色自动行走
- 🏆 **计分系统**：成功跨越平台获得分数，支持历史最高分记录
- 📊 **评级系统**：根据分数获得 S/A/B/C 等级评价
- 📜 **历史记录**：保存最近 20 条游戏记录，包含分数、时间和评级
- 🔊 **音效设置**：支持音量调节，设置自动保存到本地
- 📱 **响应式设计**：适配多种屏幕尺寸
- 🎨 **流畅动画**：角色呼吸动画、杆子生长动画、相机跟随效果

## 🚀 快速开始

### 环境要求

- [Cocos Creator 3.x](https://www.cocos.com/creator-download) 或更高版本
- Node.js 14.x 或更高版本
- TypeScript 支持

### 安装步骤

1. **克隆仓库**
   ```bash
   git clone https://github.com/yourusername/stick-hero.git
   cd stick-hero
   ```

2. **使用 Cocos Creator 打开项目**
   - 启动 Cocos Creator
   - 选择 "打开项目"
   - 选择项目根目录

3. **运行项目**
   - 在编辑器中点击预览按钮
   - 或构建发布到目标平台

## 🎯 游戏玩法

| 操作         | 说明                         |
| ------------ | ---------------------------- |
| **按住屏幕** | 杆子开始变长                 |
| **松开屏幕** | 杆子倒下，角色开始移动       |
| **精准判断** | 杆子长度需刚好搭到下一个平台 |

### 计分规则

- 成功跨越：+1 分
- 杆子太短：角色坠落，游戏结束
- 杆子太长：角色走过平台，游戏结束

### 评级标准

| 分数    | 评级 |
| ------- | ---- |
| ≥ 50 分 | S 级 |
| ≥ 40 分 | A 级 |
| ≥ 20 分 | B 级 |
| < 20 分 | C 级 |

## 📁 项目结构

```
assets/
├── scripts/           # 游戏脚本
│   ├── GameManager.ts # 游戏主逻辑管理
│   ├── Player.ts      # 玩家角色控制
│   ├── Stick.ts       # 杆子逻辑
│   ├── Main.ts        # 主菜单场景
│   └── Records.ts     # 历史记录界面
├── prefabs/           # 预制体资源
│   ├── platform.prefab
│   ├── stick.prefab
│   └── row.prefab
├── scenes/            # 场景文件
│   ├── Main.scene     # 主菜单
│   ├── C1.scene       # 游戏场景
│   └── Records.scene  # 记录界面
└── resources/         # 动态加载资源
    └── Prefab/
        └── FireParticles.prefab
```

## 🏗️ 核心脚本说明

### GameManager.ts
游戏核心管理器，负责：
- 游戏状态机管理（WAITING/GROWING/FALLING/MOVING/GAMEOVER）
- 平台生成算法
- 分数计算与存储
- 相机跟随逻辑
- 设置面板控制

### Player.ts
玩家角色控制器：
- 呼吸待机动画
- 移动动画（Tween）
- 坠落动画

### Stick.ts
杆子逻辑组件：
- 生长动画
- 倒下旋转动画
- 长度计算

### Records.ts
历史记录界面：
- 本地存储读取
- ScrollView 动态列表
- 记录清除功能

## ⚙️ 配置参数

在 `GameManager.ts` 中可调整以下参数：

| 参数名                | 默认值 | 说明         |
| --------------------- | ------ | ------------ |
| `stickSpeed`          | 300    | 杆子生长速度 |
| `playerSpeed`         | 400    | 角色移动速度 |
| `minPlatformDistance` | 80     | 平台最小间距 |
| `maxPlatformDistance` | 200    | 平台最大间距 |
| `minPlatformWidth`    | 75     | 平台最小宽度 |
| `maxPlatformWidth`    | 150    | 平台最大宽度 |

## 💾 数据存储

游戏使用 `localStorage` 本地存储：

- `highScore`: 历史最高分
- `scoreRecords`: 最近 20 条游戏记录（JSON 格式）
- `gameVolume`: 音量设置

## 🛠️ 构建发布

1. 在 Cocos Creator 中选择 **项目 -> 构建发布**
2. 选择目标平台（Web Mobile、微信小游戏、Android 等），这里选用抖音小游戏
3. 配置构建参数
4. 点击 **构建**，完成后点击 **运行**

## 📝 更新日志

### v1.0.0 (2026-04-14)
- ✅ 核心玩法实现
- ✅ 计分与评级系统
- ✅ 历史记录功能
- ✅ 音效设置面板
- ✅ 主菜单与游戏结束界面

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目基于 [MIT](LICENSE) 许可证开源。

## 🙏 致谢

- [Cocos Creator](https://www.cocos.com/) - 游戏引擎
- 灵感来源于经典游戏 Stick Hero

---

<p align="center">Made with ❤️ using Cocos Creator</p>
'''

print(readme_content)