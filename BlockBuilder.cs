using UnityEngine;
using System.Collections.Generic;
using System.Linq;

public class FixedBlockBuilder : MonoBehaviour
{
    [Header("目标尺寸")]
    public Vector3Int targetSize = new Vector3Int(5, 3, 2);

    [Header("随机化设置")]
    public int randomSeed = 42;
    [Range(0f, 1f)]
    public float largeBlockBias = 0.3f; // 大块偏好（0-1，越大越喜欢用大块）

    [Header("视觉设置")]
    public bool showGizmos = false;

    [Header("预设体")]
    public List<GameObject> Block;

    // 固定的5种方块尺寸
    private readonly Vector3Int[] fixedBlockSizes = new Vector3Int[]
    {
        new Vector3Int(1, 1, 1), // 1x1x1
        new Vector3Int(2, 1, 1), // 2x1x1
        new Vector3Int(2, 2, 1), // 2x2x1
        new Vector3Int(1, 3, 1), // 1x3x1
        new Vector3Int(2, 3, 1)  // 2x3x1
    };

    private System.Random random;
    private GameObject blockContainer;
    private List<PlacedBlock> placedBlocks = new List<PlacedBlock>();

    // 用于调试的统计信息
    private Dictionary<Vector3Int, int> blockUsageStats = new Dictionary<Vector3Int, int>();

    void Start()
    {
        BuildRandomCuboid();
    }

    [ContextMenu("构建随机长方体")]
    public void BuildRandomCuboid()
    {
        ClearExistingBlocks();
        random = new System.Random(randomSeed);
        blockContainer = new GameObject($"Cuboid_{targetSize.x}x{targetSize.y}x{targetSize.z}_Seed{randomSeed}");

        // 执行拼装算法
        List<BlockPlacement> placements = GreedyRandomPlacement();

        // 生成方块
        foreach (var placement in placements)
        {
            CreateBlock(placement);
        }

        // 输出统计信息
        LogPlacementStats(placements);
    }

    List<BlockPlacement> GreedyRandomPlacement()
    {
        List<BlockPlacement> placements = new List<BlockPlacement>();
        bool[,,] occupied = new bool[targetSize.x, targetSize.y, targetSize.z];

        // 按体积排序（从大到小），但加入随机因素
        var sortedSizes = fixedBlockSizes
            .OrderByDescending(s => s.x * s.y * s.z)
            .ThenBy(s => Random.value) // 随机打乱同体积的
            .ToArray();

        // 遍历每个可能的位置
        for (int z = 0; z < targetSize.z; z++)
        {
            for (int y = 0; y < targetSize.y; y++)
            {
                for (int x = 0; x < targetSize.x; x++)
                {
                    if (occupied[x, y, z]) continue;

                    // 尝试放置方块
                    BlockPlacement? placement = TryPlaceBlockAtPosition(x, y, z, occupied, sortedSizes);

                    if (placement.HasValue)
                    {
                        placements.Add(placement.Value);
                        MarkOccupied(occupied, placement.Value);
                    }
                }
            }
        }

        return placements;
    }

    BlockPlacement? TryPlaceBlockAtPosition(int x, int y, int z, bool[,,] occupied, Vector3Int[] sortedSizes)
    {
        // 根据大块偏好调整尝试顺序
        List<Vector3Int> candidateSizes = new List<Vector3Int>();

        foreach (var size in sortedSizes)
        {
            if (CanPlaceBlock(x, y, z, size, occupied))
            {
                candidateSizes.Add(size);
            }
        }

        if (candidateSizes.Count == 0)
            return null;

        // 根据largeBlockBias选择方块
        Vector3Int selectedSize;

        if (random.NextDouble() < largeBlockBias)
        {
            // 偏好大块：从较大的几个中随机选择
            int largeCount = Mathf.Max(1, candidateSizes.Count / 2);
            selectedSize = candidateSizes[random.Next(0, largeCount)];
        }
        else
        {
            // 完全随机
            selectedSize = candidateSizes[random.Next(candidateSizes.Count)];
        }

        return new BlockPlacement
        {
            position = new Vector3Int(x, y, z),
            size = selectedSize,
        };
    }

    bool CanPlaceBlock(int x, int y, int z, Vector3Int size, bool[,,] occupied)
    {
        // 检查边界
        if (x + size.x > targetSize.x ||
            y + size.y > targetSize.y ||
            z + size.z > targetSize.z)
            return false;

        // 检查空间是否被占用
        for (int dx = 0; dx < size.x; dx++)
        {
            for (int dy = 0; dy < size.y; dy++)
            {
                for (int dz = 0; dz < size.z; dz++)
                {
                    if (occupied[x + dx, y + dy, z + dz])
                        return false;
                }
            }
        }

        return true;
    }

