import { _decorator, Collider2D, Component,Input,input, instantiate, Node, Prefab, tween, Vec3, Contact2DType, Label} from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Player')
export class Player extends Component {

    //旋转节点：节点.Angle = 旋转角度
    //Prefab预制体就是保存节点配置，在需要的时候随机生成（节点模版）
    //1.制作箭的预制体
    //2.导入箭的预制体到脚本
    //3.吧预制体生成为节点 instantiate
    //4.设置该节点的父节点（让其显示）

    //监听类型（触摸开始）：Input.EventType.TOUCH_START
    //平滑移动：tween(Arrow_Node).to(0.1,{position:new Vec3(位置坐标)}).start()
    //平滑移动回调：平滑移动语句.call(() => {函数体})
    //播放平滑移动：平滑移动语句 + 回调（可选）.start()
    //本地坐标：相对于父节点的相对位置（不唯一，可能重复）
    //世界坐标：相对于场景的绝对位置（唯一坐标）
    //修改世界坐标，本地坐标也会跟随改动。修改本地坐标，世界坐标也会跟随改变

    //监听类型(碰撞触发)：Contact2DType.BEGIN_CONTAcT
    @property(Node)   //导入箭靶节点
    Target_Node: Node = null

    @property(Prefab)//导入箭的预制体
    Arrow_Prefab: Prefab = null

    @property(Node)//导入箭的父节点
    Arrow_Top_Node: Node = null
    Arrow_Node: Node = null  //箭自身节点
    
    @property(Node)
    Tips_Node: Node = null

    @property(Label)
    Tips_Label: Label= null

    @property(Label)
    Tips_All_Label: Label= null         //目标总数

    @property(Label)
    Tips_New_Label: Label= null         //当前数量







    Angle = 0  //初始旋转角度
    Angle_Speed = 50  //旋转速度
    Move = true   //箭靶旋转开关
    All_Num = 15
    New_Num = 0
    Up_Sw = true

    protected onLoad(): void {
        input.on(Input.EventType.TOUCH_START,this.TOUCH_START,this)
    }
    protected onDestroy(): void {
        input.off(Input.EventType.TOUCH_START,this.TOUCH_START,this)
    }

    TOUCH_START(){
        const Arrow_Node = instantiate(this.Arrow_Prefab)
        Arrow_Node.setParent(this.Arrow_Top_Node)
        Arrow_Node.getComponent(Collider2D).on(Contact2DType.BEGIN_CONTACT,this.BEGIN_CONTACT,this)
        // Arrow_Node.setPosition(0,135,0)
        tween(Arrow_Node).to(0.2,{position:new Vec3(0,135,0)}).call(() =>{
            this.Arrow_To_Target(Arrow_Node)
            Arrow_Node.getComponent(Collider2D).off(Contact2DType.BEGIN_CONTACT,this.BEGIN_CONTACT,this)
        }).start()
    }

    BEGIN_CONTACT(){
        this.Up_Sw = false
        this.Tips_UI(false)

    }

    Tips_UI(a){ //提示框函数
        
        //碰撞触发
        this.Move = false
        input.off(Input.EventType.TOUCH_START,this.TOUCH_START,this) //关闭发射
        this.Tips_Node.active = true   //显示提示框节点
        if(!a){
            this.Tips_Label.string = '你失败了'
        }else{
            this.Tips_Label.string = '你成功了'
        }
    }

    Up_Num(){ //更新数量函数
        if(!this.Up_Sw){return}
        this.New_Num ++
        this.Tips_New_Label.string = '当前：' + this.New_Num + '把'
        if(this.New_Num >= this.All_Num){
            this.Tips_UI(true)
        }
    }


    Arrow_To_Target(Arrow_Node){
        const Worla_Pos = Arrow_Node.getWorldPosition() //获取世界坐标
        Arrow_Node.setParent(this.Target_Node)          //设置父节点
        Arrow_Node.setWorldPosition(Worla_Pos)          //设置世界坐标
        Arrow_Node.angle = -this.Target_Node.angle + 180    //设置旋转角度
        this.Up_Num()

    }
    start() {
        this.Tips_All_Label.string = '目标：射入' + this.All_Num + '把宝剑'
        this.Tips_New_Label.string = '当前：' + this.New_Num + '把'
    }

    update(deltaTime: number) {
        if(!this.Move){return}   //判断开关状态
        if(this.Angle >= 360){this.Angle = 0} //角度超过360，就从0开始
        this.Angle += deltaTime * this.Angle_Speed  //接收旋转角度，帧时间补偿
        this.Target_Node.angle = this.Angle
    }
}


