using UnityEngine;

public class CameraController : MonoBehaviour
{
    [Header("Camera Settings")]
    public float cameraHeight = 12f;
    public float cameraDepth = 12f;
    public float lookAtHeight = 0f;

    [Header("Target")]
    public Transform targetPoint;

    [Header("View Angle")]
    public float viewAngleX = 45f;

    private Vector3 targetPosition;
    private Vector3 lookAtPosition;

    void Start()
    {
        Setup45DegreeView();
    }

    public void Setup45DegreeView()
    {
        transform.position = new Vector3(0, cameraHeight, cameraDepth);
        transform.rotation = Quaternion.Euler(viewAngleX, 0, 0);

        if (targetPoint != null)
        {
            targetPosition = targetPoint.position;
        }
        else
        {
            targetPosition = Vector3.zero;
        }

        lookAtPosition = new Vector3(targetPosition.x, lookAtHeight, targetPosition.z);
        transform.LookAt(lookAtPosition);
    }

    public void SetPosition(float x, float y, float z)
    {
        cameraHeight = y;
        cameraDepth = z;
        Setup45DegreeView();
    }

    public void SetViewAngle(float angleX)
    {
        viewAngleX = angleX;
        transform.rotation = Quaternion.Euler(viewAngleX, 0, 0);
    }

    public void FocusOnPoint(Vector3 point)
    {
        targetPosition = point;
        lookAtPosition = new Vector3(point.x, lookAtHeight, point.z);
        transform.LookAt(lookAtPosition);
    }

    public void ResetToDefault()
    {
        Setup45DegreeView();
    }

    void OnValidate()
    {
        if (Application.isPlaying) return;
        Setup45DegreeView();
    }
}