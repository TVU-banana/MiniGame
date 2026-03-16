# `sample_game.html` 技术拆解报告

## 0. 先用一句话说清这段代码在做什么

这是一个**单文件前端小游戏**：用一个 `canvas` 负责绘制“世界”，再用一层普通 HTML 负责做按钮、血条、风力显示和提示框，最后用一段原生 JavaScript 把**游戏状态、物理规则、输入交互、画面渲染**串起来，形成一个可以运行的“2D 弹道对战游戏”。

如果你是前端新手，可以把它理解为：

- `HTML` 负责“摆东西”
- `CSS` 负责“长什么样”
- `JavaScript` 负责“它们怎么动、怎么响应操作”

这份代码最有学习价值的地方，不是某个 API 有多高级，而是它已经具备了一个小型游戏原型常见的几个核心模块：

- 视图层
- 游戏状态
- 主循环
- 物理规则
- 输入系统
- 回合切换
- 特效与 UI 同步

也就是说，它虽然只是一个 HTML 文件，但背后已经有了“小型互动系统”的雏形。这种思路不仅能做游戏，也能迁移到可视化编辑器、数据看板、教学动画、流程模拟器等很多别的前端项目里。

---

## 1. 这份代码的整体结构

这份代码基本可以分成 4 层：

1. 页面结构层  
   代码位置：[sample_game.html](D:/MiniGame/sample_game.html#L59) 到 [sample_game.html](D:/MiniGame/sample_game.html#L106)

2. 样式层  
   代码位置：[sample_game.html](D:/MiniGame/sample_game.html#L7) 到 [sample_game.html](D:/MiniGame/sample_game.html#L55)

3. 游戏逻辑层  
   代码位置：[sample_game.html](D:/MiniGame/sample_game.html#L108) 到 [sample_game.html](D:/MiniGame/sample_game.html#L702)

4. 运行入口  
   代码位置：[sample_game.html](D:/MiniGame/sample_game.html#L701) 到 [sample_game.html](D:/MiniGame/sample_game.html#L702)

如果把它画成架构图，可以理解成这样：

```text
用户手指/鼠标操作
        ↓
输入处理（蓄力、拖动角度、点击道具）
        ↓
修改游戏状态（玩家角度、炮弹、风力、回合状态）
        ↓
update() 更新逻辑
        ↓
draw() 渲染画面
        ↓
Canvas 世界画面 + HTML UI 更新
```

这是一个很重要的思维方式：

- **输入不直接改画面**
- **输入先改状态**
- **状态再驱动渲染**

这是几乎所有中大型交互系统都会遵守的基本原则。

---

## 2. 页面结构：为什么同时用 Canvas 和普通 HTML

### 2.1 Canvas 负责“世界”

代码位置：[sample_game.html](D:/MiniGame/sample_game.html#L61) 到 [sample_game.html](D:/MiniGame/sample_game.html#L62)

```html
<canvas id="gameCanvas"></canvas>
```

这个 `canvas` 负责绘制：

- 地形
- 海面
- 玩家角色
- 炮弹
- 粒子特效
- 轨迹预览

也就是说，凡是“需要频繁重绘、位置变化很多、像素级控制强”的内容，都交给 `canvas`。

### 2.2 HTML 负责“界面”

代码位置：[sample_game.html](D:/MiniGame/sample_game.html#L64) 到 [sample_game.html](D:/MiniGame/sample_game.html#L105)

这层 `.ui-layer` 负责：

- 风力显示
- 计时器显示
- 玩家头像与血条
- 提示 toast
- 角度控制盘
- 开火按钮
- 道具按钮

为什么这样分？

因为普通 HTML 做 UI 有三个天然优势：

1. 好布局
2. 好加点击事件
3. 好做文字和按钮样式

而 Canvas 的优势是：

1. 连续绘制快
2. 坐标系统统一
3. 适合做动画、轨迹、粒子、地图

这就是这段代码一个非常值得学习的点：

- **动态世界用 Canvas**
- **交互控件用 DOM**

这是一种非常实用的混合架构，不少 H5 游戏、可视化应用都会这么做。

---

## 3. CSS 层：它不是“装饰”，而是在定义交互体验

### 3.1 容器在模拟“手机竖屏”

代码位置：[sample_game.html](D:/MiniGame/sample_game.html#L10) 到 [sample_game.html](D:/MiniGame/sample_game.html#L19)

`#game-container` 被限制成最大 `414 x 896`，很明显是在模拟手机竖屏设备。

这说明作者一开始就明确了产品形态：**移动端优先**。

这背后对应的是一种很值得学的开发习惯：

- 先决定产品场景
- 再决定布局策略

很多新手会一开始就写页面，但没有先想清楚“这个东西是给 PC 用，还是给手机用”，结果后面全是返工。

### 3.2 UI 层用了 `pointer-events: none`

代码位置：[sample_game.html](D:/MiniGame/sample_game.html#L23)

```css
.ui-layer { ... pointer-events: none; }
```

意思是默认情况下，这一层虽然盖在上面，但不拦截点击。

然后真正需要点击的区域，例如 `.controls`，再单独打开：

代码位置：[sample_game.html](D:/MiniGame/sample_game.html#L36)

```css
.controls { ... pointer-events: auto; }
```

这是一个非常聪明的小技巧。它解决的是“覆盖层挡住底层交互”的常见问题。

这种技巧不只游戏能用，在以下场景也很常见：

- 浮层提示
- 热区标注
- 地图覆盖 UI
- 数据图表上的悬浮层

### 3.3 按钮状态被 CSS 接管了

比如开火按钮的普通态、按下态、蓄力态：

- [sample_game.html](D:/MiniGame/sample_game.html#L42)
- [sample_game.html](D:/MiniGame/sample_game.html#L43)
- [sample_game.html](D:/MiniGame/sample_game.html#L44)

这体现了一个好习惯：

- **JavaScript 负责改状态**
- **CSS 负责表现状态**

而不是把所有视觉变化都塞进 JS 里硬改样式。

---

## 4. JavaScript 的核心思路：它在管理“状态”，不是在堆事件

很多初学者写交互时，会变成这样：

- 点一下按钮，改一点东西
- 再点一下，改另外一点东西
- 哪儿坏了再补一段 if

最后代码会越来越乱。

而这份代码的相对成熟之处在于：它有明确的**游戏状态机**。

代码位置：[sample_game.html](D:/MiniGame/sample_game.html#L140) 到 [sample_game.html](D:/MiniGame/sample_game.html#L147)

```js
const STATE = { IDLE: 0, CHARGING: 1, FIRING: 2, RESOLVING: 3, GAME_OVER: 4 };
let currentState = STATE.IDLE;
```

这几种状态分别意味着：

- `IDLE`：当前玩家可以操作
- `CHARGING`：正在长按蓄力
- `FIRING`：炮弹飞行中
- `RESOLVING`：爆炸、坠落、粒子等结算中
- `GAME_OVER`：游戏结束

这在架构层面非常重要，因为它把“某个时刻系统允许做什么”说清楚了。

比如：

- 只有 `IDLE` 时可以开始蓄力
- 蓄力结束才可以发射
- 发射后不能再调角度
- 结算没结束不能立刻切回合
- 游戏结束后不能继续操作

换句话说，状态机的价值是：

- 防止逻辑互相打架
- 防止无效输入
- 防止时序混乱

这个思想可以迁移到很多别的领域，比如：

- 表单提交流程
- 支付流程
- 视频播放器状态
- 聊天消息发送状态
- 多步骤工作流

你可以把它抽象成一句话：

> 不要让系统“想干嘛就干嘛”，要让系统“在某个状态下只允许做该做的事”。

---

## 5. 数据模型：这段代码在维护哪些核心数据

### 5.1 世界常量

代码位置：[sample_game.html](D:/MiniGame/sample_game.html#L115) 到 [sample_game.html](D:/MiniGame/sample_game.html#L123)

```js
const MAP_WIDTH = 2500;
const SEA_LEVEL = 1200;
const GRAVITY = 0.5;
const TERRAIN_THICKNESS = 350;
```

这些常量决定了世界规则：

- 地图有多宽
- 海面在哪
- 重力多大
- 地形视觉厚度多厚

这是一种“配置优先”的写法。好处是调参数时，不必去很多地方找魔法数字。

### 5.2 摄像机对象

代码位置：[sample_game.html](D:/MiniGame/sample_game.html#L149) 到 [sample_game.html](D:/MiniGame/sample_game.html#L156)

```js
const camera = {
  x, y, zoom,
  targetX, targetY, targetZoom,
  isRadarActive
}
```

这是本文件最值得学的对象之一。

它告诉你：**屏幕看到的内容，不等于世界真实位置**。

这就是“世界坐标”和“屏幕坐标”的区别。

这个思想非常关键。很多前端新手做画布项目时，容易把“元素在哪里”和“镜头看哪里”混成一件事。实际上它们是两套东西：

- 玩家在世界中的位置：`player.x / player.y`
- 镜头在看哪里：`camera.x / camera.y`

这套思路能直接迁移到：

- 地图系统
- 白板系统
- 流程图编辑器
- 2D 游戏
- 图片裁切器

### 5.3 地形数据

代码位置：[sample_game.html](D:/MiniGame/sample_game.html#L161) 到 [sample_game.html](D:/MiniGame/sample_game.html#L172)

```js
const terrain = new Float32Array(MAP_WIDTH);
```

这表示作者没有把地形做成一个个方块，而是用“一维数组”存每个 `x` 对应的地表高度 `y`。

这是一个很聪明、也很省事的设计。

它意味着：

- 地图是横向扫描的
- 每一列只有一个地表高度
- 查地形碰撞时，只要看 `terrain[Math.floor(x)]`

它牺牲了一些复杂地形能力，但换来了：

- 数据简单
- 碰撞简单
- 地形破坏简单
- 绘制也简单

这是典型的“为当前问题选择刚刚够用的数据结构”。

### 5.4 玩家数据

代码位置：[sample_game.html](D:/MiniGame/sample_game.html#L174) 到 [sample_game.html](D:/MiniGame/sample_game.html#L188)

每个玩家都有：

- 位置：`x`, `y`
- 血量：`hp`
- 颜色：`color`
- 角度：`angle`
- 蓄力：`power`
- 纵向速度：`vy`
- 是否掉落：`falling`

这其实就是一个很基础的“实体对象”设计。

你可以把它理解成一句话：

> 每个对象都应该只保存它完成行为所必需的数据。

这套做法可以迁移到任何面向对象的交互元素，比如：

- 图表中的节点
- 编辑器中的图层
- 关卡中的敌人
- 动画中的角色

---

## 6. 初始化流程：页面加载后到底先发生了什么

这段代码的启动流程其实很清晰：

1. 找到 `canvas` 和上下文  
   [sample_game.html](D:/MiniGame/sample_game.html#L112) 到 [sample_game.html](D:/MiniGame/sample_game.html#L113)

2. 调整画布尺寸  
   [sample_game.html](D:/MiniGame/sample_game.html#L128) 到 [sample_game.html](D:/MiniGame/sample_game.html#L138)

3. 生成地形  
   [sample_game.html](D:/MiniGame/sample_game.html#L164) 到 [sample_game.html](D:/MiniGame/sample_game.html#L172)

4. 把玩家放到地表上  
   [sample_game.html](D:/MiniGame/sample_game.html#L190) 到 [sample_game.html](D:/MiniGame/sample_game.html#L199)

5. 注册各种输入事件  
   [sample_game.html](D:/MiniGame/sample_game.html#L602) 到 [sample_game.html](D:/MiniGame/sample_game.html#L683)

6. 启动主循环  
   [sample_game.html](D:/MiniGame/sample_game.html#L701) 到 [sample_game.html](D:/MiniGame/sample_game.html#L702)

这说明作者在“启动顺序”上是有意识的。

一个常见错误是：

- 事件先注册了
- 但状态还没准备好
- 或者画布还没准备好

结果就是一上来就出现空引用、位置错误、画面错位。

这份代码虽然简单，但初始化顺序是合理的。

---

## 7. 主循环：这段代码最核心的骨架

代码位置：[sample_game.html](D:/MiniGame/sample_game.html#L204) 到 [sample_game.html](D:/MiniGame/sample_game.html#L209)

```js
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
```

这是整段代码最核心的架构骨架。

它表达的是两个非常经典的概念：

- `update()`：更新逻辑
- `draw()`：渲染画面

很多初学者最容易犯的错误，是把“逻辑更新”和“渲染输出”揉在一起。比如：

- 在画东西的时候顺手改位置
- 在判断碰撞的时候顺手画特效

短期看没问题，长期维护会越来越乱。

这段代码虽然还没有做到完全纯净，但它已经有了明确方向：

- `update()` 尽量负责算
- `draw()` 尽量负责画

这就是游戏循环里非常经典的 separation of concerns，也就是“职责分离”。

### 7.1 `update()` 在做什么

代码位置：[sample_game.html](D:/MiniGame/sample_game.html#L211) 到 [sample_game.html](D:/MiniGame/sample_game.html#L350)

它主要负责：

- 摄像机跟随
- 蓄力数值变化
- 炮弹运动
- 玩家重力与掉落
- 回合结束检测

### 7.2 `draw()` 在做什么

代码位置：[sample_game.html](D:/MiniGame/sample_game.html#L352) 到 [sample_game.html](D:/MiniGame/sample_game.html#L469)

它主要负责：

- 画天空
- 画海
- 画地形
- 画预瞄线
- 画玩家
- 画炮弹
- 画粒子

如果你只学这一条，也已经很值：

> 任何持续刷新的互动系统，都应该尽量拆成“先算，再画”。

---

## 8. 摄像机系统：为什么这个小游戏看起来“像游戏”

代码位置：[sample_game.html](D:/MiniGame/sample_game.html#L215) 到 [sample_game.html](D:/MiniGame/sample_game.html#L249)

这里不是简单地把画面固定住，而是做了“根据场景切换镜头目标”：

- 雷达道具开启时，看全图
- 炮弹飞行时，跟踪炮弹
- 结算时，跟掉落玩家
- 其他时候，跟当前操作玩家

这在体验上非常加分，因为镜头不是死的，而是“知道现在最值得看哪里”。

更重要的是，它不是瞬移，而是平滑过渡：

```js
camera.x += (targetCamX - camera.x) * 0.1;
camera.y += (targetCamY - camera.y) * 0.1;
camera.zoom += (targetZoom - camera.zoom) * 0.05;
```

这是一种非常常见的插值写法。它的含义是：

- 不是一下跳到目标
- 而是每帧靠近一点

这类思路可以迁移到：

- 滚动跟随
- 卡片吸附
- 拖拽回弹
- 图表平滑过渡
- 过场镜头

所以不要把它只当成“游戏镜头技巧”，它本质上是**状态渐进式过渡**。

---

## 9. 物理系统：这段代码为什么能打炮、爆炸、掉坑、落海

### 9.1 炮弹飞行

代码位置：[sample_game.html](D:/MiniGame/sample_game.html#L261) 到 [sample_game.html](D:/MiniGame/sample_game.html#L290)

核心思想很简单：

- `vx` 是横向速度
- `vy` 是纵向速度
- 重力会不断让 `vy` 增大
- 风会不断影响 `vx`
- 位置由速度累加得到

也就是：

```text
速度变了 → 位置就会变
```

这是最基础的物理模拟。

### 9.2 玩家掉落

代码位置：[sample_game.html](D:/MiniGame/sample_game.html#L292) 到 [sample_game.html](D:/MiniGame/sample_game.html#L336)

这里作者没有把玩家看成“固定钉在地面上”，而是让玩家也服从重力。

当地形被炸出坑后，如果角色脚下没有地面支撑，就会进入 `falling` 状态，然后：

- `vy += GRAVITY`
- `y += vy`

这使得“可破坏地形”真的影响玩法，而不是只有视觉效果。

这其实体现了一个很重要的设计原则：

> 好的系统，不是做一个假动画骗你，而是让规则真的互相作用。

比如很多项目里，动画和数据是两套系统，彼此没关系，看起来炫，但没有真实反馈。这段代码相反，它是“地形变了，角色真的会掉下去”。

### 9.3 地形破坏

代码位置：[sample_game.html](D:/MiniGame/sample_game.html#L494) 到 [sample_game.html](D:/MiniGame/sample_game.html#L523)

爆炸时，代码并不是“画一个坑”，而是直接修改 `terrain` 数据本身。

这就是数据驱动的好处：

- 地形怎么画，取决于数据
- 地形怎么碰撞，也取决于数据

只要改一份数据，画面和规则都会一起变。

这正是很多优秀前端系统的共同特征：

- 不直接修补表象
- 直接修改底层状态

---

## 10. 输入系统：为什么要统一成 Pointer 事件

代码位置：[sample_game.html](D:/MiniGame/sample_game.html#L599) 到 [sample_game.html](D:/MiniGame/sample_game.html#L653)

这段代码没有分别写：

- `mousedown`
- `touchstart`
- `mouseup`
- `touchend`

而是采用了 Pointer 事件：

- `pointerdown`
- `pointermove`
- `pointerup`

这是一种更现代、也更统一的写法，因为它可以同时覆盖：

- 鼠标
- 触摸
- 手写笔

对于移动端 H5 项目，这是值得优先学习的。

### 10.1 开火按钮

代码位置：[sample_game.html](D:/MiniGame/sample_game.html#L605) 到 [sample_game.html](D:/MiniGame/sample_game.html#L623)

流程是：

1. `pointerdown` 开始蓄力
2. 记录开始时间
3. UI 进入 `charging` 状态
4. `pointerup` 或 `pointerleave` 时结束蓄力
5. 立刻调用 `fire()`

这个设计挺直观，而且“长按时长映射力度”的做法也很适合移动端。

### 10.2 角度盘

代码位置：[sample_game.html](D:/MiniGame/sample_game.html#L629) 到 [sample_game.html](D:/MiniGame/sample_game.html#L653)

这里做的事情其实是一个很典型的“坐标转角度”问题：

1. 求出指针相对圆心的偏移 `dx`, `dy`
2. 用 `atan2` 算角度
3. 把角度映射回玩家炮管方向
4. 再把摇杆小球摆到对应位置

这套思路可以迁移到很多交互场景，比如：

- 圆形菜单
- 旋钮控制器
- 雷达扫描盘
- 方向输入
- 图像旋转手柄

---

## 11. UI 同步：这段代码如何把“游戏状态”反映到界面上

代码位置：[sample_game.html](D:/MiniGame/sample_game.html#L685) 到 [sample_game.html](D:/MiniGame/sample_game.html#L691)

```js
function updateUI() {
  ...
}
```

它负责同步：

- 风力数值
- 左右两侧血条高度
- 当前角度显示

这是一种半手动的数据绑定方式。

如果你用 React、Vue，这种事情往往由框架自动帮你做。  
但在原生 JS 里，你必须自己决定什么时候更新 UI。

这段代码的好处是：

- 有一个统一入口 `updateUI()`
- 而不是每个地方都零散地修改 DOM

这个思想很值得保留。

哪怕未来你写 React，也还是应该追求：

- 有明确的状态来源
- 有明确的界面同步边界

---

## 12. 道具系统：这是一个很典型的“扩展点”设计

代码位置：[sample_game.html](D:/MiniGame/sample_game.html#L655) 到 [sample_game.html](D:/MiniGame/sample_game.html#L683)

`triggerGift(type)` 本质上是一个“小型命令分发器”。

它根据 `type` 执行不同效果：

- `radar`：拉远镜头
- `storm`：改变风力
- `bomb`：连续爆炸

这说明作者在结构上已经留出了扩展空间。

今天只有 3 个道具，明天完全可以继续加：

- 护盾
- 双发炮弹
- 反重力
- 医疗包

这种写法背后的架构思想是：

> 把“输入类别”和“执行效果”分开，给系统留扩展点。

这在业务系统里也非常常见，比如：

- 根据按钮类型执行不同审批动作
- 根据消息类型走不同渲染逻辑
- 根据图表类型绘制不同图形

---

## 13. 这份代码里最值得学习的架构理念

### 13.1 用状态机管理复杂交互

参考：[sample_game.html](D:/MiniGame/sample_game.html#L140) 到 [sample_game.html](D:/MiniGame/sample_game.html#L147)

这是防止交互混乱最有效的手段之一。

### 13.2 用“世界数据”驱动画面，而不是只做表面动画

参考：

- 地形数据：[sample_game.html](D:/MiniGame/sample_game.html#L161) 到 [sample_game.html](D:/MiniGame/sample_game.html#L172)
- 地形破坏：[sample_game.html](D:/MiniGame/sample_game.html#L507) 到 [sample_game.html](D:/MiniGame/sample_game.html#L523)

这让规则、碰撞和视觉统一。

### 13.3 把 update 和 draw 分开

参考：[sample_game.html](D:/MiniGame/sample_game.html#L204) 到 [sample_game.html](D:/MiniGame/sample_game.html#L209)

这能显著降低后续复杂度。

### 13.4 把“世界层”和“UI 层”分开

参考：

- Canvas 层：[sample_game.html](D:/MiniGame/sample_game.html#L61) 到 [sample_game.html](D:/MiniGame/sample_game.html#L62)
- UI 层：[sample_game.html](D:/MiniGame/sample_game.html#L64) 到 [sample_game.html](D:/MiniGame/sample_game.html#L105)

这是一种非常实用的前端交互分层。

### 13.5 为体验写逻辑，而不是只为“功能存在”写逻辑

比如：

- 镜头平滑过渡
- 炮弹跟镜头
- 结算延迟 1 秒再切回合
- 蓄力时按钮震动
- 爆炸后角色会掉落

这些都说明作者不是只在实现功能，而是在思考“用户感觉像不像真的在玩”。

这也是优秀产品代码和纯功能代码的差别。

---

## 14. 这份代码的主要不足，以及为什么这些坑要尽量避免

下面这一部分很重要。学习代码，不能只看它哪里好，也要看它哪里以后会出问题。

### 14.1 所有东西都堆在一个 HTML 文件里，耦合太高

整份文件把：

- HTML
- CSS
- 游戏逻辑
- 渲染逻辑
- 输入逻辑
- 道具逻辑

全塞进一个文件里。

小 demo 可以，大一点就会非常难维护。

更好的拆法至少应该是：

- `render`
- `physics`
- `input`
- `ui`
- `game-state`

分模块。

### 14.2 `resize()` 里直接 `ctx.scale(2, 2)`，有累计缩放风险

代码位置：[sample_game.html](D:/MiniGame/sample_game.html#L128) 到 [sample_game.html](D:/MiniGame/sample_game.html#L135)

这是这份代码里最值得指出的技术问题之一。

现在的写法是每次 `resize()` 都再 `scale(2, 2)` 一次，但没有先重置 transform。  
如果窗口多次变化，理论上可能出现累计缩放。

更稳妥的写法通常是：

```js
ctx.setTransform(1, 0, 0, 1, 0, 0);
ctx.scale(dpr, dpr);
```

### 14.3 画布清晰度写死成 2 倍，不够通用

代码位置：[sample_game.html](D:/MiniGame/sample_game.html#L132) 到 [sample_game.html](D:/MiniGame/sample_game.html#L134)

它写死成了 `width * 2`、`height * 2`，这是一种“近似 DPR=2”的处理。

问题是：

- 某些设备 DPR 不是 2
- 某些设备可能是 1.5、3、4

更好的方式是用 `window.devicePixelRatio`。

### 14.4 物理更新依赖帧率，没有 `deltaTime`

比如重力、速度、粒子衰减，都是按“每帧”在算，而不是按“每秒”在算。

这意味着：

- 高帧率设备和低帧率设备，物理表现会不一样

这是前端动画和小游戏里非常常见的坑。

### 14.5 `draw()` 里顺手更新粒子，职责不够纯

代码位置：[sample_game.html](D:/MiniGame/sample_game.html#L458) 到 [sample_game.html](D:/MiniGame/sample_game.html#L466)

这里在渲染粒子的同时，也更新了粒子位置和半径。

这会导致：

- `draw()` 不再只是“画”
- 逻辑和渲染再次耦合

短期没问题，长期会难调试。更理想的做法是把粒子更新放进 `update()`。

### 14.6 在 `forEach` 里 `splice` 粒子数组，可能跳元素

代码位置：[sample_game.html](D:/MiniGame/sample_game.html#L458) 到 [sample_game.html](D:/MiniGame/sample_game.html#L466)

这是经典坑。

因为你一边遍历，一边删除数组项，后面的索引会变，可能造成某些粒子没处理到。

更稳妥的方式通常是：

- 倒序 `for`
- 或者 `particles = particles.filter(...)`

### 14.7 `bomb` 道具的爆炸高度写法有问题

代码位置：[sample_game.html](D:/MiniGame/sample_game.html#L676) 到 [sample_game.html](D:/MiniGame/sample_game.html#L680)

```js
explode(Math.random() * MAP_WIDTH, terrain[1000], 40);
```

这里 `x` 是随机的，但 `y` 却固定取 `terrain[1000]`。  
也就是说，随机横坐标和地形高度没有配套起来。

直白一点讲：

- 爆炸点的横坐标是随机的
- 但纵坐标不是该横坐标对应地面的高度

这很可能造成爆炸位置不合理。

正确思路应该是：

1. 先得到随机 `x`
2. 再用这个 `x` 去取 `terrain[Math.floor(x)]`

### 14.8 计时器 UI 是静态的，没有真正的回合倒计时逻辑

代码位置：

- UI 元素：[sample_game.html](D:/MiniGame/sample_game.html#L71)
- 逻辑里没有真正更新它

这会给人一种“界面有功能，逻辑没接上”的感觉。

这类半成品状态在原型阶段可以接受，但正式项目里要尽量避免。

### 14.9 `window.turnTimeout` 作为动态全局变量，不够稳妥

代码位置：[sample_game.html](D:/MiniGame/sample_game.html#L343) 到 [sample_game.html](D:/MiniGame/sample_game.html#L347)

把状态挂到 `window` 上虽然方便，但会带来两个问题：

- 污染全局命名空间
- 让变量来源变得不清晰

更好的做法是显式声明：

```js
let turnTimeout = null;
```

### 14.10 仍然使用了内联 `onclick`

代码位置：[sample_game.html](D:/MiniGame/sample_game.html#L98) 到 [sample_game.html](D:/MiniGame/sample_game.html#L100)

这会让结构层和行为层重新耦合。现代写法通常更推荐统一在 JS 里绑定事件。

### 14.11 DOM 查询有重复

比如 `document.getElementById(...)` 在不同地方频繁调用。

小项目问题不大，但更大的项目里最好：

- 启动时缓存 DOM 引用
- 统一管理 UI 节点

这样更清晰，也更省性能。

---

## 15. 如果要把这份代码继续升级，建议怎么改

### 第一步：先拆模块，不要先急着上框架

建议先拆成这些文件：

- `gameState.js`
- `physics.js`
- `render.js`
- `input.js`
- `ui.js`
- `effects.js`

这样比直接重写成 React 更有价值，因为你先学会的是“怎么拆职责”。

### 第二步：把所有魔法数字抽成配置

比如：

- 爆炸半径
- 玩家半径
- 初始 HP
- 风力范围
- 蓄力时间
- 粒子数量

这样以后调平衡会轻松很多。

### 第三步：让 `update()` 完全只算状态，`draw()` 完全只画

这是让代码从“能跑”走向“好维护”的关键一步。

### 第四步：引入 `deltaTime`

这样不同设备表现会更一致。

### 第五步：把 UI 更新做成一个更清晰的 ViewModel

例如统一维护：

- 当前玩家
- 风力
- 角度
- 双方血量
- 回合剩余时间

然后集中刷新 DOM。

---

## 16. 给小白读者的最终总结

如果你是前端初学者，这份代码最值得你带走的，不是某一行语法，而是下面这 6 个“可迁移能力”：

1. **先分层**  
   动态世界交给 Canvas，控件交给 DOM。

2. **先有状态，再有交互**  
   不要一上来就堆事件，把系统状态先想清楚。

3. **任何复杂交互都值得做状态机**  
   这会极大降低后续混乱。

4. **把逻辑更新和画面渲染拆开**  
   这是互动程序最基本的架构习惯。

5. **数据应当驱动画面和规则**  
   地形数组一改，碰撞和绘制都跟着变，这才是真正可维护。

6. **写完以后一定要反过来看“哪些地方以后会坑自己”**  
   比如全局变量、重复查 DOM、硬编码、帧率依赖、职责混杂，这些都是项目长大后最先反噬你的地方。

一句话总结这份代码：

> 它是一个结构意识已经不错的小游戏原型，优点是分层思维和状态管理雏形清晰，缺点是仍然停留在“单文件原型”的维护级别。

如果你能把它看懂，再把它拆成模块、补上计时、修正物理时序、整理 UI 同步方式，你就已经不只是“会写一个小游戏”，而是在学习**如何设计一个可扩展的前端互动系统**。
