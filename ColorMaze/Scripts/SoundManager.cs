using UnityEngine;

public class SoundManager : MonoBehaviour
{
    private static SoundManager _instance;
    public static SoundManager Instance
    {
        get
        {
            if (_instance == null)
            {
                _instance = FindObjectOfType<SoundManager>();
            }
            return _instance;
        }
    }

    [Header("Audio Sources")]
    [SerializeField] private AudioSource effectSource;

    [Header("Audio Clips")]
    [SerializeField] private AudioClip moveClip;
    [SerializeField] private AudioClip colorClip;
    [SerializeField] private AudioClip winClip;
    [SerializeField] private AudioClip clickClip;

    private float moveVolume = 0.5f;
    private float colorVolume = 0.7f;
    private float winVolume = 0.8f;
    private float clickVolume = 0.6f;

    void Awake()
    {
        if (_instance == null)
        {
            _instance = this;
            DontDestroyOnLoad(gameObject);
            InitializeAudioSource();
        }
        else if (_instance != this)
        {
            Destroy(gameObject);
        }
    }

    private void InitializeAudioSource()
    {
        if (effectSource == null)
        {
            effectSource = gameObject.AddComponent<AudioSource>();
            effectSource.playOnAwake = false;
            effectSource.spatialBlend = 0;
        }
    }

    public void PlayMove()
    {
        if (moveClip != null && effectSource != null)
        {
            effectSource.PlayOneShot(moveClip, moveVolume);
        }
    }

    public void PlayColor()
    {
        if (colorClip != null && effectSource != null)
        {
            effectSource.PlayOneShot(colorClip, colorVolume);
        }
    }

    public void PlayWin()
    {
        if (winClip != null && effectSource != null)
        {
            effectSource.PlayOneShot(winClip, winVolume);
        }
    }

    public void PlayClick()
    {
        if (clickClip != null && effectSource != null)
        {
            effectSource.PlayOneShot(clickClip, clickVolume);
        }
    }

    public void SetMoveClip(AudioClip clip) => moveClip = clip;
    public void SetColorClip(AudioClip clip) => colorClip = clip;
    public void SetWinClip(AudioClip clip) => winClip = clip;
    public void SetClickClip(AudioClip clip) => clickClip = clip;
}
