using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Tilemaps;
using UnityEngine.UI;
using TMPro;
using UnityEngine.SceneManagement;
public class CurveMazeController : MonoBehaviour
{


    public Transform player;
    public Transform target;
    public float moveSpeed = 4f;
    private Vector3 playerStartPos;

    [Header("画线与曲线")]
    public LineRenderer pathLine;
    public float minPointDistance = 0.2f;
    public int smoothness = 12;
    public Color colorWalked = Color.green;
    public Color colorUnwalked = Color.blue;
    public Color previewColor = Color.gray;

    [Header("UI")]
    public GameObject panelFail;
    public Button btnRestart;
    public Button btnExitGame;
    public TextMeshProUGUI textLevel;

    [Header("通关祝贺界面")]
    public GameObject panelClear;
    public TextMeshProUGUI textCongrats;
    public TextMeshProUGUI textDesc;
    public Button btnRestartAll;

    [Header("游戏内右上角返回主菜单")]
    public Button btnBackToMain;

    [Header("音效")]
    public AudioSource audioSource;
    public AudioClip successClip;
    public AudioClip failClip;
    public AudioClip wallHitClip;
    public AudioClip drawSound;
    public AudioClip clearMusic;

    [Header("关卡")]
    public List<GameObject> mazePrefabs;
    public float fadeSpeed = 1f;

    private List<Vector3> rawPoints = new List<Vector3>();
    private List<Vector3> curvePoints = new List<Vector3>();
    private bool isDrawing = false;
    private bool isMoving = false;
    private int currentPoint = 0;

    private int currentLevel = 1;
    private int maxLevel;
    private GameObject currentMaze;
    private Camera mainCam;

    private CanvasGroup currentMazeGroup;
    private bool isFading = false;
    private float fadeTarget = 1f;

    private bool drawSoundEnabled;

    void Awake()
    {
        moveSpeed
= UIManager.moveSpeed;
        drawSoundEnabled
= UIManager.drawSoundEnabled;

        mainCam
= Camera.main;
        panelFail
.SetActive(false);
        panelClear
.SetActive(false);

        btnRestart
.onClick.AddListener(RestartLevel);
        btnExitGame
.onClick.AddListener(BackToMainMenu);
        btnRestartAll
.onClick.AddListener(RestartFromLevel1);

        if (btnBackToMain != null)
            btnBackToMain
.onClick.AddListener(BackToMainMenu);

        maxLevel
= mazePrefabs.Count;
        LoadLevel(currentLevel);
    }

    void Update()
    {
        if (isFading && currentMazeGroup != null)
        {
            currentMazeGroup
.alpha = Mathf.MoveTowards(currentMazeGroup.alpha, fadeTarget, fadeSpeed * Time.deltaTime);
            if (Mathf.Approximately(currentMazeGroup.alpha, fadeTarget))
                isFading
= false;
        }

        if (isMoving)
        {
            MoveAlongCurve();
            return;
        }

        if (Input.GetMouseButtonDown(0))
        {
            ClearPath();
            HideAllPanels();

            Vector3 worldPos = GetMouseWorldPos();
            float dis = Vector3.Distance(worldPos, player.position);

            if (dis < 1f)
                isDrawing
= true;
            else
                isDrawing
= false;
        }

        if (isDrawing && Input.GetMouseButton(0))
        {
            if (drawSoundEnabled && drawSound != null && !audioSource.isPlaying)
                audioSource
.PlayOneShot(drawSound);

            Vector3 worldPos = GetMouseWorldPos();
            bool safe = rawPoints.Count < 3 || IsPointSafe(worldPos);

            if (!safe)
            {
                PlaySound(failClip);
                PlaySound(wallHitClip);
                ShowFail();
                isDrawing
= false;
                return;
            }

            AddRawPoint(worldPos);
        }

        if (Input.GetMouseButtonUp(0) && isDrawing)
        {
            isDrawing
= false;
            if (rawPoints.Count > 1)
            {
                MakeSmoothCurve();
                isMoving
= true;
                currentPoint
= 0;
                UpdateLineGradient();
            }
            else
            {
                ClearPath();
            }
        }
    }

