using UnityEngine;
using TMPro;
using System.Collections;

public class CubeFacesArrows : MonoBehaviour
{
    [Header("箭头设置")]
    [Tooltip("箭头大小")]
    public float arrowSize = 0.3f;
    [Tooltip("箭头颜色")]
    public Color arrowColor = Color.red;
    [Tooltip("是否在启动时随机生成方向")]
    public bool randomizeOnStart = true;
    [Tooltip("是否始终面向相机（移动端建议开启）")]
    public bool alwaysFaceCamera = true;
    [Tooltip("箭头偏移量（避免与面重叠）")]
    public float arrowOffset = 0.05f;

    // 当前立方体的随机方向（世界坐标）
    private Vector3 worldDirection;

    // 当前使用的箭头符号
    private string arrowSymbol = "↑";

    // 六个面上的箭头对象
    private GameObject[] faceArrows = new GameObject[6];
    private TextMeshPro[] arrowTexts = new TextMeshPro[6];
    private Camera mainCamera;

    // 移动相关
    [Header("移动设置")]
    [Tooltip("移动速度")]
    public float moveSpeed = 5f;
    [Tooltip("移动单位距离（一格的大小）")]
    public float moveDistance = 1f;
    [Tooltip("检测障碍物的层")]
    public LayerMask obstacleLayer = -1;
    [Tooltip("需要移动的格数")]
    public int moveSteps = 10;

    private bool isMoving = false;
    private bool isWaitingForStep = false;
    private int stepsRemaining = 0;
    private Vector3 targetPosition;
    private Vector3 moveDirection;

    // 事件：当立方体完成所有移动时触发
    public System.Action OnMoveCompleted;
    // 事件：当立方体被销毁时触发
    public System.Action OnCubeDestroyed;

    // 六个面的本地坐标中心点和法线方向
    private readonly Vector3[] faceCenters = new Vector3[]
    {
        new Vector3(0, 0, 0.5f),  // 前 (Z+)
        new Vector3(0, 0, -0.5f), // 后 (Z-)
        new Vector3(0.5f, 0, 0),  // 右 (X+)
        new Vector3(-0.5f, 0, 0), // 左 (X-)
        new Vector3(0, 0.5f, 0),  // 上 (Y+)
        new Vector3(0, -0.5f, 0)  // 下 (Y-)
    };

    private readonly Vector3[] faceNormals = new Vector3[]
    {
        Vector3.forward,  // 前
        Vector3.back,     // 后
        Vector3.right,    // 右
        Vector3.left,     // 左
        Vector3.up,       // 上
        Vector3.down      // 下
    };

    // 修正后的方向向量 - 确保箭头符号和实际移动方向一致
    // 箭头←应该向左移动 (Vector3.left)
    // 箭头→应该向右移动 (Vector3.right)
    private readonly Vector3[] directionVectors = new Vector3[]
    {
        Vector3.up,        // 上 (↑)
        Vector3.down,      // 下 (↓)
        Vector3.left,      // 左 (←) - 修正：← 表示向左移动
        Vector3.right      // 右 (→) - 修正：→ 表示向右移动
    };

    // 方向数字对应的箭头符号
    private readonly string[] directionSymbols = new string[]
    {
        "↑",  // 上
        "↓",  // 下
        "→",  // 左
        "←"   // 右
    };

    private void Awake()
    {
        // 获取主相机引用
        mainCamera = Camera.main;
    }

    private void Start()
    {
        // 创建六个面上的箭头
        CreateFaceArrows();

        if (randomizeOnStart)
        {
            RandomizeDirection();
        }
    }

    private void Update()
    {
        // 处理移动
        if (isMoving)
        {
            MoveTowardsTarget();
        }

        // 移动端优化：只有需要时才更新朝向
        if (alwaysFaceCamera && mainCamera != null)
        {
            for (int i = 0; i < 6; i++)
            {
                if (faceArrows[i] != null)
                {
                    UpdateArrowFacing(faceArrows[i]);
                }
            }
        }

        // 定期检查距离优化性能
        if (Time.frameCount % 30 == 0)
        {
            AdjustArrowsForDistance();
        }
    }

