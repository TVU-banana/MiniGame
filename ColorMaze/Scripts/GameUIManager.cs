using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class GameUIManager : MonoBehaviour
{
    public static GameUIManager Instance { get; private set; }

    [Header("Game HUD")]
    [SerializeField] private TextMeshProUGUI progressText;
    [SerializeField] private TextMeshProUGUI timerText;
    [SerializeField] private TextMeshProUGUI stepText;
    [SerializeField] private Button pauseButton;
    [SerializeField] private Button restartButton;
    [SerializeField] private Button exitButton;

    [Header("Pause Panel")]
    [SerializeField] private GameObject pausePanel;
    [SerializeField] private Button resumeButton;
    [SerializeField] private Button pauseRestartButton;
    [SerializeField] private Button pauseExitButton;

    [Header("Win Panel")]
    [SerializeField] private GameObject winPanel;
    [SerializeField] private TextMeshProUGUI winTimeText;
    [SerializeField] private TextMeshProUGUI bestTimeText;
    [SerializeField] private Button nextLevelButton;
    [SerializeField] private Button winRestartButton;
    [SerializeField] private Button winExitButton;

    [Header("Settings")]
    [SerializeField] private string mainSceneName = "Main";

    private bool isPaused = false;
    private float gameTime = 0;
    private bool isTiming = false;

    void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
    }

    void Start()
    {
        SetupButtons();
    }

    void SetupButtons()
    {
        AddButton(pauseButton, OnPauseClick);
        AddButton(restartButton, OnRestartClick);
        AddButton(exitButton, OnExitClick);
        AddButton(resumeButton, OnResumeClick);
        AddButton(pauseRestartButton, OnRestartClick);
        AddButton(pauseExitButton, OnExitClick);
        AddButton(nextLevelButton, OnNextLevelClick);
        AddButton(winRestartButton, OnRestartClick);
        AddButton(winExitButton, OnExitClick);
    }

    void AddButton(Button btn, UnityEngine.Events.UnityAction action)
    {
        if (btn != null)
        {
            btn.onClick.RemoveAllListeners();
            btn.onClick.AddListener(action);
        }
    }

    public void ShowGameUI()
    {
        SetHUDElements(true);
        HideAllPanels();
    }

    void HideAllPanels()
    {
        if (pausePanel) pausePanel.SetActive(false);
        if (winPanel) winPanel.SetActive(false);
    }

    void SetHUDElements(bool active)
    {
        if (progressText && progressText.gameObject) progressText.gameObject.SetActive(active);
        if (timerText && timerText.gameObject) timerText.gameObject.SetActive(active);
        if (stepText && stepText.gameObject) stepText.gameObject.SetActive(active);
        if (pauseButton && pauseButton.gameObject) pauseButton.gameObject.SetActive(active);
        if (restartButton && restartButton.gameObject) restartButton.gameObject.SetActive(active);
        if (exitButton && exitButton.gameObject) exitButton.gameObject.SetActive(active);
    }

    public void StartGame()
    {
        ShowGameUI();
        StartTimer();
        UpdateProgressDisplay(0);
    }

    public void UpdateProgressDisplay(float progress)
    {
        if (progressText) progressText.text = $"进度: {progress:F0}%";
    }

    public void UpdateStepDisplay(int steps)
    {
        if (stepText) stepText.text = $"步长: {steps}";
    }

    void UpdateTimerDisplay()
    {
        if (timerText)
        {
            int min = Mathf.FloorToInt(gameTime / 60);
            int sec = Mathf.FloorToInt(gameTime % 60);
            timerText.text = $"时间: {min:D2}:{sec:D2}";
        }
    }

    public void StartTimer()
    {
        gameTime = 0;
        isTiming = true;
        isPaused = false;
        UpdateTimerDisplay();
    }

    public void PauseTimer() => isPaused = true;
    public void ResumeTimer() => isPaused = false;

    public void OnPauseClick()
    {
        PauseTimer();
        if (InputManager.Instance != null) InputManager.Instance.DisableSwipe();
        if (pausePanel) pausePanel.SetActive(true);
    }

    public void OnResumeClick()
    {
        ResumeTimer();
        if (InputManager.Instance != null) InputManager.Instance.EnableSwipe();
        if (pausePanel) pausePanel.SetActive(false);
    }

    public void OnRestartClick()
    {
        UnityEngine.SceneManagement.SceneManager.LoadScene(UnityEngine.SceneManagement.SceneManager.GetActiveScene().name);
    }

    public void OnExitClick()
    {
        UnityEngine.SceneManagement.SceneManager.LoadScene(mainSceneName);
    }

    public void OnNextLevelClick()
    {
        int current = LevelManager.Instance?.GetCurrentLevel()?.levelNumber ?? 1;
        int next = current + 1;
        if (next > 3) next = 1;
        if (GameManager.Instance != null) GameManager.Instance.StartLevel(next);
    }

    public void ShowWinScreen()
    {
        isTiming = false;

        int currentLevel = LevelManager.Instance?.GetCurrentLevel()?.levelNumber ?? 1;
        float currentTime = gameTime;
        float bestTime = currentTime;

        if (DataManager.Instance != null)
        {
            bestTime = DataManager.Instance.GetBestTime(currentLevel);
            if (bestTime == 0 || currentTime < bestTime)
            {
                DataManager.Instance.SaveBestTime(currentLevel, currentTime);
                bestTime = currentTime;
            }
        }

        if (winTimeText)
        {
            int min = Mathf.FloorToInt(currentTime / 60);
            int sec = Mathf.FloorToInt(currentTime % 60);
            winTimeText.text = $"通关时间: {min:D2}:{sec:D2}";
        }
        if (bestTimeText)
        {
            int min = Mathf.FloorToInt(bestTime / 60);
            int sec = Mathf.FloorToInt(bestTime % 60);
            bestTimeText.text = $"最佳时间: {min:D2}:{sec:D2}";
        }
        if (nextLevelButton) nextLevelButton.gameObject.SetActive(currentLevel < 3);
        if (winPanel) winPanel.SetActive(true);
    }

    public void HidePausePanel() { if (pausePanel) pausePanel.SetActive(false); }
    public void HideWinPanel() { if (winPanel) winPanel.SetActive(false); }

    void Update()
    {
        if (isTiming && !isPaused)
        {
            gameTime += Time.deltaTime;
            UpdateTimerDisplay();
        }
    }
}
