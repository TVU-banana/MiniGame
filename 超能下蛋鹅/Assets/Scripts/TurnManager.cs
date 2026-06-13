
using System.Collections;
using UnityEngine;

/// <summary>
/// 回合管理器（TurnManager）
/// 
/// 功能：
/// 1. 控制5个角色轮流行动
/// 2. 每回合只允许当前角色发射一次
/// 3. 当场上所有 Egg 消失后：
///    。 所有 Enemy 平滑上移
///    。 动画结束后切换回合
/// 
/// 核心机制：
/// - 状态锁（hasFiredThisTurn / isProcessingTurnEnd）
/// - 协程（Coroutine）实现平滑动画
/// </summary>
public class TurnManager : MonoBehaviour
{
    [Header("玩家列表（按顺序轮流）")]
    public FireScript[] players; // 5个角色

    public float moveDistance=1f;//怪每回合移动距离

    private int currentIndex = 0;          // 当前玩家索引
    private bool hasFiredThisTurn = false; // 本回合是否已经发射
    private bool isProcessingTurnEnd = false; // 是否正在处理回合结束（防止重复触发）

    void Start()
    {
        // 游戏开始时，激活第一个玩家
        SetActivePlayer(0);
    }

    void Update()
    {
        // 条件：
        // 1. 当前回合已经发射
        // 2. 没有正在处理回合结束（防止重复进入）
        // 3. 场上已经没有 Egg（子弹）
        if (hasFiredThisTurn
            && !isProcessingTurnEnd
            && GameObject.FindGameObjectsWithTag("Egg").Length == 0)
        {
            // 上锁，防止 Update 多次触发
            isProcessingTurnEnd = true;

            // 启动回合结束流程（协程）
            StartCoroutine(HandleTurnEnd());
        }
    }

    /// <summary>
    /// 设置当前激活玩家
    /// </summary>
    void SetActivePlayer(int index)
    {
        currentIndex = index;

        // 新回合开始 → 重置发射状态
        hasFiredThisTurn = false;

        // 只允许当前玩家发射
        for (int i = 0; i < players.Length; i++)
        {
            players[i].SetCanFire(i == currentIndex);
        }
    }

    /// <summary>
    /// 当前玩家发射时调用（由 FireScript 调用）
    /// </summary>
    public void OnPlayerFired()
    {
        // 防止重复触发
        if (hasFiredThisTurn) return;

        hasFiredThisTurn = true;
    }

    /// <summary>
    /// 回合结束流程：
    /// 1. Enemy 平滑上移
    /// 2. 重置状态
    /// 3. 切换回合
    /// </summary>
    IEnumerator HandleTurnEnd()
    {
        // 获取所有 Enemy
        GameObject[] enemies = GameObject.FindGameObjectsWithTag("Enemy");

        // 。 平滑上移（等待动画完成）
        yield return StartCoroutine(MoveEnemiesSmooth(enemies, moveDistance, 0.5f));

        // 。 重置状态
        hasFiredThisTurn = false;
        isProcessingTurnEnd = false;

        // 。 切换到下一位玩家
        NextTurn();
    }

    /// <summary>
    /// 平滑移动所有 Enemy
    /// </summary>
    /// <param name="enemies">敌人数组</param>
    /// <param name="moveDistance">上移距离</param>
    /// <param name="duration">动画时长</param>
    IEnumerator MoveEnemiesSmooth(GameObject[] enemies, float moveDistance, float duration)
    {
        float time = 0f;

        // 记录起始位置 & 目标位置
        Vector3[] startPos = new Vector3[enemies.Length];
        Vector3[] targetPos = new Vector3[enemies.Length];

        for (int i = 0; i < enemies.Length; i++)
        {
            if (enemies[i] != null)
            {
                startPos[i] = enemies[i].transform.position;
                targetPos[i] = startPos[i] + Vector3.up * moveDistance;
            }
        }

        // 动画插值过程
        while (time < duration)
        {
            time += Time.deltaTime;

            // 归一化时间（0~1）
            float t = time / duration;

            // 。 SmoothStep（让动画更自然：慢→快→慢）
            t = t * t * (3f - 2f * t);

            for (int i = 0; i < enemies.Length; i++)
            {
                if (enemies[i] != null)
                {
                    enemies[i].transform.position =
                        Vector3.Lerp(startPos[i], targetPos[i], t);
                }
            }

            yield return null; // 等待下一帧
        }

        // 确保最终位置精确
        for (int i = 0; i < enemies.Length; i++)
        {
            if (enemies[i] != null)
            {
                enemies[i].transform.position = targetPos[i];
            }
        }
    }

    /// <summary>
    /// 切换到下一回合
    /// </summary>
    void NextTurn()
    {
        int next = (currentIndex + 1) % players.Length;
        SetActivePlayer(next);
    }
}

