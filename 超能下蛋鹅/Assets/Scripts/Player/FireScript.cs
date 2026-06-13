using UnityEngine;

/// <summary>
/// 发射脚本：根据鼠标点击位置计算抛物线初速度
/// 逻辑优先级：
/// 1. 优先使用“最小速度解”（最优抛物线）
/// 2. 若目标在上方但最小解不成立 → 使用“最高点解”
/// 3. 若目标在下方 → 尝试用最小速度求角度
/// 4. 若仍不可达 → 直线兜底
/// </summary>
public class FireScript : MonoBehaviour
{
    [Header("发射设置")]
    public GameObject eggPrefab;   // 子弹预制体
    public Transform firePoint;    // 发射点

    [Header("最小发射速度")]
    public float minSpeed = 10f;    // 最低初速度（兜底/下方解用）

    [Header("轨迹预测")]
    public LineRenderer lineRenderer;
    public int pointCount = 30;     // 点数量（越多越平滑）
    public float timeStep = 0.1f;   // 每个点的时间间隔（控制长度）

    private Camera cam;
    private bool canFire = false;
    private TurnManager turnManager;//发射管理

    void Awake()
    {
        cam = Camera.main;

        // 自动获取（优先找自己）
        lineRenderer = GetComponent<LineRenderer>();

        // 如果自己没有 → 去子物体找
        if (lineRenderer == null)
        {
            lineRenderer = GetComponentInChildren<LineRenderer>();
        }

        // 仍然没有 → 报错提示
        if (lineRenderer == null)
        {
            Debug.LogError("没有找到 LineRenderer！请检查是否添加组件！");
        }
    }

    void Start()
    {
        turnManager = FindObjectOfType<TurnManager>();

        lineRenderer.textureMode = LineTextureMode.Tile;

        // 控制点密度
        lineRenderer.material.mainTextureScale = new Vector2(12f, 1f);

        // 半透明
        Color c = new Color(1f, 1f, 1f, 0.6f);
        lineRenderer.startColor = c;
        lineRenderer.endColor = c;

        // 宽度
        lineRenderer.startWidth = 0.08f;
        lineRenderer.endWidth = 0.08f;
    }

    void Update()
    {
        if (!canFire) return;

        if (Input.GetMouseButton(0))
        {
            DrawTrajectory();
        }

        if (Input.GetMouseButtonUp(0))
        {
            Fire();

            lineRenderer.positionCount = 0; // 清除轨迹

            canFire = false;
            turnManager.OnPlayerFired();
        }
    }

    public void SetCanFire(bool value)
    {
        canFire = value;
    }

    /// <summary>
    /// 实例化子弹并设置初速度
    /// </summary>
    void Fire()
    {
        Vector2 start = firePoint.position;
        Vector2 target = cam.ScreenToWorldPoint(Input.mousePosition);

        GameObject egg = Instantiate(eggPrefab, start, Quaternion.identity);

        if (egg.TryGetComponent(out Rigidbody2D rb))
        {
            rb.velocity = GetVelocity(start, target, rb.gravityScale);
        }
    }

    /// <summary>
    /// 计算发射初速度
    /// </summary>
    /// <param name="start">发射点</param>
    /// <param name="target">目标点</param>
    /// <param name="gravityScale">刚体重力系数</param>
    /// <returns>初速度向量</returns>
    Vector2 GetVelocity(Vector2 start, Vector2 target, float gravityScale)
    {
        // =========================
        // 基础参数
        // =========================

        float g = Mathf.Abs(Physics2D.gravity.y * gravityScale); // 重力加速度（正值）

        Vector2 diff = target - start;
        float dx = diff.x;
        float dy = diff.y;

        float absDx = Mathf.Abs(dx);
        float r = diff.magnitude; // 直线距离

        // =========================
        // 1. 最小速度解（优先尝试）
        // =========================

        float vMin = Mathf.Sqrt(g * (dy + r));

        if (!float.IsNaN(vMin))
        {
            // 计算发射角
            float angle = Mathf.Atan2(dy + r, absDx);

            // 构建方向（恢复左右方向）
            Vector2 dir = new Vector2(Mathf.Cos(angle), Mathf.Sin(angle));
            dir.x *= Mathf.Sign(dx);

            Vector2 velocity = dir * vMin;

            // 判断目标是否位于“上升段”
            float vx = velocity.x;
            float vy = velocity.y;

            float tTarget = (absDx > 0.001f) ? absDx / Mathf.Abs(vx) : 0f;
            float tPeak = vy / g;

            // 若在上升段 → 可用
            if (tTarget <= tPeak)
            {
                return velocity;
            }
        }

        // =========================
        // 2. 目标在上方 → 使用最高点解
        // =========================

        if (dy > 0)
        {
            float vy_new = Mathf.Sqrt(2 * g * dy); // 到达最高点所需竖直速度
            float t = vy_new / g;                  // 到达最高点时间
            float vx_new = dx / t;                 // 水平速度

            return new Vector2(vx_new, vy_new);
        }

        // =========================
        // 3. 目标在下方 → 用最小速度解角度
        // =========================

        float v = minSpeed;

        float v2 = v * v;
        float v4 = v2 * v2;

        // 判别式：判断是否存在解
        float D = v4 - g * (g * dx * dx + 2 * dy * v2);

        // 有解：可以命中
        if (D >= 0)
        {
            float sqrtD = Mathf.Sqrt(D);

            // 选择低抛角（更自然）
            float tanTheta = (v2 - sqrtD) / (g * absDx);

            float angle = Mathf.Atan(tanTheta);

            Vector2 dir = new Vector2(Mathf.Cos(angle), Mathf.Sin(angle));
            dir.x *= Mathf.Sign(dx);

            return dir * v;
        }

        // =========================
        // 4. 无解 → 直线兜底
        // =========================

        return diff.normalized * v;
    }

    //轨迹
    void DrawTrajectory()
    {
        Vector2 start = firePoint.position;
        Vector2 target = cam.ScreenToWorldPoint(Input.mousePosition);

        Vector2 velocity = GetVelocity(start, target, 1f);

        float g = Mathf.Abs(Physics2D.gravity.y);

        int index = 0;

        for (int i = 0; i < pointCount; i++)
        {
            float t = i * timeStep;

            float x = start.x + velocity.x * t;
            float y = start.y + velocity.y * t - 0.5f * g * t * t;

            //（实现“点状”）
            if (i % 2 == 0)
            {
                lineRenderer.positionCount = index + 1;
                lineRenderer.SetPosition(index, new Vector3(x, y, 0));
                index++;
            }
        }
    }
}
