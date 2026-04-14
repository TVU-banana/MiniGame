🎮 你狙我躲
> 一款心跳加速的3D回合制潜伏游戏
Banner Status-InDev-orange
---
<div align="center">
🌌 黑暗星空下，谁是最后的赢家？
 vs 
你是选择瞄准猎物，还是抱头鼠窜？
</div>
---
✨ 游戏简介
「你狙我躲」是一款充满策略与博弈的 3D回合制潜伏游戏。在黑暗的星空下，狙击手与躲藏者展开一场智慧与运气的终极对决——
> 🔫 狙击手必须预判走位，一击制敌  
> 🏃 躲藏者需要利用地形，步步为营
---
🎮 核心玩法
🔄 回合制对战
- 双方轮流行动，每回合一个选择决定生死
- 心理博弈：虚晃、假动作、预判走位
🎯 狙击手模式
锁定目标 → 预判位移 → 扣下扳机 → 一枪毙命
🏃 躲藏者模式
观察弹道 → 寻找掩体 → 快速位移 → 生存到最后
---
🕹️ 游戏流程：

🏠 菜单
⚔️ 匹配
🎮 对战

---
项目结构：
juJiWaiXinRen/
├── game.js                    # 主游戏逻辑 (JS)
├── game.json                  # 游戏入口配置
├── three.js                   # Three.js库
├── package.json               # npm依赖
├── icon.png                   # 图标
├── project.config.json        # 项目配置
├── .vs/                       # VS配置
├── node_modules/              # npm包
└── Assets/                    # 资源文件夹
    ├── Scenes/
    ├── Materials/
    └── Scripts/
    
技术亮点
- Three.js 3D渲染 — 20x20 游戏场地，实时渲染
- 骨骼动画系统 — 外星人角色支持 natural / grab 两种姿态
- Canvas 2D UI — 菜单/匹配界面采用 Canvas 绘制
- 多端适配 — 兼容 Web / 小程序运行环境
---
🚀 快速开始
# 安装依赖
npm install
# 运行游戏 (需Web环境或抖音开发者工具)
# 入口: game.json
