using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Paiticles : MonoBehaviour {
	public float destoryTime = 1f;
	// Use this for initialization
	void Start () {
		Destroy(this.gameObject,destoryTime);
	}
	
	// Update is called once per frame
	void Update () {
		
	}
}
