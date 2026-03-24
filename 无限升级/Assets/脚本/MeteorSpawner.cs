using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Collections.Generic;

public class MeteorSpawner : MonoBehaviour
{

    [Header("生成控制")]
    public float spawnTime = 5f;
    public int maxActiveMeteors = 10;
    public float autoRecycleTime = 20f;
    public float spawnRangeX = 14f;
    public float spawnRangeY = 9f;

    [Header("大小设置")]
    public float minScale = 0.3f;
    public float maxScale = 0.9f;

    public List<GameObject> activeMeteors = new List<GameObject>();
    private float spawnTimer;

    void Update()
    {

        spawnTimer
+= Time.deltaTime;

        // 只在计时器变化时打印，避免刷屏
        if (Time.frameCount % 30 == 0)
        {
            Debug
    .Log($"【生成】当前: {activeMeteors.Count}/{maxActiveMeteors} | 计时器: {spawnTimer:F2}/{spawnTime}");
        }

        if (spawnTimer >= spawnTime && activeMeteors.Count < maxActiveMeteors)
        {
            Debug
    .Log($"✅【生成触发】满足条件：时间({spawnTimer:F2}s) + 空位({maxActiveMeteors - activeMeteors.Count}个)");
            SpawnMeteor();
            spawnTimer
    = 0;
        }
    }

    void SpawnMeteor()
    {
        GameObject meteor = ObjectPool.instance.GetMeteor();

        Vector2 pos = new Vector2(
            Random
.Range(-spawnRangeX, spawnRangeX),
            Random
.Range(-spawnRangeY, spawnRangeY)
        );

        meteor
.transform.position = pos;
        meteor
.transform.rotation = Quaternion.identity;
        activeMeteors
.Add(meteor);

        float scale;
        float rnd = Random.value;

        if (rnd < 0.8f)
        {
            scale
= Random.Range(minScale, minScale + 0.2f);
            Debug
.Log("【新石头】小型(80%) 大小: " + scale);
        }
        else if (rnd < 0.9f)
        {
            scale
= Random.Range(minScale + 0.2f, maxScale - 0.2f);
            Debug
.Log("【新石头】中型(10%) 大小: " + scale);
        }
        else
        {
            scale
= Random.Range(maxScale - 0.2f, maxScale);
            Debug
.Log("【新石头】大型(10%) 大小: " + scale);
        }

        meteor
.transform.localScale = Vector3.one * scale;
        StartCoroutine(RecycleMeteorAfterTime(meteor, autoRecycleTime));
    }

    IEnumerator RecycleMeteorAfterTime(GameObject meteor, float delay)
    {
        yield return new WaitForSeconds(delay);
        RemoveMeteor(meteor);
    }

    public void RemoveMeteor(GameObject meteor)
    {
        if (activeMeteors.Contains(meteor))
        {
            activeMeteors
.Remove(meteor);
            Debug
.Log("【回收】超时/碰撞移除石头: " + meteor.name);
        }

        ObjectPool
.instance.RecycleMeteor(meteor);
    }

    // 吸附时调用
    public void ForceRemoveFromActive(GameObject meteor)
    {
        if (activeMeteors.Contains(meteor))
        {
            activeMeteors
.Remove(meteor);
            Debug
.Log("【强制移除】被吸附，移出活动列表: " + meteor.name);
        }
    }

    // 脱落时调用
    public void ForceAddToActive(GameObject meteor)
    {
        if (!activeMeteors.Contains(meteor))
        {
            activeMeteors
.Add(meteor);
            Debug
.Log("【强制加回】脱落石头放回列表: " + meteor.name);
        }
    }
   
}
