using UnityEngine;

public class InputManager : MonoBehaviour
{
    public static InputManager Instance { get; private set; }

    [Header("References")]
    public GameManager gameManager;

    private Vector2 touchStartPosition;
    private Vector2 touchCurrentPosition;
    private bool isTouching = false;

    void Awake()
    {
        Instance = this;
    }

    void Update()
    {
        HandleInput();
    }

    void HandleInput()
    {
        if (Input.GetMouseButtonDown(0))
        {
            touchStartPosition = Input.mousePosition;
            isTouching = true;
            OnTouchStart(GetWorldPosition(touchStartPosition));
        }
        else if (Input.GetMouseButton(0))
        {
            touchCurrentPosition = Input.mousePosition;
            OnTouchMove(GetWorldPosition(touchCurrentPosition));
        }
        else if (Input.GetMouseButtonUp(0))
        {
            isTouching = false;
            OnTouchEnd();
        }

        if (Input.touchCount > 0)
        {
            Touch touch = Input.GetTouch(0);

            switch (touch.phase)
            {
                case TouchPhase.Began:
                    touchStartPosition = touch.position;
                    isTouching = true;
                    OnTouchStart(GetWorldPosition(touchStartPosition));
                    break;

                case TouchPhase.Moved:
                    touchCurrentPosition = touch.position;
                    OnTouchMove(GetWorldPosition(touchCurrentPosition));
                    break;

                case TouchPhase.Ended:
                    isTouching = false;
                    OnTouchEnd();
                    break;
            }
        }
    }

    Vector3 GetWorldPosition(Vector2 screenPosition)
    {
        Vector3 worldPos = Vector3.zero;

        Ray ray = Camera.main.ScreenPointToRay(screenPosition);
        Plane groundPlane = new Plane(Vector3.up, Vector3.zero);

        float distance;
        if (groundPlane.Raycast(ray, out distance))
        {
            worldPos = ray.GetPoint(distance);
        }

        return worldPos;
    }

    void OnTouchStart(Vector3 worldPosition)
    {
        switch (GameManager.Instance?.currentState)
        {
            case GameState.Menu:
                CheckMenuButtonClick(worldPosition);
                break;

            case GameState.Matching:
                CheckMatchingButtonClick(worldPosition);
                break;

            case GameState.Playing:
                OnPlayingTouchStart(worldPosition);
                break;
        }
    }

    void OnTouchMove(Vector3 worldPosition)
    {
        if (GameManager.Instance?.currentState == GameState.Playing)
        {
        }
    }

    void OnTouchEnd()
    {
    }

    void CheckMenuButtonClick(Vector3 worldPosition)
    {
        if (MenuController.Instance != null)
        {
            MenuController.Instance.OnButtonClicked();
        }
    }

    void CheckMatchingButtonClick(Vector3 worldPosition)
    {
        if (MatchingController.Instance != null)
        {
            MatchingController.Instance.OnButtonClicked();
        }
    }

    void OnPlayingTouchStart(Vector3 worldPosition)
    {
    }

    public bool IsTouching()
    {
        return isTouching;
    }

    public Vector2 GetTouchDelta()
    {
        return touchCurrentPosition - touchStartPosition;
    }
}