    /// <summary>
    /// 处理移动端点击 - 开始移动10格
    /// </summary>
    public void OnCubeTapped()
    {
        if (isMoving || isWaitingForStep) return; // 正在移动时不能再次点击

        // 开始向箭头方向移动10格
        StartMovingSequence(moveSteps);
    }

    /// <summary>
    /// 开始移动序列
    /// </summary>
    public void StartMovingSequence(int steps)
    {
        if (isMoving || isWaitingForStep) return;

        stepsRemaining = steps;
        Debug.Log($"立方体 {gameObject.name} 开始移动 {arrowSymbol} 方向，剩余 {stepsRemaining} 格");

        // 开始第一步移动
        TryNextStep();
    }

    /// <summary>
    /// 尝试下一步移动
    /// </summary>
    private void TryNextStep()
    {
        if (stepsRemaining <= 0)
        {
            // 移动完成，销毁立方体
            DestroyCube();
            return;
        }

        Vector3 nextPosition = transform.position + worldDirection * moveDistance;

        // 检查目标位置是否有障碍物
        if (!IsPositionOccupied(nextPosition))
        {
            // 无障碍物，继续移动
            StartMoving(worldDirection, nextPosition);
        }
        else
        {
            // 有障碍物，等待障碍物移开
            Debug.Log($"立方体 {gameObject.name} 第 {moveSteps - stepsRemaining + 1} 步被阻挡，等待中...");
            StartCoroutine(WaitForClearPath(nextPosition));
        }
    }

    /// <summary>
    /// 等待路径清空
    /// </summary>
    private IEnumerator WaitForClearPath(Vector3 targetPos)
    {
        isWaitingForStep = true;

        float checkInterval = 0.5f;
        float maxWaitTime = 5f;
        float elapsedTime = 0f;

        while (elapsedTime < maxWaitTime)
        {
            if (!IsPositionOccupied(targetPos))
            {
                isWaitingForStep = false;
                StartMoving(worldDirection, targetPos);
                yield break;
            }

            elapsedTime += checkInterval;
            yield return new WaitForSeconds(checkInterval);
        }

        Debug.LogWarning($"立方体 {gameObject.name} 等待超时，停止移动");
        isWaitingForStep = false;
        stepsRemaining = 0;

        OnMoveCompleted?.Invoke();
    }

    /// <summary>
    /// 检查位置是否被占用
    /// </summary>
    private bool IsPositionOccupied(Vector3 position)
    {
        float checkRadius = 0.4f;

        Collider[] colliders = Physics.OverlapSphere(position, checkRadius, obstacleLayer);

        foreach (Collider col in colliders)
        {
            if (col.gameObject != gameObject)
            {
                return true;
            }
        }

        return false;
    }

    /// <summary>
    /// 开始移动
    /// </summary>
    private void StartMoving(Vector3 direction, Vector3 targetPos)
    {
        isMoving = true;
        moveDirection = direction;
        targetPosition = targetPos;
    }

    /// <summary>
    /// 向目标位置移动
    /// </summary>
    private void MoveTowardsTarget()
    {
        float step = moveSpeed * Time.deltaTime;
        transform.position = Vector3.MoveTowards(transform.position, targetPosition, step);

        if (Vector3.Distance(transform.position, targetPosition) < 0.01f)
        {
            transform.position = targetPosition;
            isMoving = false;

            stepsRemaining--;
            Debug.Log($"立方体 {gameObject.name} 向 {arrowSymbol} 移动一步，剩余 {stepsRemaining} 格");

            TryNextStep();
        }
    }

    /// <summary>
    /// 销毁立方体
    /// </summary>
    private void DestroyCube()
    {
        Debug.Log($"立方体 {gameObject.name} 完成{moveSteps}格移动，即将销毁");

        OnCubeDestroyed?.Invoke();

        StartCoroutine(DestroyWithEffect());
    }

