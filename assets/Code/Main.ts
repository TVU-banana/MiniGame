import { _decorator, Component, director, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Main')
export class Main extends Component {
    start() {

    }

    update(deltaTime: number) {
        
    }
    onBtnPlay(){
        director.loadScene('C1')
    }
}


