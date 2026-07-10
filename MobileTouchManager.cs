using UnityEngine;
using System.Collections.Generic;

/// <summary>
/// 移动端触摸检测管理器（增强版）
/// </summary>
public class MobileTouchManager : MonoBehaviour
{
    [Header("触摸设置")]
    [Tooltip("相机引用")]
    public Camera mainCamera;
    [Tooltip("检测层")]
    public LayerMask cubeLayer = -1;
    [Tooltip("是否显示点击效果")]
    public bool showTapEffect = true;
    [Tooltip("点击效果预制体")]
    public GameObject tapEffectPrefab;

    // 跟踪所有立方体
    private List<CubeFacesArrows> allCubes = new List<CubeFacesArrows>();

    private void Start()
    {
        if (mainCamera == null)
        {
            mainCamera = Camera.main;
        }

        // 查找场景中所有立方体
        FindAllCubes();
    }

    private void Update()
    {
        // 移动端触摸检测
        if (Input.touchCount > 0)
        {
            Touch touch = Input.GetTouch(0);

            if (touch.phase == TouchPhase.Began)
            {
                HandleTouch(touch.position);
            }
        }

        // 编辑器调试用（鼠标点击）
#if UNITY_EDITOR
        if (Input.GetMouseButtonDown(0))
        {
            HandleTouch(Input.mousePosition);
        }
#endif
    }

    /// <summary>
    /// 查找场景中所有立方体
    /// </summary>
    private void FindAllCubes()
    {
        CubeFacesArrows[] cubes = FindObjectsOfType<CubeFacesArrows>();
        allCubes.Clear();
        allCubes.AddRange(cubes);

        Debug.Log($"找到 {allCubes.Count} 个立方体");
    }

    /// <summary>
    /// 处理触摸/点击
    /// </summary>
    private void HandleTouch(Vector3 screenPosition)
    {
        Ray ray = mainCamera.ScreenPointToRay(screenPosition);
        RaycastHit hit;

        if (Physics.Raycast(ray, out hit, 100f, cubeLayer))
        {
            CubeFacesArrows cube = hit.collider.GetComponent<CubeFacesArrows>();

            if (cube != null && !cube.IsMoving())
            {
                // 触发立方体的点击事件 - 开始移动10格
                cube.OnCubeTapped();

                // 显示点击效果
                if (showTapEffect)
                {
                    ShowTapEffect(hit.point);
                }

                Debug.Log($"点击立方体 {cube.name}，开始移动10格");
            }
            else if (cube != null && cube.IsMoving())
            {
                Debug.Log($"立方体 {cube.name} 正在移动中，请稍后...");
            }
        }
    }

    /// <summary>
    /// 显示点击效果
    /// </summary>
    private void ShowTapEffect(Vector3 position)
    {
        if (tapEffectPrefab != null)
        {
            // 使用预制体
            GameObject effect = Instantiate(tapEffectPrefab, position, Quaternion.identity);
            Destroy(effect, 0.5f);
        }
        else
        {
            // 创建简单的默认效果
            StartCoroutine(CreateDefaultTapEffect(position));
        }
    }

    /// <summary>
    /// 创建默认点击效果
    /// </summary>
    private System.Collections.IEnumerator CreateDefaultTapEffect(Vector3 position)
    {
        GameObject effect = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        effect.transform.position = position;
        effect.transform.localScale = Vector3.one * 0.3f;

        Renderer renderer = effect.GetComponent<Renderer>();
        renderer.material.color = Color.yellow;
        renderer.material.SetColor("_EmissionColor", Color.yellow * 0.5f);

        // 添加发光效果
        Light pointLight = effect.AddComponent<Light>();
        pointLight.color = Color.yellow;
        pointLight.range = 2f;
        pointLight.intensity = 1f;

        // 动画效果
        float duration = 0.3f;
        float elapsed = 0f;
        Vector3 originalScale = effect.transform.localScale;

        while (elapsed < duration)
        {
            elapsed += Time.deltaTime;
            float t = elapsed / duration;

            // 放大然后消失
            effect.transform.localScale = originalScale * (1f + t);

            // 透明度变化
            Color color = renderer.material.color;
            color.a = 1f - t;
            renderer.material.color = color;

            pointLight.intensity = 1f - t;

            yield return null;
        }

        Destroy(effect);
    }

    /// <summary>
    /// 手动添加立方体到跟踪列表
    /// </summary>
    public void RegisterCube(CubeFacesArrows cube)
    {
        if (!allCubes.Contains(cube))
        {
            allCubes.Add(cube);

            // 监听销毁事件
            cube.OnCubeDestroyed += () => allCubes.Remove(cube);
        }
    }

    /// <summary>
    /// 获取所有立方体
    /// </summary>
    public List<CubeFacesArrows> GetAllCubes()
    {
        return new List<CubeFacesArrows>(allCubes);
    }

    /// <summary>
    /// 获取剩余立方体数量
    /// </summary>
    public int GetRemainingCubeCount()
    {
        // 清理已销毁的立方体
        allCubes.RemoveAll(cube => cube == null);
        return allCubes.Count;
    }
}