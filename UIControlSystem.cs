using UnityEngine;
using TMPro;
using UnityEngine.UI;
using System.Collections.Generic;

/// <summary>
/// UI控制系统 - 管理所有立方体的状态显示和控制
/// </summary>
public class UIControlSystem : MonoBehaviour
{
    [Header("UI面板设置")]
    [Tooltip("主UI画布")]
    public Canvas mainCanvas;
    [Tooltip("状态显示面板预制体")]
    public GameObject statusPanelPrefab;
    [Tooltip("面板容器（如GridLayout）")]
    public RectTransform panelContainer;

    [Header("文本显示设置")]
    [Tooltip("标题文本")]
    public TextMeshProUGUI titleText;
    [Tooltip("总立方体数量文本")]
    public TextMeshProUGUI totalCubesText;
    [Tooltip("激活的立方体数量文本")]
    public TextMeshProUGUI activeCubesText;
    [Tooltip("移动中的立方体数量文本")]
    public TextMeshProUGUI movingCubesText;
    [Tooltip("已完成移动的立方体数量文本")]
    public TextMeshProUGUI completedCubesText;

    [Header("按钮设置")]
    public Button refreshButton;
    public Button resetAllButton;
    public Button transformAllButton;

    [Header("颜色设置")]
    public Color activeColor = Color.green;
    public Color movingColor = Color.yellow;
    public Color waitingColor = Color.blue;
    public Color completedColor = Color.gray;

    [Header("时间显示设置")]
    [Tooltip("已用时间文本")]
    public TextMeshProUGUI elapsedTimeText;
    [Tooltip("计时器是否在运行")]
    private bool isTimerRunning = false;
    [Tooltip("已用时间（秒）")]
    private float elapsedTime = 0f;
    [Tooltip("开始时间")]
    private float startTime = 0f;

    // 存储所有立方体的UI项
    private Dictionary<CubeFacesArrows, CubeUIItem> cubeUIItems = new Dictionary<CubeFacesArrows, CubeUIItem>();
    private List<CubeFacesArrows> allCubes = new List<CubeFacesArrows>();

    // 存储所有立方体的初始状态（用于重置）
    private List<CubeInitialState> initialStates = new List<CubeInitialState>();

    // 单例实例
    public static UIControlSystem Instance { get; private set; }

