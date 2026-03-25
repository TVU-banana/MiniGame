using UnityEngine;
using System.Collections;

public class PlayerController : MonoBehaviour
{
    [Header("Settings")]
    [SerializeField] private float moveDuration = 0.15f;

    private bool isMoving = false;
    private MazeManager mazeManager;
    private GameUIManager uiManager;
    private int currentX;
    private int currentY;

    void Awake()
    {
        Debug.Log("PlayerController Awake");
    }

    void Start()
    {
        if (InputManager.Instance != null)
        {
            InputManager.Instance.OnSwipe += HandleSwipe;
        }
    }

    void OnDestroy()
    {
        if (InputManager.Instance != null)
        {
            InputManager.Instance.OnSwipe -= HandleSwipe;
        }
    }

    public void Initialize(int startX, int startY)
    {
        Debug.Log($"PlayerController.Initialize: {startX},{startY}");
        
        if (mazeManager == null) mazeManager = MazeManager.Instance;
        if (uiManager == null) uiManager = GameUIManager.Instance;
        
        if (mazeManager == null)
        {
            Debug.LogError("MazeManager is null!");
            return;
        }

        currentX = startX;
        currentY = startY;
        Vector3 startPos = mazeManager.GetCellWorldPositionByIndex(startX, startY);
        transform.position = startPos;
        isMoving = false;
        
        if (InputManager.Instance != null)
            InputManager.Instance.EnableSwipe();
        
        CheckAndColorCell();
    }

    private void HandleSwipe(SwipeDirection direction)
    {
        if (isMoving) return;

        switch (direction)
        {
            case SwipeDirection.Up: MoveInDirection(0, -1); break;
            case SwipeDirection.Down: MoveInDirection(0, 1); break;
            case SwipeDirection.Left: MoveInDirection(-1, 0); break;
            case SwipeDirection.Right: MoveInDirection(1, 0); break;
        }
    }

    private void MoveInDirection(int dirX, int dirY)
    {
        if (mazeManager == null) return;

        int nextX = currentX + dirX;
        int nextY = currentY + dirY;

        if (!mazeManager.IsOutOfBounds(nextX, nextY) && !mazeManager.IsWall(nextX, nextY))
        {
            Vector3 newTargetPos = mazeManager.GetCellWorldPositionByIndex(nextX, nextY);
            StartCoroutine(MoveToTarget(newTargetPos, nextX, nextY));
        }
    }

    private IEnumerator MoveToTarget(Vector3 target, int newX, int newY)
    {
        isMoving = true;
        if (InputManager.Instance != null) InputManager.Instance.DisableSwipe();
        if (SoundManager.Instance != null) SoundManager.Instance.PlayMove();

        Vector3 startPos = transform.position;
        float elapsed = 0;

        while (elapsed < moveDuration)
        {
            elapsed += Time.deltaTime;
            float t = elapsed / moveDuration;
            t = Mathf.Sin(t * Mathf.PI * 0.5f);
            transform.position = Vector3.Lerp(startPos, target, t);
            yield return null;
        }

        transform.position = target;
        currentX = newX;
        currentY = newY;
        
        CheckAndColorCell();
        
        isMoving = false;
        if (InputManager.Instance != null) InputManager.Instance.EnableSwipe();
    }

    private void CheckAndColorCell()
    {
        if (mazeManager == null || uiManager == null) return;
        
        mazeManager.ColorCell(currentX, currentY);
        uiManager.UpdateProgressDisplay(mazeManager.GetProgress());
        if (SoundManager.Instance != null) SoundManager.Instance.PlayColor();
    }

    public void ResetPosition(int startX, int startY)
    {
        StopAllCoroutines();
        isMoving = false;
        Initialize(startX, startY);
    }
}