    bool IsPointSafe(Vector3 worldPos)
    {
        if (currentMaze == null) return true;
        Tilemap map = currentMaze.GetComponentInChildren<Tilemap>();
        if (map == null) return true;
        Vector3Int cell = map.WorldToCell(worldPos);
        return map.GetTile(cell) == null;
    }

    Vector3 GetMouseWorldPos()
    {
        Vector3 s = Input.mousePosition;
        s
.z = 10f;
        Vector3 w = mainCam.ScreenToWorldPoint(s);
        w
.z = 0;
        return w;
    }

    void AddRawPoint(Vector3 p)
    {
        if (rawPoints.Count == 0 || Vector3.Distance(rawPoints[rawPoints.Count - 1], p) > minPointDistance)
        {
            rawPoints
.Add(p);
            pathLine
.positionCount = rawPoints.Count;
            pathLine
.SetPositions(rawPoints.ToArray());
        }
    }

    void MakeSmoothCurve()
    {
        curvePoints
.Clear();
        if (rawPoints.Count < 2) return;

        List<Vector3> pts = new List<Vector3>(rawPoints);
        pts
.Insert(0, rawPoints[0]);
        pts
.Add(rawPoints[rawPoints.Count - 1]);

        for (int i = 1; i < pts.Count - 2; i++)
        {
            for (int s = 0; s < smoothness; s++)
            {
                float t = (float)s / smoothness;
                curvePoints
.Add(CatmullRom(pts[i - 1], pts[i], pts[i + 1], pts[i + 2], t));
            }
        }
        curvePoints
.Add(pts[pts.Count - 2]);

        pathLine
.positionCount = curvePoints.Count;
        pathLine
.SetPositions(curvePoints.ToArray());
    }