    private void Awake()
    {
        // 设置单例
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }
        else
        {
            Destroy(gameObject);
        }
    }

    private void Start()
    {
        // 初始化UI
        InitializeUI();

        // 查找所有立方体并保存初始状态
        FindAllCubesAndSaveStates();

        // 设置按钮事件
        if (refreshButton != null)
            refreshButton.onClick.AddListener(RefreshUI);

        if (resetAllButton != null)
            resetAllButton.onClick.AddListener(ResetAllCubes);

        if (transformAllButton != null)
            transformAllButton.onClick.AddListener(TransformAllCubes);

        // 启动计时器
        StartTimer();

    }

    private void Update()
    {
        // 定期更新UI显示（每秒更新4次）
        if (Time.frameCount % 15 == 0)
        {
            UpdateAllUI();
            UpdateStatsText();
        }

        // 更新时间显示（每帧更新，让时间看起来更流畅）
        UpdateTimeDisplay();
    }

    /// <summary>
    /// 初始化UI
    /// </summary>
    private void InitializeUI()
    {
        if (titleText != null)
            titleText.text = "立方体移动控制系统";

        UpdateStatsText();
    }

    /// <summary>
    /// 查找场景中所有立方体并保存初始状态
    /// </summary>
    public void FindAllCubesAndSaveStates()
    {
        // 清空现有列表
        allCubes.Clear();
        initialStates.Clear();

        // 查找所有CubeFacesArrows组件
        CubeFacesArrows[] cubes = FindObjectsOfType<CubeFacesArrows>();
        allCubes.AddRange(cubes);

        Debug.Log($"找到 {allCubes.Count} 个立方体");

        // 保存每个立方体的初始状态
        foreach (var cube in allCubes)
        {
            initialStates.Add(new CubeInitialState
            {
                cube = cube,
                position = cube.transform.position,
                direction = cube.GetMoveDirection(),
                symbol = cube.GetArrowSymbol()
            });
        }

        // 为每个立方体创建UI项
        CreateUIItems();

        // 更新统计
        UpdateStatsText();
    }

    /// <summary>
    /// 为每个立方体创建UI项
    /// </summary>
    private void CreateUIItems()
    {
        // 清理旧的UI项
        foreach (var item in cubeUIItems.Values)
        {
            if (item != null && item.gameObject != null)
                Destroy(item.gameObject);
        }
        cubeUIItems.Clear();

        // 如果没有面板容器，尝试查找或创建
        if (panelContainer == null)
        {
            CreatePanelContainer();
        }

        // 为每个立方体创建新的UI项
        foreach (var cube in allCubes)
        {
            CreateCubeUIItem(cube);
        }
    }

    /// <summary>
    /// 创建面板容器
    /// </summary>
    private void CreatePanelContainer()
    {
        GameObject containerObj = new GameObject("PanelContainer", typeof(RectTransform));
        containerObj.transform.SetParent(mainCanvas.transform, false);

        panelContainer = containerObj.GetComponent<RectTransform>();
        panelContainer.anchorMin = new Vector2(0, 0);
        panelContainer.anchorMax = new Vector2(0.3f, 1);
        panelContainer.offsetMin = Vector2.zero;
        panelContainer.offsetMax = Vector2.zero;

        // 添加ScrollRect组件
        ScrollRect scrollRect = containerObj.AddComponent<ScrollRect>();
        scrollRect.horizontal = false;
        scrollRect.vertical = true;

        // 创建Content
        GameObject contentObj = new GameObject("Content", typeof(RectTransform));
        contentObj.transform.SetParent(containerObj.transform, false);
        RectTransform contentRect = contentObj.GetComponent<RectTransform>();
        contentRect.anchorMin = new Vector2(0, 1);
        contentRect.anchorMax = new Vector2(1, 1);
        contentRect.pivot = new Vector2(0.5f, 1);
        contentRect.sizeDelta = new Vector2(0, 0);

        // 添加VerticalLayoutGroup
        VerticalLayoutGroup layout = contentObj.AddComponent<VerticalLayoutGroup>();
        layout.spacing = 5;
        layout.padding = new RectOffset(10, 10, 10, 10);
        layout.childForceExpandWidth = true;
        layout.childForceExpandHeight = false;

        // 添加ContentSizeFitter
        ContentSizeFitter fitter = contentObj.AddComponent<ContentSizeFitter>();
        fitter.verticalFit = ContentSizeFitter.FitMode.PreferredSize;

        // 设置ScrollRect
        scrollRect.content = contentRect;
        panelContainer = contentRect;
    }

    /// <summary>
    /// 为单个立方体创建UI项
    /// </summary>
    private void CreateCubeUIItem(CubeFacesArrows cube)
    {
        if (statusPanelPrefab == null)
        {
            return;
        }

        GameObject panelObj = Instantiate(statusPanelPrefab, panelContainer);
        CubeUIItem item = panelObj.GetComponent<CubeUIItem>();

        if (item == null)
            item = panelObj.AddComponent<CubeUIItem>();

        // 初始化UI项
        item.Initialize(cube);

        // 添加到字典
        cubeUIItems[cube] = item;
    }

    /// <summary>
    /// 更新所有UI项
    /// </summary>
    private void UpdateAllUI()
    {
        foreach (var kvp in cubeUIItems)
        {
            if (kvp.Key != null && kvp.Value != null)
            {
                kvp.Value.UpdateDisplay();
            }
        }
    }

    /// <summary>
    /// 更新统计文本
    /// </summary>
    private void UpdateStatsText()
    {
        if (totalCubesText != null)
            totalCubesText.text = $"总立方体: {allCubes.Count}";

        int activeCount = 0;
        int movingCount = 0;
        int completedCount = 0;

        foreach (var cube in allCubes)
        {
            if (cube == null) continue;

            if (cube.IsMoving())
            {
                movingCount++;
                activeCount++;
            }
            else if (cube.GetRemainingSteps() > 0)
            {
                activeCount++;
            }
            else
            {
                completedCount++;
            }
        }

        if (activeCubesText != null)
            activeCubesText.text = $"激活中: {activeCount}";

        if (movingCubesText != null)
            movingCubesText.text = $"移动中: {movingCount}";

        if (completedCubesText != null)
            completedCubesText.text = $"已完成: {completedCount}";
    }

    /// <summary>
    /// 创建文本辅助方法
    /// </summary>
    private GameObject CreateText(Transform parent, string name, string defaultText)
    {
        GameObject textObj = new GameObject(name, typeof(RectTransform));
        textObj.transform.SetParent(parent, false);

        TextMeshProUGUI text = textObj.AddComponent<TextMeshProUGUI>();
        text.text = defaultText;
        text.fontSize = 18;
        text.alignment = TextAlignmentOptions.Left;

        RectTransform rect = text.GetComponent<RectTransform>();
        rect.sizeDelta = new Vector2(160, 30);

        return textObj;
    }

    /// <summary>
    /// 创建按钮辅助方法
    /// </summary>
    private GameObject CreateButton(Transform parent, string name, string buttonText)
    {
        GameObject btnObj = new GameObject(name, typeof(RectTransform));
        btnObj.transform.SetParent(parent, false);

        Button button = btnObj.AddComponent<Button>();

        // 创建按钮背景
        Image image = btnObj.AddComponent<Image>();
        image.color = new Color(0.2f, 0.2f, 0.2f);

        // 创建按钮文本
        GameObject textObj = new GameObject("Text", typeof(RectTransform));
        textObj.transform.SetParent(btnObj.transform, false);

        TextMeshProUGUI text = textObj.AddComponent<TextMeshProUGUI>();
        text.text = buttonText;
        text.fontSize = 16;
        text.alignment = TextAlignmentOptions.Center;
        text.color = Color.white;

        RectTransform textRect = text.GetComponent<RectTransform>();
        textRect.anchorMin = Vector2.zero;
        textRect.anchorMax = Vector2.one;
        textRect.sizeDelta = Vector2.zero;

        RectTransform btnRect = btnObj.GetComponent<RectTransform>();
        btnRect.sizeDelta = new Vector2(80, 30);

        return btnObj;
    }

    /// <summary>
    /// 刷新UI
    /// </summary>
    public void RefreshUI()
    {
        Debug.Log("刷新UI...");

        // 重新查找立方体
        FindAllCubesAndSaveStates();

        // 更新所有UI
        UpdateAllUI();
        UpdateStatsText();
    }

    // 重置所有立方体
    public void ResetAllCubes()
    {

        // 停止所有移动中的立方体并重置状态
        foreach (var cube in allCubes)
        {
            if (cube != null)
            {
                // 停止所有协程
                cube.StopAllCoroutines();

                // 重置移动状态
                cube.ResetMovementState();
            }
        }

        // 恢复初始位置和方向
        foreach (var state in initialStates)
        {
            if (state.cube != null)
            {
                // 恢复位置
                state.cube.transform.position = state.position;

                // 恢复方向
                state.cube.SetDirection(GetDirectionNumber(state.symbol));

                // 确保所有移动状态被重置
                state.cube.ResetMovementState();

                Debug.Log($"重置立方体 {state.cube.name} 到位置 {state.position}，方向 {state.symbol}");
            }
        }

        // 重置计时器
        ResetTimer();

        // 重新查找并更新UI
        FindAllCubesAndSaveStates();

        Debug.Log("重置完成！");
    }

    /// <summary>
    /// 转换所有立方体的方向
    /// </summary>
    public void TransformAllCubes()
    {
        Debug.Log("转换所有立方体的方向...");

        foreach (var cube in allCubes)
        {
            if (cube != null && !cube.IsMoving())
            {
                // 获取当前方向数字
                string currentSymbol = cube.GetArrowSymbol();
                int currentDir = GetDirectionNumber(currentSymbol);

                // 计算新方向（循环：1->2->3->4->1）
                int newDir = (currentDir % 4) + 1;

                // 设置新方向
                cube.SetDirection(newDir);

                Debug.Log($"立方体 {cube.name} 方向从 {currentSymbol} 转换为 {cube.GetArrowSymbol()}");
            }
        }

        // 更新UI显示
        UpdateAllUI();
        UpdateStatsText();
    }

    /// <summary>
    /// 将箭头符号转换为方向数字
    /// </summary>
    private int GetDirectionNumber(string symbol)
    {
        switch (symbol)
        {
            case "↑": return 1;
            case "↓": return 2;
            case "←": return 3;
            case "→": return 4;
            default: return 1;
        }
    }

    /// <summary>
    /// 单个立方体的UI项
    /// </summary>
    [System.Serializable]
    public class CubeUIItem : MonoBehaviour
    {
        public TextMeshProUGUI nameText;
        public TextMeshProUGUI directionText;
        public TextMeshProUGUI stepsText;
        public TextMeshProUGUI statusText;
        public Image statusImage;
        public Button selectButton;
        public Button transformButton;

        private CubeFacesArrows targetCube;

        public void Initialize(CubeFacesArrows cube)
        {
            targetCube = cube;

            // 如果没有Text组件，尝试获取或创建
            if (nameText == null)
                nameText = transform.Find("NameText")?.GetComponent<TextMeshProUGUI>();
            if (directionText == null)
                directionText = transform.Find("DirectionText")?.GetComponent<TextMeshProUGUI>();
            if (stepsText == null)
                stepsText = transform.Find("StepsText")?.GetComponent<TextMeshProUGUI>();
            if (statusText == null)
                statusText = transform.Find("StatusText")?.GetComponent<TextMeshProUGUI>();
            if (statusImage == null)
                statusImage = transform.Find("StatusImage")?.GetComponent<Image>();

            // 设置按钮事件
            if (selectButton != null)
                selectButton.onClick.AddListener(OnSelectCube);

            if (transformButton != null)
                transformButton.onClick.AddListener(OnTransformCube);

            // 初始更新
            UpdateDisplay();
        }

        public void UpdateDisplay()
        {
            if (targetCube == null) return;

            if (nameText != null)
                nameText.text = targetCube.name;

            if (directionText != null)
                directionText.text = $"方向: {targetCube.GetArrowSymbol()}";

            if (stepsText != null)
            {
                int remaining = targetCube.GetRemainingSteps();
                stepsText.text = remaining > 0 ? $"剩余: {remaining}格" : "等待点击";
            }

            if (statusText != null)
            {
                if (targetCube.IsMoving())
                {
                    statusText.text = "移动中";
                    statusText.color = Instance.movingColor;
                }
                else if (targetCube.GetRemainingSteps() > 0)
                {
                    statusText.text = "等待移动";
                    statusText.color = Instance.waitingColor;
                }
                else
                {
                    statusText.text = "已完成";
                    statusText.color = Instance.completedColor;
                }
            }

            if (statusImage != null)
            {
                if (targetCube.IsMoving())
                    statusImage.color = Instance.movingColor;
                else if (targetCube.GetRemainingSteps() > 0)
                    statusImage.color = Instance.waitingColor;
                else
                    statusImage.color = Instance.completedColor;
            }
        }

        private void OnSelectCube()
        {
            if (targetCube != null)
            {
                Debug.Log($"选中立方体: {targetCube.name}");
                // 可以添加相机聚焦等效果
            }
        }

        private void OnTransformCube()
        {
            if (targetCube != null && !targetCube.IsMoving())
            {
                // 循环改变方向
                string currentSymbol = targetCube.GetArrowSymbol();
                int currentDir = Instance.GetDirectionNumber(currentSymbol);
                int newDir = (currentDir % 4) + 1;

                targetCube.SetDirection(newDir);
                UpdateDisplay();

                Debug.Log($"转换立方体 {targetCube.name} 方向: {currentSymbol} -> {targetCube.GetArrowSymbol()}");
            }
        }
    }

    /// <summary>
    /// 立方体初始状态存储类
    /// </summary>
    [System.Serializable]
    public class CubeInitialState
    {
        public CubeFacesArrows cube;
        public Vector3 position;
        public Vector3 direction;
        public string symbol;
    }


    /// <summary>
    /// 启动计时器
    /// </summary>
    public void StartTimer()
    {
        isTimerRunning = true;
        startTime = Time.time - elapsedTime; // 如果有已用时间，继续累加
        Debug.Log("计时器启动");
    }

    /// <summary>
    /// 暂停计时器
    /// </summary>
    public void PauseTimer()
    {
        isTimerRunning = false;
        // 更新已用时间
        elapsedTime = Time.time - startTime;
        Debug.Log($"计时器暂停，当前时间: {FormatTime(elapsedTime)}");
    }

    /// <summary>
    /// 重置计时器
    /// </summary>
    public void ResetTimer()
    {
        elapsedTime = 0f;
        if (isTimerRunning)
        {
            startTime = Time.time;
        }
        UpdateTimeDisplay();
        Debug.Log("计时器重置");
    }

    /// <summary>
    /// 更新时间显示
    /// </summary>
    private void UpdateTimeDisplay()
    {
        if (elapsedTimeText != null)
        {
            float currentTime = GetElapsedTime();
            elapsedTimeText.text = $"时间: {FormatTime(currentTime)}";
        }
    }

    /// <summary>
    /// 获取当前已用时间
    /// </summary>
    public float GetElapsedTime()
    {
        if (isTimerRunning)
        {
            return Time.time - startTime;
        }
        return elapsedTime;
    }

    /// <summary>
    /// 格式化时间显示（MM:SS.ms）
    /// </summary>
    private string FormatTime(float timeInSeconds)
    {
        int minutes = Mathf.FloorToInt(timeInSeconds / 60f);
        int seconds = Mathf.FloorToInt(timeInSeconds % 60f);
        int milliseconds = Mathf.FloorToInt((timeInSeconds * 1000f) % 1000f);

        return string.Format("{0:00}:{1:00}.{2:000}", minutes, seconds, milliseconds);
    }

}