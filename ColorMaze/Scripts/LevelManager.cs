using UnityEngine;
using System.Collections.Generic;

public class LevelData
{
    public int levelNumber;
    public string levelName;
    public int[,] mazeData;
    public int startX;
    public int startY;
    public Vector2 mazePosition;
}

public class LevelManager : MonoBehaviour
{
    public static LevelManager Instance { get; private set; }

    [Header("Level Settings")]
    [SerializeField] private Vector2 level1Position = new Vector2(0, 0);
    [SerializeField] private Vector2 level2Position = new Vector2(0, 0);
    [SerializeField] private Vector2 level3Position = new Vector2(0, 0);

    private List<LevelData> levels;
    private int currentLevelIndex;

    void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
            InitializeLevels();
        }
        else
        {
            Destroy(gameObject);
        }
    }

    private void InitializeLevels()
    {
        levels = new List<LevelData>();

        LevelData level1 = new LevelData
        {
            levelNumber = 1,
            levelName = "简单迷宫",
            startX = 1,
            startY = 1,
            mazePosition = level1Position,
            mazeData = new int[,]
            {
                {1,1,1,1,1,1},
                {1,0,0,0,0,1},
                {1,0,1,1,0,1},
                {1,0,0,0,0,1},
                {1,0,1,1,0,1},
                {1,0,0,0,0,1},
                {1,0,0,0,0,1},
                {1,1,1,1,1,1}
            }
        };
        levels.Add(level1);

        LevelData level2 = new LevelData
        {
            levelNumber = 2,
            levelName = "中等迷宫",
            startX = 1,
            startY = 1,
            mazePosition = level2Position,
            mazeData = new int[,]
            {
                {1,1,1,1,1,1,1,1},
                {1,0,0,0,1,0,0,1},
                {1,0,1,0,1,0,1,1},
                {1,0,1,0,0,0,0,1},
                {1,0,1,1,1,1,0,1},
                {1,0,0,0,0,0,0,1},
                {1,1,1,0,1,1,0,1},
                {1,0,0,0,1,0,0,1},
                {1,0,1,1,1,0,0,1},
                {1,1,1,1,1,1,1,1}
            }
        };
        levels.Add(level2);

        LevelData level3 = new LevelData
        {
            levelNumber = 3,
            levelName = "困难迷宫",
            startX = 1,
            startY = 1,
            mazePosition = level3Position,
            mazeData = new int[,]
            {
                {1,1,1,1,1,1,1,1,1,1},
                {1,0,0,0,0,0,1,0,0,1},
                {1,0,1,1,1,0,1,0,1,1},
                {1,0,1,0,0,0,0,0,0,1},
                {1,0,1,0,1,1,1,1,0,1},
                {1,0,0,0,1,0,0,0,0,1},
                {1,1,1,0,1,0,1,1,1,1},
                {1,0,0,0,0,0,0,0,0,1},
                {1,0,1,1,1,1,1,1,0,1},
                {1,0,0,0,0,0,0,0,0,1},
                {1,1,1,1,1,1,1,1,1,1}
            }
        };
        levels.Add(level3);
    }

    public LevelData GetLevel(int levelNumber)
    {
        if (levelNumber < 1 || levelNumber > levels.Count)
        {
            return levels[0];
        }
        return levels[levelNumber - 1];
    }

    public int GetTotalLevels()
    {
        return levels.Count;
    }

    public void SetCurrentLevel(int level)
    {
        currentLevelIndex = level - 1;
    }

    public LevelData GetCurrentLevel()
    {
        return levels[currentLevelIndex];
    }

    public float GetBestTime(int level)
    {
        return DataManager.Instance.GetBestTime(level);
    }
}
