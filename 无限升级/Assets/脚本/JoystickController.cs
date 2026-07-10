using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.EventSystems;

public class JoystickController : MonoBehaviour, IDragHandler, IPointerDownHandler, IPointerUpHandler
{
    public RectTransform joystickBG;    // 摇杆背景
    public RectTransform joystickKnob;  // 摇杆按钮
    public float moveLimit = 50f;       // 摇杆移动范围

    private Vector2 inputDirection;     // 摇杆输入方向
    private PlayerMeteor player;        // 玩家脚本引用

    void Awake()
    {
        // 获取玩家脚本
        player
= FindObjectOfType<PlayerMeteor>();
        // 初始化摇杆位置
        joystickKnob
.anchoredPosition = Vector2.zero;
    }

    /// <summary>
    /// 拖动摇杆时
    /// </summary>
    public void OnDrag(PointerEventData eventData)
    {
        // 计算摇杆偏移
        Vector2 direction = eventData.position - RectTransformUtility.WorldToScreenPoint(null, joystickBG.position);
        inputDirection
= (direction.magnitude > moveLimit) ? direction.normalized : direction / moveLimit;

        // 更新摇杆按钮位置
        joystickKnob
.anchoredPosition = inputDirection * moveLimit;

        // 传递输入给玩家
        if (player != null)
            player
.SetMoveInput(inputDirection);

        Debug
.Log($"【摇杆输入】方向：{inputDirection}");
    }

    /// <summary>
    /// 松开摇杆时
    /// </summary>
    public void OnPointerUp(PointerEventData eventData)
    {
        inputDirection
= Vector2.zero;
        joystickKnob
.anchoredPosition = Vector2.zero;

        // 停止玩家移动
        if (player != null)
            player
.SetMoveInput(inputDirection);

        Debug
.Log($"【摇杆输入】松开，停止移动");
    }

    /// <summary>
    /// 按下摇杆时
    /// </summary>
    public void OnPointerDown(PointerEventData eventData)
    {
        OnDrag(eventData); // 直接调用拖动逻辑
    }

    // 获取摇杆输入（备用）
    public Vector2 GetInputDirection()
    {
        return inputDirection;
    }
}
