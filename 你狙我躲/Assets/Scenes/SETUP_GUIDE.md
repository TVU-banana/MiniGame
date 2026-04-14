# Unity 场景搭建指南（3D场景 + 2D界面）

## 项目概述

本游戏采用混合架构：
- **3D 场景**：外星人模型、游戏玩法（Playing 状态）
- **2D 界面**：菜单界面、匹配界面（Menu、Matching 状态）

---

## 第一步：打开 Unity 并创建项目

1. 打开 **Unity Hub**
2. 点击 **"New Project"**
3. 选择 **"3D Core"** 模板（内置渲染管线）
4. 设置项目名称：`juJiWaiXinRen`
5. 点击 **"Create"**

---

## 第二步：导入脚本文件

1. 将本项目的 `Assets/Scripts` 文件夹整个复制到 Unity 项目的 `Assets` 目录
2. Unity 会自动识别所有 C# 脚本

---

## 第三步：场景基础设置

### 3.1 Camera 设置（用于 3D 游戏画面）

在 Hierarchy 中选中 **Main Camera**，按以下设置：

| 属性 | 值 |
|------|-----|
| Position | (0, 12, 12) |
| Rotation | (45, 0, 0) |
| Projection | Perspective |
| Field of View | 60 |
| Clear Flags | Solid Color |
| Background | #1A1A2E |

添加 `CameraController.cs` 组件到 Main Camera：
- 选中 Main Camera
- 在 Inspector 点击 **Add Component**
- 搜索并添加 `CameraController`

### 3.2 创建地面

1. **Hierarchy** → 右键 → **3D Object** → **Plane**
2. 在 Inspector 中修改：
   - Name: `Ground`
   - Position: (0, 0, 0)
   - Rotation: (0, 0, 0)
   - Scale: (2, 1, 2)  // 地面变成 20x20 大小

3. 创建材质：
   - **Project** 窗口 → 右键 → **Create** → **Material**，命名为 `GroundMat`
   - 选中材质，在 Inspector 中设置 **Albedo** 颜色为灰色 #808080
   - 将 `GroundMat` 拖到 Hierarchy 中的 Ground 上

### 3.3 光照设置

1. 选中 Hierarchy 中的 **Directional Light**
   - Rotation: (50, -30, 0)
   - Intensity: 1

2. 添加环境光：
   - **Window** → **Rendering** → **Lighting**
   - 切换到 **Environment** 标签
   - Source: **Gradient**
   - Sky Color: #1A1A2E
   - Equator Color: #2D2D4A
   - Ground Color: #1A1A2E

---

## 第四步：创建外星人模型（3D）

### 4.1 创建 AlienLeft

1. **Hierarchy** → 右键 → **Create Empty**，命名为 `AlienLeft`
2. 在 Inspector 中设置：
   - Position: (-6, 0, 0)
3. 在 Inspector 中点击 **Add Component**，搜索并添加 `AlienController`
4. 在 AlienController 组件中找到 **"Initialize"** 按钮并点击，生成外星人模型
5. 将 AlienLeft 拖到 Project 窗口，创建预制体

### 4.2 创建 AlienRight

1. **Hierarchy** → 右键 → **Create Empty**，命名为 `AlienRight`
2. 在 Inspector 中设置：
   - Position: (6, 0, 0)
   - Rotation: (0, 180, 0)
3. 添加 `AlienController.cs` 组件
4. 点击 **"Initialize"** 按钮生成模型
5. 拖到 Project 窗口创建预制体

---

## 第五步：创建 2D 菜单界面（UI）

### 5.1 创建 Canvas（画布）

1. **Hierarchy** → 右键 → **UI** → **Canvas**
2. 选中 Canvas，在 Inspector 中设置：
   - **Render Mode**: **Screen Space - Overlay**
   - **Canvas Scaler** → **UI Scale Mode**: **Scale With Screen Size**
   - **Reference Resolution**: 375 × 667
   - **Match**: 0.5 (宽和高匹配)

### 5.2 创建背景

