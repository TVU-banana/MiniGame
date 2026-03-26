using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

public class GameManager : MonoBehaviour {
	public GameObject StarGroup;
	public GameObject[] starObjList;
	public int starRow = 12;
	public int starColumn = 10;
	public float starUnit = 48f;
	public float starSpeed = -2f;

	public List<Star> starList = new List<Star>();
	public List<Star> currentNeighbourStarList = new List<Star>();

	public static GameManager gameManager_Instance;

	public float TotalScore = 0;
	public int clearedStarCount = 0;

	public GameObject[] particles;

	public AudioSource clearSource;
	public AudioSource bgMusicSource;

	public Text hurdleText;
	public Text targetScoreText;
	public Text TotalScoreText;
	public Text currentScoreText;
	public Text restStarsText;
	public int hurdle = 0;
	public int targetScore = 0;

	public GameObject newGame;
	private int overSwitch = 0;
	void Awake()
    {
		gameManager_Instance = this;
	}
	// Use this for initialization
	void Start () {
		GameStart();
	}
	
	// Update is called once per frame
	void Update () {
		
	}
	void GameStart()
    {
        if (bgMusicSource!=null)
        {
			bgMusicSource.Play();
		}
		overSwitch = 0;
		Debug.Log("start");
		LoadHurdle();
	}
	void InitializeStars(int row,int column)
    {
		starList.Clear();
		Vector3 localPos = Vector3.zero;
		int starIndex = 0;
        for (int i = 0;i<row;i++)
        {
            for (int j = 0; j < column; j++)
			{
				localPos = new Vector3(starUnit * j, starUnit * i, 0);
                if (starObjList.Length>=5&& StarGroup!=null)
                {
					starIndex = Random.Range(0,5);
					GameObject starObj = Instantiate(starObjList[starIndex], starObjList[starIndex].transform.position, starObjList[starIndex].transform.rotation);
					starObj.transform.SetParent(StarGroup.transform);
					starObj.transform.localPosition = localPos;
					starObj.transform.localScale = new Vector3(1,1,1);

					Star star = starObj.GetComponent<Star>();
					star.row = i;
					star.column = j;
					star.speed = starSpeed;
					starList.Add(star);
				}
			}
		}
    }

	public void FindSameStars(Star currentStar)
    {
		Star neighbourStar = null;
		int currentRow = currentStar.row;
		int currentColumn = currentStar.column;

		//下
		if (currentStar.row>0)
        {
			neighbourStar = GetStar(starList, currentRow-1, currentColumn);
            if (neighbourStar!=null&&neighbourStar.starColor==currentStar.starColor)
            {
                if (!currentNeighbourStarList.Contains(neighbourStar))
                {
					currentNeighbourStarList.Add(neighbourStar);
					FindSameStars(neighbourStar);

				}
            }
		}
		//上
		if (currentStar.row < starRow-1)
		{
			neighbourStar = GetStar(starList, currentRow + 1, currentColumn);
			if (neighbourStar != null && neighbourStar.starColor == currentStar.starColor)
			{
				if (!currentNeighbourStarList.Contains(neighbourStar))
				{
					currentNeighbourStarList.Add(neighbourStar);
					FindSameStars(neighbourStar);
				}
			}
		}
		//左
		if (currentStar.column > 0)
		{
			neighbourStar = GetStar(starList, currentRow, currentColumn-1);
			if (neighbourStar != null && neighbourStar.starColor == currentStar.starColor)
			{
				if (!currentNeighbourStarList.Contains(neighbourStar))
				{
					currentNeighbourStarList.Add(neighbourStar);
					FindSameStars(neighbourStar);
				}
			}
		}
		//右
		if (currentStar.column < starColumn-1)
		{
			neighbourStar = GetStar(starList, currentRow, currentColumn+1);
			if (neighbourStar != null && neighbourStar.starColor == currentStar.starColor)
			{
				if (!currentNeighbourStarList.Contains(neighbourStar))
				{
					currentNeighbourStarList.Add(neighbourStar);
					FindSameStars(neighbourStar);
				}
			}
		}

	}
	public void ClearStarList()
    {
        if (currentNeighbourStarList.Count>=2)
		{
			foreach (var item in currentNeighbourStarList)
			{
				starList.Remove(item);

				var particlesPos = item.transform.localPosition;
				CreateParticles(item.starColor, particlesPos);

				clearSource.Play();

				item.DestroyStar();
			}
			//移动
			MoveStars(currentNeighbourStarList, starList);

			//分数计算
			clearedStarCount = currentNeighbourStarList.Count;
			TotalScore += CalculateScore(clearedStarCount);
			TotalScoreText.text = TotalScore.ToString();
			currentScoreText.text = currentNeighbourStarList.Count + "连消" + CalculateScore(clearedStarCount)+ "分";

			currentNeighbourStarList.Clear();
		}
		OverJudge();

	}
	public void MoveStars(List<Star> beClearedStars, List<Star> restStars)
    {
		//Down
		//几种情况，1、一列上的所有消除的星星都挨着；2、一列上消除的点不挨着
		for(int col = 0;col<starColumn;col++)
		{
			int downCount = 0;
			int maxClearedRow = 0;
			int minClearedRow = starRow;

			foreach (var restStar in restStars)
			{
                if (restStar.column == col)
				{
					foreach (var clearedStar in beClearedStars)
					{
						if (clearedStar.column == col && restStar.row > clearedStar.row)
						{
							restStar.downRowCount++;
						}
					}
					if (restStar.downRowCount > 0)
					{
						restStar.OpenMoveDown();
					}
				}
			}
		}
        //Left
        //Left的情况，只用判断剩下的星星中每一列，是否有空;若为空，右边所有星星左移
		//从右往左判断
        for (int col = starColumn-1; col>=0; col--)
		{
			//Debug.Log("moveLeft");
			//判断col列是否为空
			bool isEmpty = true;
			foreach (var resrStar in restStars)
			{
                if (resrStar.column==col)
                {
					isEmpty = false;
				}
			}
			//col列为空,col右边的所有列向左移动列数+1
			if(isEmpty)
			{
				foreach(var resrStar in restStars)
                {
                    if (resrStar.column>col)
                    {
						resrStar.leftColumnCount++;
					}
                }
			}
		}
        //move left
        foreach (var resrStar in restStars)
        {
            if (resrStar.leftColumnCount>0)
            {
				resrStar.OpenMoveLeft();
			}
        }

	}

