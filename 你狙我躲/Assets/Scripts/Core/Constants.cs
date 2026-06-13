using UnityEngine;

public class Constants : MonoBehaviour
{
    public static class Screen
    {
        public const int Width = 375;
        public const int Height = 667;
    }

    public static class Alien
    {
        public static readonly Color BodyColor = new Color(0f, 1f, 0f);
        public static readonly Color EyeColor = new Color(0.067f, 0.067f, 0.067f);
        public static readonly float Scale = 0.8f;
    }

    public static class Scene
    {
        public static readonly float CameraHeight = 12f;
        public static readonly float CameraDepth = 12f;
        public static readonly float ViewAngleX = 45f;
        
        public static readonly float GroundSize = 20f;
        public static readonly Color GroundColor = new Color(0.5f, 0.5f, 0.5f);
        
        public static readonly float AlienSpacing = 6f;
        public static readonly float AlienLeftX = -6f;
        public static readonly float AlienRightX = 6f;
    }

    public static class Colors
    {
        public static readonly Color MenuBackgroundTop = new Color(0.04f, 0.04f, 0.1f);
        public static readonly Color MenuBackgroundBottom = new Color(0.1f, 0.1f, 0.23f);
        public static readonly Color SceneBackground = new Color(0.1f, 0.1f, 0.18f);
        
        public static readonly Color HiderColor = new Color(1f, 0.84f, 0f);
        public static readonly Color SniperColor = new Color(1f, 0.42f, 0.42f);
        
        public static readonly Color ButtonNormal = new Color(1f, 0.46f, 0.46f);
        public static readonly Color ButtonPressed = new Color(0.84f, 0.19f, 0.19f);
    }

    public static class Animation
    {
        public const float StarMinAlpha = 0.3f;
        public const float StarMaxAlpha = 1f;
        public const float StarMinSpeed = 0.01f;
        public const float StarMaxSpeed = 0.03f;
        
        public const float SphereRotationSpeed = 1f;
    }
}