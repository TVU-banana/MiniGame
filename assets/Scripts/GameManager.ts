import { _decorator, Component, instantiate, Label, Node, Prefab } from 'cc';
import { PlayerController } from './PlayerController';
const { ccclass, property } = _decorator;

enum BlockType{
    BT_NONE,
    BT_WHITE
}

enum GameState{
    Gs_MENU,
    Gs_PLAYING
}

@ccclass('GameManager')
export class GameManager extends Component {

    @property(Prefab)
    public boxPrefab:Prefab = null;
    @property
    public roadLength = 50;

    private _road:BlockType[]=[];

    @property(PlayerController)
    public playerController:PlayerController = null;

    @property(Node)
    public startMenu:Node = null;

    @property(Label)
    public stepLabel:Label = null;

    start() {
        this.setCurState(GameState.Gs_MENU);
        this.playerController.node.on('JumpEnd',this.onJumpEnd,this);
    }

    setCurState(value:GameState){
        if(value===GameState.Gs_MENU){
            this.playerController.reset();
            this.generateRoad();
            this.stepLabel.string = '0';
            this.playerController.setIsCanControll(false);
            this.startMenu.active = true;

        }else if(value===GameState.Gs_PLAYING){
            this.playerController.setIsCanControll(true);
            this.startMenu.active = false;

        }
    }

    onStartButtonClick(){
        this.setCurState(GameState.Gs_PLAYING);
    }
    onJumpEnd(value:number){
        this.stepLabel.string = value.toString();

        this.checkResult(value);
    }

    checkResult(totalStep:number){
        if(totalStep>=this.roadLength){
            this.setCurState(GameState.Gs_MENU);
        }else{
            if(this._road[totalStep]==BlockType.BT_NONE){
                this.setCurState(GameState.Gs_MENU);
            }
        }
    }
    generateRoad(){
        this.node.removeAllChildren();

        this._road=[];

        this._road.push(BlockType.BT_WHITE );

        for(let i=1;i<this.roadLength;i++){

            if(this._road[i-1] ===BlockType.BT_NONE){
                this._road.push(BlockType.BT_WHITE);
            }else{
                this._road.push(Math.round(Math.random()));
            }   
        }

        for(let j=1;j<this.roadLength;j++){
            if(this._road[j]==BlockType.BT_WHITE){
                const box = instantiate(this.boxPrefab);
                box.setParent(this.node);
                box.setPosition(j*160,0,0  );
            }
        }
    }
}


