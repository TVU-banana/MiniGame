using UnityEngine;

public class FinishLine : MonoBehaviour
{
    [Header("角色生命脚本")]
    public Health playerHealth;  // 角色的Health脚本（Slider+HPText_play）

    [Header("默认伤害值")]
    public int defaultDamage = 5; // 如果Enemy没血量字段，使用默认值

    private void OnTriggerEnter2D(Collider2D other)
    {
        // 只处理 Tag = "Enemy" 的对象
        if (other.CompareTag("Enemy"))
        {
            int damage = defaultDamage;

            // 获取Enemy脚本
            Enemy enemy = other.GetComponent<Enemy>();
            if (enemy != null)
            {
                damage = enemy.GetCurrentHP(); // 使用怪物当前生命值
            }

            // 扣血并更新UI
            if (playerHealth != null)
            {
                playerHealth.TakeDamage(damage);
            }

            // 销毁怪物实体
            Destroy(other.gameObject);
        }
    }
}