    Vector3 CatmullRom(Vector3 p0, Vector3 p1, Vector3 p2, Vector3 p3, float t)
    {
        float t2 = t * t;
        float t3 = t2 * t;
        return 0.5f * (
            (-p0 + 3 * p1 - 3 * p2 + p3) * t3 +
            (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
            (-p0 + p2) * t + 2 * p1);
    }

    void MoveAlongCurve()
    {
        if (currentPoint >= curvePoints.Count)
        {
            isMoving
= false;
            float dis = Vector3.Distance(player.position, target.position);

            if (dis < 1.1f)
            {
                PlaySound(successClip);

                if (currentLevel >= maxLevel)
                {
                    ShowClearPanel();
                }
                else
                {
                    AutoNextLevel();
                }
            }
            else
            {
                PlaySound(failClip);
                ShowFail();
            }
            return;
        }

        // 只改了这里：去掉 *2.5f，让滑块真正生效，手机速度正常
        player
.position = Vector3.MoveTowards(player.position, curvePoints[currentPoint], moveSpeed);

        if (Vector3.Distance(player.position, curvePoints[currentPoint]) < 0.1f)
        {
            currentPoint
++;
            UpdateLineGradient();
        }
    }

    void UpdateLineGradient()
    {
        Gradient g = new Gradient();
        float p = curvePoints.Count < 2 ? 0 : (float)currentPoint / curvePoints.Count;

        GradientColorKey[] ck = new GradientColorKey[3];
        ck
[0] = new GradientColorKey(colorWalked, 0);
        ck
[1] = new GradientColorKey(colorWalked, p);
        ck
[2] = new GradientColorKey(colorUnwalked, 1);

        GradientAlphaKey[] ak = new GradientAlphaKey[2];
        ak
[0] = new GradientAlphaKey(1, 0);
        ak
[1] = new GradientAlphaKey(1, 1);

        g
.SetKeys(ck, ak);
        pathLine
.colorGradient = g;
    }

    void PlaySound(AudioClip clip)
    {
        if (audioSource != null && clip != null)
            audioSource
.PlayOneShot(clip);
    }

    void ShowFail() => panelFail.SetActive(true);

    void HideAllPanels()
    {
        panelFail
.SetActive(false);
        panelClear
.SetActive(false);
    }

    void ShowClearPanel()
    {
        panelClear
.SetActive(true);

        if (clearMusic != null)
            PlaySound(clearMusic);

        StartCoroutine(ShakeCamera(0.3f, 0.15f));
        StartCoroutine(ClearTextAnimation());
    }

    IEnumerator ShakeCamera(float duration, float magnitude)
    {
        Vector3 originalPos = mainCam.transform.localPosition;
        float elapsed = 0f;

        while (elapsed < duration)
        {
            float x = Random.Range(-1f, 1f) * magnitude;
            float y = Random.Range(-1f, 1f) * magnitude;
            mainCam
.transform.localPosition = originalPos + new Vector3(x, y, 0);
            elapsed
+= Time.deltaTime;
            yield return null;
        }

        mainCam
.transform.localPosition = originalPos;
    }

    IEnumerator ClearTextAnimation()
    {
        textCongrats
.transform.localScale = Vector3.zero;
        textDesc
.transform.localScale = Vector3.zero;

        textCongrats
.enableVertexGradient = true;
        textCongrats
.colorGradient = new VertexGradient(Color.yellow, Color.red, Color.magenta, Color.cyan);

        float t = 0;
        while (t < 1)
        {
            t
+= Time.deltaTime * 2.5f;
            textCongrats
.transform.localScale = Vector3.Lerp(Vector3.zero, Vector3.one, t);
            yield return null;
        }

        yield return new WaitForSeconds(0.2f);
        t
= 0;
        while (t < 1)
        {
            t
+= Time.deltaTime * 2.5f;
            textDesc
.transform.localScale = Vector3.Lerp(Vector3.zero, Vector3.one, t);
            yield return null;
        }
    }

    void AutoNextLevel()
    {
        currentLevel
++;
        StartCoroutine(FadeSequence());
    }

    IEnumerator FadeSequence()
    {
        fadeTarget
= 0;
        isFading
= true;
        yield return new WaitUntil(() => !isFading);

        Destroy(currentMaze);

        int idx = Mathf.Clamp(currentLevel - 1, 0, mazePrefabs.Count - 1);
        currentMaze
= Instantiate(mazePrefabs[idx]);
        currentMaze
.transform.localPosition = Vector3.zero;
        currentMaze
.transform.localScale = Vector3.one;

        currentMazeGroup
= currentMaze.AddComponent<CanvasGroup>();
        currentMazeGroup
.alpha = 0;

        player
= currentMaze.transform.Find("Player");
        target
= currentMaze.transform.Find("Target");
        playerStartPos
= player.position;

        if (textLevel != null)
            textLevel
.text = "第 " + currentLevel + " 关";

        ClearPath();
        HideAllPanels();

        fadeTarget
= 1;
        isFading
= true;
        yield return null;
    }

    void LoadLevel(int level)
    {
        currentLevel
= level;
        if (currentMaze != null) Destroy(currentMaze);

        int idx = Mathf.Clamp(level - 1, 0, mazePrefabs.Count - 1);
        currentMaze
= Instantiate(mazePrefabs[idx]);
        currentMaze
.transform.localPosition = Vector3.zero;
        currentMaze
.transform.localScale = Vector3.one;

        currentMazeGroup
= currentMaze.AddComponent<CanvasGroup>();
        currentMazeGroup
.alpha = 1;

        player
= currentMaze.transform.Find("Player");
        target
= currentMaze.transform.Find("Target");
        playerStartPos
= player.position;

        if (textLevel != null)
            textLevel
.text = "第 " + currentLevel + " 关";

        ClearPath();
        HideAllPanels();
    }

    public void RestartLevel()
    {
        LoadLevel(currentLevel);
    }

    public void RestartFromLevel1()
    {
        LoadLevel(1);
    }

    public void BackToMainMenu()
    {
        SceneManager
.LoadScene("开始界面");
    }

    void ClearPath()
    {
        rawPoints
.Clear();
        curvePoints
.Clear();
        pathLine
.positionCount = 0;
        currentPoint
= 0;
        isMoving
= false;
        isDrawing
= false;
    }
}
