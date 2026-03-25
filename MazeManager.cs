using UnityEngine;
using System.Collections.Generic;

public class Cell
{
    public int x, y;
    public bool isWall;
    public bool isColored;
    public GameObject gameObject;
    public Renderer renderer;

    public Cell(int x, int y, bool isWall)
    {
        this.x = x;
        this.y = y;
        this.isWall = isWall;
        this.isColored = false;
    }
}

public class MazeManager : MonoBehaviour
{
    public static MazeManager Instance { get; private set; }

    [Header("Maze Settings")]
    [SerializeField] private GameObject cellPrefab;
    [SerializeField] private GameObject wallPrefab;
    [SerializeField] private float cellSize = 80f;
    [SerializeField] private float cellSpacing = 2f;

    [Header("Colors")]
    [SerializeField] private Color uncoloredColor = Color.white;
    [SerializeField] private Color coloredColor = new Color(0.29f, 0.56f, 0.85f);

    private Cell[,] maze;
    private int width;
    private int height;
    private int totalWalkableCells;
    private int coloredCells;
    private Vector2 mazeOffset;

    public int TotalWalkableCells => totalWalkableCells;
    public int ColoredCells => coloredCells;

    public event System.Action OnAllCellsColored;

    void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
        }
        else
        {
            Destroy(gameObject);
        }
    }

    public void GenerateMaze(int[,] mazeData, Vector2 startPosition)
    {
        Debug.Log($"MazeManager.GenerateMaze called with data size {mazeData.GetLength(0)}x{mazeData.GetLength(1)}, position {startPosition}");
        
        if (cellPrefab == null) { Debug.LogError("CellPrefab is null! Please assign in Inspector."); return; }
        if (wallPrefab == null) { Debug.LogError("WallPrefab is null! Please assign in Inspector."); return; }
        
        ClearMaze();

        width = mazeData.GetLength(1);
        height = mazeData.GetLength(0);

        maze = new Cell[width, height];
        totalWalkableCells = 0;
        coloredCells = 0;

        float totalWidth = width * (cellSize + cellSpacing);
        float totalHeight = height * (cellSize + cellSpacing);
        mazeOffset = new Vector2(
            startPosition.x - totalWidth / 2 + cellSize / 2,
            startPosition.y + totalHeight / 2 - cellSize / 2
        );

        for (int y = 0; y < height; y++)
        {
            for (int x = 0; x < width; x++)
            {
                bool isWall = mazeData[y, x] == 1;
                Cell cell = new Cell(x, y, isWall);

                Vector3 worldPos = GetCellWorldPosition(x, y);

                GameObject obj;
                if (isWall)
                {
                    obj = Instantiate(wallPrefab, worldPos, Quaternion.identity, transform);
                }
                else
                {
                    obj = Instantiate(cellPrefab, worldPos, Quaternion.identity, transform);
                    totalWalkableCells++;
                }

                cell.gameObject = obj;
                cell.renderer = obj.GetComponent<Renderer>();
                maze[x, y] = cell;
            }
        }
    }

    private Vector3 GetCellWorldPosition(int x, int y)
    {
        return new Vector3(
            mazeOffset.x + x * (cellSize + cellSpacing),
            mazeOffset.y - y * (cellSize + cellSpacing),
            0
        );
    }

    public Vector3 GetCellWorldPositionByIndex(int x, int y)
    {
        return GetCellWorldPosition(x, y);
    }

    public void ColorCell(int x, int y)
    {
        if (x < 0 || x >= width || y < 0 || y >= height) return;

        Cell cell = maze[x, y];
        if (cell.isWall || cell.isColored) return;

        cell.isColored = true;
        coloredCells++;

        if (cell.renderer != null)
        {
            Debug.Log($"Coloring cell ({x},{y}), color: {coloredColor}");
            cell.renderer.material.color = coloredColor;
        }
        else
        {
            Debug.LogWarning($"Cell ({x},{y}) has no renderer!");
        }

        if (coloredCells >= totalWalkableCells)
        {
            OnAllCellsColored?.Invoke();
        }
    }

    public bool IsWall(int x, int y)
    {
        if (x < 0 || x >= width || y < 0 || y >= height) return true;
        return maze[x, y].isWall;
    }

    public bool IsOutOfBounds(int x, int y)
    {
        return x < 0 || x >= width || y < 0 || y >= height;
    }

    public (int x, int y) WorldPositionToCell(Vector3 worldPos)
    {
        int x = Mathf.RoundToInt((worldPos.x - mazeOffset.x) / (cellSize + cellSpacing));
        int y = Mathf.RoundToInt((mazeOffset.y - worldPos.y) / (cellSize + cellSpacing));
        return (x, y);
    }

    public void ResetMaze()
    {
        if (maze == null) return;

        for (int y = 0; y < height; y++)
        {
            for (int x = 0; x < width; x++)
            {
                Cell cell = maze[x, y];
                if (!cell.isWall)
                {
                    cell.isColored = false;
                    if (cell.renderer != null)
                    {
                        cell.renderer.material.color = uncoloredColor;
                    }
                }
            }
        }
        coloredCells = 0;
    }

    private void ClearMaze()
    {
        if (maze != null)
        {
            for (int y = 0; y < height; y++)
            {
                for (int x = 0; x < width; x++)
                {
                    if (maze[x, y]?.gameObject != null)
                    {
                        Destroy(maze[x, y].gameObject);
                    }
                }
            }
        }
        maze = null;
    }

    public float GetProgress()
    {
        if (totalWalkableCells == 0) return 0;
        return (float)coloredCells / totalWalkableCells * 100f;
    }
}
