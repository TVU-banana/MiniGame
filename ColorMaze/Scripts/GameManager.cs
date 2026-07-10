using UnityEngine;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    [Header("References - 拖入或留空自动查找")]
    [SerializeField] private MazeManager mazeManager;
    [SerializeField] private PlayerController playerController;
    [SerializeField] private GameUIManager uiManager;
    [SerializeField] private GameObject playerPrefab;

    private int currentLevel;
    private LevelData currentLevelData;

    void Awake()
    {
        Instance = this;
    }

    void Start()
    {
        EnsureAllManagers();
        FindManagers();
        StartLevel(1);
    }

    void EnsureAllManagers()
    {
        Debug.Log("=== Auto creating managers ===");
        
        if (FindObjectOfType<DataManager>() == null)
        {
            new GameObject("DataManager").AddComponent<DataManager>();
        }
        if (FindObjectOfType<LevelManager>() == null)
        {
            new GameObject("LevelManager").AddComponent<LevelManager>();
        }
        if (FindObjectOfType<MazeManager>() == null)
        {
            new GameObject("MazeManager").AddComponent<MazeManager>();
        }
        if (FindObjectOfType<InputManager>() == null)
        {
            new GameObject("InputManager").AddComponent<InputManager>();
        }
        if (FindObjectOfType<SoundManager>() == null)
        {
            new GameObject("SoundManager").AddComponent<SoundManager>();
        }
        if (FindObjectOfType<GameUIManager>() == null)
        {
            new GameObject("GameUIManager").AddComponent<GameUIManager>();
        }
        
        GameObject player = GameObject.Find("Player");
        if (player == null)
        {
            if (playerPrefab != null)
            {
                player = Instantiate(playerPrefab);
            }
            else
            {
                player = new GameObject("Player");
                player.AddComponent<SpriteRenderer>();
            }
        }
        if (player.GetComponent<PlayerController>() == null)
        {
            player.AddComponent<PlayerController>();
        }
        
        Debug.Log("=== Managers ready ===");
    }

    void FindManagers()
    {
        mazeManager = FindObjectOfType<MazeManager>();
        uiManager = FindObjectOfType<GameUIManager>();
        playerController = FindObjectOfType<PlayerController>();

        Debug.Log($"GameManager: MazeManager={mazeManager}, GameUIManager={uiManager}, Player={playerController}");

        if (mazeManager != null)
        {
            mazeManager.OnAllCellsColored += OnLevelComplete;
        }
    }

    public void StartLevel(int levelNum)
    {
        Debug.Log("GameManager.StartLevel: " + levelNum);
        currentLevel = levelNum;
        currentLevelData = LevelManager.Instance.GetLevel(levelNum);

        if (mazeManager == null)
        {
            Debug.LogError("MazeManager is null!");
            return;
        }

        mazeManager.GenerateMaze(currentLevelData.mazeData, currentLevelData.mazePosition);

        if (playerController == null)
        {
            Debug.LogError("PlayerController is null!");
            return;
        }

        playerController.Initialize(currentLevelData.startX, currentLevelData.startY);

        if (uiManager != null)
        {
            uiManager.StartGame();
            uiManager.HidePausePanel();
            uiManager.HideWinPanel();
        }
    }

    public void RestartLevel()
    {
        Debug.Log("GameManager.RestartLevel");
        if (mazeManager != null) mazeManager.ResetMaze();
        if (playerController != null && currentLevelData != null)
            playerController.ResetPosition(currentLevelData.startX, currentLevelData.startY);
        if (uiManager != null)
        {
            uiManager.StartGame();
            uiManager.HidePausePanel();
            uiManager.HideWinPanel();
        }
    }

    private void OnLevelComplete()
    {
        Debug.Log("Level Complete!");
        if (uiManager != null)
        {
            uiManager.UpdateProgressDisplay(100f);
            Invoke(nameof(ShowWinScreen), 0.5f);
        }
    }

    private void ShowWinScreen()
    {
        if (uiManager != null) uiManager.ShowWinScreen();
    }

    public int GetCurrentLevel() => currentLevel;

    void OnDestroy()
    {
        if (mazeManager != null)
        {
            mazeManager.OnAllCellsColored -= OnLevelComplete;
        }
    }
}