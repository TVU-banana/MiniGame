using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class PlayerMeteor : MonoBehaviour
{
    public float moveForce = 8f;
    public float drag = 0.98f;

    [Header("判定阈值")]
    public float baseScale = 1f;
    public float smallRatio = 0.4f;
    public float mediumRatio = 0.8f;

    [Header("吸附配置")]
    public float attachRadius = 1.8f;
    public float attachSmooth = 12f;

    [Header("脱落配置")]
    public float detachSpeed = 1.8f;
    public float detachDrag = 3f;

    private Rigidbody2D rb;
    public float currentScale;
    private List<Transform> attached = new List<Transform>();
    private Vector2 moveInput;

    private MeteorSpawner spawner;

    void Awake()
    {
        rb
= GetComponent<Rigidbody2D>();
        spawner
= FindObjectOfType<MeteorSpawner>();
        currentScale
= baseScale;
        UpdateScale();
        Debug
.Log("【玩家】初始化完成，初始大小: " + currentScale);
    }

    public void SetMoveInput(Vector2 dir)
    {
        moveInput
= dir.normalized;
    }

    void FixedUpdate()
    {
        if (moveInput.magnitude > 0.1f)
            rb
.AddForce(moveInput * moveForce);

        rb
.velocity *= drag;
        UpdateAttachedPositions();
    }

    void UpdateScale()
    {
        transform
.localScale = Vector3.one * currentScale;
    }

    void UpdateAttachedPositions()
    {
        if (attached.Count == 0) return;

        for (int i = 0; i < attached.Count; i++)
        {
            if (attached[i] == null) continue;

            float angle = i * Mathf.PI * 2 / attached.Count;
            float r = attachRadius * currentScale;
            Vector3 targetPos = transform.position + new Vector3(
                Mathf
.Cos(angle) * r,
                Mathf
.Sin(angle) * r,
                0
            );

            attached
[i].position = Vector3.Lerp(
                attached
[i].position,
                targetPos
,
                Time
.fixedDeltaTime *
 attachSmooth
            );
        }
    }

    public void TryInteract(Transform other)
    {
        float otherSize = other.localScale.x;
        float ratio = otherSize / currentScale;

        Debug
.Log("【碰撞】石头大小:" + otherSize + " 玩家大小:" + currentScale + " 比例:" + ratio);

        if (ratio <= smallRatio)
        {
            Debug
.Log("【结果】可吸附 → 小型石头");
            Attach(other);
        }
        else if (ratio <= mediumRatio)
        {
            Debug
.Log("【结果】中型石头 → 触发脱落");
            DetachAll();
        }
        else
        {
            Debug
.Log("【结果】大型石头 → 游戏结束");
            GameManager
.instance.GameOver();
        }
    }

    void Attach(Transform meteor)
    {
        int beforeCount = spawner.activeMeteors.Count;
        if (spawner.activeMeteors.Contains(meteor.gameObject))
        {
            spawner
    .activeMeteors.Remove(meteor.gameObject);
            Debug
    .Log($"【吸附】石头 {meteor.name} 已移除 | 数量: {beforeCount} → {spawner.activeMeteors.Count}");
        }
        else
        {
            Debug
    .LogWarning($"【吸附】石头 {meteor.name} 不在列表中，无需移除 | 当前数量: {beforeCount}");
        }

        // 禁用石头物理
        Rigidbody2D r = meteor.GetComponent<Rigidbody2D>();
        if (r != null)
        {
            r
    .simulated = false;
            r
    .velocity = Vector2.zero;
            r
    .angularVelocity = 0;
        }

        // 吸附逻辑
        attached
    .Add(meteor);
        currentScale
    += meteor.localScale.x * 0.1f;
        UpdateScale();
        GameManager
    .instance.AddScore(5);
        Debug
    .Log($"【吸附完成】当前吸附数: {attached.Count} | 玩家大小: {currentScale:F2}");
    }

    void DetachAll()
    {
        Debug
.Log("【脱落】全部石头脱落，总数: " + attached.Count);

        foreach (var meteor in attached)
        {
            if (meteor == null) continue;

            Rigidbody2D r = meteor.GetComponent<Rigidbody2D>();
            if (r != null)
            {
                r
.simulated = true;
                Vector2 dir = (meteor.position - transform.position).normalized;
                r
.velocity = dir * detachSpeed;
                r
.drag = detachDrag;
            }

            // 脱落重新加入活动列表
            spawner
.ForceAddToActive(meteor.gameObject);
            Debug
.Log("【脱落】石头 " + meteor.name + " 已放回活动列表");
        }

        attached
.Clear();
        currentScale
= Mathf.Max(baseScale, currentScale * 0.8f);
        UpdateScale();

        GameManager
.instance.AddScore(-10);
        Debug
.Log("【脱落】完成 -10分");
    }
}
