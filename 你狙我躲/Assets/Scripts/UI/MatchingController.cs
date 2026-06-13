using UnityEngine;
using UnityEngine.UI;

public class MatchingController : MonoBehaviour
{
    public static MatchingController Instance { get; private set; }

    [Header("UI Elements")]
    public GameObject leftAvatar;
    public GameObject rightAvatar;
    public Text leftNameText;
    public Text rightNameText;
    public Text vsText;
    public Collider startButton;
    public GameObject buttonVisual;

    [Header("Avatar Colors")]
    public Color hiderColor = new Color(1f, 0.84f, 0f);
    public Color sniperColor = new Color(1f, 0.42f, 0.42f);

    [Header("Names")]
    public string hiderName = "躲藏者";
    public string sniperName = "狙击手";

    void Awake()
    {
        Instance = this;
    }

    void Start()
    {
        InitializeMatchingUI();
    }

    void InitializeMatchingUI()
    {
        if (leftAvatar != null)
        {
            Renderer rend = leftAvatar.GetComponent<Renderer>();
            if (rend != null)
            {
                Material mat = new Material(Shader.Find("Standard"));
                mat.color = hiderColor;
                rend.material = mat;
            }
        }

        if (rightAvatar != null)
        {
            Renderer rend = rightAvatar.GetComponent<Renderer>();
            if (rend != null)
            {
                Material mat = new Material(Shader.Find("Standard"));
                mat.color = sniperColor;
                rend.material = mat;
            }
        }

        if (leftNameText != null)
            leftNameText.text = hiderName;

        if (rightNameText != null)
            rightNameText.text = sniperName;

        if (vsText != null)
            vsText.text = "VS";
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
        Debug.Log("开始匹配按钮点击");
        
        if (GameManager.Instance != null)
        {
            GameManager.Instance.OnMatchingStartClicked();
        }
    }

    public void SetHiderName(string name)
    {
        hiderName = name;
        if (leftNameText != null)
            leftNameText.text = name;
    }

    public void SetSniperName(string name)
    {
        sniperName = name;
        if (rightNameText != null)
            rightNameText.text = name;
    }
}