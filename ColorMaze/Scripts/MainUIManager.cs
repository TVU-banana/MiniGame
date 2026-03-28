using UnityEngine;
using UnityEngine.UI;
using TMPro;
using UnityEngine.SceneManagement;

public class MainUIManager : MonoBehaviour
{
    public static MainUIManager Instance { get; private set; }

    [Header("UI References")]
    [SerializeField] private GameObject mainMenuPanel;
    [SerializeField] private Button startButton;
    [SerializeField] private Button level1Button;
    [SerializeField] private Button level2Button;
    [SerializeField] private Button level3Button;

    [Header("Settings")]
    [SerializeField] private string gameSceneName = "Game";

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
        ShowMainMenu();
    }

    void SetupButtons()
    {
        AddButton(startButton, OnStartGame);
        AddButton(level1Button, () => LoadLevel(1));
        AddButton(level2Button, () => LoadLevel(2));
        AddButton(level3Button, () => LoadLevel(3));
    }

    void AddButton(Button btn, UnityEngine.Events.UnityAction action)
    {
        if (btn != null)
        {
            btn.onClick.RemoveAllListeners();
            btn.onClick.AddListener(action);
        }
    }

    public void ShowMainMenu()
    {
        if (mainMenuPanel) mainMenuPanel.SetActive(true);
    }

    void OnStartGame()
    {
        LoadLevel(1);
    }

    void LoadLevel(int level)
    {
        PlayerPrefs.SetInt("LastLevel", level);
        PlayerPrefs.Save();
        SceneManager.LoadScene(gameSceneName);
    }
}
