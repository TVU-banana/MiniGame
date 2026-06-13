using UnityEngine;
using UnityEngine.SceneManagement;

public class SceneLoader : MonoBehaviour
{
    // 去选关界面
    public void LoadLevelSelect()
    {
        SceneManager.LoadScene("LevelSelect");
    }

    // 加载指定关卡
    public void LoadLevel(string levelName)
    {
        SceneManager.LoadScene(levelName);
    }

    // 下一关
    public void LoadNextLevel()
    {
        int index = SceneManager.GetActiveScene().buildIndex;
        SceneManager.LoadScene(index + 1);
    }

    // 重开当前关
    public void ReloadLevel()
    {
        SceneManager.LoadScene(SceneManager.GetActiveScene().name);
    }
}