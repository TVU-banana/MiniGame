# Gomoku Lite

`gomoku-v0` 是一个纯前端五子棋小游戏项目，使用 `React + Vite + Canvas API + Web Audio API` 实现。

它的目标很直接：

- 打开浏览器就能玩
- 同时支持桌面端和移动端
- 支持玩家对玩家 `PVP`
- 支持玩家对机器 `PVE`
- 支持 3 档难度
- 不依赖后端、数据库、登录系统或第三方接口

## 1. 你会得到什么

当前项目已经包含这些内容：

- 15 x 15 五子棋棋盘
- 玩家对玩家模式
- 玩家对机器模式
- 新手 / 高手 / 专家三档难度
- 胜负判断与平局判断
- 落子提示、胜利连线高亮
- 重新开始、返回菜单
- 音效开关
- 可直接开发、构建、部署的完整工程目录

## 2. 运行这个项目前，你需要先准备什么

这是一个前端工程，不需要安装 MySQL、Redis、Java、Python 后端环境。你只需要准备下面这些：

### 2.1 必备软件

1. `Git`
   用来拉取代码。
2. `Node.js`
   用来安装依赖、启动开发服务器、打包生产文件。
3. 一个浏览器
   推荐 Chrome / Edge。

### 2.2 Node 版本要求

这个项目当前使用的是 `Vite 7`。根据本地依赖，推荐使用：

- `Node.js 20.19.0` 或更高版本
- 或 `Node.js 22.12.0` 及以上版本

如果你的 Node 版本太低，项目可能无法启动或构建。

### 2.3 怎么检查自己装好了没有

打开终端后，分别执行：

```bash
git --version
node -v
npm -v
```

如果三条命令都能输出版本号，说明基础环境已经就绪。

## 3. 从 0 开始部署并运行项目

这一节按“完全新手”写。你只要一步一步照着做就可以。

### 3.1 第一步：找一个你想放代码的位置

比如你想把代码放在：

```text
D:\workspace
```

先打开终端，然后进入这个目录：

```bash
cd D:\workspace
```

如果这个目录还没有，你也可以先手动创建。

### 3.2 第二步：把仓库 clone 到本地

下面用占位符演示,你需要把 `<your-repo-url>` 换成本仓库地址。

```bash
git clone <this-repo-url>
```

执行完成后，会在当前目录生成一个仓库文件夹。假设仓库文件夹名叫 `MiniGame`，继续进入它：

```bash
cd MiniGame
```

### 3.3 第三步：进入真正的项目目录

这个仓库下面不止一个项目，你这次要运行的是 `gomoku-v0`：

```bash
cd gomoku-v0
```

进入之后，你应该能看到这些关键文件：

```text
index.html
package.json
vite.config.js
src/
README.md
```

### 3.4 第四步：安装依赖

第一次运行前，一定要先安装依赖：

```bash
npm install
```

这一步会根据 `package.json` 和 `package-lock.json` 下载依赖，并生成或更新 `node_modules/`。

正常情况下你会看到安装完成提示。

### 3.5 第五步：启动开发服务器

安装完成后，执行：

```bash
npm run dev
```

项目已经在 `vite.config.js` 里写死了开发端口：

- 地址：`http://localhost:5173`
- 端口：`5173`

浏览器打开这个地址即可看到游戏：

```text
http://localhost:5173
```

### 3.6 第六步：停止项目

如果你想关闭开发服务器，在终端里按：

```text
Ctrl + C
```

## 4. Windows PowerShell 常见报错处理

如果你在 Windows PowerShell 里执行 `npm install` 或 `npm run dev` 时，看到了类似下面的报错：

```text
npm.ps1 cannot be loaded because running scripts is disabled on this system
```

这不是项目本身坏了，而是 PowerShell 的执行策略拦住了 `npm.ps1`。

你可以直接改用下面这种写法：

```bash
npm.cmd install
npm.cmd run dev
npm.cmd run build
npm.cmd run preview
```

也可以换到 `cmd` 或 `Git Bash` 里执行普通的 `npm` 命令。

## 5. 项目整体架构

这个项目的结构是“界面层”和“游戏核心层”分离。

```text
index.html
  -> src/main.jsx
    -> src/App.jsx
      -> UI 组件层
         - Menu
         - StatusBar
         - GameBoard
         - ResultModal
      -> 状态协调层
         - useGameState
      -> 核心逻辑层
         - GameManager
         - Board
         - Rule
         - MachinePlayer
      -> 基础能力层
         - AudioManager
         - main.css
```

你可以把它理解成 4 层：

### 5.1 入口层

- `index.html`
  页面根节点，只提供 `#root`
- `src/main.jsx`
  React 启动入口，把 `App` 挂到页面上

### 5.2 界面层

- `src/App.jsx`
  根据当前游戏阶段，决定显示主菜单、对局界面还是结算弹窗
- `src/components/Menu.jsx`
  负责模式选择、AI 难度选择、音效开关