    void MarkOccupied(bool[,,] occupied, BlockPlacement placement)
    {
        for (int dx = 0; dx < placement.size.x; dx++)
        {
            for (int dy = 0; dy < placement.size.y; dy++)
            {
                for (int dz = 0; dz < placement.size.z; dz++)
                {
                    occupied[placement.position.x + dx,
                            placement.position.y + dy,
                            placement.position.z + dz] = true;
                }
            }
        }
    }

    void CreateBlock(BlockPlacement placement)
    {
        // 根据尺寸选择对应的预制体
        GameObject prefab = GetPrefabBySize(placement.size);

        if (prefab == null)
        {
            Debug.LogError($"找不到尺寸为 {placement.size} 的预制体");
            return;
        }

        // 实例化预制体
        GameObject block = Instantiate(prefab, blockContainer.transform);
        block.name = $"Block_{placement.size.x}x{placement.size.y}x{placement.size.z}_{placement.position.x}_{placement.position.y}_{placement.position.z}";

        // 设置尺寸
        block.transform.localScale = placement.size;

        // 计算位置（使方块中心对齐到网格中心）
        Vector3 position = new Vector3(
            placement.position.x + placement.size.x * 0.5f,
            placement.position.y + placement.size.y * 0.5f,
            placement.position.z + placement.size.z * 0.5f
        );
        block.transform.position = position;

        // 记录放置信息
        placedBlocks.Add(new PlacedBlock
        {
            gameObject = block,
            placement = placement
        });

        // 更新统计
        if (!blockUsageStats.ContainsKey(placement.size))
            blockUsageStats[placement.size] = 0;
        blockUsageStats[placement.size]++;
    }

    // 根据尺寸获取对应的预制体
    GameObject GetPrefabBySize(Vector3Int size)
    {
        // 尺寸到索引的映射
        if (size == new Vector3Int(1, 1, 1) && Block.Count > 0)
            return Block[0];
        else if (size == new Vector3Int(2, 1, 1) && Block.Count > 1)
            return Block[1];
        else if (size == new Vector3Int(2, 2, 1) && Block.Count > 2)
            return Block[2];
        else if (size == new Vector3Int(1, 3, 1) && Block.Count > 3)
            return Block[3];
        else if (size == new Vector3Int(2, 3, 1) && Block.Count > 4)
            return Block[4];

        return null;
    }

    void ClearExistingBlocks()
    {
        if (blockContainer != null)
        {
            DestroyImmediate(blockContainer);
        }
        placedBlocks.Clear();
        blockUsageStats.Clear();
    }

    void LogPlacementStats(List<BlockPlacement> placements)
    {
        string stats = $"=== 拼装统计 ===\n总方块数: {placements.Count}\n";
        stats += "各尺寸使用情况:\n";

        foreach (var size in fixedBlockSizes)
        {
            int count = blockUsageStats.ContainsKey(size) ? blockUsageStats[size] : 0;
            float volume = size.x * size.y * size.z;
            stats += $"{size.x}x{size.y}x{size.z}: {count}个 (体积:{volume})\n";
        }

        stats += $"总体积: {targetSize.x * targetSize.y * targetSize.z}";
        Debug.Log(stats);
    }

    void OnDrawGizmos()
    {
        if (!showGizmos) return;

        // 绘制目标范围
        Gizmos.color = new Color(1, 1, 0, 0.3f);
        Gizmos.DrawWireCube(
            new Vector3(targetSize.x * 0.5f, targetSize.y * 0.5f, targetSize.z * 0.5f),
            targetSize
        );

        // 绘制网格点
        Gizmos.color = Color.white;
        for (int x = 0; x <= targetSize.x; x++)
        {
            for (int y = 0; y <= targetSize.y; y++)
            {
                for (int z = 0; z <= targetSize.z; z++)
                {
                    Gizmos.DrawSphere(new Vector3(x, y, z), 0.05f);
                }
            }
        }
    }

    [System.Serializable]
    public struct BlockPlacement
    {
        public Vector3Int position;
        public Vector3Int size;
        public int colorIndex;
    }

    public class PlacedBlock
    {
        public GameObject gameObject;
        public BlockPlacement placement;
    }
}