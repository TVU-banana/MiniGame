using System.Collections;
using System.Collections;
using System.Collections.Generic;
using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class RopeManager : MonoBehaviour
{
    // 单例模式（全局唯一）
    public static RopeManager Instance;
    private bool isChangingLevel = false;
    // 新增：胜利后才解锁切关，防止自动触发
    private bool canClickNextLevel = false;

    [Header("基础配置")]
    public GameObject ropeEndPrefab;       // 绳子端点预制体（需挂载RopeEnd脚本+Collider2D）
    public LineRenderer ropePrefab;        // 绳子线段预制体（LineRenderer）
    public List<Transform> dotGrid;        // 黑点网格（6行4列，按行优先顺序拖入，Size=24）

    [Header("胜利界面 UI 绑定")]
    public GameObject VictoryPanel;        // 胜利面板（默认隐藏）
    public TMP_Text VictoryTitleText;      // 胜利标题文本
    public TMP_Text VictoryDescText;       // 胜利描述文本
    public Button NextLevelButton;         // 下一关按钮

    // 内部变量
    private List<Rope> ropes = new List<Rope>();
    private int currentLevelId = 1;        // 当前关卡ID

    void Awake()
    {
        // 单例初始化（防止重复创建）
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance
= this;

        // 初始隐藏胜利面板
        if (VictoryPanel != null)
            VictoryPanel
.SetActive(false);

        // 绑定下一关按钮事件（先清空旧监听，防止重复绑定）
        if (NextLevelButton != null)
        {
            NextLevelButton
.onClick.RemoveAllListeners(); // 清空旧监听
            NextLevelButton
.onClick.AddListener(OnNextLevelClick);
        }
    }

    void Start()
    {
        // 启动游戏加载第1关
        LoadLevel(1);
        // 显示关卡开始提示
        if (UIManager.Instance != null)
            UIManager
.Instance.ShowNotice("第1关开始！解开打结的绳子吧！");
    }

    #region 关卡管理
    // 加载指定关卡（核心：严格按1→2→3顺序）
    public void LoadLevel(int levelId)
    {
        Debug
.Log($"[日志] 进入 LoadLevel，传入 levelId = {levelId}，当前 currentLevelId = {currentLevelId}");
        currentLevelId
    = levelId;
        Debug
    .Log($"[日志] LoadLevel 赋值后：currentLevelId = {currentLevelId}");
        ClearAllRopes();
        UIManager
    .Instance?.UpdateLevelText(currentLevelId);
        UIManager
    .Instance?.ShowNotice($"第{currentLevelId}关开始！");
        canClickNextLevel
    = false; // 

        // 启动10秒倒计时


        switch (levelId)
        {
            case 1:
                Debug
    .Log("[日志] 加载第1关（2根绳子，打1次结）");
                // 绿绳：(2,2) → (3,5)
                SpawnRope(new Vector2Int(2, 2), new Vector2Int(3, 5), Color.green);
                // 红绳：(3,2) → (2,5)
                SpawnRope(new Vector2Int(3, 2), new Vector2Int(2, 5), Color.red);
                break;
            case 2:
                Debug
    .Log("[日志] 加载第2关（4根绳子，互相纠缠）");
                // 绿绳：(2,2) → (3,5)
                SpawnRope(new Vector2Int(2, 2), new Vector2Int(3, 5), Color.green);
                // 红绳：(3,2) → (2,5)
                SpawnRope(new Vector2Int(3, 2), new Vector2Int(2, 5), Color.red);
                // 黄绳：(1,3) → (4,3)
                SpawnRope(new Vector2Int(1, 3), new Vector2Int(4, 3), Color.yellow);
                // 蓝绳：(2,4) → (3,1)
                SpawnRope(new Vector2Int(2, 4), new Vector2Int(3, 1), Color.blue);
                break;
            case 3:
                Debug
    .Log("[日志] 加载第3关（5根绳子，更复杂纠缠）");
                // 绿绳：(2,2) → (3,5)
                SpawnRope(new Vector2Int(2, 2), new Vector2Int(3, 5), Color.green);
                // 红绳：(3,2) → (2,5)
                SpawnRope(new Vector2Int(3, 2), new Vector2Int(2, 5), Color.red);
                // 黄绳：(1,3) → (4,3)
                SpawnRope(new Vector2Int(1, 3), new Vector2Int(4, 3), Color.yellow);
                // 蓝绳：(2,4) → (3,1)
                SpawnRope(new Vector2Int(2, 4), new Vector2Int(3, 1), Color.blue);
                // 紫绳：(1,2) → (4,5)
                SpawnRope(new Vector2Int(1, 2), new Vector2Int(4, 5), Color.magenta);
                break;
            default:
                Debug
    .Log($"[日志] 加载超出范围的关卡 levelId = {levelId}，触发游戏结束");
                if (UIManager.Instance != null)
                {
                    UIManager
    .Instance.ShowGameOverPanel();
                    UIManager
    .Instance.ShowNotice("恭喜通关所有关卡！");
                }
                break;
        }
    }

    // 重置当前关卡
    public void ResetCurrentLevel()
    {
        // 隐藏失败面板
        if (UIManager.Instance != null)
            UIManager
.Instance.HidePanel(UIManager.Instance.defeatPanel);

        LoadLevel(currentLevelId);
        // 显示重置提示
        if (UIManager.Instance != null)
            UIManager
.Instance.ShowNotice("关卡已重置！");
    }

    // 下一关按钮点击事件（唯一切关入口）
    public void OnNextLevelClick()
    {
        // 双重保护：1. 未胜利解锁 2. 正在切关 → 都返回
        if (!canClickNextLevel)
        {
            Debug
.Log("[日志] 未胜利解锁，忽略切关请求");
            return;
        }
        if (isChangingLevel)
        {
            Debug
.Log("[日志] 正在切关中，忽略重复点击");
            return;
        }

        isChangingLevel
= true; // 上锁
        Debug
.Log($"[日志] 点击下一关前：currentLevelId = {currentLevelId}");

        if (VictoryPanel != null)
            VictoryPanel
.SetActive(false);

        int nextLevel = currentLevelId + 1;
        Debug
.Log($"[日志] 计算得到 nextLevel = {nextLevel}");

        LoadLevel(nextLevel);

        if (UIManager.Instance != null)
            UIManager
.Instance.ShowNotice($"第{nextLevel}关开始！");

        // 切关完成后解锁（延迟1秒，避免连续点击）
        Invoke(nameof(UnlockLevelChange), 1f);
    }

    // 解锁方法
    private void UnlockLevelChange()
    {
        isChangingLevel
= false;
    }
    #endregion

    #region 绳子生成与管理
    // 生成单根绳子（参数：起点(列,行)、终点(列,行)、颜色，输入为1开始的行列）
    private void SpawnRope(Vector2Int startColRow, Vector2Int endColRow, Color color)
    {
        // 转换为0开始的索引
        int col1 = startColRow.x - 1;
        int row1 = startColRow.y - 1;
        int col2 = endColRow.x - 1;
        int row2 = endColRow.y - 1;

        // 获取黑点位置（加空值保护）
        Transform dot1 = GetDot(row1, col1);
        Transform dot2 = GetDot(row2, col2);
        if (dot1 == null || dot2 == null)
        {
            Debug
.LogError($"❌ 黑点位置错误：行{row1}列{col1} 或 行{row2}列{col2}不存在！");
            return;
        }

        Vector3 pos1 = dot1.position;
        Vector3 pos2 = dot2.position;

        // 生成绳子端点
        GameObject end1Obj = Instantiate(ropeEndPrefab, pos1, Quaternion.identity, transform);
        GameObject end2Obj = Instantiate(ropeEndPrefab, pos2, Quaternion.identity, transform);
        RopeEnd end1Comp = end1Obj.GetComponent<RopeEnd>();
        RopeEnd end2Comp = end2Obj.GetComponent<RopeEnd>();
        if (end1Comp == null || end2Comp == null)
        {
            Debug
.LogError("❌ 绳子端点预制体缺少 RopeEnd 组件！");
            return;
        }

        // 生成绳子线段
        LineRenderer ropeLine = Instantiate(ropePrefab, transform);
        ropeLine
.positionCount = 2;
        ropeLine
.SetPosition(0, pos1);
        ropeLine
.SetPosition(1, pos2);
        ropeLine
.startColor = color;
        ropeLine
.endColor = color;
        ropeLine
.startWidth = 0.1f; // 保证绳子可见
        ropeLine
.endWidth = 0.1f;

        // 初始化绳子
        Rope newRope = new Rope(end1Comp, end2Comp, ropeLine);
        ropes
.Add(newRope);
        end1Comp
.Init(newRope);
        end2Comp
.Init(newRope);
    }

    // 根据行列获取黑点（行优先，0开始索引）
    private Transform GetDot(int row, int col)
    {
        int index = row * 4 + col; // 6行4列 → 一维索引
        if (index >= 0 && index < dotGrid.Count)
            return dotGrid[index];

        Debug
.LogError($"❌ 黑点索引越界：行{row}列{col} → 索引{index}");
        return null;
    }

    // 清空所有绳子
    public void ClearAllRopes()
    {
        foreach (var rope in ropes)
        {
            if (rope.GetEnd1() != null) Destroy(rope.GetEnd1().gameObject);
            if (rope.GetEnd2() != null) Destroy(rope.GetEnd2().gameObject);
            if (rope.lineRenderer != null) Destroy(rope.lineRenderer.gameObject);
        }
        ropes
.Clear();
    }
    #endregion

    #region 胜利检测与提示
    // 检查胜利条件（所有绳子不相交）
    public void CheckWinCondition()
    {
        bool isAllUnknotted = true;

        // 检测所有绳子对是否相交
        for (int i = 0; i < ropes.Count; i++)
        {
            for (int j = i + 1; j < ropes.Count; j++)
            {
                if (LinesIntersect(ropes[i], ropes[j]))
                {
                    isAllUnknotted
= false;
                    break;
                }
            }
            if (!isAllUnknotted) break;
        }

        // 胜利/失败逻辑
        if (isAllUnknotted)
        {
            Debug
.Log($"[日志] 通关！当前 currentLevelId = {currentLevelId}");
            // 胜利后解锁切关按钮（核心！）
            canClickNextLevel
= true;

            // 显示通关提示
            if (UIManager.Instance != null)
            {
                UIManager
.Instance.ShowNotice($"恭喜通关第{currentLevelId}关！");
                UIManager
.Instance.ShowVictoryPanel(currentLevelId, currentLevelId < 3);
            }
            // 显示胜利面板（本地UI）
            ShowVictoryPanel(
                $"恭喜通关第 {currentLevelId} 关！",
                currentLevelId
< 3 ? "点击下一关继续挑战！" : "你已通关所有关卡！",
                currentLevelId
< 3
            );
            // 绳子收缩动画
            StartCoroutine(ShrinkAllRopesToDots());
        }
        else
        {
            Debug
.Log($"[日志] 未通关，currentLevelId = {currentLevelId}");
            // 未胜利时锁定切关按钮
            canClickNextLevel
= false;

            // 显示失败提示
            if (UIManager.Instance != null)
            {
                UIManager
.Instance.ShowNotice("还有绳子打结哦，再试试！");
                UIManager
.Instance.ShowDefeatPanel();
            }
        }
    }

    // 线段相交检测（仅真正打叉才算相交，防浮点误差）
    private bool LinesIntersect(Rope r1, Rope r2)
    {
        Vector2 A = r1.GetEnd1().transform.position;
        Vector2 B = r1.GetEnd2().transform.position;
        Vector2 C = r2.GetEnd1().transform.position;
        Vector2 D = r2.GetEnd2().transform.position;

        float ccw1 = Cross(B - A, C - A);
        float ccw2 = Cross(B - A, D - A);
        float ccw3 = Cross(D - C, A - C);
        float ccw4 = Cross(D - C, B - C);

        // 防浮点误差：ccw接近0视为共线/端点接触，不算相交
        const float eps = 1e-6f;
        bool hasZero = Mathf.Abs(ccw1) < eps || Mathf.Abs(ccw2) < eps ||
                       Mathf
.Abs(ccw3) < eps || Mathf.Abs(ccw4) < eps;
        if (hasZero) return false;

        // 仅严格互相穿过才算相交
        return (ccw1 * ccw2 < 0) && (ccw3 * ccw4 < 0);
    }

    // 向量叉乘（判断线段相交的核心）
    private float Cross(Vector2 v1, Vector2 v2)
    {
        return v1.x * v2.y - v1.y * v2.x;
    }

    // 显示胜利面板（本地UI）
    private void ShowVictoryPanel(string title, string desc, bool showNextButton)
    {
        if (VictoryPanel == null) return;

        VictoryPanel
.SetActive(true);
        if (VictoryTitleText != null) VictoryTitleText.text = title;
        if (VictoryDescText != null) VictoryDescText.text = desc;
        if (NextLevelButton != null) NextLevelButton.gameObject.SetActive(showNextButton);
    }
    #endregion

    #region 动画与协程
    // 绳子收缩动画（仅动画，无切关逻辑，避免跳关）
    IEnumerator ShrinkAllRopesToDots()
    {
        float duration = 0.5f;
        float time = 0;
        while (time < duration)
        {
            time
+= Time.deltaTime;
            foreach (var rope in ropes)
            {
                Vector3 p1 = rope.GetEnd1().transform.position;
                Vector3 p2 = rope.GetEnd2().transform.position;
                rope
.lineRenderer.SetPosition(0, p1);
                rope
.lineRenderer.SetPosition(1, p2);
            }
            yield return null;
        }
    }
    #endregion

    #region 内部类：绳子
    public class Rope
    {
        private RopeEnd end1;
        private RopeEnd end2;
        public LineRenderer lineRenderer;

        public Rope(RopeEnd e1, RopeEnd e2, LineRenderer lr)
        {
            end1
= e1;
            end2
= e2;
            lineRenderer
= lr;
            UpdateLinePositions();
        }

        public RopeEnd GetEnd1() { return end1; }
        public RopeEnd GetEnd2() { return end2; }

        // 更新绳子线段位置（拖拽时同步，防止回弹）
        public void UpdateLinePositions()
        {
            if (lineRenderer != null)
            {
                lineRenderer
.SetPosition(0, end1.transform.position);
                lineRenderer
.SetPosition(1, end2.transform.position);
            }
        }
    }
    #endregion
    public void OnCheckWinButtonClick()
    {
        CheckWinCondition();
    }
}

