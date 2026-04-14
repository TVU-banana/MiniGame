# 材质配置说明

## 需要的材质

在 Unity 项目中创建以下材质：

### 1. 外星人身体材质 (AlienBodyMat)
```
Shader: Standard
Albedo: #00FF00 (亮绿色)
Smoothness: 0.3
Metallic: 0
```

### 2. 外星人眼睛材质 (AlienEyeMat)
```
Shader: Standard  
Albedo: #111111 (近黑色)
Smoothness: 0.5
Metallic: 0
```

### 3. 地面材质 (GroundMat)
```
Shader: Standard
Albedo: #808080 (灰色)
Smoothness: 0
Metallic: 0
```

### 4. 菜单背景材质 (MenuBackgroundMat)
```
Shader: Standard
Albedo: 渐变 (#0A0A1A 到 #1A1A3A)
```

### 5. 按钮材质 (ButtonMat)
```
Shader: Standard
Albedo: #FF7675 (红色渐变到 #D63031)
```

---

## 在 Unity 中创建材质

1. 在 Project 窗口右键 → Create → Material
2. 命名按照上面的名称
3. 在 Inspector 中设置颜色和其他属性
4. 拖拽到对应的物体上

---

## 颜色参考表

| 名称 | Hex 值 | RGB |
|------|--------|-----|
| 亮绿色 | #00FF00 | (0, 255, 0) |
| 黑色眼睛 | #111111 | (17, 17, 17) |
| 灰色地面 | #808080 | (128, 128, 128) |
| 菜单背景顶 | #0A0A1A | (10, 10, 26) |
| 菜单背景底 | #1A1A3A | (26, 26, 58) |
| 躲藏者黄色 | #FFD700 | (255, 215, 0) |
| 狙击手红色 | #FF6B6B | (255, 107, 107) |
| 按钮红色 | #FF7675 | (255, 118, 117) |
| 场景背景 | #1A1A2E | (26, 26, 46) |

---

## 程序化材质

如果你不想手动创建材质，AlienController.cs 中已经有代码会自动创建材质：

```csharp
// 自动创建绿色材质
Material mat = new Material(Shader.Find("Standard"));
mat.color = new Color(0f, 1f, 0f);
```

所以实际上你只需要把脚本挂载到空物体上，点击 Initialize 按钮，就会自动生成所有模型和材质。