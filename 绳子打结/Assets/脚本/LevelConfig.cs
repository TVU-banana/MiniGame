using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Collections.Generic;
[System.Serializable]
public class RopeSetup
{
    public Vector2Int end1GridPos; // (列, 行)
    public Vector2Int end2GridPos;
    public Color ropeColor;
}

[System.Serializable]
public class LevelData
{
    public int levelId;
    public float timeLimit;
    public List<RopeSetup> ropeSetups = new List<RopeSetup>();
}
public class LevelConfig : MonoBehaviour
{
    public static LevelConfig Instance;
    public List<LevelData> allLevels = new List<LevelData>();

    void Awake()
    {
        Instance = this;
        InitLevels();
    }

    // 初始化所有关卡数据
    private void InitLevels()
    {
        // 第1关（红绿交叉）
        allLevels.Add(new LevelData
        {
            levelId = 1,
            timeLimit = 300f,
            ropeSetups = new List<RopeSetup>
            {
                new RopeSetup { end1GridPos = new Vector2Int(2,2), end2GridPos = new Vector2Int(2,5), ropeColor = Color.green },
                new RopeSetup { end1GridPos = new Vector2Int(3,2), end2GridPos = new Vector2Int(3,5), ropeColor = Color.red }
            }
        });

        // 第2关（红绿扭结）
        allLevels.Add(new LevelData
        {
            levelId = 2,
            timeLimit = 300f,
            ropeSetups = new List<RopeSetup>
            {
                new RopeSetup { end1GridPos = new Vector2Int(2,2), end2GridPos = new Vector2Int(2,5), ropeColor = Color.green },
                new RopeSetup { end1GridPos = new Vector2Int(3,2), end2GridPos = new Vector2Int(3,5), ropeColor = Color.red }
            }
        });

        // 第3关（红绿黄+水平绿）
        allLevels.Add(new LevelData
        {
            levelId = 3,
            timeLimit = 300f,
            ropeSetups = new List<RopeSetup>
            {
                new RopeSetup { end1GridPos = new Vector2Int(3,2), end2GridPos = new Vector2Int(3,5), ropeColor = Color.red },
                new RopeSetup { end1GridPos = new Vector2Int(3,2), end2GridPos = new Vector2Int(2,5), ropeColor = Color.yellow },
                new RopeSetup { end1GridPos = new Vector2Int(1,3), end2GridPos = new Vector2Int(4,3), ropeColor = Color.green }
            }
        });

        // 后续关卡可继续添加...
    }
    // Start is called before the first frame update
    void Start()
    {
        
    }

    // Update is called once per frame
    void Update()
    {
        
    }
}
