using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI; // 新增：确保能获取Button组件

public class MenuManager : MonoBehaviour
{
    public GameObject menuPanel; // 需要在Inspector拖入菜单面板
    private Button _menuButton;  // 按钮自身的引用

    private bool isPaused = false;

    void Start()
    {
        // 1. 获取按钮自身的Button组件（脚本挂在按钮上）
        _menuButton = GetComponent<Button>();
        if (_menuButton == null)
        {
            Debug.LogError("当前游戏对象没有Button组件！请确认脚本挂在按钮上", this);
            return;
        }

        // 2. 代码绑定点击事件（避免手动绑定出错）
        _menuButton.onClick.AddListener(OnMenuButtonClick);

        // 3. 初始化菜单面板
        if (menuPanel != null)
        {
            menuPanel.SetActive(false);
        }
        else
        {
            Debug.LogError("menuPanel未赋值！请在Inspector拖入菜单面板", this);
        }

        Time.timeScale = 1f; // 恢复游戏速度
    }

    // 点击 Menu 按钮（公开方法，也可手动绑定）
    public void OnMenuButtonClick()
    {
        Debug.Log("Menu按钮被点击！当前菜单状态：" + menuPanel?.activeSelf); // 打印日志排查

        if (menuPanel == null) return; // 面板没赋值则直接返回

        // 如果已经打开  关闭并恢复
        if (menuPanel.activeSelf)
        {
            ResumeGame();
        }
        else
        {
            OpenMenuAndPause();
        }
    }

    // 打开菜单 + 暂停
    void OpenMenuAndPause()
    {
        menuPanel.SetActive(true);
        Time.timeScale = 0f; // 暂停游戏（注意：UI仍可交互）
        isPaused = true;
        Debug.Log("游戏已暂停，菜单已打开");
    }

    // 恢复游戏 + 关闭菜单
    void ResumeGame()
    {
        menuPanel.SetActive(false);
        Time.timeScale = 1f; // 恢复游戏
        isPaused = false;
        Debug.Log("游戏已恢复，菜单已关闭");
    }

    // 点击 Quit 按钮（需给Quit按钮绑定这个方法）
    public void OnQuitClick()
    {
        Time.timeScale = 1f; // 必须恢复时间缩放，否则切换场景会异常
        Debug.Log("退出到主菜单，加载场景：MainMenu");

        // 检查场景是否存在（避免场景名写错）
        if (SceneManager.GetSceneByName("MainMenu").IsValid() || SceneManager.sceneCountInBuildSettings > 0)
        {
            SceneManager.LoadScene("MainMenu");
        }
        else
        {
            Debug.LogError("MainMenu场景不存在！请检查Build Settings是否添加该场景", this);
        }
    }

    // 点击“继续”按钮（需给继续按钮绑定这个方法）
    public void OnContinueClick()
    {
        ResumeGame();
        Debug.Log("点击了继续按钮，恢复游戏");
    }

    // 防止场景切换时内存泄漏
    void OnDestroy()
    {
        if (_menuButton != null)
        {
            _menuButton.onClick.RemoveListener(OnMenuButtonClick);
        }
    }
}