using UnityEngine;
using System.Collections.Generic;

public class AlienController : MonoBehaviour
{
    [Header("Model Reference")]
    public Transform alienRoot;

    [Header("Bone Transforms - Root")]
    public Transform rootBone;
    public Transform pelvis;

    [Header("Bone Transforms - Spine")]
    public Transform spine_01;
    public Transform spine_02;
    public Transform spine_03;
    public Transform clavicle_l;
    public Transform clavicle_r;

    [Header("Bone Transforms - Arms")]
    public Transform upperarm_l;
    public Transform upperarm_r;
    public Transform lowerarm_l;
    public Transform lowerarm_r;
    public Transform hand_l;
    public Transform hand_r;

    [Header("Bone Transforms - Head")]
    public Transform neck_01;
    public Transform head;

    [Header("Bone Transforms - Face")]
    public Transform jawRoot;
    public Transform teeth;
    public Transform tongue;
    public Transform l_eye;
    public Transform r_eye;

    [Header("Arm Twist Bones (Optional)")]
    public Transform upperarm_twist_l;
    public Transform upperarm_twist_r;
    public Transform lowerarm_twist_l;
    public Transform lowerarm_twist_r;

    private string currentPosture = "stand";

    private Dictionary<string, Quaternion> standPose = new Dictionary<string, Quaternion>();
    private Dictionary<string, Quaternion> plankPose = new Dictionary<string, Quaternion>();

    void Start()
    {
        SaveCurrentPose(standPose);
    }

    public void InitializeBones()
    {
        if (alienRoot == null)
        {
            alienRoot = transform;
        }

        FindAllBones();
    }

    void FindAllBones()
    {
        if (alienRoot == null) return;

        rootBone = FindChildBone(alienRoot, "root");
        pelvis = FindChildBone(alienRoot, "pelvis");

        spine_01 = FindChildBone(alienRoot, "spine_01");
        spine_02 = FindChildBone(alienRoot, "spine_02");
        spine_03 = FindChildBone(alienRoot, "spine_03");

        clavicle_l = FindChildBone(alienRoot, "clavicle_l");
        clavicle_r = FindChildBone(alienRoot, "clavicle_r");

        upperarm_l = FindChildBone(alienRoot, "upperarm_l");
        upperarm_r = FindChildBone(alienRoot, "upperarm_r");
        lowerarm_l = FindChildBone(alienRoot, "lowerarm_l");
        lowerarm_r = FindChildBone(alienRoot, "lowerarm_r");
        hand_l = FindChildBone(alienRoot, "hand_l");
        hand_r = FindChildBone(alienRoot, "hand_r");

        neck_01 = FindChildBone(alienRoot, "neck_01");
        head = FindChildBone(alienRoot, "head");

        jawRoot = FindChildBone(alienRoot, "jawRoot");
        teeth = FindChildBone(alienRoot, "teeth");
        tongue = FindChildBone(alienRoot, "tongue");
        l_eye = FindChildBone(alienRoot, "L_Eye");
        r_eye = FindChildBone(alienRoot, "R_Eye");

        upperarm_twist_l = FindChildBone(alienRoot, "upperarm_twist_l");
        upperarm_twist_r = FindChildBone(alienRoot, "upperarm_twist_r");
        lowerarm_twist_l = FindChildBone(alienRoot, "lowerarm_twist_l");
        lowerarm_twist_r = FindChildBone(alienRoot, "lowerarm_twist_r");
    }

    Transform FindChildBone(Transform parent, string name)
    {
        if (parent == null) return null;

        foreach (Transform child in parent)
        {
            if (child.name.ToLower().Contains(name.ToLower()))
            {
                return child;
            }

            Transform found = FindChildBone(child, name);
            if (found != null) return found;
        }

        return null;
    }

    void SaveCurrentPose(Dictionary<string, Quaternion> pose)
    {
        SaveBoneRotation(pelvis, "pelvis", pose);
        SaveBoneRotation(spine_01, "spine_01", pose);
        SaveBoneRotation(spine_02, "spine_02", pose);
        SaveBoneRotation(spine_03, "spine_03", pose);
        SaveBoneRotation(clavicle_l, "clavicle_l", pose);
        SaveBoneRotation(clavicle_r, "clavicle_r", pose);
        SaveBoneRotation(upperarm_l, "upperarm_l", pose);
        SaveBoneRotation(upperarm_r, "upperarm_r", pose);
        SaveBoneRotation(lowerarm_l, "lowerarm_l", pose);
        SaveBoneRotation(lowerarm_r, "lowerarm_r", pose);
        SaveBoneRotation(hand_l, "hand_l", pose);
        SaveBoneRotation(hand_r, "hand_r", pose);
        SaveBoneRotation(neck_01, "neck_01", pose);
        SaveBoneRotation(head, "head", pose);
    }

