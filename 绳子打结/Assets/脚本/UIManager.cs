using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;
using UnityEngine.UI;

public class UIManager : MonoBehaviour
{
    public static UIManager Instance { get; private set; }

    [Header("提示弹窗")]
    public GameObject noticePanel;
    public TextMeshProUGUI noticeText;
    public float noticeShowTime = 2f;

    [Header("胜利面板")]
    public GameObject victoryPanel;
    public TextMeshProUGUI victoryTitleText;
    public TextMeshProUGUI victoryDescText;
    public Button nextLevelButton;

    [Header("失败面板")]
    public GameObject defeatPanel;
    public TextMeshProUGUI defeatTitleText;
    public TextMeshProUGUI defeatDescText;
    public Button restartLevelButton;

    [Header("游戏结束面板")]
    public GameObject gameOverPanel;
    public TextMeshProUGUI gameOverTitleText;
    public TextMeshProUGUI gameOverDescText;
    public Button restartGameButton;

    [Header("基础信息文本（可选）")]
    public TextMeshProUGUI levelText;    // 显示当前关卡
    public TextMeshProUGUI timerText;    // 显示计时
    public TextMeshProUGUI coinHealthText; // 显示金币/生命值

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance
= this;
        InitAllPanels();
    }

    // 初始化所有面板为隐藏状态
    private void InitAllPanels()
    {
        // 提示面板
        if (noticePanel != null) noticePanel.SetActive(false);
        if (noticeText != null) noticeText.text = "";

        // 胜利面板（核心修复：方法名改为 OnNextLevelClick）
        if (victoryPanel != null) victoryPanel.SetActive(false);
        if (nextLevelButton != null)
        {
            nextLevelButton
        .onClick.RemoveAllListeners(); // 先清空所有旧监听
            nextLevelButton
        .onClick.AddListener(() =>
        {
            Debug
.Log("[日志] UIManager 触发 OnNextLevelClick（仅一次）");
            RopeManager
.Instance.OnNextLevelClick();
        });
        }

        // 失败面板
        if (defeatPanel != null) defeatPanel.SetActive(false);
        if (restartLevelButton != null)
            restartLevelButton
.onClick.AddListener(() => RopeManager.Instance.ResetCurrentLevel());

        // 游戏结束面板
        if (gameOverPanel != null) gameOverPanel.SetActive(false);
        if (restartGameButton != null)
            restartGameButton
.onClick.AddListener(() => RopeManager.Instance.LoadLevel(1));
    }

    // 显示提示弹窗
    public void ShowNotice(string message)
    {
        if (noticePanel == null || noticeText == null) return;
        noticeText
.text = message;
        noticePanel
.SetActive(true);
        StopAllCoroutines();
        StartCoroutine(HideNoticeAfterDelay(noticeShowTime));
    }

    // 显示胜利面板
    public void ShowVictoryPanel(int levelId, bool hasNextLevel)
    {
        if (victoryPanel == null) return;
        victoryPanel
.SetActive(true);
        if (victoryTitleText != null) victoryTitleText.text = $"恭喜通关第 {levelId} 关！";
        if (victoryDescText != null) victoryDescText.text = hasNextLevel ? "点击下一关继续挑战！" : "你已通关所有关卡！";
        if (nextLevelButton != null) nextLevelButton.gameObject.SetActive(hasNextLevel);
    }

    // 显示失败面板
    public void ShowDefeatPanel()
    {
        if (defeatPanel == null) return;
        defeatPanel
.SetActive(true);
        if (defeatTitleText != null) defeatTitleText.text = "还有绳子打结！";
        if (defeatDescText != null) defeatDescText.text = "点击重新开始，再试一次吧！";
    }

    // 显示游戏结束面板
    public void ShowGameOverPanel()
    {
        if (gameOverPanel == null) return;
        gameOverPanel
.SetActive(true);
        if (gameOverTitleText != null) gameOverTitleText.text = "恭喜通关全部关卡！";
        if (gameOverDescText != null) gameOverDescText.text = "你太棒了！点击重新开始游戏吧！";
    }

    // 更新基础信息文本
    public void UpdateLevelText(int levelId) { if (levelText != null) levelText.text = $"关卡 {levelId}"; }
    public void UpdateTimerText(string time) { if (timerText != null) timerText.text = time; }
    public void UpdateCoinHealthText(string text) { if (coinHealthText != null) coinHealthText.text = text; }

    // 隐藏指定面板
    public void HidePanel(GameObject panel) { if (panel != null) panel.SetActive(false); }

    private IEnumerator HideNoticeAfterDelay(float delayTime)
    {
        yield return new WaitForSeconds(delayTime);
        if (noticePanel != null) noticePanel.SetActive(false);
        if (noticeText != null) noticeText.text = "";
    }
}