	public Star GetStar(List<Star> starList,int row,int column)
    {
		Star result = null;
        foreach (var item in starList)
        {
            if (item.row==row&&item.column==column)
            {
				result = item;
			}
        }
		return result;
    }

	int CalculateScore(int count)
    {
		int result = 5;
        for (int i=1;i<count;i++)
        {
			result += i * 10 + 5;
		}
		return result;
    }

	public void OverJudge()
    {
		//星星相连性判断关卡结束与否
		if (IsOver(starList))
		{
            if (overSwitch==0)
			{
				overSwitch++;
				Debug.Log("Over");
				Invoke("HurdleOver", 1f);
			}
		}
	}
	//判断剩下的星星相连性
	bool IsOver(List<Star> restStarList)
    {
		bool result = true;
        foreach(var item in restStarList)
        {
			FindSameStars(item);
            if (currentNeighbourStarList.Count>0)
            {
				result = false;
				currentNeighbourStarList.Clear();
			}
		}

		return result;
    }

	public void CreateParticles(StarColor starColor, Vector3 pos)
	{
		if (particles.Length>=5)
		{
			GameObject parObj = null;
            switch (starColor)
            {
				case StarColor.Blue:
					parObj = particles[(int)StarColor.Blue];
					break;
				case StarColor.Green:
					parObj = particles[(int)StarColor.Green];
					break;
				case StarColor.Orange:
					parObj = particles[(int)StarColor.Orange];
					break;
				case StarColor.Purple:
					parObj = particles[(int)StarColor.Purple];
					break;
				case StarColor.Red:
					parObj = particles[(int)StarColor.Red];
					break;
			}
			if (parObj == null) return;
			var obj = Instantiate(parObj, pos, parObj.transform.rotation);
			obj.transform.SetParent(StarGroup.transform);
			obj.transform.localPosition = pos;
			obj.transform.localScale = parObj.transform.localScale;
		}
	}

	public void HurdleOver()
    {
		restStarsText.gameObject.SetActive(true);
		restStarsText.text = "剩余" + starList.Count + "颗星星";
        //奖励
        if (starList.Count<10)
        {
			int bonusScore = 2000-50* starList.Count;
			TotalScore += bonusScore;
			TotalScoreText.text = TotalScore.ToString();
		}

        foreach(var item in starList)
		{
            if (item!=null)
			{
				var particlesPos = item.transform.localPosition;
				CreateParticles(item.starColor, particlesPos);

				item.DestroyStar();
			}

		}
        if (TotalScore>targetScore)
		{
			Invoke("LoadHurdle", 3f);
		}
        else
        {
			//GameOver
			newGame.SetActive(true);

		}

	}

	void LoadHurdle()
	{
		hurdle++;
		targetScore = 1000;
		if (hurdle == 1)
		{
			targetScore = 1000;
		}
		else
		{
			for (int i = 1; i < hurdle; i++)
			{
				targetScore += 2000 + i * 100;
			}
		}
		hurdleText.text = "关卡：" + hurdle.ToString();
		targetScoreText.text = "目标：" + targetScore.ToString();

		currentScoreText.gameObject.SetActive(false);
		restStarsText.gameObject.SetActive(false);

		newGame.SetActive(false);

		InitializeStars(starRow, starColumn);
		overSwitch = 0;
	}
	public void NewGame()
    {
		SceneManager.LoadScene("PopStar");
    }

}