    /// <summary>
    /// 带效果的销毁
    /// </summary>
    private IEnumerator DestroyWithEffect()
    {
        float duration = 0.3f;
        float elapsed = 0f;
        Vector3 originalScale = transform.localScale;

        while (elapsed < duration)
        {
            elapsed += Time.deltaTime;
            float t = elapsed / duration;
            transform.localScale = Vector3.Lerp(originalScale, Vector3.zero, t);
            yield return null;
        }

        Destroy(gameObject);
    }

    /// <summary>
    /// 创建六个面上的箭头
    /// </summary>
    private void CreateFaceArrows()
    {
        for (int i = 0; i < 6; i++)
        {
            GameObject arrowObj = new GameObject($"FaceArrow_{i}");
            arrowObj.transform.parent = transform;

            Vector3 localPosition = faceCenters[i] + faceNormals[i] * arrowOffset;
            arrowObj.transform.localPosition = localPosition;

            Quaternion rotation = Quaternion.LookRotation(faceNormals[i]);
            if (i == 4)
            {
                rotation = Quaternion.LookRotation(faceNormals[i], Vector3.forward);
            }
            else if (i == 5)
            {
                rotation = Quaternion.LookRotation(faceNormals[i], Vector3.back);
            }
            arrowObj.transform.localRotation = rotation;

            TextMeshPro textMesh = arrowObj.AddComponent<TextMeshPro>();
            textMesh.fontSize = arrowSize * 10;
            textMesh.color = arrowColor;
            textMesh.alignment = TextAlignmentOptions.Center;
            textMesh.fontStyle = FontStyles.Bold;
            textMesh.enableWordWrapping = false;
            textMesh.overflowMode = TextOverflowModes.Overflow;
            textMesh.outlineWidth = 0.15f;
            textMesh.outlineColor = Color.black;
            textMesh.text = "?";

            faceArrows[i] = arrowObj;
            arrowTexts[i] = textMesh;
        }
    }

    /// <summary>
    /// 更新箭头面向相机
    /// </summary>
    private void UpdateArrowFacing(GameObject arrow)
    {
        if (arrow == null || mainCamera == null) return;

        Vector3 directionToCamera = mainCamera.transform.position - arrow.transform.position;
        directionToCamera.y = 0;

        if (directionToCamera != Vector3.zero)
        {
            arrow.transform.rotation = Quaternion.LookRotation(directionToCamera);
        }
    }

    /// <summary>
    /// 根据距离调整箭头显示
    /// </summary>
    private void AdjustArrowsForDistance()
    {
        if (mainCamera == null) return;

        float distanceToCamera = Vector3.Distance(transform.position, mainCamera.transform.position);
        bool shouldShow = distanceToCamera < 20f;

        for (int i = 0; i < 6; i++)
        {
            if (faceArrows[i] != null)
            {
                faceArrows[i].SetActive(shouldShow);

                if (shouldShow && arrowTexts[i] != null)
                {
                    float scaleFactor = Mathf.Clamp(15f / distanceToCamera, 0.8f, 2f);
                    arrowTexts[i].fontSize = arrowSize * 10 * scaleFactor;
                }
            }
        }
    }

    /// <summary>
    /// 更新所有箭头显示的符号
    /// </summary>
    private void UpdateAllArrowSymbols()
    {
        for (int i = 0; i < 6; i++)
        {
            if (arrowTexts[i] != null)
            {
                arrowTexts[i].text = arrowSymbol;
                arrowTexts[i].color = arrowColor;
            }
        }
    }

    /// <summary>
    /// 随机生成一个方向
    /// </summary>
    public void RandomizeDirection()
    {
        int randomIndex = Random.Range(0, 4);
        worldDirection = directionVectors[randomIndex];
        arrowSymbol = directionSymbols[randomIndex];

        Debug.Log($"立方体 {gameObject.name} 的随机方向: {arrowSymbol} -> 将向 {worldDirection} 移动");

        UpdateAllArrowSymbols();
    }

