using UnityEngine;
using TMPro;

public class Enemy : MonoBehaviour
{
    public int maxHP = 10;
    private int currentHP;

    private TextMeshPro hpText;

    void Start()
    {
        currentHP = maxHP;

        // 获取子物体文本组件
        hpText = GetComponentInChildren<TextMeshPro>();

        UpdateHPText();
    }

    private void OnCollisionEnter2D(Collision2D collision)
    {
        if (collision.gameObject.CompareTag("Player"))
        {
            TakeDamage(2);
            
        }
    }

    void TakeDamage(int damage)
    {
        currentHP -= damage;
        currentHP = Mathf.Max(0, currentHP);

        UpdateHPText();

        if (currentHP <= 0)
        {
            Destroy(gameObject);
        }
    }

    void UpdateHPText()
    {
        if (hpText != null)
        {
            hpText.text = currentHP.ToString();
        }
    }
}