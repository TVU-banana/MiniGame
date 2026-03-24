using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Meteor : MonoBehaviour
{
    public float minForce = 0.1f;
    public float maxForce = 0.4f;
    public float maxDistance = 30f;

    private Rigidbody2D rb;
    private MeteorSpawner spawner;
    private Transform player;

    void Awake()
    {
        rb
= GetComponent<Rigidbody2D>();
        spawner
= FindObjectOfType<MeteorSpawner>();
        player
= FindObjectOfType<PlayerMeteor>().transform;
    }

    void OnEnable()
    {
        Vector2 dir = Random.insideUnitCircle.normalized;
        float force = Random.Range(minForce, maxForce);
        rb
.velocity = dir * force;
        Debug
.Log("【石头】" + gameObject.name + " 开始漂移");
    }

    void Update()
    {
        if (player == null) return;

        float dist = Vector2.Distance(transform.position, player.position);

        if (dist > maxDistance)
        {
            Debug
.Log("【石头】过远，自动回收: " + gameObject.name);
            spawner
.RemoveMeteor(gameObject);
        }
    }

    void OnCollisionEnter2D(Collision2D col)
    {
        PlayerMeteor p = col.collider.GetComponent<PlayerMeteor>();

        if (p != null)
        {
            Debug
.Log("【石头】" + gameObject.name + " 碰到玩家");

            float ratio = transform.localScale.x / p.currentScale;

            // 中型、大型才回收
            if (ratio > p.smallRatio)
            {
                spawner
.RemoveMeteor(gameObject);
                Debug
.Log("【石头】中型/大型，碰撞后回收");
            }

            p
.TryInteract(transform);
        }
    }
}
