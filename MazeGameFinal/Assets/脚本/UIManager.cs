using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;
using TMPro;
public class UIManager : MonoBehaviour
{
    [Header("面板")]
    public Image panelMain;
    public Image panelSetting;

    [Header("按钮")]
    public Button btnStart;
    public Button btnSetting;
    public Button btnExit;
    public Button btnBack;

    [Header("音量设置")]
    public Slider sliderBGM;
    public TextMeshProUGUI textBGM_Value; // 初始空，代码赋值

    [Header("速度设置")]
    public Slider sliderSpeed;
    public TextMeshProUGUI textSpeed_Value; // 初始空，代码赋值

    [Header("画线音效开关")]
    public Toggle toggleDrawSound;

    // 全局设置
    public static float bgmVolume = 1f;
    public static float moveSpeed = 4f;
    public static bool drawSoundEnabled = true;

    void Start()
    {
        LoadSettings();

        // 代码初始化文本，完全不依赖 Inspector
        sliderBGM
.value = bgmVolume;
        textBGM_Value
.text = $"{Mathf.Round(bgmVolume * 100)}%";

        sliderSpeed
.value = moveSpeed;
        textSpeed_Value
.text = $"{moveSpeed:F1}";

        toggleDrawSound
.isOn = drawSoundEnabled;

        BGMManager
.instance.SetVolume(bgmVolume);

        // 绑定按钮事件
        btnStart
.onClick.AddListener(StartGame);
        btnSetting
.onClick.AddListener(OpenSetting);
        btnExit
.onClick.AddListener(ExitGame);
        btnBack
.onClick.AddListener(CloseSetting);

        // 绑定滑块/开关事件
        sliderBGM
.onValueChanged.AddListener(OnBGMChanged);
        sliderSpeed
.onValueChanged.AddListener(OnSpeedChanged);
        toggleDrawSound
.onValueChanged.AddListener(OnDrawSoundToggled);
    }

    #region 按钮事件
    void StartGame()
    {
        SaveSettings();
        SceneManager
.LoadScene("SampleScene");
    }

    void OpenSetting()
    {
        panelMain
.gameObject.SetActive(false);
        panelSetting
.gameObject.SetActive(true);
    }

    void CloseSetting()
    {
        panelSetting
.gameObject.SetActive(false);
        panelMain
.gameObject.SetActive(true);
    }

    void ExitGame()
    {
#if UNITY_EDITOR
        UnityEditor
.EditorApplication.isPlaying = false;
#else
        Application
.Quit();
#endif
    }
    #endregion

    #region 滑块/开关实时刷新
    void OnBGMChanged(float value)
    {
        bgmVolume
= value;
        textBGM_Value
.text = $"{Mathf.Round(value * 100)}%";
        BGMManager
.instance.SetVolume(value);
    }

    void OnSpeedChanged(float value)
    {
        moveSpeed
= value;
        textSpeed_Value
.text = $"{value:F1}";
    }

    void OnDrawSoundToggled(bool isOn)
    {
        drawSoundEnabled
= isOn;
    }
    #endregion

    #region 数据持久化
    void SaveSettings()
    {
        PlayerPrefs
.SetFloat("BGM", bgmVolume);
        PlayerPrefs
.SetFloat("Speed", moveSpeed);
        PlayerPrefs
.SetInt("DrawSound", drawSoundEnabled ? 1 : 0);
        PlayerPrefs
.Save();
    }

    void LoadSettings()
    {
        if (PlayerPrefs.HasKey("BGM"))
            bgmVolume
= PlayerPrefs.GetFloat("BGM");
        else
            bgmVolume
= 1f;

        if (PlayerPrefs.HasKey("Speed"))
            moveSpeed
= PlayerPrefs.GetFloat("Speed");
        else
            moveSpeed
= 4f;

        if (PlayerPrefs.HasKey("DrawSound"))
            drawSoundEnabled
= PlayerPrefs.GetInt("DrawSound") == 1;
        else
            drawSoundEnabled
= true;
    }
    #endregion
}
