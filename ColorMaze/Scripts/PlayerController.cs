using UnityEngine;
using System.Collections;

public class PlayerController : MonoBehaviour
{
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
        Debug.Log($"Player position set to: {startPos}");
        isMoving = false;
        
        if (InputManager.Instance != null)
            InputManager.Instance.EnableSwipe();
        
        CheckAndColorCell();
    }

    private void HandleSwipe(SwipeDirection direction)
    {
        if (isMoving) return;

        int steps = UnityEngine.Random.Range(1, 6);
        Debug.Log($"Move direction: {direction}, steps: {steps}");

        switch (direction)
        {
            case SwipeDirection.Up: MoveInDirection(0, -1, steps); break;
            case SwipeDirection.Down: MoveInDirection(0, 1, steps); break;
            case SwipeDirection.Left: MoveInDirection(-1, 0, steps); break;
            case SwipeDirection.Right: MoveInDirection(1, 0, steps); break;
        }
    }

    private void MoveInDirection(int dirX, int dirY, int steps)
    {
        if (mazeManager == null) return;

        if (uiManager != null)
        {
            uiManager.UpdateStepDisplay(steps);
        }

        int targetX = currentX;
        int targetY = currentY;

        for (int i = 0; i < steps; i++)
        {
            int nextX = targetX + dirX;
            int nextY = targetY + dirY;

            if (mazeManager.IsOutOfBounds(nextX, nextY) || mazeManager.IsWall(nextX, nextY))
                break;

            targetX = nextX;
            targetY = nextY;
        }

        if (targetX != currentX || targetY != currentY)
        {
            Vector3 newTargetPos = mazeManager.GetCellWorldPositionByIndex(targetX, targetY);
            Debug.Log($"Moving from {currentX},{currentY} to {targetX},{targetY}, pos: {newTargetPos}");
            StartCoroutine(MoveToTarget(newTargetPos, targetX, targetY, dirX, dirY));
        }
    }

    private IEnumerator MoveToTarget(Vector3 target, int newX, int newY, int dirX, int dirY)
    {
        isMoving = true;
        if (InputManager.Instance != null) InputManager.Instance.DisableSwipe();
        if (SoundManager.Instance != null) SoundManager.Instance.PlayMove();

        Vector3 startPos = transform.position;
        int totalSteps = Mathf.Abs(newX - currentX) + Mathf.Abs(newY - currentY);
        float moveDuration = 0.2f * totalSteps;
        float elapsed = 0;

        while (elapsed < moveDuration)
        {
            elapsed += Time.deltaTime;
            float t = elapsed / moveDuration;
            t = Mathf.Sin(t * Mathf.PI * 0.5f);
            transform.position = Vector3.Lerp(startPos, target, t);

            float progress = elapsed / moveDuration;
            int currentStep = Mathf.FloorToInt(progress * totalSteps);
            
            int colorX = currentX + dirX * currentStep;
            int colorY = currentY + dirY * currentStep;
            mazeManager.ColorCell(colorX, colorY);
            
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