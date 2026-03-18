using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class RopeEnd : MonoBehaviour
{

    private RopeManager.Rope rope;
    private Vector3 offset;
    private Camera mainCam;

    void Awake()
    {
        mainCam
= Camera.main;
        if (mainCam == null) mainCam = FindObjectOfType<Camera>();
    }

    public void Init(RopeManager.Rope rope)
    {
        this.rope = rope;
    }

    void OnMouseDown()
    {
        if (mainCam == null) return;
        Vector3 mouseWorldPos = mainCam.ScreenToWorldPoint(Input.mousePosition);
        mouseWorldPos
.z = transform.position.z;
        offset
= transform.position - mouseWorldPos;
    }

    void OnMouseDrag()
    {
        if (mainCam == null || rope == null) return;
        Vector3 mouseWorldPos = mainCam.ScreenToWorldPoint(Input.mousePosition);
        mouseWorldPos
.z = transform.position.z;
        transform
.position = mouseWorldPos + offset;
        rope
.UpdateLinePositions(); // 仅更新绳子位置，不检测胜利
    }

    void OnMouseUp()
    {
        // ✅ 彻底注释掉，绝不自动触发胜利检测！
        // RopeManager.Instance.CheckWinCondition();
    }
}