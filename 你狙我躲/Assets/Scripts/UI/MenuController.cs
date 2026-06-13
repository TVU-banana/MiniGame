using UnityEngine;
using System.Collections;

public class MenuController : MonoBehaviour
{
    public static MenuController Instance { get; private set; }

    [Header("UI References")]
    public GameObject title3DObject;
    public Transform rotatingSphere;
    public Transform[] stars;

    [Header("Button")]
    public Collider startButton;
    public GameObject buttonVisual;

    [Header("Colors")]
    public Color backgroundTop = new Color(0.04f, 0.04f, 0.1f);
    public Color backgroundBottom = new Color(0.1f, 0.1f, 0.23f);

    private float rotationSpeed = 1f;

    void Awake()
    {
        Instance = this;
    }

    void Start()
    {
        InitializeMenu();
    }

    void InitializeMenu()
    {
        if (rotatingSphere != null)
        {
            StartCoroutine(AnimateSphere());
        }

        if (stars != null && stars.Length > 0)
        {
            StartCoroutine(AnimateStars());
        }
    }

    IEnumerator AnimateSphere()
    {
        while (true)
        {
            if (rotatingSphere != null)
            {
                rotatingSphere.Rotate(Vector3.up, rotationSpeed * Time.deltaTime * 60f);
            }
            yield return null;
        }
    }

    IEnumerator AnimateStars()
    {
        float[] phases = new float[stars.Length];
        float[] speeds = new float[stars.Length];

        for (int i = 0; i < stars.Length; i++)
        {
            phases[i] = Random.Range(0f, Mathf.PI * 2);
            speeds[i] = Random.Range(0.01f, 0.03f);
        }

        while (true)
        {
            float time = Time.time;
            for (int i = 0; i < stars.Length; i++)
            {
                if (stars[i] != null)
                {
                    float alpha = 0.3f + Mathf.Sin(time * speeds[i] + phases[i]) * 0.7f;
                    Renderer renderer = stars[i].GetComponent<Renderer>();
                    if (renderer != null)
                    {
                        Color color = renderer.material.color;
                        color.a = alpha;
                        renderer.material.color = color;
                    }
                }
            }
            yield return null;
        }
    }

    void Update()
    {
        if (Input.GetMouseButtonDown(0))
        {
            CheckButtonClick();
        }
    }

    void CheckButtonClick()
    {
        Ray ray = Camera.main.ScreenPointToRay(Input.mousePosition);
        RaycastHit hit;

        if (startButton != null && Physics.Raycast(ray, out hit))
        {
            if (hit.collider == startButton)
            {
                OnButtonClicked();
            }
        }
    }

    public void OnButtonClicked()
    {
        if (GameManager.Instance != null)
        {
            GameManager.Instance.OnMenuStartClicked();
        }
    }

    void OnValidate()
    {
        if (Application.isPlaying) return;
    }
}