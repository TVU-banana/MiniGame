using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;
using UnityEngine.UI;
using UnityEngine.SceneManagement;
public class GameManager : MonoBehaviour
{
    public static GameManager instance;

    [Header("UI配置")]
    public TMP_Text scoreText; // 拖入右上角的分数文本（TextMeshPro）
    // 旧版Unity用：public Text scoreText;

    [Header("失败界面")]
    public GameObject gameOverPanel; // 拖入你的失败界面Panel

    private int currentScore = 0; // 当前分数

    void Awake()
    {
        // 确保全局只有一个GameManager
        if (instance == null)
            instance
= this;
        else
            Destroy(gameObject);
    }

    void Start()
    {
        // 初始化：隐藏失败界面，显示初始分数
        if (gameOverPanel != null)
            gameOverPanel
.SetActive(false);
        UpdateScoreUI();
        Debug
.Log($"【游戏初始化】初始分数：{currentScore}");
    }

    /// <summary>
    /// 分数增减（吸附+5，脱落-10）
    /// </summary>
    public void AddScore(int value)
    {
        currentScore
+= value;
        // 防止分数为负数（可选）
        currentScore
= Mathf.Max(0, currentScore);
        UpdateScoreUI();
        string sign = value > 0 ? "+" : "";
        Debug
        .Log($"【分数更新】{sign}{value}分 → 当前分数：{currentScore}");
    }
    /// <summary>
    /// 获取当前分数（给其他脚本调用）
    /// </summary>
    public int GetScore()
    {
        return currentScore;
    }

    /// <summary>
    /// 实时更新右上角分数显示
    /// </summary>
    void UpdateScoreUI()
    {
        if (scoreText != null)
            scoreText
.text = $"分数：{currentScore}";
        else
            Debug
.LogWarning("【UI警告】未绑定分数文本组件！");
    }

    /// <summary>
    /// 游戏失败（被大型陨石击中）
    /// </summary>
    public void GameOver()
    {
        Time
.timeScale = 0; // 暂停游戏
        if (gameOverPanel != null)
            gameOverPanel
.SetActive(true);
        Debug
.Log($"【游戏结束】最终分数：{currentScore}");
    }

    /// <summary>
    /// 重启游戏（给失败界面按钮绑定）
    /// </summary>
    public void RestartGame()
    {
        Time
.timeScale = 1; // 恢复游戏速度
        SceneManager
.LoadScene(SceneManager.GetActiveScene().name); // 重新加载当前场景
    }
}
