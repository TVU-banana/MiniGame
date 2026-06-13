using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class Health : MonoBehaviour
{
    [Header("角色生命")]
    public int maxHP = 100;
    private int currentHP;

    [Header("UI引用")]
    public Slider hpSlider;           // Slider UI
    public TextMeshProUGUI hpText;   // Slider 上的 TMP 文本

    void Start()
    {
        // 初始化生命
        currentHP = maxHP;

        // 初始化UI
        UpdateUI();
    }

    public void SetHP(int hp)
    {
        maxHP = hp;
        currentHP = hp;
        UpdateUI();
    }

    // 受到伤害
    public void TakeDamage(int damage)
    {
        currentHP -= damage;
        currentHP = Mathf.Max(currentHP, 0); // 防止小于0
        UpdateUI();
    }

    // 回复生命
    public void Heal(int amount)
    {
        currentHP += amount;
        currentHP = Mathf.Min(currentHP, maxHP);
        UpdateUI();
    }

    // 更新Slider和Text
    private void UpdateUI()
    {
        if (hpSlider != null)
        {
            hpSlider.maxValue = maxHP;
            hpSlider.value = currentHP;
        }

        if (hpText != null)
        {
            hpText.text = $"{currentHP} / {maxHP}";
        }
    }
}