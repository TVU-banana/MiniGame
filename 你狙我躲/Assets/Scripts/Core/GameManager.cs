using UnityEngine;
using System.Collections;

public enum GameState
{
    Menu,
    Matching,
    Playing
}

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    public GameState currentState = GameState.Menu;

    [Header("Screen Settings")]
    public int width = 375;
    public int height = 667;

    [Header("Scene References")]
    public GameObject menuRoot;
    public GameObject matchingRoot;
    public GameObject playingRoot;

    [Header("Alien References")]
    public GameObject alienLeft;
    public GameObject alienRight;

    [Header("Camera")]
    public Transform mainCamera;

    private float gameTime = 0f;

    void Awake()
    {
        Instance = this;
    }

    void Start()
    {
        InitializeGame();
    }

    void InitializeGame()
    {
        Screen.SetResolution(width, height, false);

        menuRoot?.SetActive(true);
        matchingRoot?.SetActive(false);
        playingRoot?.SetActive(false);

        if (alienLeft != null)
        {
            var controller = alienLeft.GetComponent<AlienController>();
            controller?.SetPosture("natural");
        }
        if (alienRight != null)
        {
            var controller = alienRight.GetComponent<AlienController>();
            controller?.SetPosture("natural");
            alienRight.transform.rotation = Quaternion.Euler(0, 180, 0);
        }
    }

    public void ChangeState(GameState newState)
    {
        if (currentState == newState) return;

        currentState = newState;
        UpdateSceneActivation();
    }

    void UpdateSceneActivation()
    {
        switch (currentState)
        {
            case GameState.Menu:
                menuRoot?.SetActive(true);
                matchingRoot?.SetActive(false);
                playingRoot?.SetActive(false);
                break;

            case GameState.Matching:
                menuRoot?.SetActive(false);
                matchingRoot?.SetActive(true);
                playingRoot?.SetActive(false);
                break;

            case GameState.Playing:
                menuRoot?.SetActive(false);
                matchingRoot?.SetActive(false);
                playingRoot?.SetActive(true);
                SetupPlayingScene();
                break;
        }
    }

    void SetupPlayingScene()
    {
        if (mainCamera != null)
        {
            mainCamera.position = new Vector3(0, 12, 12);
            mainCamera.rotation = Quaternion.Euler(45, 0, 0);
        }

        if (alienLeft != null)
        {
            alienLeft.transform.position = new Vector3(-6, 0, 0);
            alienLeft.transform.rotation = Quaternion.identity;
            var controller = alienLeft.GetComponent<AlienController>();
            controller?.SetPosture("natural");
        }

        if (alienRight != null)
        {
            alienRight.transform.position = new Vector3(6, 0, 0);
            alienRight.transform.rotation = Quaternion.Euler(0, 180, 0);
            var controller = alienRight.GetComponent<AlienController>();
            controller?.SetPosture("natural");
        }
    }

    void Update()
    {
        gameTime += Time.deltaTime;

        switch (currentState)
        {
            case GameState.Menu:
                UpdateMenu();
                break;
            case GameState.Matching:
                UpdateMatching();
                break;
            case GameState.Playing:
                UpdatePlaying();
                break;
        }
    }

    void UpdateMenu()
    {
    }

    void UpdateMatching()
    {
    }

    void UpdatePlaying()
    {
    }

    public void OnMenuStartClicked()
    {
        ChangeState(GameState.Matching);
    }

    public void OnMatchingStartClicked()
    {
        ChangeState(GameState.Playing);
    }
}