- `src/components/StatusBar.jsx`
  显示当前回合、模式、状态文字和操作按钮
- `src/components/GameBoard.jsx`
  使用 `Canvas` 绘制棋盘、棋子、悬浮提示和胜利连线
- `src/components/ResultModal.jsx`
  对局结束后弹出结果层

### 5.3 状态协调层

- `src/hooks/useGameState.js`

这是整个前端最重要的“胶水层”：

- 持有 `GameManager` 实例
- 持有 `AudioManager` 实例
- 把核心状态转成前端可直接展示的 `snapshot`
- 处理“玩家落子后是否轮到 AI”
- 用 `setTimeout` 模拟 AI 思考延迟
- 统一管理开始、重开、返回菜单、落子、切换音效这些动作

### 5.4 核心逻辑层

- `src/core/GameManager.js`
  统一管理游戏状态机，比如 `MENU -> PLAYING -> GAME_OVER`
- `src/core/Board.js`
  管理 15x15 棋盘数据、空位检查、落子记录
- `src/core/Rule.js`
  判断是否五连、是否平局
- `src/core/MachinePlayer.js`
  根据不同难度计算 AI 下一步落子

### 5.5 基础能力层

- `src/audio/AudioManager.js`
  使用 `Web Audio API` 动态生成按钮音、落子音、胜利音
- `src/styles/main.css`
  负责整体视觉风格、布局、响应式适配和动效

## 6. 游戏运行逻辑

### 6.1 启动流程

1. 浏览器加载 `index.html`
2. `main.jsx` 渲染 `App`
3. `App` 调用 `useGameState`
4. 初始阶段是 `MENU`
5. 页面先显示主菜单

### 6.2 玩家开始一局后的流程

1. 用户在菜单中选择 `PVP` 或 `PVE`
2. `useGameState.startGame()` 被触发
3. `GameManager.start()` 重置棋盘并写入模式、难度
4. 页面切换到对局界面
5. `GameBoard` 负责把当前棋盘状态画到 Canvas 上

### 6.3 每次落子的流程

1. 用户点击 Canvas
2. `GameBoard` 把点击位置换算成棋盘坐标
3. `useGameState.placeStone(x, y)` 被调用
4. `GameManager.applyMove(x, y)` 执行真正落子
5. `Rule.checkWin()` 判断是否胜利
6. `Rule.checkDraw()` 判断是否平局
7. 如果没结束，就切换当前玩家
8. 如果是 `PVE` 且轮到机器，`useGameState` 会延迟一小段时间后调用 AI 落子

### 6.4 对局结束后的流程

1. `GameManager` 把状态改成 `GAME_OVER`
2. `snapshot.result` 写入胜负信息
3. `ResultModal` 弹出
4. 用户可以选择“重新开始”或“返回菜单”

## 7. 人机难度分层

v0 版本的人机设计是一坨，要看的话直接看 v1 版本的即可，此外，v1 版本的专家模式一般情况下人类可能下不过。

## 8. 技术栈说明

下面这张表，可以帮助你快速看明白“每个技术是拿来干什么的”。

| 层级 | 技术 | 作用 |
| --- | --- | --- |
| 页面入口 | HTML5 | 提供页面骨架和 `#root` 挂载点 |
| 前端框架 | React 19 | 负责组件化界面和状态驱动渲染 |
| 构建工具 | Vite 7 | 提供开发服务器、热更新和生产打包 |
| React 构建插件 | `@vitejs/plugin-react` | 让 Vite 正确处理 React JSX |
| 核心语言 | JavaScript ES Modules | 编写业务逻辑和模块拆分 |
| 棋盘渲染 | Canvas API | 绘制 15x15 棋盘、棋子和胜利线 |
| 音效 | Web Audio API | 直接合成点击、落子、胜利音效 |
| 样式 | CSS3 | 实现布局、响应式、渐变、动效 |
| 状态管理 | React Hooks + 自定义类 | UI 状态和核心规则解耦 |
| 部署方式 | 静态文件部署 | 构建后直接上传 `dist/` 即可 |

## 9. 目录结构说明

```text
gomoku-v0/
├─ index.html
├─ package.json
├─ package-lock.json
├─ vite.config.js
├─ README.md
├─ prd-v0.md
├─ dist/                  # 构建产物
├─ node_modules/          # 安装依赖后生成
└─ src/
   ├─ main.jsx
   ├─ App.jsx
   ├─ assets/
   ├─ audio/
   │  └─ AudioManager.js
   ├─ components/
   │  ├─ Menu.jsx
   │  ├─ GameBoard.jsx
   │  ├─ StatusBar.jsx
   │  └─ ResultModal.jsx
   ├─ core/
   │  ├─ Board.js
   │  ├─ GameManager.js
   │  ├─ MachinePlayer.js
   │  └─ Rule.js
   ├─ hooks/
   │  └─ useGameState.js
   └─ styles/
      └─ main.css
```
