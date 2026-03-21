import { _decorator, Collider2D, Component, Input, input, instantiate, Node, Prefab, tween, Vec3, Contact2DType, Label, Animation, director, AudioClip } from 'cc';
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



    //AudioSource音频组件
    //AudioClip音频资源
    //1.导入音频资源
    //2.获取音频组件
    //3.指定音频资源
    //4.开始播放音频




    @property(Node)   //导入箭靶节点
    Target_Node: Node = null

    @property(Prefab)//导入箭的预制体
    Arrow_Prefab: Prefab = null
    Arrow_Node: Node = null  //箭自身节点


    @property(Prefab)//导入箭的预制体
    Arrow2_Prefab: Prefab = null
    Arrow2_Node: Node = null

    @property(Prefab)//导入箭的预制体
    Arrow3_Prefab: Prefab = null
    Arrow3_Node: Node = null

    @property(Node)//导入箭的父节点
    Arrow_Top_Node: Node = null

    @property(Node)



    @property(Node)
    Tips_Node: Node = null

    @property(Label)
    Tips_Label: Label = null

    @property(Label)
    Tips_All_Label: Label = null         //目标总数

    @property(Label)
    Tips_New_Label: Label = null         //当前数量

    @property(Animation)
    Button_Animation: Animation = null

    @property(AudioClip)
    Win_Audio: AudioClip = null     //成功音频
    @property(AudioClip)
    Low_Audio: AudioClip = null

    @property(Label)
    Tips_Label1: Label = null

    @property(Node)
    Goto_Menu: Node = null


    onBtnMainMenu(){
        director.loadScene('main')
    }


    Angle = 0  //初始旋转角度
    Angle_Speed = 50  //旋转速度
    Move = true   //箭靶旋转开关
    All_Num = 3
    New_Num = 0
    Up_Sw = true

    protected onLoad(): void {
        input.on(Input.EventType.TOUCH_START, this.TOUCH_START, this)
    }
    protected onDestroy(): void {
        input.off(Input.EventType.TOUCH_START, this.TOUCH_START, this)
    }

    TOUCH_START() {
        if (director.getScene().name == 'c1') {
            const Arrow_Node = instantiate(this.Arrow_Prefab)
            Arrow_Node.setParent(this.Arrow_Top_Node)

            Arrow_Node.getComponent(Collider2D).on(Contact2DType.BEGIN_CONTACT, this.BEGIN_CONTACT, this)

            tween(Arrow_Node).to(0.2, { position: new Vec3(0, 135, 0) }).call(() => {
                this.Arrow_To_Target(Arrow_Node)
                Arrow_Node.getComponent(Collider2D).off(Contact2DType.BEGIN_CONTACT, this.BEGIN_CONTACT, this)
            }).start()
        }

        if (director.getScene().name == 'c2') {
            const Arrow2_Node = instantiate(this.Arrow2_Prefab)



            Arrow2_Node.setParent(this.Arrow_Top_Node)



            Arrow2_Node.getComponent(Collider2D).on(Contact2DType.BEGIN_CONTACT, this.BEGIN_CONTACT, this)
            // Arrow_Node.setPosition(0,135,0)


            tween(Arrow2_Node).to(0.2, { position: new Vec3(0, 135, 0) }).call(() => {
                this.Arrow_To_Target(Arrow2_Node)
                Arrow2_Node.getComponent(Collider2D).off(Contact2DType.BEGIN_CONTACT, this.BEGIN_CONTACT, this)
            }).start()
        }

        if (director.getScene().name == 'c3') {
            const Arrow3_Node = instantiate(this.Arrow3_Prefab)



            Arrow3_Node.setParent(this.Arrow_Top_Node)



            Arrow3_Node.getComponent(Collider2D).on(Contact2DType.BEGIN_CONTACT, this.BEGIN_CONTACT, this)
            // Arrow_Node.setPosition(0,135,0)


            tween(Arrow3_Node).to(0.2, { position: new Vec3(0, 135, 0) }).call(() => {
                this.Arrow_To_Target(Arrow3_Node)
                Arrow3_Node.getComponent(Collider2D).off(Contact2DType.BEGIN_CONTACT, this.BEGIN_CONTACT, this)
            }).start()
        }

    }

    BEGIN_CONTACT() {
        this.Up_Sw = false
        this.Tips_UI(false)

    }


    Win_Audio_Play() {

    }



    Tips_UI(a) { //提示框函数

        //碰撞触发
        this.Move = false
        input.off(Input.EventType.TOUCH_START, this.TOUCH_START, this) //关闭发射
        this.Tips_Node.active = true   //显示提示框节点
        this.Goto_Menu.active = true
        this.Button_Animation.play('D')
        //停止：动画名称.stop
        if (!a) {
            this.Tips_Label.string = '你失败了'
            this.Tips_Label1.string = '再试一次'
        } else {
            this.Tips_Label.string = '你成功了'
            this.Tips_Label1.string = '下一关'
        }
    }

    Up_Num() { //更新数量函数
        if (!this.Up_Sw) { return }
        this.New_Num++
        this.Tips_New_Label.string = '当前：' + this.New_Num + '把'
        if (this.New_Num >= this.All_Num) {
            this.Tips_UI(true)
        }
    }


    Arrow_To_Target(Arrow_Node) {
        const Worla_Pos = Arrow_Node.getWorldPosition() //获取世界坐标
        Arrow_Node.setParent(this.Target_Node)          //设置父节点
        Arrow_Node.setWorldPosition(Worla_Pos)
        if(director.getScene().name=='c1'){
            Arrow_Node.angle = -this.Target_Node.angle + 180    //设置旋转角度
        }          //设置世界坐标
        if(director.getScene().name=='c2'){
             Arrow_Node.angle = -this.Target_Node.angle  //设置旋转角度
        }
        if(director.getScene().name=='c3'){
             Arrow_Node.angle = -this.Target_Node.angle  //设置旋转角度
        }
        this.Up_Num()

    }

    New_Game() {
        let currentScene = director.getScene().name
        if (this.Tips_Label.string == '你失败了') {
            director.loadScene(currentScene)
        } else {
            if (currentScene == 'c1') {
                director.loadScene('c2')
            }
            if (currentScene == 'c2') {
                director.loadScene('c3')
            }
            if (currentScene == 'c3') {
                director.loadScene('end')
            }
            
            
        }



    }

    start() {
        let currentScene = director.getScene().name
        if (currentScene == 'c2') {
            this.All_Num += 2
        }
        if (currentScene == 'c3') {
            this.All_Num += 15
        }
        this.Tips_All_Label.string = '目标：射入' + this.All_Num + '把宝剑'
        this.Tips_New_Label.string = '当前：' + this.New_Num + '把'
    }

    update(deltaTime: number) {
        if (!this.Move) { return }   //判断开关状态
        if (this.Angle >= 360) { this.Angle = 0 } //角度超过360，就从0开始
        this.Angle += deltaTime * this.Angle_Speed  //接收旋转角度，帧时间补偿
        this.Target_Node.angle = this.Angle
    }
}