1. 在 Canvas 下创建 **UI** → **Image**，命名为 `Background`
2. 在 Inspector 中：
   - **Rect Transform** → 点击锚点图标 → **Stretch** (拉伸填满全屏)
   - **Source Image**: 保持 None（显示纯色）
   - **Color**: #1A1A2E（深蓝色）

### 5.3 创建标题文字

1. **Canvas** → 右键 → **UI** → **Text**（或 TextMeshPro），命名为 `Title`
2. 设置：
   - **Rect Transform** → Pos Y: 200（屏幕上半部分）
   - **Width**: 300, **Height**: 80
   - **Text**: "你狙我躲"
   - **Font Size**: 48
   - **Color**: #FFFFFF
   - **Alignment**: 居中

### 5.4 创建开始按钮

1. **Canvas** → 右键 → **UI** → **Button** - TextMeshPro，命名为 `StartButton`
2. 设置：
   - **Rect Transform** → Pos Y: -150（屏幕下半部分）
   - **Width**: 200, **Height**: 60
3. 展开 Button，展开 **Text (TMP)**，修改文字为 "开始游戏"
4. 调整按钮样式（颜色、字体等）

### 5.5 按钮点击事件

1. 选中 `StartButton` 按钮
2. 在 Inspector 中找到 **On Click ()** 区域
3. 点击 **(+)** 添加事件
4. 将 Hierarchy 中的 **GameManager** 拖到空槽位（还没创建，先跳过）
5. 在下拉菜单中选择 `GameManager` → `OnMenuStartClicked()`

---

## 第六步：创建 2D 匹配界面（UI）

### 6.1 创建第二个 Canvas

1. **Hierarchy** → 右键 → **UI** → **Canvas**，命名为 `MatchingCanvas`
2. 设置（同上）：
   - **Render Mode**: **Screen Space - Overlay**
   - **Canvas Scaler**: 375 × 667，Scale With Screen Size

### 6.2 创建背景

1. 在 MatchingCanvas 下创建 **UI** → **Image**，命名为 `Background`
2. 设置：
   - **Rect Transform**: Stretch 填满全屏
   - **Color**: #1A1A2E

### 6.3 创建玩家头像（左侧）

1. **MatchingCanvas** → 右键 → **UI** → **Image**，命名为 `LeftAvatar`
2. 设置：
   - **Rect Transform** → Pos X: -80, Pos Y: 50
   - **Width/Height**: 100 × 100
   - **Source Image**: 选择 Unity 自带的 **Knob** 或圆形图片
   - **Color**: #FFD700（金黄色）

### 6.4 创建对手头像（右侧）

1. **MatchingCanvas** → 右键 → **UI** → **Image**，命名为 `RightAvatar`
2. 设置：
   - **Rect Transform** → Pos X: 80, Pos Y: 50
   - **Width/Height**: 100 × 100
   - **Color**: #FF6B6B（红色）

### 6.5 创建 VS 文字

1. **MatchingCanvas** → 右键 → **UI** → **Text**，命名为 `VSText`
2. 设置：
   - **Rect Transform** → Pos X: 0, Pos Y: 50
   - **Text**: "VS"
   - **Font Size**: 36
   - **Color**: #FFFFFF

### 6.6 创建匹配按钮

1. **MatchingCanvas** → 右键 → **UI** → **Button**，命名为 `MatchButton`
2. 设置：
   - **Rect Transform** → Pos Y: -150
   - **Width**: 200, **Height**: 60
3. 修改按钮文字为 "开始匹配"

---

## 第七步：创建 GameManager

### 7.1 创建 GameManager 物体

1. **Hierarchy** → 右键 → **Create Empty**，命名为 `GameManager`
2. 添加 `GameManager.cs` 组件

### 7.2 关联场景引用

在 Inspector 中找到 GameManager 组件，设置以下字段：

