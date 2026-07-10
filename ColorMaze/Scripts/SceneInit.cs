using UnityEngine;

public class SceneInit : MonoBehaviour
{
    [SerializeField] private GameObject playerPrefab;
    private bool initialized = false;

    void Awake()
    {
        Debug.Log("SceneInit Awake");
    }

    void Start()
    {
        if (initialized) return;
        initialized = true;
        
        CreateManagers();
        
        string sceneName = UnityEngine.SceneManagement.SceneManager.GetActiveScene().name;
        Debug.Log("Scene: " + sceneName);
        
        if (sceneName == "Game")
        {
            EnsurePlayer();
            Invoke("StartGame", 0.1f);
        }
    }

    void StartGame()
    {
        if (GameManager.Instance != null)
        {
            int level = PlayerPrefs.GetInt("LastLevel", 1);
            GameManager.Instance.StartLevel(level);
            Debug.Log("Game started, level: " + level);
        }
        else
        {
            Debug.LogError("GameManager is null!");
        }
    }

    void CreateManagers()
    {
        Debug.Log("Creating Managers...");
        
        if (FindObjectOfType<DataManager>() == null)
        {
            CreateManager<DataManager>("DataManager");
        }

        if (FindObjectOfType<LevelManager>() == null)
        {
            CreateManager<LevelManager>("LevelManager");
        }

        if (FindObjectOfType<MazeManager>() == null)
        {
            CreateManager<MazeManager>("MazeManager");
        }

        if (FindObjectOfType<InputManager>() == null)
        {
            CreateManager<InputManager>("InputManager");
        }

        if (FindObjectOfType<SoundManager>() == null)
        {
            CreateManager<SoundManager>("SoundManager");
        }

        string sceneName = UnityEngine.SceneManagement.SceneManager.GetActiveScene().name;
        if (sceneName == "Main")
        {
            if (FindObjectOfType<MainUIManager>() == null)
            {
                CreateManager<MainUIManager>("MainUIManager");
            }
        }
        else if (sceneName == "Game")
        {
            if (FindObjectOfType<GameUIManager>() == null)
            {
                CreateManager<GameUIManager>("GameUIManager");
            }
        }

        if (FindObjectOfType<GameManager>() == null)
        {
            CreateManager<GameManager>("GameManager");
        }
        
        Debug.Log("All managers created");
    }

    void CreateManager<T>(string name) where T : MonoBehaviour
    {
        GameObject go = new GameObject(name);
        go.AddComponent<T>();
        Debug.Log(name + " created");
    }

    void EnsurePlayer()
    {
        GameObject existingPlayer = GameObject.Find("Player");
        if (existingPlayer == null)
        {
            existingPlayer = new GameObject("Player");
            Debug.Log("Player gameobject created");
        }
        
        if (existingPlayer.GetComponent<PlayerController>() == null)
        {
            existingPlayer.AddComponent<PlayerController>();
            Debug.Log("PlayerController added");
        }
        
        if (existingPlayer.GetComponent<SpriteRenderer>() == null)
        {
            existingPlayer.AddComponent<SpriteRenderer>();
        }
    }
}