    /// <summary>
    /// 手动设置方向
    /// </summary>
    public void SetDirection(int directionNumber)
    {
        if (directionNumber >= 1 && directionNumber <= 4)
        {
            int index = directionNumber - 1;
            worldDirection = directionVectors[index];
            arrowSymbol = directionSymbols[index];

            Debug.Log($"立方体 {gameObject.name} 设置方向: {arrowSymbol} -> 将向 {worldDirection} 移动");

            UpdateAllArrowSymbols();
        }
    }

    /// <summary>
    /// 设置箭头大小
    /// </summary>
    public void SetArrowSize(float size)
    {
        arrowSize = size;
        for (int i = 0; i < 6; i++)
        {
            if (arrowTexts[i] != null)
            {
                arrowTexts[i].fontSize = arrowSize * 10;
            }
        }
    }

    /// <summary>
    /// 设置箭头颜色
    /// </summary>
    public void SetArrowColor(Color color)
    {
        arrowColor = color;
        for (int i = 0; i < 6; i++)
        {
            if (arrowTexts[i] != null)
            {
                arrowTexts[i].color = color;
            }
        }
    }

    /// <summary>
    /// 获取移动状态
    /// </summary>
    public bool IsMoving()
    {
        return isMoving || isWaitingForStep;
    }

    /// <summary>
    /// 获取剩余步数
    /// </summary>
    public int GetRemainingSteps()
    {
        return stepsRemaining;
    }

    /// <summary>
    /// 获取当前移动方向
    /// </summary>
    public Vector3 GetMoveDirection()
    {
        return worldDirection;
    }

    private void OnDestroy()
    {
        for (int i = 0; i < 6; i++)
        {
            if (faceArrows[i] != null)
            {
                Destroy(faceArrows[i]);
            }
        }
    }

#if UNITY_EDITOR
    private void OnDrawGizmosSelected()
    {
        if (!Application.isPlaying)
        {
            Gizmos.color = arrowColor;

            for (int i = 0; i < 6; i++)
            {
                Vector3 worldPos = transform.TransformPoint(faceCenters[i]);
                Vector3 worldNormal = transform.TransformDirection(faceNormals[i]);

                Gizmos.DrawSphere(worldPos, 0.05f);
                Gizmos.DrawLine(worldPos, worldPos + worldNormal * 0.3f);
            }

            // 绘制移动方向预览
            if (worldDirection != Vector3.zero)
            {
                Gizmos.color = Color.green;
                Vector3 startPos = transform.position;
                Vector3 endPos = startPos + worldDirection * 2f;
                Gizmos.DrawLine(startPos, endPos);

                // 绘制箭头头部
                Vector3 right = Vector3.Cross(Vector3.up, worldDirection).normalized;
                if (right.magnitude < 0.1f)
                {
                    right = Vector3.Cross(Vector3.forward, worldDirection).normalized;
                }

                float headSize = 0.3f;
                Vector3 headBack = endPos - worldDirection * headSize;
                Gizmos.DrawLine(endPos, headBack + right * headSize * 0.5f);
                Gizmos.DrawLine(endPos, headBack - right * headSize * 0.5f);
            }
        }
    }

    /// <summary>
    /// 获取当前箭头符号
    /// </summary>
    public string GetArrowSymbol()
    {
        return arrowSymbol;
    }

    /// <summary>
    /// 停止所有移动
    /// </summary>
    public void StopAllMovement()
    {
        StopAllCoroutines();
        isMoving = false;
        isWaitingForStep = false;
        stepsRemaining = 0;
    }

    public void ResetMovementState()
    {
        // 停止所有协程
        StopAllCoroutines();

        // 重置状态变量
        isMoving = false;
        isWaitingForStep = false;
        stepsRemaining = 0;
        targetPosition = Vector3.zero;
        moveDirection = Vector3.zero;

        Debug.Log($"立方体 {gameObject.name} 移动状态已重置");
    }

#endif
}