import { _decorator, Animation, AudioSource, Component, EventMouse, Input, input, Node, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PlayerController')
export class PlayerController extends Component {

    private _startJump = false;
    private _jumpTime = 0.2;
    private _curJumpTime=0;
    private _jumpSpeed = 0;
    private _targetPos = new Vec3();
    private _curPos = new Vec3();

    @property(Animation)
    public bodyAnim:Animation = null;

    @property(AudioSource)
    public jumpAudio:AudioSource = null;

    private _curTotalStep = 0;
    start() {
        
    }

    public setIsCanControll(value:boolean){
        if(value){
            input.on(Input.EventType.MOUSE_DOWN,this.onMouseDown,this);
        }else{
            input.off(Input.EventType.MOUSE_DOWN,this.onMouseDown,this);
        }

    }

    onMouseDown(event:EventMouse){
        if(event.getButton()==0){
            this.jumpByStep(1);
        }else if(event.getButton()==2){
            this.jumpByStep(2);
        }
    }

    jumpByStep(Step:number){
        if( -this._startJump)return;
        if(this.jumpAudio){
            this.jumpAudio.play();
        }

        const animName = Step==1?'JumpOneStep':'JumpTwoStep';
        const animState = this.bodyAnim.getState(animName);
        this._jumpTime = animState.duration;
        const moveLength = Step*160;
        this._startJump = true;
        this._curJumpTime = 0; 
        this._jumpSpeed = Step*160/this._jumpTime;

        this._curPos = this.node.position;
        Vec3.add(this._targetPos,this._curPos,new Vec3(moveLength,0,0) );

        this.bodyAnim.play(animName);

        this._curTotalStep+=Step;
    }

    protected update(dt: number): void {
        if(this._startJump){
            this._curJumpTime+=dt;
            if(this._curJumpTime>this._jumpTime){
                this._startJump = false;
                this.node.setPosition( this._targetPos);
                this.node.emit("JumpEnd",this._curTotalStep);
            }else{
                const curPos = this.node.position;
                this.node.setPosition(curPos.x+this._jumpSpeed*dt,curPos.y,curPos.z);
            }
        }
    }

    protected onDestroy(): void {
        input.off(Input.EventType.MOUSE_DOWN,this.onMouseDown,this);
    }

    public reset(){
        this.node.setPosition(0,0,0);
        this._curTotalStep = 0;
    }
}