| 字段 | 关联对象 |
|------|---------|
| **Menu Root** | 新建空物体，命名为 `MenuRoot`，把 Canvas 放进去 |
| **Matching Root** | 新建空物体，命名为 `MatchingRoot`，把 MatchingCanvas 放进去 |
| **Playing Root** | 新建空物体，命名为 `PlayingRoot`，包含 Ground 和外星人 |
| **Alien Left** | 拖入 AlienLeft 预制体实例 |
| **Alien Right** | 拖入 AlienRight 预制体实例 |
| **Main Camera** | 拖入 Hierarchy 中的 Main Camera |

### 7.3 设置初始状态

在 GameManager 组件中：
- **Width**: 375
- **Height**: 667
- **Current State**: Menu

### 7.4 调整 Playing Root 的相机

点击运行后，GameManager 会自动把相机位置设置为 (0, 12, 12)，用于游戏画面。

---

## 第八步：创建 InputManager

1. **Hierarchy** → 右键 → **Create Empty**，命名为 `InputManager`
2. 添加 `InputManager.cs` 组件

---

## 第九步：设置场景层级关系（重要！）

### 9.1 创建场景根物体

按以下结构整理 Hierarchy：

```
├── Main Camera
├── Directional Light
├── GameManager (添加 GameManager.cs)
├── InputManager (添加 InputManager.cs)
├── Ground (3D 地面)
├── AlienLeft (外星人)
├── AlienRight (外星人)
├── MenuRoot (空物体)
│   └── Canvas (2D 菜单界面)
│       ├── Background
│       ├── Title
│       └── StartButton
├── MatchingRoot (空物体)
│   └── MatchingCanvas (2D 匹配界面)
│       ├── Background
│       ├── LeftAvatar
│       ├── RightAvatar
│       ├── VSText
│       └── MatchButton
└── PlayingRoot (空物体，包含 3D 游戏场景)
```

### 9.2 设置初始显示状态

1. 选中 `MenuRoot`，在 Inspector 中勾选 **√ Active**
2. 选中 `MatchingRoot`，取消勾选（隐藏）
3. 选中 `PlayingRoot`，取消勾选（隐藏）

---

## 第十步：连接按钮事件

### 10.1 菜单开始按钮

1. 选中 Canvas 下的 `StartButton`
2. Inspector → **On Click ()** → 点击 **+**
3. 拖入 **GameManager** 物体
4. 选择函数：`GameManager` → `OnMenuStartClicked()`

### 10.2 匹配开始按钮

1. 选中 MatchingCanvas 下的 `MatchButton`
2. Inspector → **On Click ()** → 点击 **+**
3. 拖入 **GameManager** 物体
4. 选择函数：`GameManager` → `OnMatchingStartClicked()`

---

## 第十一步：构建设置

1. **File** → **Build Settings**
2. 选择 **WebGL** 平台
3. 点击 **Switch Platform**（如果还没切换）
4. 点击 **Player Settings**：
   - **Resolution and Presentation** → 指定分辨率：375 × 667
   - **Orientation**: Portrait（竖屏）
   - **Other Settings** → Color Space: Gamma
5. 点击 **Build And Run** 测试

---

## 第十二步：接入 StarkSDK（后续步骤）

构建完成后，需要：
1. 导入 StarkSDK .unitypackage
2. 在 SDK 面板配置 AppID
3. 使用 StarkSDK Tools 重新构建
4. 在抖音开发者工具中测试

---

## 常见问题

**Q: 菜单界面不显示？**
A: 检查 MenuRoot 是否勾选 Active，Canvas 是否在 MenuRoot 下

**Q: 按钮点击没反应？**
A: 确认已设置 On Click 事件，关联到 GameManager 的对应函数

**Q: 外星人不显示？**
A: 检查是否在 AlienController 组件中点击了 "Initialize" 按钮

**Q: 2D 界面覆盖了 3D 场景？**
A: 这是正常的！菜单和匹配界面就是纯 2D，只有 Playing 状态才会显示 3D

**Q: 运行后画面是黑的？**
A: 检查 Camera 的 Clear Flags 设置为 Solid Color，Background 颜色为 #1A1A2E

---

完成以上步骤后，你的 3D 外星人对战游戏就搭建好了！