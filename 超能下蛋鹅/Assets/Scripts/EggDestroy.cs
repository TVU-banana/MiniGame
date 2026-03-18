using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class EggDestroy : MonoBehaviour
{
    public float destroyHeight = -5f; // ¿ÉÔÚInspectorµ÷

    void FixedUpdate()
    {
        if (transform.position.y < destroyHeight)
        {
            Destroy(gameObject);
        }
    }
}
