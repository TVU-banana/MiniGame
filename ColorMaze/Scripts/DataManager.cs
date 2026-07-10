using UnityEngine;

public class DataManager : MonoBehaviour
{
    private static DataManager _instance;
    public static DataManager Instance
    {
        get
        {
            if (_instance == null)
            {
                _instance = FindObjectOfType<DataManager>();
                if (_instance == null)
                {
                    GameObject go = new GameObject("DataManager");
                    _instance = go.AddComponent<DataManager>();
                }
            }
            return _instance;
        }
    }

    private const string BEST_TIME_LEVEL1 = "BestTime_Level1";
    private const string BEST_TIME_LEVEL2 = "BestTime_Level2";
    private const string BEST_TIME_LEVEL3 = "BestTime_Level3";

    void Awake()
    {
        if (_instance == null)
        {
            _instance = this;
            DontDestroyOnLoad(gameObject);
        }
        else if (_instance != this)
        {
            Destroy(gameObject);
        }
    }

    public void SaveBestTime(int level, float time)
    {
        string key = GetBestTimeKey(level);
        float currentBest = GetBestTime(level);
        if (time < currentBest || currentBest == 0)
        {
            PlayerPrefs.SetFloat(key, time);
            PlayerPrefs.Save();
        }
    }

    public float GetBestTime(int level)
    {
        string key = GetBestTimeKey(level);
        return PlayerPrefs.GetFloat(key, 0);
    }

    private string GetBestTimeKey(int level)
    {
        return level switch
        {
            1 => BEST_TIME_LEVEL1,
            2 => BEST_TIME_LEVEL2,
            3 => BEST_TIME_LEVEL3,
            _ => BEST_TIME_LEVEL1
        };
    }

    public string FormatTime(float time)
    {
        int minutes = Mathf.FloorToInt(time / 60);
        int seconds = Mathf.FloorToInt(time % 60);
        return $"{minutes:D2}:{seconds:D2}";
    }
}
