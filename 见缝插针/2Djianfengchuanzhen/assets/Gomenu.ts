import { _decorator, Component, Node ,director} from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Gomenu')
export class Gomenu extends Component {
    start() {

    }

    update(deltaTime: number) {
        
    }
    onBtnPlays(){
        director.loadScene('main')
    }
}


