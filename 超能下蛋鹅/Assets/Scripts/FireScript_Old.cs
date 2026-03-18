using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class FireScript_Old : MonoBehaviour
{
    public GameObject eggPrefab;
    public Transform firePoint;

    public float maxPower = 15f;
    public float chargeSpeed = 10f;

    private float currentPower;
    private bool isCharging;

    private Camera cam;

    void Awake()
    {
        cam = Camera.main; // 缓存相机
    }

    void Update()
    {
        if (Input.GetMouseButtonDown(0))
        {
            isCharging = true;
            currentPower = 0f;
        }

        if (isCharging)
        {
            // 持续蓄力（自动限制最大值）
            currentPower = Mathf.Min(currentPower + chargeSpeed * Time.deltaTime, maxPower);
        }

        if (Input.GetMouseButtonUp(0) && isCharging)
        {
            Fire();
            isCharging = false;
        }
    }

    void Fire()
    {
        Vector2 direction = GetMouseDirection();

        // 防止点一下就发射（可选但推荐）
        //if (currentPower < 0.1f) return;

        GameObject egg = Instantiate(eggPrefab, firePoint.position, Quaternion.identity);

        if (egg.TryGetComponent(out Rigidbody2D rb))
        {
            rb.AddForce(direction * currentPower, ForceMode2D.Impulse);
        }
    }

    Vector2 GetMouseDirection()
    {
        Vector3 mousePos = Input.mousePosition;
        mousePos.z = 10f;

        Vector2 worldPos = cam.ScreenToWorldPoint(mousePos);
        return (worldPos - (Vector2)firePoint.position).normalized;
    }
}
