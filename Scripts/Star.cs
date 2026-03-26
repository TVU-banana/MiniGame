using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

public enum StarColor
{
	Blue = 0,
	Green = 1,
	Orange = 2,
	Purple = 3,
	Red = 4,
}
public class Star : MonoBehaviour {
	public int row;
	public int column;

	public StarColor starColor = StarColor.Blue;
	public float speed = -0.5f;

	public bool isMoveDown = false;
	public int downRowCount = 0;
	private int targetRow = 0;

	public bool isMoveLeft = false;
	public int leftColumnCount = 0;
	public int targetColumn = 0;

	public GameObject eventSystem;
	// Use this for initialization
	void Start () {
		this.GetComponent<Button>().onClick.AddListener(OnClick_Star);
		eventSystem = GameObject.FindGameObjectWithTag("EventSystem");
	}
	
	// Update is called once per frame
	void Update () {
        if (isMoveDown)
        {
			MoveDown();
		}
		if (isMoveLeft)
		{
			MoveLeft();
		}
	}

	public void OnClick_Star()
    {
		downRowCount = 0;
		GameManager.gameManager_Instance.FindSameStars(this);
		GameManager.gameManager_Instance.ClearStarList();
	}

	public void DestroyStar()
    {

		Destroy(this.gameObject);
	}
	public void OpenMoveDown()
    {
		this.targetRow = row- downRowCount;
		row = targetRow;
		isMoveDown = true;
    }

	void MoveDown()
	{
		eventSystem.GetComponent<EventSystem>().enabled = false;
		if (this.gameObject.transform.localPosition.y > targetRow * GameManager.gameManager_Instance.starUnit)
		{
			this.gameObject.transform.Translate(new Vector3(0, 1, 0) * speed);
		}
		else
		{
			this.gameObject.transform.localPosition = new Vector3(this.gameObject.transform.localPosition.x, targetRow * GameManager.gameManager_Instance.starUnit, this.gameObject.transform.localPosition.z);
			isMoveDown = false;
			targetRow = 0;
			downRowCount = 0;
			eventSystem.GetComponent<EventSystem>().enabled = true;
		}
	}
	public void OpenMoveLeft()
	{
		this.targetColumn = column - leftColumnCount;
		isMoveLeft = true;
		column = targetColumn;
	}
	void MoveLeft()
	{
		eventSystem.GetComponent<EventSystem>().enabled = false;
		if (this.gameObject.transform.localPosition.x > targetColumn * GameManager.gameManager_Instance.starUnit)
		{
			this.gameObject.transform.Translate(new Vector3(1, 0, 0) * speed);
		}
		else
		{
			this.gameObject.transform.localPosition = new Vector3(targetColumn * GameManager.gameManager_Instance.starUnit,this.gameObject.transform.localPosition.y, this.gameObject.transform.localPosition.z);
			isMoveLeft = false;
			targetColumn = 0;
			leftColumnCount = 0;
			eventSystem.GetComponent<EventSystem>().enabled = true;
		}
	}


}
