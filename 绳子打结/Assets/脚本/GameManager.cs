using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;
using System.Collections;
public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    // 游戏核心数据
    [Header("游戏参数")]
    public int maxHealth = 5;       // 最大生命值
    public int currentHealth;       // 当前生命值
    public int currentCoin = 0;     // 当前金币（初始0）
    public int currentLevel = 1;    // 当前关卡（初始1）
    public float levelTime = 20f;   // 每关20秒
    private float currentTimer;     // 剩余时间
    private bool isGameOver = false;// 游戏是否结束

    // UI文本引用（只拖对象，不写文字）
    [Header("顶部状态栏文本")]
    public TextMeshProUGUI levelText;       // 左上角：关卡X
    public TextMeshProUGUI timerText;       // 顶部中央：倒计时
    public TextMeshProUGUI coinHealthText;  // 右上角：金币+生命值

    [Header("胜利弹窗文本")]
    public TextMeshProUGUI victoryTitleText;// 胜利标题
    public TextMeshProUGUI victoryDescText; // 胜利描述（金币变化）
    public TextMeshProUGUI nextLevelBtnText;// “下一关”按钮文字

    [Header("失败弹窗文本")]
    public TextMeshProUGUI defeatTitleText; // 失败标题
    public TextMeshProUGUI defeatDescText;  // 失败描述（生命值变化）
    public TextMeshProUGUI restartLevelBtnText; // “重玩本关”按钮文字

    [Header("游戏结束弹窗文本")]
    public TextMeshProUGUI gameOverTitleText;// 游戏结束标题
    public TextMeshProUGUI gameOverDescText; // 游戏结束描述（最终金币）
    public TextMeshProUGUI restartGameBtnText;// “重新开始”按钮文字

    // 弹窗对象
    [Header("弹窗对象")]
    public GameObject victoryPanel;
    public GameObject defeatPanel;
    public GameObject gameOverPanel;

    // 音效
    [Header("音效")]
    public AudioSource audioSource;
    public AudioClip clickSound;
    public AudioClip victorySound;
    public AudioClip defeatSound;

    private void Awake()
    {
        // 单例初始化
        if (Instance != null && Instance != this)
            Destroy(gameObject);
        else
            Instance
= this;

        // 初始化数据
        currentHealth
= maxHealth;
        currentTimer
= levelTime;
    }

    private void Start()
    {
        // 第一步：初始化所有UI文字（纯代码赋值，编辑器留空）
        InitAllStaticUIText();
        // 第二步：更新动态文字（关卡、倒计时、金币）
        UpdateAllDynamicUIText();
        // 加载第一关绳子
        if (RopeManager.Instance != null)
            RopeManager
.Instance.LoadLevel(currentLevel);
    }

    private void Update()
    {
        if (isGameOver) return;

        // 20秒倒计时逻辑
        currentTimer
-= Time.deltaTime;
        // 实时更新倒计时文字
        UpdateTimerText();

        // 时间到，触发失败
        if (currentTimer <= 0f)
        {
            currentTimer
= 0f;
            UpdateTimerText();
            LevelFailed();
        }
    }

    #region 核心：初始化所有静态文字（游戏启动只执行一次）
    private void InitAllStaticUIText()
    {
        // 1. 胜利弹窗静态文字
        victoryTitleText
.text = "通关成功！";       // 标题
        nextLevelBtnText
.text = "下一关";           // 按钮文字

        // 2. 失败弹窗静态文字
        defeatTitleText
.text = "挑战失败";          // 标题
        restartLevelBtnText
.text = "重玩本关";      // 按钮文字

        // 3. 游戏结束弹窗静态文字
        gameOverTitleText
.text = "游戏结束";        // 标题
        restartGameBtnText
.text = "重新开始";       // 按钮文字

        // 4. 初始清空动态文字（避免残留）
        levelText
.text = "";
        timerText
.text = "";
        coinHealthText
.text = "";
        victoryDescText
.text = "";
        defeatDescText
.text = "";
        gameOverDescText
.text = "";
    }
    #endregion

    #region 核心：更新所有动态文字（数据变化时调用）
    public void UpdateAllDynamicUIText()
    {
        UpdateLevelText();       // 更新关卡文字
        UpdateTimerText();       // 更新倒计时文字
        UpdateCoinHealthText();  // 更新金币+生命值文字
        UpdatePopupDescText();   // 更新弹窗描述文字
    }

    // 1. 更新左上角关卡文字（如：关卡 1）
    private void UpdateLevelText()
    {
        levelText
.text = $"关卡 {currentLevel}";
    }

    // 2. 更新顶部中央倒计时文字（如：20 → 19 → 00）
    private void UpdateTimerText()
    {
        int seconds = Mathf.CeilToInt(currentTimer);
        timerText
.text = $"{seconds:00}"; // 补零格式：01、02...20
    }

    // 3. 更新右上角金币+生命值文字（如：💰 0 | ❤️ 5/5）
    private void UpdateCoinHealthText()
    {
        coinHealthText
.text = $"💰 {currentCoin} | ❤️ {currentHealth}/{maxHealth}";
    }

    // 4. 更新弹窗描述文字（动态数据：金币、生命值）
    private void UpdatePopupDescText()
    {
        // 胜利描述：通关奖励5金币
        victoryDescText
.text = $"获得 5 枚金币\n当前金币：{currentCoin + 5}";
        // 失败描述：扣1生命值
        defeatDescText
.text = $"生命值 -1\n剩余生命值：{Mathf.Max(currentHealth - 1, 0)}";
        // 游戏结束描述：最终金币
        gameOverDescText
.text = $"最终金币：{currentCoin}\n是否重新开始？";
    }
    #endregion

    #region 游戏逻辑：胜利/失败/关卡切换
    // 播放点击音效（拖拽端点时调用）
    public void PlayClickSound()
    {
        audioSource
.PlayOneShot(clickSound);
    }

    // 关卡胜利
    public void LevelVictory()
    {
        isGameOver
= true;
        currentCoin
+= 5; // 奖励5金币
        UpdateAllDynamicUIText(); // 更新所有动态文字
        audioSource
.PlayOneShot(victorySound);
        victoryPanel
.SetActive(true); // 显示胜利弹窗
    }

    // 关卡失败
    public void LevelFailed()
    {
        isGameOver
= true;
        currentHealth
--; // 扣1生命值
        UpdateAllDynamicUIText(); // 更新所有动态文字
        audioSource
.PlayOneShot(defeatSound);

        if (currentHealth <= 0)
            gameOverPanel
.SetActive(true); // 生命值耗尽→游戏结束
        else
            defeatPanel
.SetActive(true);   // 本关失败
    }

    // 下一关（按钮点击调用）
    public void NextLevel()
    {
        currentLevel
++;
        currentTimer
= levelTime;
        isGameOver
= false;
        UpdateAllDynamicUIText(); // 更新关卡/倒计时
        victoryPanel
.SetActive(false); // 隐藏胜利弹窗
        RopeManager
.Instance.LoadLevel(currentLevel); // 加载新关卡
    }

    // 重玩本关（按钮点击调用）
    public void RestartLevel()
    {
        currentTimer
= levelTime;
        isGameOver
= false;
        UpdateAllDynamicUIText(); // 更新倒计时
        defeatPanel
.SetActive(false); // 隐藏失败弹窗
        RopeManager
.Instance.ResetCurrentLevel(); // 重置绳子
    }

    // 重新开始游戏（按钮点击调用）
    public void RestartGame()
    {
        currentLevel
= 1;
        currentHealth
= maxHealth;
        currentCoin
= 0;
        currentTimer
= levelTime;
        isGameOver
= false;
        UpdateAllDynamicUIText(); // 重置所有动态文字
        gameOverPanel
.SetActive(false); // 隐藏游戏结束弹窗
        RopeManager
.Instance.LoadLevel(1); // 重新加载第一关
    }
    #endregion
}
