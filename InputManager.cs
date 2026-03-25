using UnityEngine;
using UnityEngine.EventSystems;

public enum SwipeDirection
{
    None,
    Up,
    Down,
    Left,
    Right
}

public class InputManager : MonoBehaviour
{
    public static InputManager Instance { get; private set; }

    [Header("Settings")]
    [SerializeField] private float minSwipeDistance = 30f;

    private Vector2 touchStartPosition;
    private bool isTouching = false;
    private bool canSwipe = true;

    public event System.Action<SwipeDirection> OnSwipe;

    void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
        }
        else
        {
            Destroy(gameObject);
        }
    }

    void Update()
    {
        if (!canSwipe) return;

        if (Input.touchCount > 0)
        {
            Touch touch = Input.GetTouch(0);

            switch (touch.phase)
            {
                case TouchPhase.Began:
                    touchStartPosition = touch.position;
                    isTouching = true;
                    break;

                case TouchPhase.Ended:
                    if (isTouching)
                    {
                        Vector2 touchEndPosition = touch.position;
                        HandleSwipe(touchStartPosition, touchEndPosition);
                    }
                    isTouching = false;
                    break;
            }
        }

        HandleMouseInput();
    }

    private void HandleMouseInput()
    {
        if (!canSwipe) return;

        if (Input.GetMouseButtonDown(0))
        {
            touchStartPosition = Input.mousePosition;
            isTouching = true;
        }
        else if (Input.GetMouseButtonUp(0) && isTouching)
        {
            Vector2 mouseEndPosition = Input.mousePosition;
            HandleSwipe(touchStartPosition, mouseEndPosition);
            isTouching = false;
        }
    }

    private void HandleSwipe(Vector2 start, Vector2 end)
    {
        Vector2 swipeDirection = end - start;
        float distance = swipeDirection.magnitude;

        if (distance < minSwipeDistance) return;

        swipeDirection.Normalize();

        float absX = Mathf.Abs(swipeDirection.x);
        float absY = Mathf.Abs(swipeDirection.y);

        SwipeDirection direction;
        if (absX > absY)
        {
            direction = swipeDirection.x > 0 ? SwipeDirection.Right : SwipeDirection.Left;
        }
        else
        {
            direction = swipeDirection.y > 0 ? SwipeDirection.Up : SwipeDirection.Down;
        }

        OnSwipe?.Invoke(direction);
    }

    public void EnableSwipe() => canSwipe = true;
    public void DisableSwipe() => canSwipe = false;
}
