import { _decorator, Component, director, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MainMenu')
export class MainMenu extends Component {
    start() {

    }

    update(deltaTime: number) {
        
    }
    onBtnPlay(){
        director.loadScene('c1')
    }
}


