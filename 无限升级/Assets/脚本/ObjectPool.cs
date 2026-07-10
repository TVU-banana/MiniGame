using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Collections.Generic;
public class ObjectPool : MonoBehaviour
{
    public static ObjectPool instance;

    [Header("对象池配置")]
    public GameObject meteorPrefab; // 石头预制体
    public int poolSize = 20;       // 初始池大小

    private List<GameObject> meteorPool;

    void Awake()
    {
        // 单例模式（修复换行）
        if (instance == null)
            instance
= this;
        else
            Destroy(gameObject);

        // 初始化对象池
        meteorPool
= new List<GameObject>();
        for (int i = 0; i < poolSize; i++)
        {
            GameObject meteor = Instantiate(meteorPrefab);
            meteor
.SetActive(false); // 初始隐藏
            meteorPool
.Add(meteor);
        }
    }

    /// <summary>
    /// 从池里获取石头（核心修复：新增石头必激活）
    /// </summary>
    public GameObject GetMeteor()
    {
        // 找第一个未激活的石头
        foreach (GameObject meteor in meteorPool)
        {
            if (!meteor.activeInHierarchy)
            {
                meteor
.SetActive(true); // 激活
                return meteor;
            }
        }

        // 池满了就新增（修复：新增后立刻激活）
        GameObject newMeteor = Instantiate(meteorPrefab);
        newMeteor
.SetActive(true); // 关键！新增石头必须激活
        meteorPool
.Add(newMeteor);
        return newMeteor;
    }

    /// <summary>
    /// 回收石头到池里
    /// </summary>
    public void RecycleMeteor(GameObject meteor)
    {
        meteor
.SetActive(false); // 隐藏回收
    }
}