    void SaveBoneRotation(Transform bone, string name, Dictionary<string, Quaternion> pose)
    {
        if (bone != null)
        {
            pose[name] = bone.localRotation;
        }
    }

    public void SetPosture(string postureName)
    {
        currentPosture = postureName;

        switch (postureName)
        {
            case "stand":
                ApplyStandPose();
                break;
            case "plank":
                ApplyPlankPose();
                break;
            default:
                ApplyStandPose();
                break;
        }
    }

    void ApplyStandPose()
    {
        if (standPose.Count == 0)
        {
            SaveCurrentPose(standPose);
        }

        ApplyPose(standPose);
    }

    void ApplyPlankPose()
    {
        ResetToStandFirst();

        if (pelvis != null)
            pelvis.localRotation = standPose.ContainsKey("pelvis") ? standPose["pelvis"] : pelvis.localRotation;

        if (spine_01 != null)
            spine_01.localRotation = Quaternion.Euler(-30f, 0f, 0f);
        if (spine_02 != null)
            spine_02.localRotation = Quaternion.Euler(-15f, 0f, 0f);
        if (spine_03 != null)
            spine_03.localRotation = Quaternion.Euler(-10f, 0f, 0f);

        if (clavicle_l != null)
            clavicle_l.localRotation = Quaternion.Euler(0f, 0f, -45f);
        if (clavicle_r != null)
            clavicle_r.localRotation = Quaternion.Euler(0f, 0f, 45f);

        if (upperarm_l != null)
            upperarm_l.localRotation = Quaternion.Euler(0f, 0f, -90f);
        if (upperarm_r != null)
            upperarm_r.localRotation = Quaternion.Euler(0f, 0f, 90f);

        if (lowerarm_l != null)
            lowerarm_l.localRotation = Quaternion.Euler(0f, 0f, 0f);
        if (lowerarm_r != null)
            lowerarm_r.localRotation = Quaternion.Euler(0f, 0f, 0f);

        if (neck_01 != null)
            neck_01.localRotation = Quaternion.Euler(-20f, 0f, 0f);
        if (head != null)
            head.localRotation = Quaternion.Euler(-15f, 0f, 0f);
    }

    void ResetToStandFirst()
    {
        ApplyPose(standPose);
    }

    void ApplyPose(Dictionary<string, Quaternion> pose)
    {
        SetBoneRotation(pelvis, "pelvis", pose);
        SetBoneRotation(spine_01, "spine_01", pose);
        SetBoneRotation(spine_02, "spine_02", pose);
        SetBoneRotation(spine_03, "spine_03", pose);
        SetBoneRotation(clavicle_l, "clavicle_l", pose);
        SetBoneRotation(clavicle_r, "clavicle_r", pose);
        SetBoneRotation(upperarm_l, "upperarm_l", pose);
        SetBoneRotation(upperarm_r, "upperarm_r", pose);
        SetBoneRotation(lowerarm_l, "lowerarm_l", pose);
        SetBoneRotation(lowerarm_r, "lowerarm_r", pose);
        SetBoneRotation(hand_l, "hand_l", pose);
        SetBoneRotation(hand_r, "hand_r", pose);
        SetBoneRotation(neck_01, "neck_01", pose);
        SetBoneRotation(head, "head", pose);
    }

    void SetBoneRotation(Transform bone, string name, Dictionary<string, Quaternion> pose)
    {
        if (bone != null && pose.ContainsKey(name))
        {
            bone.localRotation = pose[name];
        }
    }

    public void SetBoneRotation(string boneName, Vector3 eulerAngles)
    {
        Transform bone = GetBoneByName(boneName);
        if (bone != null)
        {
            bone.localRotation = Quaternion.Euler(eulerAngles);
        }
    }

    Transform GetBoneByName(string name)
    {
        switch (name.ToLower())
        {
            case "pelvis": return pelvis;
            case "spine_01": return spine_01;
            case "spine_02": return spine_02;
            case "spine_03": return spine_03;
            case "clavicle_l": return clavicle_l;
            case "clavicle_r": return clavicle_r;
            case "upperarm_l": return upperarm_l;
            case "upperarm_r": return upperarm_r;
            case "lowerarm_l": return lowerarm_l;
            case "lowerarm_r": return lowerarm_r;
            case "hand_l": return hand_l;
            case "hand_r": return hand_r;
            case "neck_01": return neck_01;
            case "head": return head;
            case "jawroot": return jawRoot;
            case "l_eye": return l_eye;
            case "r_eye": return r_eye;
            default: return null;
        }
    }

    public string GetCurrentPosture()
    {
        return currentPosture;
    }

    public void TogglePosture()
    {
        if (currentPosture == "stand")
        {
            SetPosture("plank");
        }
        else
        {
            SetPosture("stand");
        }
    }

    void OnValidate()
    {
        if (Application.isPlaying) return;
        InitializeBones();
    }
}
